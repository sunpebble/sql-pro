import type { Env } from './types';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(env: Env): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

// Stripe Price IDs for SQL Pro subscriptions
export const PRICE_IDS = {
  monthly: 'price_1SoR4VCoPJQxyAtwW0vaj2T9',
  yearly: 'price_1SoR4rCoPJQxyAtwv4xKqnCQ',
  lifetime: 'price_1SoR5JCoPJQxyAtwqX7AgCwT',
};

export interface CreateCheckoutParams {
  email: string;
  plan: 'monthly' | 'yearly' | 'lifetime';
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(
  env: Env,
  params: CreateCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe(env);

  const isSubscription = params.plan !== 'lifetime';

  const session = await stripe.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    customer_email: params.email,
    line_items: [
      {
        price: PRICE_IDS[params.plan],
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      plan: params.plan,
      email: params.email,
    },
    ...(isSubscription
      ? {
          subscription_data: {
            metadata: {
              plan: params.plan,
              email: params.email,
            },
          },
        }
      : {
          payment_intent_data: {
            metadata: {
              plan: params.plan,
              email: params.email,
            },
          },
        }),
  });

  return session;
}

export async function createCustomerPortalSession(
  env: Env,
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe(env);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

export async function constructWebhookEvent(
  env: Env,
  body: string,
  signature: string
): Promise<Stripe.Event> {
  const stripe = getStripe(env);

  return stripe.webhooks.constructEvent(
    body,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}
