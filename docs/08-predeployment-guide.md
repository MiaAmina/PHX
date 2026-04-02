# PHX Exchange — Pre-Deployment & Application Settings Guide

This document covers everything needed to take PHX Exchange from the current development environment to a production deployment in Saudi Arabia.

---

## 1. Current State Summary

The platform is fully functional in development mode with:
- All 4 roles operational (Admin, Hotel, Broker, Agent)
- Auction engine, escrow system, wallet ledger, dispute resolution — all working
- ZATCA invoice generation and Nusuk sync — running in simulation mode
- Background workers active (auction expiry, escrow release, inventory clawback, license suspension, retry queue)
- 5 seeded test accounts with sample data

---

## 2. Environment Variables — Complete Reference

All settings are managed through environment variables. The configuration file is `server/config.ts`.

### 2.1 Required Variables (Must Set Before Deployment)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/phx_exchange` |
| `SESSION_SECRET` | Express session encryption key (use a strong random string) | `a1b2c3d4e5f6...` (64+ characters) |
| `NODE_ENV` | Set to `production` for deployment | `production` |
| `PORT` | Server port | `5000` |

### 2.2 Nusuk Masar Integration (Ministry of Hajj)

| Variable | Description | Default |
|----------|-------------|---------|
| `NUSUK_API_URL` | Nusuk Masar API base URL | Empty (simulation mode) |
| `NUSUK_API_KEY` | Nusuk Masar API key | Empty (simulation mode) |
| `NUSUK_API_TIMEOUT_MS` | API request timeout | `30000` (30 seconds) |
| `NUSUK_SIMULATION_MODE` | Force simulation even if URL is set | `true` or `false` |

**Current state:** Simulation mode is active. The system generates realistic mock responses for pilgrim sync and ministry approval requests. Set `NUSUK_API_URL` and `NUSUK_API_KEY` with real credentials to connect to the Ministry.

### 2.3 ZATCA E-Invoicing (Tax Authority)

| Variable | Description | Default |
|----------|-------------|---------|
| `ZATCA_API_URL` | ZATCA Fatoora API base URL | Empty (simulation mode) |
| `ZATCA_API_KEY` | ZATCA API key | Empty (simulation mode) |
| `ZATCA_SIMULATION_MODE` | Force simulation even if URL is set | `true` or `false` |

**Current state:** Simulation mode is active. Tax invoices are generated locally with valid TLV QR codes. Set real credentials to submit invoices to ZATCA Fatoora platform.

### 2.4 Payment Gateway (Not Yet Integrated — See Section 7)

| Variable | Description |
|----------|-------------|
| `PAYMENT_GATEWAY` | `hyperpay`, `moyasar`, or `tap` |
| `PAYMENT_MODE` | `sandbox` or `production` |
| `HYPERPAY_ENTITY_ID` | HyperPay sandbox/production entity ID |
| `HYPERPAY_ACCESS_TOKEN` | HyperPay sandbox/production access token |
| `HYPERPAY_API_URL` | `https://eu-test.oppwa.com` (sandbox) or `https://eu-prod.oppwa.com` (production) |
| `MOYASAR_PUBLISHABLE_KEY` | Moyasar publishable key |
| `MOYASAR_SECRET_KEY` | Moyasar secret key |
| `TAP_SECRET_KEY` | Tap Payments secret key |
| `TAP_PUBLISHABLE_KEY` | Tap Payments publishable key |

