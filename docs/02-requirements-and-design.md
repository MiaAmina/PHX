# PHX Core - Requirements Completion & Design Document

## 1. Project Vision

PHX Core is a multi-role marketplace platform that digitizes the Hajj and Umrah hotel accommodation supply chain. It connects Hotels, Brokers, and Travel Agents through a transparent auction-based system with built-in financial protections.

### Business Objectives
- Eliminate opaque middleman pricing in the Hajj/Umrah accommodation market
- Provide real-time, competitive auction-based room allocation
- Ensure financial protection for all parties through escrow mechanisms
- Enable full platform oversight and dispute resolution for administrators

### Source of Truth
All requirement statuses below are derived from direct code inspection of the implemented codebase. Key source files:
- Schema & Types: `shared/schema.ts`
- API Routes: `server/routes.ts`
- Storage/Business Logic: `server/storage.ts`
- Background Workers: `server/auction-worker.ts`, `server/escrow-worker.ts`
- Frontend Pages: `client/src/pages/*.tsx`
- Navigation: `client/src/components/app-sidebar.tsx`

---

## 2. Requirements Completion Matrix

### 2.1 Core Platform Requirements

| ID | Requirement | Status | Phase | Notes |
|----|-------------|--------|-------|-------|
| R-001 | Multi-role user system (Admin, Hotel, Broker, Agent) | COMPLETE | 1 | 4 distinct roles with separate dashboards |
| R-002 | Session-based authentication with bcrypt | COMPLETE | 1 | express-session + bcrypt password hashing |
| R-003 | Role-based route protection | COMPLETE | 1 | Server-side requireAuth + requireRole middleware |
| R-004 | User registration with business name | COMPLETE | 1 | Zod validation on registration form |
| R-005 | User verification system | COMPLETE | 6 | Admin toggle, gates auction creation and bidding |
| R-006 | Demo seed accounts for all roles | COMPLETE | 1 | 4 pre-seeded accounts with known credentials |

### 2.2 Auction System Requirements

| ID | Requirement | Status | Phase | Notes |
|----|-------------|--------|-------|-------|
| R-010 | Hotel creates room block auctions | COMPLETE | 2 | Room type, distance from Haram, quantity, floor price, end time |
| R-011 | Broker places bids on auctions | COMPLETE | 3 | Atomic bid placement with validation |
| R-012 | Floor price enforcement | COMPLETE | 3 | Bids must meet or exceed floor price |
| R-013 | Highest bid enforcement | COMPLETE | 3 | Each bid must exceed current highest |
| R-014 | Anti-sniping protection | COMPLETE | 3 | 60-second extension on last-minute bids |
| R-015 | Real-time bid updates via WebSocket | COMPLETE | 3 | bid_placed and auction_extended broadcasts |
| R-016 | Live countdown timer | COMPLETE | 3 | Ticks every second, "Xd HH:MM:SS" format |
| R-017 | Auto-expiry auction settlement | COMPLETE | 3 | Background worker creates WonBlock for winner |
| R-018 | Manual auction closing by Hotel | COMPLETE | 2 | Hotel can end auction early |
| R-019 | Verification gate for auction creation | COMPLETE | 6 | Only verified Hotels can create auctions |
| R-020 | Verification gate for bid placement | COMPLETE | 6 | Only verified Brokers can bid |

### 2.3 Inventory & Marketplace Requirements

| ID | Requirement | Status | Phase | Notes |
|----|-------------|--------|-------|-------|
| R-030 | Broker manages won inventory | COMPLETE | 4 | View all won blocks with auction details |
| R-031 | Fixed markup pricing | COMPLETE | 4 | Agent price = wholesale + fixed amount |
| R-032 | Percentage markup pricing | COMPLETE | 4 | Agent price = wholesale + (wholesale * pct / 100) |
| R-033 | Publish/unpublish inventory | COMPLETE | 4 | isListed toggle controls marketplace visibility |
| R-034 | Secure agent marketplace | COMPLETE | 4 | Strips wholesale price, markup amounts, broker ID |
| R-035 | Atomic room booking | COMPLETE | 4 | SELECT FOR UPDATE prevents concurrent overbooking |
| R-036 | Multi-room booking | COMPLETE | 4 | Agents book multiple rooms per transaction |
| R-037 | Auto-unlist at zero inventory | COMPLETE | 4 | Block automatically hidden when quantity reaches 0 |
| R-038 | Visibility controls (PUBLIC/PRIVATE/DIRECT) | COMPLETE | 7 | Three-tier access control on inventory |

