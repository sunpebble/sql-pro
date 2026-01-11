import type {
  ActivateRequest,
  CheckoutRequest,
  Env,
  VerifyRequest,
  VerifyResponse,
} from './types';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { nanoid } from 'nanoid';
import {
  createActivation,
  createLicense,
  deleteActivation,
  getActivation,
  getActivationsForLicense,
  getLicenseByEmail,
  getLicenseByKey,
  getLicenseByStripeCustomer,
  initDb,
  updateActivationLastSeen,
  updateLicenseStatus,
} from './db';
import {
  calculatePeriodEnd,
  generateLicenseKey,
  getMaxMachinesForPlan,
  isValidLicenseKeyFormat,
} from './license';
import {
  constructWebhookEvent,
  createCheckoutSession,
  createCustomerPortalSession,
} from './stripe';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for desktop app
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', service: 'sql-pro-license-api' });
});

// Initialize database (run once)
app.post('/api/init', async (c) => {
  try {
    await initDb(c.env);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: (error as Error).message }, 500);
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
    return c.json({ success: false, error: (error as Error).message }, 500);
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
    return c.json({ success: false, error: (error as Error).message }, 500);
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
    return c.json({ success: false, error: (error as Error).message }, 500);
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
      error: (error as Error).message,
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
    return c.json({ success: false, error: (error as Error).message }, 500);
  }
});

// Stripe Webhook Handler
app.post('/api/webhooks/stripe', async (c) => {
  try {
    const signature = c.req.header('stripe-signature');
    if (!signature) {
      return c.json({ error: 'Missing stripe-signature' }, 400);
    }

    const body = await c.req.text();
    const event = await constructWebhookEvent(c.env, body, signature);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const email = session.customer_email || session.metadata?.email;
        const plan = session.metadata?.plan as
          | 'monthly'
          | 'yearly'
          | 'lifetime';
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;

        if (!email || !plan) {
          console.error('Missing email or plan in session metadata');
          return c.json({ received: true });
        }

        // Check if license already exists
        const existingLicense = await getLicenseByStripeCustomer(
          c.env,
          customerId
        );
        if (existingLicense) {
          console.warn('License already exists for customer:', customerId);
          return c.json({ received: true });
        }

        // Create new license
        const licenseKey = generateLicenseKey();
        const periodEnd = calculatePeriodEnd(plan);
        const maxMachines = getMaxMachinesForPlan(plan);

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
        });

        console.warn('Created license for:', email);
        // TODO: Send email with license key
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const periodEnd = new Date(subscription.current_period_end * 1000);

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
        console.warn('Unhandled event type:', event.type);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return c.json({ error: (error as Error).message }, 400);
  }
});

export default app;
