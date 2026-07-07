# Quarry - Cloudflare Workers

License and billing API for Quarry, backed by Cloudflare Workers, D1, and Stripe.

## Services

| Service | Purpose                                        |
| ------- | ---------------------------------------------- |
| Workers | Hono API routes                                |
| D1      | License, user, session, and activation storage |
| Stripe  | Checkout, billing portal, and webhook events   |

## Setup

```bash
cd packages/cloudflare
wrangler d1 create quarry-db
wrangler d1 migrations apply quarry-db --local
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

For OAuth and desktop SSO, also set the GitHub/Google client secrets listed in `wrangler.toml`.

## Development

```bash
pnpm --filter @quarry/cloudflare dev
pnpm --filter @quarry/cloudflare typecheck
pnpm --filter @quarry/cloudflare deploy
pnpm --filter @quarry/cloudflare deploy:production
```

Local dev runs at `http://localhost:8787`.

## API Endpoints

| Endpoint                  | Method | Description                                |
| ------------------------- | ------ | ------------------------------------------ |
| `/api/health`             | GET    | Health check with DB status                |
| `/api/db/info`            | GET    | Database tables info                       |
| `/api/checkout`           | POST   | Create Stripe Checkout session             |
| `/api/portal`             | POST   | Create Stripe Customer Portal session      |
| `/api/billing/portal`     | POST   | Create portal session from browser session |
| `/api/license/lookup`     | POST   | Retrieve license by email                  |
| `/api/license/activate`   | POST   | Activate license on a machine              |
| `/api/license/verify`     | POST   | Verify license                             |
| `/api/license/deactivate` | POST   | Deactivate machine                         |
| `/api/webhooks/stripe`    | POST   | Stripe webhook handler                     |

## Project Structure

```
packages/cloudflare/
├── src/
│   ├── index.ts
│   └── api/
├── migrations/
├── wrangler.toml
├── package.json
├── tsconfig.json
└── project.json
```