### 2.4 Broker-Agent Relationship Requirements

| ID | Requirement | Status | Phase | Notes |
|----|-------------|--------|-------|-------|
| R-040 | Broker group management | COMPLETE | 7 | Add/remove verified agents from group |
| R-041 | Agent directory search | COMPLETE | 7 | Search all verified agents |
| R-042 | Unique broker-agent pairs | COMPLETE | 7 | Database unique index prevents duplicates |
| R-043 | Direct offers to group agents | COMPLETE | 7 | Custom pricing and room count per offer |
| R-044 | Offer accept/decline workflow | COMPLETE | 7 | Atomic acceptance creates booking + decrements inventory |
| R-045 | PRIVATE visibility checks | COMPLETE | 7 | Only group members see PRIVATE blocks |
| R-046 | DIRECT visibility checks | COMPLETE | 7 | Only assigned agent sees DIRECT blocks |

### 2.5 Guest Management Requirements

| ID | Requirement | Status | Phase | Notes |
|----|-------------|--------|-------|-------|
| R-050 | Manual pilgrim registration | COMPLETE | 5 | Individual form per booking |
| R-051 | CSV bulk pilgrim upload | COMPLETE | 5 | papaparse parsing with validation |
| R-052 | Client-side CSV pre-validation | COMPLETE | 5 | Missing name/passport, invalid gender, duplicates |
| R-053 | Server-side CSV validation | COMPLETE | 5 | Capacity overflow check, passport deduplication |
| R-054 | Room capacity enforcement | COMPLETE | 5 | Single=1, Double=2, Triple=3, Quad=4, Suite=2 |
| R-055 | PDF voucher generation | COMPLETE | 5 | jsPDF with QR code, booking details, "PHX CONFIRMED" stamp |
| R-056 | Hotel rooming list | COMPLETE | 5 | Pilgrims grouped by booking/agent for ended auctions |

### 2.6 Admin & Oversight Requirements

| ID | Requirement | Status | Phase | Notes |
|----|-------------|--------|-------|-------|
| R-060 | User management dashboard | COMPLETE | 6 | Summary stats + master user table |
| R-061 | Shadow mode (impersonation) | COMPLETE | 6 | Secure session swap with amber banner |
| R-062 | Return to admin from impersonation | COMPLETE | 6 | originalAdminId preserved in session |
| R-063 | Financial ledger | COMPLETE | 6 | totalGMV, wholesaleValue, brokerDelta, room metrics |
| R-064 | Direct offer audit trail | COMPLETE | 7 | Admin views all offers with full details |
| R-065 | Stale offer detection | COMPLETE | 7 | Offers pending > 72 hours flagged |
| R-066 | Broker group visibility (admin) | COMPLETE | 7 | Admin can view any broker's agent group |

### 2.7 Escrow & Financial Requirements

| ID | Requirement | Status | Phase | Notes |
|----|-------------|--------|-------|-------|
| R-070 | 80/20 escrow split on booking | COMPLETE | 8 | 20% instant to broker wallet, 80% held |
| R-071 | 80/20 escrow split on offer acceptance | COMPLETE | 8 | Same split for direct offer acceptance |
| R-072 | Digital wallets for brokers | COMPLETE | 8 | Balance and totalEarned tracking |
| R-073 | Digital wallets for hotels | COMPLETE | 8 | Balance and totalEarned tracking |
| R-074 | QR check-in triggers fund release | COMPLETE | 8 | Hotel scan releases 80% minus platform fee |
| R-075 | Configurable platform fee | COMPLETE | 8 | Admin adjustable, default 5%, deducted from escrow |
| R-076 | Admin escrow ledger | COMPLETE | 8 | Real-time table with summary cards |
| R-077 | Freeze/unfreeze escrow | COMPLETE | 8 | Admin dispute management controls |
| R-078 | Escrow event audit log | COMPLETE | 8 | Chronological event trail per escrow |
| R-079 | Auto-release safeguard | COMPLETE | 8 | 48h post-checkout auto-release if no scan |
| R-080 | Escrow authorization checks | COMPLETE | 8 | Only admin or involved parties can view |
| R-081 | Financial sandbox mode | COMPLETE | 8 | Status tracking only, no real payment processing |

