# PHX Exchange

## Overview
PHX Exchange is a multi-role B2B2C marketplace designed to revolutionize Hajj and Umrah accommodation bookings. It facilitates auctions for hotel room blocks, enables brokers to manage inventory, and allows agents to book rooms for pilgrims. The platform incorporates a financial sandbox compliant with Saudi B2B regulations, an escrow-based payout system, and a robust role-based compliance and verification system. The project's vision is to enhance efficiency, transparency, and trust within the Hajj and Umrah accommodation sector, addressing a significant market need and offering significant market potential.

## User Preferences
- Clear and concise communication
- Iterative development with regular updates
- Confirmation before major architectural changes
- Well-documented code following best practices

## System Architecture
The platform is built with a React, Vite, and TailwindCSS frontend, utilizing shadcn/ui and wouter. It supports multiple languages (English, Arabic, Urdu, Farsi/Persian) with automatic RTL adjustments and a default dark theme. Mapping functionalities are integrated using Leaflet and react-leaflet.

The backend is an Express.js API using session-based authentication with `express-session` and `bcrypt`. PostgreSQL is the database, managed by Drizzle ORM. Real-time communication, essential for auctions, is handled by a WebSocket server.

**Core Features and Technical Implementations:**
- **Atomic Auction Engine:** Real-time bidding with anti-sniping and WebSocket broadcasts.
- **Escrow System:** Implements an 80/20 payout based on hotel check-ins.
- **Compliance Workflow:** Verification process for feature access.
- **Resale Pipeline & Direct Offers:** Brokers can apply markups for agents, and agents can book at marked-up prices, including private offers.
- **Audit-Ready Wallet Ledger:** Double-entry accounting for financial transactions.
- **Dispute System:** Mechanism for agents to file disputes, freezing escrow and triggering admin resolution.
- **Multi-Currency Support:** Displays prices in SAR (base), USD, IDR, and PKR.
- **Agent Storefront (B2B2C):** Agents can create public storefronts for direct pilgrim bookings.
- **Document Generation:** Uses jsPDF for booking vouchers and ZATCA compliant tax invoices with TLV QR codes.
- **Data Import:** papaparse facilitates CSV bulk uploads for pilgrim data.
- **Background Workers:** Manage auction expirations, escrow releases, inventory clawbacks, license suspensions, and retry mechanisms.
- **Production Service Layer:** Includes `NusukApiService` for pilgrim synchronization and `ZatcaBillingService` for tax invoice generation.
- **Middleware Stack:** Incorporates request ID assignment, tiered rate limiting, Zod validation, and `Trust Proxy`.
- **User Roles:** Distinct roles (ADMIN, HOTEL, BROKER, AGENT) with specific functionalities.

## External Dependencies
- **PostgreSQL:** Primary relational database.
- **ZATCA:** For e-invoicing and generating TLV QR codes, with a simulation mode.
- **Nusuk Masar:** Integrated for pilgrim synchronization and visa processing, including a simulation mode.
- **Ministry BRN:** Referenced for Business Registration Numbers.

## File Structure
- `server/index.ts` — Express setup, middleware, service initialization
- `server/routes.ts` — API route handlers (thin, delegates to services)
- `server/storage.ts` — Database CRUD via Drizzle ORM (IStorage interface)
- `server/config.ts` — Centralized environment configuration
- `server/logger.ts` — Structured Logger (console + system_logs table)
- `server/validation.ts` — Zod validation middleware + request schemas
- `server/middleware/rate-limiter.ts` — Rate limiting (auth 10/15min, public 30/15min, API 100/15min)
- `server/services/nusuk-service.ts` — NusukApiService (pilgrim sync, ministry approval)
- `server/services/zatca-service.ts` — ZatcaBillingService (tax invoices, TLV QR)
- `server/services/retry-queue.ts` — RetryQueue (exponential backoff tasks)
- `shared/schema.ts` — Drizzle schema + Zod schemas + types

## Database Tables
users, auctions, bids, room_blocks, bookings, pilgrims, pilgrim_bookings, wallet_transactions, disputes, agent_storefronts, direct_offers, hotel_check_ins, system_logs, task_queue

**Key columns (pilgrim_bookings):** visa_status (PENDING/ISSUED/REJECTED), nusuk_synced, nusuk_synced_at, ministry_rejection_reason, passport_expiry
**Key columns (pilgrims):** passport_expiry

## Test Accounts
- Admin: admin@phxcore.com / admin123
- Hotel 1: almadinah@hotel.com / hotel123 (Al Madinah Grand Hotel)
- Hotel 2: haramview@hotel.com / hotel123 (Haram View Suites)
- Broker: summit@broker.com / broker123 (Summit Hajj Services)
- Agent: alnoor@agent.com / agent123 (Storefront slug: al-noor-travel)

## User Manual

### Hotel User Guide
1. Log in, go to Auctions, click "New Listing" to create a room block auction (room type, distance, rooms, floor price, end time)
2. Auction goes live with real-time bidding — highest bidder wins automatically
3. After auction ends: View Rooming List for registered pilgrims, assign Ministry BRN Code
4. Confirm guest check-ins when pilgrims arrive (triggers 80% escrow release)
5. Go to Profile to set star rating, distance from Haram, amenities, GPS coordinates, hotel image URL

### Broker User Guide
1. Navigate to Auctions, browse live listings, click "Place Bid" (must exceed current highest or floor price)
2. Bids broadcast in real-time via WebSocket — won blocks appear in Inventory
3. In Inventory: set Markup Percentage, toggle Listed (visible to agents), toggle Public/Private
4. Monitor 7-day listing deadline — unlisted rooms revert to hotel
5. Send Direct Offers: select agent, set room count and price — agent gets accept/decline options

