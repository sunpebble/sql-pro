import type {
  ActivateRequest,
  CheckoutRequest,
  Env,
  VerifyRequest,
  VerifyResponse,
} from './api/types';
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { cors } from 'hono/cors';
import { nanoid } from 'nanoid';
import {
  getSession,
  getUserByEmail,
  getUserById,
  getUserLicenses,
} from './api/auth';
import authRoutes from './api/auth-routes';
import {
  createActivation,
  createLicense,
  deleteActivation,
  getActivation,
  getActivationsForLicense,
  getLicenseByEmail,
  getLicenseByKey,
  getLicenseByStripeCustomer,
  updateActivationLastSeen,
  updateLicenseStatus,
} from './api/db';
import { getErrorMessage } from './api/error-utils';
import {
  calculatePeriodEnd,
  generateLicenseKey,
  getMaxMachinesForPlan,
  isValidLicenseKeyFormat,
} from './api/license';
import {
  constructWebhookEvent,
  createCheckoutSession,
  createCustomerPortalSession,
} from './api/stripe';

const app = new Hono<{ Bindings: Env }>();

// ============================================
// CORS Configuration
// ============================================
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// ============================================
// API Routes
// ============================================

// Mount auth routes
app.route('/api/auth', authRoutes);

// ============================================
// Billing Portal (session-based authentication)
// ============================================
const SESSION_COOKIE = 'quarry_session';