### 2.8 Audit-Ready Wallet Ledger Requirements

| ID | Requirement | Status | Phase | Notes |
|----|-------------|--------|-------|-------|
| R-090 | Wallet transactions table | COMPLETE | 17 | wallet_transactions with type, amount, reference, status, timestamps |
| R-091 | Locked balance for payout holds | COMPLETE | 17 | lockedBalance column on wallets, deducted on payout request |
| R-092 | Payout request flow (Hotels/Brokers) | COMPLETE | 17 | Min SAR 10, creates PAYOUT_PENDING transaction, deducts from balance |
| R-093 | Admin payout approval | COMPLETE | 17 | PAYOUT_PENDING to PAYOUT_COMPLETED, clears lockedBalance |
| R-094 | Auto wallet transactions on booking | COMPLETE | 17 | ESCROW_HOLD created when agent books rooms |
| R-095 | Auto wallet transactions on check-in | COMPLETE | 17 | COMMISSION_CREDIT (hotel 80%) + PLATFORM_FEE on check-in |
| R-096 | Auto wallet transactions on auto-release | COMPLETE | 17 | Same as check-in, triggered by 48h auto-release worker |
| R-097 | Wallet page for all roles | COMPLETE | 17 | Balance cards + transaction history + payout request UI |

### 2.9 Dispute Management Requirements

| ID | Requirement | Status | Phase | Notes |
|----|-------------|--------|-------|-------|
| R-100 | Agent files dispute on booking | COMPLETE | 18 | Only for MILESTONE_1_PAID escrow, requires reason text |
| R-101 | Escrow frozen on dispute | COMPLETE | 18 | Escrow status set to FROZEN, wallet transaction recorded |
| R-102 | Hotel check-in blocked for disputes | COMPLETE | 18 | 400 error returned if escrow is FROZEN or DISPUTED |
| R-103 | Admin dispute management page | COMPLETE | 18 | Summary cards + dispute table with resolution actions |
| R-104 | Release to Hotel resolution | COMPLETE | 18 | Settles escrow, deducts platform fee, credits hotel wallet |
| R-105 | Refund to Agent resolution | COMPLETE | 18 | Full refund (escrow + broker 20%) to agent, debits broker |
| R-106 | Notifications on dispute lifecycle | COMPLETE | 18 | Admin notified on filing, agent/hotel notified on resolution |
| R-107 | Disputed badge on booking cards | COMPLETE | 18 | Red "Disputed" badge with snowflake icon for FROZEN bookings |

### 2.10 ZATCA Tax Invoice Requirements

| ID | Requirement | Status | Phase | Notes |
|----|-------------|--------|-------|-------|
| R-110 | TLV QR code encoding | COMPLETE | 19 | Tag-Length-Value binary format with Base64 for 5 ZATCA fields |
| R-111 | Seller/Buyer compliance profiles on invoice | COMPLETE | 19 | Business names, VAT numbers, CR numbers from user profiles |
| R-112 | PDF tax invoice generation | COMPLETE | 19 | jsPDF with PHX Exchange branding, line items, VAT breakdown |
| R-113 | PDF downloadable from Agent bookings | COMPLETE | 19 | "Download PDF" button on booking cards + inside invoice dialog |
| R-114 | SAR as primary currency | COMPLETE | 19 | All invoice amounts in SAR, multi-currency note when applicable |
| R-115 | ZATCA compliance footer | COMPLETE | 19 | TLV encoding note, generation timestamp, compliance disclaimer |
| R-116 | Invoice i18n (4 languages) | COMPLETE | 19 | All invoice keys in EN, AR, UR, FA |

