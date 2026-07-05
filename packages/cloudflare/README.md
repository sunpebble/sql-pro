# Quarry - Cloudflare Workers

This package contains the unified Cloudflare Workers deployment for Quarry, hosting both the website and license API using **100% Cloudflare infrastructure**.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  Static Assets   │    │       Hono API Routes        │  │
│  │  (public/)       │    │       (/api/*)               │  │
│  │                  │    │                              │  │
│  │  - index.html    │    │  - /api/health               │  │
│  │  - assets/       │    │  - /api/checkout             │  │
│  │  - favicon.ico   │    │  - /api/portal               │  │
│  │                  │    │  - /api/license/lookup       │  │
│  └────────┬─────────┘    │  - /api/license/activate     │  │
│           │              │  - /api/license/verify       │  │
│           │              │  - /api/license/deactivate   │  │
│           │              │  - /api/webhooks/stripe      │  │
│           │              └──────────────────────────────┘  │
│           │                            │                    │
│           └────────────────────────────┘                    │
│                        ↓                                    │
│               Request Router                                │
│      (non-/api/* → static, /api/* → Hono)                  │
└─────────────────────────────────────────────────────────────┘
                         ↓
    ┌─────────────────────────────────────────────────────┐
    │                 Cloudflare D1                        │
    │              (SQLite at the Edge)                    │
    └─────────────────────────────────────────────────────┘
                         ↓
    ┌─────────────────────────────────────────────────────┐
    │                    Stripe                            │
    │              (Payment Processing)                    │
    └─────────────────────────────────────────────────────┘
```

## 100% Cloudflare Ecosystem

This deployment uses only Cloudflare services:

| Service     | Purpose             |
| ----------- | ------------------- |
| **Workers** | Serverless compute  |
| **D1**      | SQLite database     |
| **Assets**  | Static file hosting |

**External service:** Only Stripe for payment processing (required for accepting payments).

## Quick Start

### 1. Create D1 Database

```bash
cd packages/cloudflare

# Create the database
wrangler d1 create quarry-db

# You'll get output like:
# ✅ Successfully created DB 'quarry-db'
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Update wrangler.toml with the database_id
```

### 2. Run Migrations

```bash
# Apply migrations locally (for development)
wrangler d1 migrations apply quarry-db --local

# Apply migrations to production
wrangler d1 migrations apply quarry-db --remote
```

### 3. Configure Secrets (Only 2 Required!)

```bash
cd packages/cloudflare

# Stripe payment integration
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

That's it! No email service configuration needed.

### 4. Build & Deploy

```bash
# Build website and deploy
pnpm nx build @quarry/cloudflare
pnpm nx deploy @quarry/cloudflare
```

## Development

### Local Development

```bash
# Start the development server with local D1
pnpm nx dev @quarry/cloudflare
```

This starts at `http://localhost:8787` with a local D1 database.

### Building

```bash
# Build the website and copy to public/
pnpm nx build @quarry/cloudflare
```

## Deployment

```bash
# Deploy to development
pnpm nx deploy @quarry/cloudflare

# Deploy to production
pnpm nx deploy:production @quarry/cloudflare
```

## API Endpoints

| Endpoint                  | Method | Description                           |
| ------------------------- | ------ | ------------------------------------- |
| `/api/health`             | GET    | Health check with DB status           |
| `/api/db/info`            | GET    | Database tables info                  |
| `/api/checkout`           | POST   | Create Stripe Checkout Session        |
| `/api/portal`             | POST   | Create Stripe Customer Portal Session |
| `/api/license/lookup`     | POST   | **Retrieve license by email**         |
| `/api/license/activate`   | POST   | Activate license on a machine         |
| `/api/license/verify`     | POST   | Verify license                        |
| `/api/license/deactivate` | POST   | Deactivate machine                    |
| `/api/webhooks/stripe`    | POST   | Stripe Webhook handler                |

## License Retrieval Flow

Since we don't send emails, users retrieve their license via the website:

```
1. User completes Stripe Checkout
2. Stripe redirects to /?checkout=success
3. Website shows License Lookup modal
4. User enters their email
5. POST /api/license/lookup → returns license key
6. User copies license key and activates in app
```

## Environment Variables

| Variable                | Description                        | Required |
| ----------------------- | ---------------------------------- | -------- |
| `STRIPE_SECRET_KEY`     | Stripe secret API key              | Yes      |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret      | Yes      |
| `ENVIRONMENT`           | Environment name (auto-configured) | No       |

**Note:** Database is handled via D1 binding - zero configuration needed!

## Project Structure

```
packages/cloudflare/
├── src/
│   ├── index.ts          # Main entry with Hono routes
│   └── api/
│       ├── db.ts         # D1 database operations
│       ├── error-utils.ts # Error handling utilities
│       ├── license.ts    # License key generation/validation
│       ├── stripe.ts     # Stripe integration
│       └── types.ts      # TypeScript types
├── migrations/           # D1 database migrations
│   └── 0001_init.sql     # Initial schema
├── public/               # Static website files
├── wrangler.toml         # Cloudflare configuration
├── package.json
├── tsconfig.json
└── project.json          # Nx project configuration
```

## Database Migrations

Migrations are in `migrations/` directory:

```bash
# Add a new migration
# Create: migrations/000X_description.sql

# Apply locally
wrangler d1 migrations apply quarry-db --local

# Apply to production
wrangler d1 migrations apply quarry-db --remote
```

## Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret

## Cost Estimate

Using Cloudflare's free tier:

| Service | Free Tier                     | Estimated Usage |
| ------- | ----------------------------- | --------------- |
| Workers | 100K requests/day             | ✅ Covered      |
| D1      | 5M reads/day, 100K writes/day | ✅ Covered      |
| Assets  | Unlimited                     | ✅ Free         |

**Monthly cost: $0** (for most indie projects)

Only pay for Stripe's 2.9% + $0.30 per transaction.