app.post('/api/billing/portal', async (c) => {
  try {
    // Get session from cookie
    const sessionId = getCookie(c, SESSION_COOKIE);
    if (!sessionId) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    // Validate session
    const session = await getSession(c.env, sessionId);
    if (!session) {
      return c.json({ success: false, error: 'Session expired' }, 401);
    }

    // Get user
    const user = await getUserById(c.env, session.user_id);
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Get user's licenses to find Stripe customer ID
    const licenses = (await getUserLicenses(c.env, user.id)) as Array<{
      stripe_customer_id: string;
      stripe_subscription_id?: string | null;
    }>;

    // Find a license with a Stripe customer ID
    const licenseWithStripe = licenses.find((l) => l.stripe_customer_id);

    if (!licenseWithStripe) {
      return c.json(
        {
          success: false,
          error:
            'No billing information found. You may not have an active subscription.',
        },
        404
      );
    }

    // Create portal session
    const returnUrl =
      c.req.header('referer') || new URL('/', c.req.url).toString();
    const portalSession = await createCustomerPortalSession(
      c.env,
      licenseWithStripe.stripe_customer_id,
      returnUrl
    );

    return c.json({ success: true, url: portalSession.url });
  } catch (error) {
    console.error('Billing portal error:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Health check
app.get('/api/health', async (c) => {
  // Quick DB connectivity check
  let dbStatus = 'unknown';
  try {
    await c.env.DB.prepare('SELECT 1').first();
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  return c.json({
    status: 'ok',
    service: 'quarry',
    environment: c.env.ENVIRONMENT,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Database info endpoint (for debugging)
app.get('/api/db/info', async (c) => {
  try {
    // Check if tables exist
    const tables = await c.env.DB.prepare(
      `
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `
    ).all();

    return c.json({
      success: true,
      tables: tables.results?.map((t) => (t as { name: string }).name) || [],
      message: 'Database is ready. Run migrations if tables are missing.',
    });
  } catch (error) {
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Create Stripe Checkout Session
app.post('/api/checkout', async (c) => {
  try {
    const body = await c.req.json<CheckoutRequest>();
    const { email, plan, successUrl, cancelUrl } = body;

    if (!email || !plan || !successUrl || !cancelUrl) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    const session = await createCheckoutSession(c.env, {
      email,
      plan,
      successUrl,
      cancelUrl,
    });

    return c.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Create Customer Portal Session
app.post('/api/portal', async (c) => {
  try {
    const { email, returnUrl } = await c.req.json<{
      email: string;
      returnUrl: string;
    }>();

    const license = await getLicenseByEmail(c.env, email);
    if (!license) {
      return c.json({ success: false, error: 'License not found' }, 404);
    }

    const session = await createCustomerPortalSession(
      c.env,
      license.stripe_customer_id,
      returnUrl
    );

    return c.json({ success: true, url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// ============================================
// License Lookup (for users to retrieve their license after purchase)
// ============================================
app.post('/api/license/lookup', async (c) => {
  try {
    const { email } = await c.req.json<{ email: string }>();

    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }

    const license = await getLicenseByEmail(c.env, email);
    if (!license) {
      return c.json(
        { success: false, error: 'No license found for this email' },
        404
      );
    }

    // Return license info (including key for the owner)
    return c.json({
      success: true,
      license: {
        email: license.email,
        licenseKey: license.license_key,
        plan: license.plan,
        status: license.status,
        expiresAt: license.current_period_end,
        maxMachines: license.max_machines,
        createdAt: license.created_at,
      },
    });
  } catch (error) {
    console.error('Lookup error:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Activate license on a machine
app.post('/api/license/activate', async (c) => {
  try {
    const body = await c.req.json<ActivateRequest>();
    const { email, licenseKey, machineId, platform, hostname } = body;

    // Validate license key format
    if (!isValidLicenseKeyFormat(licenseKey)) {
      return c.json(
        { success: false, error: 'Invalid license key format' },
        400
      );
    }

    // Find license
    const license = await getLicenseByKey(c.env, licenseKey);
    if (!license) {
      return c.json({ success: false, error: 'License not found' }, 404);
    }

    // Check if email matches
    if (license.email !== email) {
      return c.json(
        { success: false, error: 'Email does not match license' },
        403
      );
    }

    // Check license status
    if (license.status !== 'active') {
      return c.json(
        { success: false, error: `License is ${license.status}` },
        403
      );
    }

    // Check if already activated on this machine
    const existingActivation = await getActivation(
      c.env,
      license.id,
      machineId
    );
    if (existingActivation) {
      await updateActivationLastSeen(c.env, existingActivation.id);
      return c.json({
        success: true,
        license: {
          email: license.email,
          plan: license.plan,
          status: license.status,
          expiresAt: license.current_period_end,
        },
      });
    }

    // Check machine limit
    const activations = await getActivationsForLicense(c.env, license.id);
    if (activations.length >= license.max_machines) {
      return c.json(
        {
          success: false,
          error: `Maximum ${license.max_machines} machines allowed. Deactivate another machine first.`,
          activations: activations.map((a) => ({
            machineId: a.machine_id,
            platform: a.platform,
            hostname: a.hostname,
            activatedAt: a.activated_at,
          })),
        },
        403
      );
    }

    // Create activation
    await createActivation(c.env, {
      id: nanoid(),
      license_id: license.id,
      machine_id: machineId,
      platform,
      hostname,
    });

    return c.json({
      success: true,
      license: {
        email: license.email,
        plan: license.plan,
        status: license.status,
        expiresAt: license.current_period_end,
      },
    });
  } catch (error) {
    console.error('Activation error:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// Verify license
app.post('/api/license/verify', async (c) => {
  try {
    const body = await c.req.json<VerifyRequest>();
    const { licenseKey, machineId } = body;

    if (!isValidLicenseKeyFormat(licenseKey)) {
      return c.json<VerifyResponse>({
        valid: false,
        error: 'Invalid license key format',
      });
    }

    const license = await getLicenseByKey(c.env, licenseKey);
    if (!license) {
      return c.json<VerifyResponse>({
        valid: false,
        error: 'License not found',
      });
    }

    // Check if license is active
    if (license.status !== 'active') {
      return c.json<VerifyResponse>({
        valid: false,
        error: `License is ${license.status}`,
      });
    }

    // Check if period has expired
    const periodEnd = new Date(license.current_period_end);
    if (periodEnd < new Date()) {
      return c.json<VerifyResponse>({
        valid: false,
        error: 'License has expired',
      });
    }

    // Check if machine is activated
    const activation = await getActivation(c.env, license.id, machineId);
    if (!activation) {
      return c.json<VerifyResponse>({
        valid: false,
        error: 'Machine not activated',
      });
    }

    // Update last seen
    await updateActivationLastSeen(c.env, activation.id);

    return c.json<VerifyResponse>({
      valid: true,
      license: {
        email: license.email,
        plan: license.plan,
        status: license.status,
        expiresAt: license.current_period_end,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    return c.json<VerifyResponse>({
      valid: false,
      error: getErrorMessage(error),
    });
  }
});

// Deactivate machine
app.post('/api/license/deactivate', async (c) => {
  try {
    const { licenseKey, machineId } = await c.req.json<{
      licenseKey: string;
      machineId: string;
    }>();

    const license = await getLicenseByKey(c.env, licenseKey);
    if (!license) {
      return c.json({ success: false, error: 'License not found' }, 404);
    }

    await deleteActivation(c.env, license.id, machineId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Deactivate error:', error);
    return c.json({ success: false, error: getErrorMessage(error) }, 500);
  }
});

// ============================================
// Stripe Webhook Handler
// ============================================
app.post('/api/webhooks/stripe', async (c) => {
  try {
    const signature = c.req.header('stripe-signature');
    if (!signature) {
      console.error('Webhook: Missing stripe-signature header');
      return c.json({ error: 'Missing stripe-signature' }, 400);
    }

    const body = await c.req.text();
    console.log('Webhook: Received request, body length:', body.length);

    const event = await constructWebhookEvent(c.env, body, signature);
    console.log('Webhook: Event type:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Webhook: checkout.session.completed');
        console.log('Webhook: customer_email:', session.customer_email);
        console.log('Webhook: metadata:', JSON.stringify(session.metadata));

        const email = session.customer_email || session.metadata?.email;
        const plan = session.metadata?.plan as
          | 'monthly'
          | 'yearly'
          | 'lifetime';
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;

        console.log(
          'Webhook: Extracted - email:',
          email,
          'plan:',
          plan,
          'customerId:',
          customerId
        );

        if (!email || !plan) {
          console.error('Webhook: Missing email or plan in session metadata');
          return c.json({ received: true, error: 'missing_metadata' });
        }

        // Check if license already exists
        const existingLicense = await getLicenseByStripeCustomer(
          c.env,
          customerId
        );
        if (existingLicense) {
          console.log(
            'Webhook: License already exists for customer:',
            customerId
          );
          return c.json({ received: true, existing: true });
        }

        // Create new license
        const licenseKey = generateLicenseKey();
        const periodEnd = calculatePeriodEnd(plan);
        const maxMachines = getMaxMachinesForPlan(plan);

        // Check if a user with this email already exists
        const existingUser = await getUserByEmail(c.env, email);
        const userId = existingUser?.id || null;

        console.log(
          'Webhook: Creating license - key:',
          licenseKey,
          'periodEnd:',
          periodEnd.toISOString(),
          'userId:',
          userId
        );

        await createLicense(c.env, {
          id: nanoid(),
          email,
          license_key: licenseKey,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan,
          status: 'active',
          current_period_end: periodEnd.toISOString(),
          max_machines: maxMachines,
          user_id: userId,
        });

        console.log('Webhook: License created successfully for:', email);

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        // Use type assertion for current_period_end
        const periodEndTimestamp = (
          subscription as unknown as { current_period_end: number }
        ).current_period_end;
        const periodEnd = new Date(periodEndTimestamp * 1000);

        const license = await getLicenseByStripeCustomer(c.env, customerId);
        if (license) {
          let licenseStatus: 'active' | 'canceled' | 'expired' | 'past_due' =
            'active';
          if (status === 'canceled') licenseStatus = 'canceled';
          else if (status === 'past_due') licenseStatus = 'past_due';
          else if (status === 'unpaid') licenseStatus = 'expired';

          await updateLicenseStatus(
            c.env,
            license.id,
            licenseStatus,
            periodEnd.toISOString()
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const license = await getLicenseByStripeCustomer(c.env, customerId);
        if (license) {
          await updateLicenseStatus(c.env, license.id, 'canceled');
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: getErrorMessage(error) }, 400);
  }
});

// ============================================
// Export the Hono app
// ============================================
export default app;