### 2.11 Safety & Risk Requirements

| ID | Requirement | Status | Phase | Notes |
|----|-------------|--------|-------|-------|
| R-120 | Zero-bid auction expires to EXPIRED status | COMPLETE | 20 | Auctions with 0 bids at end time get EXPIRED (not ENDED), rooms stay with hotel |
| R-121 | Verification gate for New Listing (Hotel) | COMPLETE | 6 | isVerified boolean + server-side 403, VerificationGate UI blur |
| R-122 | Verification gate for Place Bid (Broker) | COMPLETE | 6 | isVerified boolean + server-side 403, VerificationGate UI blur |
| R-123 | 7-day clawback background worker | COMPLETE | 20 | Hourly worker checks releaseDeadline, reverts unsold blocks to hotel |
| R-124 | REVERSION wallet transaction on clawback | COMPLETE | 20 | Logs REVERSION type in wallet_transactions for both hotel and broker |
| R-125 | EXPIRED badge on auction cards | COMPLETE | 20 | Orange badge for expired auctions distinct from ENDED |

---

## 3. Design System

### 3.1 Visual Identity

| Element | Value |
|---------|-------|
| Primary Background | Stone grey-blue (#1C2530) |
| Accent Color | Antique Gold (#D4AF37) |
| Typography | System font stack via TailwindCSS |
| Border Radius | Small (rounded-md) |
| Design Pattern | Bordered card method with subtle contrast |
| Dark Mode | Supported via class-based toggle |

### 3.2 Component Library

| Component | Source | Usage |
|-----------|--------|-------|
| Cards | shadcn/ui Card | Dashboard stats, content containers |
| Buttons | shadcn/ui Button | Actions, navigation, form submission |
| Badges | shadcn/ui Badge | Status indicators, labels |
| Tables | shadcn/ui Table | Data grids (escrow ledger, user management) |
| Dialogs | shadcn/ui Dialog | Freeze confirmation, event log viewer, guest management |
| Sidebar | shadcn/ui Sidebar | Role-based navigation |
| Forms | shadcn/ui Form + react-hook-form | All input forms |
| Toasts | shadcn/ui Toaster | Success/error notifications |
| Avatars | shadcn/ui Avatar | User profile in sidebar footer |
| Icons | lucide-react | Visual cues throughout UI |

### 3.3 Layout Architecture

```
+-----------------------------------------------------------+
| Impersonation Banner (conditional, amber, z-9999)         |
+----------+------------------------------------------------+
|          |  Header: [Sidebar Toggle]    [Theme Toggle]     |
| Sidebar  +------------------------------------------------+
| (16rem)  |                                                |
|          |  Main Content Area                             |
| - Logo   |  (overflow-y-auto, p-4/p-6, stone-texture)    |
| - Nav    |                                                |
| - Footer |  [Role-Specific Page Component]                |
|   (user  |                                                |
|    info   |                                                |
|  + logout)|                                               |
+----------+------------------------------------------------+
```

### 3.4 Navigation Structure by Role

**Hotel Portal:**
- Dashboard (overview stats)
- Wholesale Listings (create/manage auctions)
- Guest Check-In (QR verification, escrow release)

**Broker Portal:**
- Dashboard (bid/inventory stats)
- Live Auctions (browse and bid)
- My Inventory (markup pricing, publish)
- My Group (agent whitelist management)

**Agent Portal:**
- Dashboard (booking/pilgrim stats)
- Available Rooms (marketplace browsing)
- My Bookings (booking management, guest registration, ZATCA invoice PDF download)
- Storefront (B2B2C storefront manager, pilgrim bookings, visa tracking, Nusuk Masar sync)
- Wallet (balance, transaction history)

**Admin Portal:**
- Dashboard (global platform stats)
- All Auctions (view all auctions)
- Users (management, verification, impersonation)
- Reports (financial ledger)
- Offer Audit (direct offer oversight)
- Escrow Ledger (escrow management, freeze/unfreeze, fee adjustment)
- Disputes (dispute management, release/refund resolution)

### 3.5 Status Indicator Design

| Status | Badge Variant | Icon | Context |
|--------|---------------|------|---------|
| ACTIVE | default | Radio (animated) | Auction status |
| ENDED | secondary | none | Auction status |
| FUNDED | default | DollarSign | Escrow status |
| MILESTONE_1_PAID | secondary | ArrowDown | Escrow (20% released) |
| SETTLED | default | CheckCircle | Escrow (check-in complete) |
| AUTO_RELEASED | default | Clock | Escrow (48h auto-release) |
| FROZEN | destructive | Snowflake | Escrow (admin frozen) |
| DISPUTED | destructive | AlertTriangle | Escrow (dispute filed) |
| PENDING | secondary | none | Offer status |
| ACCEPTED | default | none | Offer status |
| DECLINED | outline | none | Offer status |

### 3.6 Responsive Design

- Grid layouts: `sm:grid-cols-2 lg:grid-cols-3` or `lg:grid-cols-4` for summary cards
- Tables: `overflow-x-auto` wrapper for horizontal scrolling on mobile
- Sidebar: Collapsible with SidebarTrigger button
- Font sizes: Responsive with `text-sm` for data-dense areas
- Spacing: Consistent `space-y-6` between sections, `gap-4` in grids

### 2.12 Agent Storefront & Pilgrim Booking

| ID | Requirement | Status |
|----|-------------|--------|
| R-130 | Agent can create a public storefront with a unique slug URL (`/s/:slug`) | ✅ |
| R-131 | Storefront has configurable agency name, description, and markup percentage | ✅ |
| R-132 | Agent can toggle storefront active/inactive | ✅ |
| R-133 | Storefront displays available room blocks from agent's accessible inventory | ✅ |
| R-134 | Room prices shown to pilgrims include agent's storefront markup on top of broker markup | ✅ |
| R-135 | Pilgrims can book rooms without logging in (public page, no auth required) | ✅ |
| R-136 | Pilgrim booking requires Nusuk ID validation (exactly 10 digits) | ✅ |
| R-137 | Pilgrim booking requires passport expiry validation (must be valid beyond Dec 31, 2026) | ✅ |
| R-138 | Booking atomically decrements room block availability and creates escrow record | ✅ |
| R-139 | Escrow follows 80/20 rule: 20% released to broker, 80% held for hotel check-in | ✅ |
| R-140 | Agent can view all pilgrim bookings with visa status tracking (PENDING/ISSUED) | ✅ |
| R-141 | Agent can copy shareable storefront link for WhatsApp/social distribution | ✅ |
| R-142 | PHX operates as technology provider; agent is merchant of record (B2B2C model) | ✅ |

### 2.13 Nusuk Integration Layer

| ID | Requirement | Status |
|----|-------------|--------|
| R-150 | Auto-generate human-readable Accommodation Voucher ID (`bookingRef`) on every pilgrim booking | ✅ |
| R-151 | Voucher ID format: `PHX-2026-XXXXX` (5-digit zero-padded sequence) | ✅ |
| R-152 | Voucher ID is unique (DB unique constraint) and concurrency-safe (MAX+1 within transaction) | ✅ |
| R-153 | Public confirmation page displays Voucher ID prominently as "Official Accommodation Voucher ID" | ✅ |
| R-154 | Agent dashboard shows Voucher ID column in pilgrim bookings table | ✅ |
| R-155 | "Sync to Nusuk Masar" button per unsynced booking (cloud-upload icon, orange theme) | ✅ |
| R-156 | Nusuk sync modal displays formatted JSON payload: booking_ref, nusuk_id, passport_number, full_name, citizenship, room_count, block_id, platform, timestamp | ✅ |
| R-157 | Sync simulation with 2-second loading animation before API confirmation | ✅ |
| R-158 | Success message: "Data Package Verified. Awaiting Ministry Visa Issuance." | ✅ |
| R-159 | Backend marks booking as synced (`nusukSynced: true`, `nusukSyncedAt: timestamp`) | ✅ |
| R-160 | Backend validates required fields (bookingRef, nusukId, passportNumber) before allowing sync | ✅ |
| R-161 | "Pending Government Sync" metric card on agent dashboard shows count of unsynced bookings | ✅ |
| R-162 | Gov Sync status column with badges: green "Synced" / orange "Pending" per booking row | ✅ |
| R-163 | Nusuk integration i18n keys in all 4 languages (EN, AR, UR, FA) | ✅ |

### 2.14 Nusuk Compliance & Sync Layer

| ID | Requirement | Status |
|----|-------------|--------|
| R-164 | Pre-Flight Validation: Passport expiry must be strictly after December 20, 2026 | ✅ |
| R-165 | Pre-Flight Validation: Nusuk ID must be exactly 10 digits (numeric only) | ✅ |
| R-166 | Pre-Flight Validation: Auto-sanitize full names to uppercase Latin characters (e.g., 'Müller' → 'MUELLER') | ✅ |
| R-167 | Client-side validation runs before payload preview — failed validation shows red error panel with specific issues | ✅ |
| R-168 | Server-side validation enforces same rules — backend rejects non-compliant records on sync | ✅ |
| R-169 | Validation-passed state shows green "Pre-Flight Validation Passed — Data is Ministry-Ready" banner | ✅ |
| R-170 | Sanitized uppercase Latin name appears in the JSON payload preview (not the original name) | ✅ |
| R-171 | "Simulate Ministry Approval" button appears only for SYNCED bookings with visa not yet issued | ✅ |
| R-172 | Ministry approval generates mock visa number in V-2026-88XXX format | ✅ |
| R-173 | Ministry approval sets visaStatus to ISSUED and stores generated visa number | ✅ |
| R-174 | Once visa is ISSUED, "Simulate Ministry Approval" button is replaced by green visa number badge | ✅ |
| R-175 | Backend route `POST /api/storefront/bookings/:id/ministry-approval` with agent role guard | ✅ |
| R-176 | Backend rejects ministry approval for bookings not yet synced to Nusuk | ✅ |
| R-177 | Backend rejects ministry approval for bookings that already have ISSUED visa | ✅ |

### Public Booking Status Lookup & Visa Voucher Download

| ID | Requirement | Status |
|----|-------------|--------|
| R-178 | Public page at `/booking-status` accessible without authentication | ✅ |
| R-179 | Lookup requires Accommodation Voucher ID (PHX-2026-XXXXX) + passport number | ✅ |
| R-180 | Uses POST `/api/booking-status` (body params, not URL) to avoid sensitive data in logs/browser history | ✅ |
| R-181 | Returns masked guest name with GDPR/PDPL-compliant masking — first and last letter only (e.g., "M****r") | ✅ |
| R-182 | Returns hotel name, room type, city, room count, citizenship — no financial data exposed | ✅ |
| R-183 | Displays visa status badge: PENDING (amber) or ISSUED (green) | ✅ |
| R-184 | When visa is ISSUED, displays visa number and "Download Accommodation Voucher (PDF)" button | ✅ |
| R-185 | PDF voucher generated server-side via POST `/api/booking-voucher` — requires same booking ref + passport | ✅ |
| R-186 | PDF voucher contains: PHX Exchange branding, voucher ID, visa number, guest name (unmasked), hotel info, room details | ✅ |
| R-187 | Voucher download blocked if visa not yet ISSUED — returns error message | ✅ |
| R-188 | Individual booking confirmation dialog shows prominent "Track Your Visa & Download Voucher" CTA with link to /booking-status | ✅ |
| R-189 | Group booking confirmation dialog shows same CTA explaining each pilgrim can check individually | ✅ |

### Agent Dashboard Enhancements

| ID | Requirement | Status |
|----|-------------|--------|
| R-190 | "Sync Entire Group" batch action button on agent storefront dashboard for group bookings | ✅ |
| R-191 | Batch sync endpoint `POST /api/storefront/bookings/batch-sync` accepts array of booking IDs | ✅ |
| R-192 | Batch sync iterates through bookings, syncing each individually with per-booking error handling | ✅ |
| R-193 | Batch sync returns `{ synced: [...], failed: [...] }` with error details for failed bookings | ✅ |
| R-194 | Batch sync button only appears when group has unsynced bookings; shows "(X/Y pending)" count | ✅ |
| R-195 | Batch sync button disappears once all group members are synced | ✅ |
| R-196 | Room progress bar text updated to "X of Y Rooms Assigned" format in group leader booking flow | ✅ |
| R-197 | Security masking on `/booking-status` uses GDPR/PDPL-compliant first+last letter pattern (e.g., "M****r") | ✅ |

### 2.17 Pilgrim Progress Tracker

| ID | Requirement | Status |
|----|-------------|--------|
| R-198 | Booking Status page displays a 3-step vertical progress tracker for each booking lookup | ✅ |
| R-199 | Step 1 "Booking Received" — always marked complete with green checkmark after successful lookup | ✅ |
| R-200 | Step 2 "Submitted to Ministry" — marked complete (green) when `nusukSynced` is true, shows submission date; pending (gray) with "Waiting for your travel agent" message when false | ✅ |
| R-201 | Step 3 "Visa Issued" — marked complete (green) when `visaStatus` is ISSUED, shows visa number; pending (gray) with "Once the Ministry processes your application" message when pending | ✅ |
| R-202 | Completed steps show green circle with checkmark icon and green connecting line to next step | ✅ |
| R-203 | Pending steps show gray circle with clock icon and gray connecting line | ✅ |
| R-204 | Progress tracker i18n keys in all 4 languages (EN, AR, UR, FA) with RTL support | ✅ |
| R-205 | When visa is ISSUED, Download Voucher button appears below the progress tracker | ✅ |

### 2.18 Agent Pending Sync Notifications

| ID | Requirement | Status |
|----|-------------|--------|
| R-206 | Backend `/api/dashboard/stats` returns `pendingSyncCount` for agent role — count of pilgrim bookings where `nusukSynced` is false | ✅ |
| R-207 | Agent Dashboard shows amber alert banner when `pendingSyncCount > 0` — displays count and "Go to Storefront → Nusuk Dashboard" CTA | ✅ |
| R-208 | Agent Bookings page queries `/api/storefront/bookings` and shows amber alert when unsynced bookings exist — displays count and CTA to Storefront | ✅ |
| R-209 | Both alerts are clickable and navigate to `/storefront` | ✅ |
| R-210 | Both alerts disappear automatically when all pilgrim bookings are synced (count = 0) | ✅ |

---

## 4. Completion Summary

| Category | Total Requirements | Completed | Percentage |
|----------|-------------------|-----------|------------|
| Core Platform | 6 | 6 | 100% |
| Auction System | 11 | 11 | 100% |
| Inventory & Marketplace | 9 | 9 | 100% |
| Broker-Agent Relations | 7 | 7 | 100% |
| Guest Management | 7 | 7 | 100% |
| Admin & Oversight | 7 | 7 | 100% |
| Escrow & Financial | 12 | 12 | 100% |
| Audit-Ready Wallet Ledger | 8 | 8 | 100% |
| Dispute Management | 8 | 8 | 100% |
| ZATCA Tax Invoice | 7 | 7 | 100% |
| Safety & Risk | 6 | 6 | 100% |
| Agent Storefront & Pilgrim Booking | 13 | 13 | 100% |
| Nusuk Integration Layer | 14 | 14 | 100% |
| Nusuk Compliance & Sync Layer | 14 | 14 | 100% |
| Public Booking Status & Voucher | 12 | 12 | 100% |
| Agent Dashboard Enhancements | 8 | 8 | 100% |
| Pilgrim Progress Tracker | 8 | 8 | 100% |
| Agent Pending Sync Notifications | 5 | 5 | 100% |
| **Total** | **162** | **162** | **100%** |