### 2.5 Rate Limiting

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window | `900000` (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Max API requests per window | `100` |
| `RATE_LIMIT_PUBLIC_MAX` | Max public endpoint requests per window | `30` |
| `RATE_LIMIT_AUTH_MAX` | Max auth endpoint requests per window | `10` |

### 2.6 Retry Queue (Background Task Processing)

| Variable | Description | Default |
|----------|-------------|---------|
| `RETRY_MAX_ATTEMPTS` | Maximum retry attempts for failed tasks | `5` |
| `RETRY_BASE_DELAY_MS` | Initial retry delay | `1000` (1 second) |
| `RETRY_MAX_DELAY_MS` | Maximum retry delay (exponential backoff cap) | `300000` (5 minutes) |
| `RETRY_WORKER_INTERVAL_MS` | How often the worker checks for pending tasks | `30000` (30 seconds) |

### 2.7 Session & Security

| Variable | Description | Default |
|----------|-------------|---------|
| `SESSION_MAX_AGE_MS` | Session expiry time | `604800000` (7 days) |
| `UPLOAD_MAX_FILE_SIZE` | Max file upload size in bytes | `10485760` (10 MB) |

### 2.8 Validation Rules

| Variable | Description | Default |
|----------|-------------|---------|
| `PASSPORT_EXPIRY_CUTOFF` | Minimum passport expiry date for pilgrim registration | `2026-12-20` |

---

## 3. Database Setup

### 3.1 PostgreSQL Requirements

- PostgreSQL 14 or higher
- Recommended: Managed PostgreSQL service (e.g., STC Cloud managed database, AWS RDS, or Azure Database for PostgreSQL)
- Minimum storage: 10 GB for initial deployment, plan for 50+ GB for Hajj season

### 3.2 Schema Sync

```bash
npm run db:push
```

This synchronizes the Drizzle ORM schema to the database. Run this once on initial setup and after any schema changes.

### 3.3 Database Tables

| Table | Purpose |
|-------|---------|
| `users` | All platform accounts (hotels, brokers, agents, admins) |
| `auctions` | Room block auction listings |
| `bids` | Broker bids on auctions |
| `room_blocks` | Won room inventory managed by brokers |
| `bookings` | Agent room bookings |
| `pilgrim_bookings` | Individual pilgrim records within bookings |
| `wallet_transactions` | Double-entry financial ledger |
| `disputes` | Agent-filed disputes with escrow freeze |
| `agent_storefronts` | Agent public storefront configuration |
| `direct_offers` | Private broker-to-agent room offers |
| `hotel_check_ins` | Hotel guest check-in confirmations |
| `system_logs` | Structured application logs |
| `task_queue` | Background task queue (retry, sync) |

### 3.4 Seed Data

On first run, the application automatically seeds:
- 5 test accounts (admin, 2 hotels, 1 broker, 1 agent)
- Sample auctions and room blocks
- Sample bookings with pilgrim data

**For production:** Remove or skip the seed data by setting `NODE_ENV=production`. Create real accounts through the registration flow or admin panel.

### 3.5 Database Migration (Development to Production)

```bash
# Export from development
pg_dump -Fc $DATABASE_URL > phx_backup.dump

# Import to production
pg_restore -d $PRODUCTION_DATABASE_URL phx_backup.dump
```

---

## 4. Build & Deployment

### 4.1 Build for Production

```bash
npm run build    # Compiles TypeScript backend and builds Vite frontend
```

This produces:
- `dist/` — compiled backend
- `dist/public/` — compiled frontend assets

### 4.2 Start Production Server

```bash
npm start        # Starts Express server serving both API and frontend
```

### 4.3 Production Checklist

| Item | Action | Status |
|------|--------|--------|
| Set `NODE_ENV=production` | Enables secure cookies, disables dev tools | Required |
| Set strong `SESSION_SECRET` | 64+ character random string | Required |
| Configure `DATABASE_URL` | Point to production PostgreSQL | Required |
| Run `npm run db:push` | Sync schema to production database | Required |
| Set `PORT` | Match your hosting environment | Required |
| Enable HTTPS/TLS | Configure reverse proxy (nginx, Cloudflare) | Required |
| Set domain name | Saudi `.sa` domain requires nic.sa + CR number | Required |
| Configure rate limits | Adjust for expected traffic volume | Recommended |
| Set `PASSPORT_EXPIRY_CUTOFF` | Update to match current Hajj season | Recommended |
| Remove seed data | Delete test accounts from production database | Required |

---

## 5. Background Workers

The application starts 5 background workers automatically on boot. No separate configuration needed.

| Worker | Interval | Purpose |
|--------|----------|---------|
| Auction Expiry | Every 30 seconds | Settles expired auctions, awards winning bidder |
| Escrow Release | Every 60 seconds | Auto-releases escrow 48 hours after check-in if no dispute |
| Inventory Clawback | Every 60 seconds | Reverts unlisted room blocks to hotel after 7 days |
| License Suspension | Daily | Suspends users with expired business licenses |
| Retry Queue | Every 30 seconds | Retries failed Nusuk sync and ministry approval requests |

### Worker Tuning for Production

For Hajj season (high volume), consider:
- Reduce auction expiry check to every 10 seconds
- Increase rate limits to handle 1000+ concurrent users
- Monitor `task_queue` table for failed tasks

---

## 6. WebSocket Configuration

Real-time auction bidding requires WebSocket connectivity.

| Setting | Value |
|---------|-------|
| Path | `/ws` (same HTTP server) |
| Events | `bid_placed`, `auction_extended`, `auction_settled` |
| Client | Auto-reconnect built into `lib/websocket.ts` |

**Production note:** If using a load balancer, enable WebSocket passthrough (sticky sessions recommended).

---

## 7. External Service Integration Checklist

### Integration Readiness Summary

| Integration | Code Status | What You Need | Code Changes Required |
|-------------|------------|---------------|----------------------|
| **Nusuk Masar (Ministry)** | Complete — real API calls and simulation both built in `server/services/nusuk-service.ts` | `NUSUK_API_URL` and `NUSUK_API_KEY` from the Ministry | None — set 2 environment variables and restart |
| **ZATCA Fatoora (Tax)** | Complete — real API submission and local generation both built in `server/services/zatca-service.ts` | `ZATCA_API_URL` and `ZATCA_API_KEY` from ZATCA portal | None — set 2 environment variables and restart |
| **Payment Gateway** | Not yet built | Sandbox credentials from HyperPay, Moyasar, or Tap | Yes — one new file: `server/services/payment-service.ts` (~1-2 weeks) |
| **Nafath SSO** | Not yet built | API agreement with National Information Center | Yes — new identity verification service (future) |

**How Nusuk and ZATCA work today:** Both services check their environment variables on startup. If no API URL is set, they run in simulation mode automatically. If you set the credentials, the exact same code switches to calling the real Ministry/ZATCA APIs — no rebuild, no redeployment, just set the variables and restart the application.

**How the Payment Gateway will work:** Once you choose a gateway (HyperPay, Moyasar, or Tap), it follows the same pattern as Stripe — set your API keys as environment variables, and the payment service handles checkouts, confirmations, and refunds. The existing escrow logic, 80/20 split, dispute freeze, and wallet ledger stay exactly as they are. The payment service is just the bridge between "debit the wallet" and "charge the card."

### 7.1 Nusuk Masar (Ministry of Hajj)

| Step | Action | Who |
|------|--------|-----|
| 1 | Request API access from Ministry of Hajj IT department | Amina / Business |
| 2 | Receive sandbox API URL and API key | Ministry |
| 3 | Set `NUSUK_API_URL` and `NUSUK_API_KEY` environment variables | Developer |
| 4 | Set `NUSUK_SIMULATION_MODE=false` | Developer |
| 5 | Test pilgrim sync and ministry approval flows in sandbox | Developer |
| 6 | Request production API credentials | Amina / Business |
| 7 | Switch to production credentials | Developer |

### 7.2 ZATCA Fatoora (Tax Authority)

| Step | Action | Who |
|------|--------|-----|
| 1 | Register on ZATCA developer portal: https://sandbox.zatca.gov.sa | Amina / Business |
| 2 | Obtain Compliance CSID (Certificate Signing ID) | ZATCA portal |
| 3 | Set `ZATCA_API_URL` and `ZATCA_API_KEY` environment variables | Developer |
| 4 | Set `ZATCA_SIMULATION_MODE=false` | Developer |
| 5 | Test invoice submission in ZATCA sandbox | Developer |
| 6 | Complete ZATCA onboarding for production | Amina / Business |
| 7 | Switch to production credentials | Developer |

### 7.3 Payment Gateway (See Investor Pitch Deck Appendix A for full details)

| Step | Action | Who |
|------|--------|-----|
| 1 | Choose gateway: HyperPay (recommended), Moyasar, or Tap | Amina / Business |
| 2 | Register and obtain sandbox credentials | Amina / Business |
| 3 | Build `server/services/payment-service.ts` | Developer |
| 4 | Set payment environment variables | Developer |
| 5 | Test with sandbox card numbers | Developer |
| 6 | Apply for SAMA sandbox entry | Amina / Legal |
| 7 | Complete PCI DSS compliance | Developer / Security |
| 8 | Activate production gateway | Developer |

### 7.4 Nafath (National SSO — Future)

| Step | Action | Who |
|------|--------|-----|
| 1 | Apply for Nafath integration through National Information Center | Amina / Business |
| 2 | Receive API credentials and documentation | NIC |
| 3 | Build identity verification service | Developer |
| 4 | Replace manual admin verification with Nafath biometric checks | Developer |

---

## 8. Saudi Hosting & Domain Requirements

### 8.1 Data Residency

Saudi NDMO (National Data Management Office) requires that citizen/pilgrim personal data be stored within the Kingdom.

**Recommended hosting options:**
- STC Cloud (Saudi Telecom Company) — Saudi sovereign cloud
- SDAIA Cloud — government-aligned cloud provider
- Alibaba Cloud (Riyadh region) — available in KSA
- AWS (Bahrain region) — GCC-based, check NDMO classification requirements

### 8.2 Domain Registration

| Requirement | Detail |
|-------------|--------|
| Domain | `.sa` domain required for Saudi-facing services |
| Registrar | nic.sa (Saudi Network Information Center) |
| Requirements | Valid Commercial Registration (CR) number |
| SSL/TLS | Required — use Let's Encrypt or commercial certificate |

### 8.3 NDMO Data Classification

All data stored by PHX Exchange is classified according to NDMO standards:

| Level | Classification | Examples | Residency Requirement |
|-------|---------------|----------|----------------------|
| Level 1 | Public | Hotel names, general room rates, auction listings | No restriction |
| Level 2 | Internal | Booking counts, revenue figures, platform analytics | Should remain in KSA |
| Level 3 | Sensitive/Personal | Pilgrim names, passport numbers, Nusuk IDs, visa numbers, payment records | **MUST NOT leave Saudi borders** |

**Requirements for Level 3 data:**
- Database must be hosted on Saudi sovereign cloud (STC Cloud, SDAIA, Oracle Jeddah, or Alibaba Cloud Riyadh)
- Any object storage for passport uploads must use a Saudi-region bucket
- Application logs containing PII must remain within Saudi infrastructure
- Backups must be stored within KSA — no cross-border replication

### 8.4 Infrastructure Sizing

| Component | Minimum | Hajj Season |
|-----------|---------|-------------|
| Application server | 2 vCPU, 4 GB RAM | 8 vCPU, 16 GB RAM |
| PostgreSQL | 2 vCPU, 4 GB RAM, 20 GB storage | 4 vCPU, 16 GB RAM, 100 GB storage |
| Redis (session store) | Optional for dev | Recommended for production (session persistence across restarts) |
| CDN | Optional | Recommended (static assets, global pilgrim access) |

---

## 9. Security Hardening for Production

| Item | Current State | Production Action |
|------|--------------|-------------------|
| Passwords | bcrypt hashed | Already production-ready |
| Sessions | Cookie-based, `httpOnly` | Set `secure: true` (automatic when `NODE_ENV=production`) |
| HTTPS | Not enforced in dev | Configure TLS termination at reverse proxy |
| Rate limiting | Active (auth: 10/15min, public: 30/15min, API: 100/15min) | Adjust based on expected traffic |
| Input validation | Zod schemas on all endpoints | Already production-ready |
| File uploads | CSV only, size limited | Add virus scanning for production |
| SQL injection | Parameterized queries via Drizzle ORM | Already production-ready |
| CORS | Same-origin (frontend served by Express) | Already production-ready |
| Request IDs | Assigned to every request | Already production-ready |
| Audit logging | `system_logs` table | Already production-ready |
| Immutable audit logs | Not enforced | Revoke DELETE on `system_logs` table in production — no admin can erase the trail |
| PII encryption at rest | Not implemented | Build `crypto-service.ts` — AES-256 encryption for passport numbers, Nusuk IDs, visa numbers |
| PII masking in UI | Not implemented | Display `XXXX-1234` unless user has "PII View" permission |
| Session timeouts | No role-based timeouts | Set 15-minute inactivity timeout for admin roles, 30 minutes for others |
| Security disclosure | No `security.txt` | Add `public/.well-known/security.txt` for responsible vulnerability reporting |
| Admin impersonation | Logged with `originalAdminId` | Already production-ready |

---

## 10. Monitoring & Observability

### 10.1 Built-In Logging

- All actions logged to `system_logs` table with level, source, action, message, and metadata
- Admin can query logs via `GET /api/admin/system-logs` (filterable by level, source, action, date)
- Background task status visible via `GET /api/admin/task-queue`

### 10.2 Recommended Production Additions

| Tool | Purpose |
|------|---------|
| Application monitoring (e.g., Datadog, New Relic) | Server performance, error tracking |
| Database monitoring | Query performance, connection pool, storage alerts |
| Uptime monitoring (e.g., UptimeRobot) | Alert if the platform goes down |
| Log aggregation (e.g., ELK Stack) | Centralized log search across services |

---

## 11. Test Accounts (Development Only)

These accounts are seeded automatically in development. **Remove them before production deployment.**

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | admin@phxcore.com | admin123 | Full platform access |
| Hotel 1 | almadinah@hotel.com | hotel123 | Al Madinah Grand Hotel |
| Hotel 2 | haramview@hotel.com | hotel123 | Haram View Suites |
| Broker | summit@broker.com | broker123 | Summit Hajj Services |
| Agent | alnoor@agent.com | agent123 | Storefront: /s/al-noor-travel |

---

## 12. Quick Start — Deployment in 10 Steps

1. Provision a PostgreSQL database on Saudi-hosted infrastructure
2. Set `DATABASE_URL`, `SESSION_SECRET`, `NODE_ENV=production`, `PORT`
3. Clone the repository to the production server
4. Run `npm install` to install dependencies
5. Run `npm run db:push` to create database tables
6. Run `npm run build` to compile the application
7. Run `npm start` to start the server
8. Configure reverse proxy (nginx) with HTTPS/TLS
9. Register `.sa` domain and point DNS to the server
10. Remove seed data and create real admin account

---

## 13. Files Reference

| File | Purpose |
|------|---------|
| `server/config.ts` | All environment variable defaults and configuration |
| `server/index.ts` | Express setup, middleware stack, service initialization |
| `server/routes.ts` | All API route handlers |
| `server/storage.ts` | Database CRUD operations (IStorage interface) |
| `server/db.ts` | PostgreSQL connection via Drizzle |
| `server/logger.ts` | Structured logging to console + system_logs table |
| `server/validation.ts` | Zod request validation schemas |
| `server/middleware/rate-limiter.ts` | Rate limiting configuration |
| `server/services/nusuk-service.ts` | Nusuk Masar API integration |
| `server/services/zatca-service.ts` | ZATCA e-invoicing integration |
| `server/services/retry-queue.ts` | Background task retry with exponential backoff |
| `server/release-worker.ts` | Escrow release and inventory clawback worker |
| `shared/schema.ts` | Database schema (Drizzle) + validation types (Zod) |
| `drizzle.config.ts` | Drizzle ORM configuration |
| `vite.config.ts` | Vite frontend build configuration |

**Files to be created for production (see Roadmap Features 16-20):**

| File | Purpose | When Needed |
|------|---------|-------------|
| `server/services/crypto-service.ts` | AES-256 encryption for PII (passports, Nusuk IDs, visa numbers) | Before production launch |
| `server/services/payment-service.ts` | Payment gateway integration (HyperPay, Moyasar, or Tap) | When gateway credentials are obtained |
| `scripts/zatca-onboarding.ts` | Exchange OTP for ZATCA Phase 2 production certificates (CSID) | When ZATCA Phase 2 onboarding begins |
| `public/.well-known/security.txt` | Responsible vulnerability disclosure contact information | Before production launch |
| `Dockerfile` | Containerized deployment to Saudi cloud providers | When migrating to Saudi infrastructure |
| `.dockerignore` | Exclude dev files from Docker builds | When migrating to Saudi infrastructure |
| `ecosystem.config.js` | PM2 auto-restart configuration for VPS deployments | Only if deploying on VPS instead of containers |