### Agent User Guide

**Browsing and Booking:**
1. Navigate to Marketplace, browse blocks with hotel images, room type, distance, price + 15% VAT
2. Click "Book Now", enter room count, confirm — payment via escrow

**Managing Pilgrims:**
1. Navigate to Bookings, expand booking, click "Add Pilgrim" (name, passport, passport expiry, Nusuk ID, etc.)
2. Use CSV Upload for bulk registration
3. Download Booking Voucher PDF

**Storefront Setup:**
1. Navigate to Storefront > Setup tab
2. Configure slug, display name, description, commission rate
3. Click "Update Settings" to save changes
4. Toggle Active to publish — share URL: /s/your-slug

**Pilgrim-to-Ministry Flow (End-to-End):**
When a pilgrim or group leader submits a booking through the public storefront, the data flows as follows:
1. Pilgrim submits booking on /s/your-slug (individual form, group form, or CSV upload)
2. Booking and all pilgrim details are saved immediately to the database
3. Agent sees the new booking in Bookings page — expand to review all submitted pilgrim data
4. Agent verifies/corrects pilgrim information before ministry submission
5. Agent goes to Storefront > Nusuk Dashboard tab
6. Agent selects bookings and clicks "Sync to Nusuk" — system validates passport expiry, Nusuk ID format, name transliteration, passport number, citizenship, and date of birth
7. If validation fails: error fields are highlighted in red with warning icons; agent clicks "Fix Data Now" to edit pilgrim details inline (full name, citizenship, passport number, DOB, passport expiry, Nusuk ID), saves, and retries sync
8. Status updates: SYNCED (success), FAILED (validation error), or QUEUED (will auto-retry)
9. For synced bookings, agent clicks "Request Ministry Approval" to request visa numbers
10. Ministry response (visa numbers) appears on agent's Nusuk Dashboard with ISSUED, PENDING, or REJECTED status
11. If ministry rejects (e.g., invalid Nusuk ID): visa status set to REJECTED, nusukSynced reset to false, rejection reason displayed — agent can use "Fix Data Now" to correct data, then re-sync and re-request approval
12. Only the agent controls ministry submissions — pilgrims never interact with the ministry directly
13. Failed syncs auto-retry via Retry Queue with exponential backoff

**Where Ministry Responses Are Visible:**
- Agent's Nusuk Dashboard (Storefront page) — full visa details
- Pilgrim's public Booking Status page — pilgrim enters Voucher ID + passport number to see visa status (sensitive data masked)

**Tax Invoices:** Click Invoice on any booking for ZATCA-compliant PDF with TLV QR code
**Filing Disputes:** Click dispute icon on booking, enter reason — escrow freezes, admin notified

### Admin User Guide
- Users: view all users, toggle Verified, click Impersonate for support (bank details hidden during impersonation)
- Reports: platform-wide financial summaries
- Escrow: view holds, process releases, resolve disputes
- Offer Audit: monitor all direct offers between brokers and agents — total offer value vs wholesale value, hidden markup totals, average markup %, and stale/unresponded offers
- System Logs: GET /api/admin/system-logs (filterable by level, source, action, date)
- Task Queue: GET /api/admin/task-queue (pending, processing, completed, failed tasks)

### Pilgrim Guide (Public Pages)
1. Visit agent storefront URL: /s/agent-slug
2. Browse rooms, submit individual or group booking (CSV upload supported)
3. Receive Voucher ID (format: PHX-2026-XXXXX) after booking
4. Your data goes to the agent for review — agent submits to Ministry on your behalf
5. Check status: visit Booking Status page, enter Voucher ID + Passport Number
6. Booking Status page shows a 3-step progress tracker:
   - Step 1: "Booking Received" — confirmed immediately after submission
   - Step 2: "Submitted to Ministry" — updates when agent syncs to Nusuk (shows date)
   - Step 3: "Visa Issued" — updates when Ministry approves (shows visa number + Download Voucher button)
7. You do not interact with the Ministry directly

### Language and Currency
- Globe icon in sidebar: EN, AR, UR, FA (RTL auto-applied for Arabic/Urdu/Persian)
- Currency selector: SAR, USD, IDR, PKR (conversions from SAR base)

## Running the Project
1. Workflow "Start application" runs `npm run dev` (Express port 5000 + Vite)
2. Database schema synced via `npm run db:push`
3. Seed data auto-loads on first run (5 test accounts, sample auctions)
4. Background workers start automatically (auction, escrow, release, license, retry)

## Future Features (Conditional)
- Secure passport document upload (encrypted at rest, PDPL-compliant, auto-delete after retention period) — if Ministry of Hajj requires scanned passport copies via Nusuk API
- SMS/email notifications — pilgrim forms currently lack contact fields
- **SAMA-regulated escrow custody** — Currently PHX holds escrow funds directly. For KSA production, evaluate partnering with a SAMA-licensed payment institution or Saudi bank to hold funds in a regulated segregated escrow account. Ministry of Hajj may set escrow release conditions; PHX would enforce them programmatically while the bank provides custody and audit compliance. Key investor discussion point: who holds the funds (PHX vs. regulated custodian vs. Ministry-supervised account).

## Deployment Notes
- Replit dev URL suitable for investor demos
- KSA production: migrate to Saudi cloud, pg_dump/pg_restore, set Nusuk/ZATCA env vars
- Saudi .sa domain requires nic.sa + CR number