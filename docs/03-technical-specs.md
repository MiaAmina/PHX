# PHX Core - Full Technical Specification

**Source of Truth:** All specifications below are derived from direct inspection of the implemented codebase. Table schemas map to `shared/schema.ts`, API routes map to `server/routes.ts`, storage methods map to `server/storage.ts`, and frontend components map to `client/src/pages/*.tsx`.

## 1. System Architecture

### 1.1 Stack Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite + TypeScript | React 18, Vite 5 |
| Styling | TailwindCSS + shadcn/ui | Tailwind 3 |
| Routing (Client) | wouter | v3 |
| State/Data | TanStack React Query | v5 |
| Backend | Express.js + TypeScript | Express 4 |
| ORM | Drizzle ORM | Latest |
| Database | PostgreSQL (Neon-backed) | 15+ |
| Auth | express-session + bcrypt | Session-based |
| WebSocket | ws (native) | Latest |
| PDF | jsPDF + qrcode | Latest |
| CSV | papaparse | Latest |

### 1.2 Project Structure

```
phx-core/
├── client/
│   └── src/
│       ├── components/
│       │   ├── ui/              # shadcn/ui primitives
│       │   ├── app-sidebar.tsx   # Role-based navigation
│       │   ├── phx-logo.tsx     # Brand logo component
│       │   └── theme-toggle.tsx # Dark/light mode switch
│       ├── hooks/
│       │   └── use-toast.ts     # Toast notification hook
│       ├── lib/
│       │   ├── auth.tsx         # AuthProvider + useAuth hook
│       │   ├── queryClient.ts   # TanStack Query config + apiRequest
│       │   ├── theme.tsx        # ThemeProvider + useTheme hook
│       │   └── websocket.ts     # WebSocket hook with auto-reconnect
│       ├── pages/
│       │   ├── auth-page.tsx            # Login/Register
│       │   ├── dashboard.tsx            # Role-specific dashboard
│       │   ├── auctions-page.tsx        # Auction management/browsing
│       │   ├── inventory-page.tsx       # Broker inventory management
│       │   ├── marketplace-page.tsx     # Agent room marketplace
│       │   ├── bookings-page.tsx        # Agent booking management
│       │   ├── broker-group-page.tsx    # Broker agent group
│       │   ├── admin-users-page.tsx     # Admin user management
│       │   ├── admin-reports-page.tsx   # Admin financial reports
│       │   ├── admin-offer-audit-page.tsx  # Admin offer oversight
│       │   ├── admin-escrow-page.tsx    # Admin escrow ledger
│       │   ├── hotel-checkin-page.tsx   # Hotel QR check-in
│       │   └── not-found.tsx            # 404 page
│       ├── App.tsx              # Root component with routing
│       └── index.css            # Theme variables + custom utilities
├── server/
│   ├── index.ts                 # Express app bootstrap
│   ├── routes.ts                # All API endpoint definitions
│   ├── storage.ts               # IStorage interface + DatabaseStorage
│   ├── db.ts                    # Drizzle database connection
│   ├── auth.ts                  # bcrypt hash/compare helpers
│   ├── seed.ts                  # Demo data seeder
│   ├── vite.ts                  # Vite dev server integration
│   ├── websocket.ts             # WebSocket server setup
│   ├── auction-worker.ts        # Auto-expiry background worker
│   └── escrow-worker.ts         # Auto-release background worker
├── shared/
│   └── schema.ts                # Drizzle schema + Zod validators + types
└── drizzle.config.ts            # Drizzle kit configuration
```

---

## 2. Database Schema

### 2.1 Entity-Relationship Diagram (Textual)

```
users (1) ──── (N) auctions         [Hotel creates auctions]
users (1) ──── (N) bids             [Broker places bids]
users (1) ──── (N) wonBlocks        [Broker wins blocks]
users (1) ──── (N) bookings         [Agent creates bookings]
users (1) ──── (N) brokerAgents     [Broker-Agent M:M]
users (1) ──── (N) directOffers     [Broker sends offers]
users (1) ──── (1) wallets          [Digital wallet]

auctions (1) ── (N) bids            [Auction receives bids]
auctions (1) ── (1) wonBlocks       [Auction settles to won block]

wonBlocks (1) ── (N) bookings       [Block has bookings]
wonBlocks (1) ── (N) directOffers   [Block has offers]

bookings (1) ── (N) pilgrims        [Booking has guests]
bookings (1) ── (1) escrowRecords   [Booking has escrow]
bookings (1) ── (N) checkinScans    [Booking has scans]

escrowRecords (1) ── (N) escrowEvents [Escrow has audit log]
```

### 2.2 Table Definitions

#### `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK, default gen_random_uuid() | Unique user identifier |
| email | text | NOT NULL, UNIQUE | Login email |
| password | text | NOT NULL | bcrypt hashed password |
| role | user_role enum | NOT NULL | ADMIN, HOTEL, BROKER, AGENT |
| businessName | text | NOT NULL | Display name / company |
| isVerified | boolean | NOT NULL, default false | Admin verification status |
| createdAt | timestamp | NOT NULL, default now() | Registration timestamp |

Indexes: `idx_users_role` on (role)

#### `auctions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Auction identifier |
| hotelId | varchar | FK → users.id, NOT NULL | Creating hotel |
| roomType | text | NOT NULL | Single, Double, Triple, Quad, Suite |
| distance | integer | NOT NULL | Meters from Haram |
| quantity | integer | NOT NULL | Number of rooms |
| floorPrice | decimal(10,2) | NOT NULL | Minimum bid amount |
| endTime | timestamp | NOT NULL | Auction closing time |
| status | auction_status enum | NOT NULL, default ACTIVE | ACTIVE, ENDED, CANCELLED |
| createdAt | timestamp | NOT NULL | Creation timestamp |

Indexes: `idx_auctions_status` on (status), `idx_auctions_hotel_id` on (hotelId)

#### `bids`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Bid identifier |
| auctionId | varchar | FK → auctions.id, NOT NULL | Target auction |
| brokerId | varchar | FK → users.id, NOT NULL | Bidding broker |
| amount | decimal(10,2) | NOT NULL | Bid amount |
| createdAt | timestamp | NOT NULL | Bid timestamp |

#### `wonBlocks`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Won block identifier |
| auctionId | varchar | FK → auctions.id, NOT NULL | Source auction |
| brokerId | varchar | FK → users.id, NOT NULL | Winning broker |
| winningPrice | decimal(10,2) | NOT NULL | Final bid amount |
| markupType | markup_type enum | NOT NULL, default FIXED | FIXED or PERCENTAGE |
| markupAmount | decimal(10,2) | NOT NULL, default 0 | Fixed markup amount |
| markupPercentage | decimal(5,2) | NOT NULL, default 0 | Percentage markup |
| availableQuantity | integer | NOT NULL, default 0 | Remaining rooms |
| isListed | boolean | NOT NULL, default false | Marketplace visibility |
| visibility | block_visibility enum | NOT NULL, default PUBLIC | PUBLIC, PRIVATE, DIRECT |
| assignedAgentId | varchar | FK → users.id, nullable | For DIRECT visibility |

#### `bookings`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Booking identifier |
| blockId | varchar | FK → wonBlocks.id, NOT NULL | Source inventory |
| agentId | varchar | FK → users.id, NOT NULL | Booking agent |
| roomCount | integer | NOT NULL, default 1 | Number of rooms booked |
| totalPrice | decimal(10,2) | NOT NULL | Total booking price |
| status | text | NOT NULL, default CONFIRMED | Booking status |
| createdAt | timestamp | NOT NULL | Booking timestamp |

#### `pilgrims`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Pilgrim identifier |
| bookingId | varchar | FK → bookings.id, NOT NULL | Associated booking |
| fullName | text | NOT NULL | Full legal name |
| passportNo | text | NOT NULL | Passport number |
| gender | text | NOT NULL | Male or Female |
| visaStatus | text | NOT NULL, default PENDING | Visa processing status |
| voucherUrl | text | nullable | PDF voucher link |

#### `brokerAgents`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Relationship identifier |
| brokerId | varchar | FK → users.id, NOT NULL | Broker |
| agentId | varchar | FK → users.id, NOT NULL | Agent |
| createdAt | timestamp | NOT NULL | Relationship timestamp |

Indexes: `idx_broker_agent_pair` UNIQUE on (brokerId, agentId)

#### `directOffers`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Offer identifier |
| blockId | varchar | FK → wonBlocks.id, NOT NULL | Inventory block |
| brokerId | varchar | FK → users.id, NOT NULL | Sending broker |
| agentId | varchar | FK → users.id, NOT NULL | Target agent |
| pricePerRoom | decimal(10,2) | NOT NULL | Offered price per room |
| roomCount | integer | NOT NULL | Number of rooms offered |
| status | offer_status enum | NOT NULL, default PENDING | PENDING, ACCEPTED, DECLINED |
| createdAt | timestamp | NOT NULL | Offer timestamp |

#### `escrowRecords`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Escrow identifier |
| bookingId | varchar | FK → bookings.id, NOT NULL | Associated booking |
| agentId | varchar | FK → users.id, NOT NULL | Paying agent |
| brokerId | varchar | FK → users.id, NOT NULL | 20% recipient |
| hotelId | varchar | FK → users.id, NOT NULL | 80% recipient |
| totalPaid | decimal(10,2) | NOT NULL | Total payment amount |
| escrowBalance | decimal(10,2) | NOT NULL | Current held amount |
| brokerPayout | decimal(10,2) | NOT NULL | 20% payout to broker |
| hotelPayout | decimal(10,2) | NOT NULL, default 0 | 80% payout to hotel |
| platformFee | decimal(10,2) | NOT NULL, default 0 | Fee deducted |
| status | escrow_status enum | NOT NULL, default FUNDED | 7-state workflow |
| checkInDate | timestamp | nullable | Expected check-in |
| checkOutDate | timestamp | nullable | Expected checkout |
| qrScannedAt | timestamp | nullable | QR scan timestamp |
| frozenAt | timestamp | nullable | Freeze timestamp |
| frozenBy | varchar | FK → users.id, nullable | Admin who froze |
| disputeReason | text | nullable | Freeze/dispute reason |
| settledAt | timestamp | nullable | Settlement timestamp |
| createdAt | timestamp | NOT NULL | Creation timestamp |

Indexes: `idx_escrow_status` on (status), `idx_escrow_booking` on (bookingId)

#### `escrowEvents`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Event identifier |
| escrowId | varchar | FK → escrowRecords.id, NOT NULL | Parent escrow |
| eventType | escrow_event_type enum | NOT NULL | 9 event types |
| amount | decimal(10,2) | NOT NULL | Event amount |
| description | text | NOT NULL | Human-readable description |
| performedBy | varchar | FK → users.id, nullable | Actor (admin for freeze/unfreeze) |
| createdAt | timestamp | NOT NULL | Event timestamp |

#### `wallets`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Wallet identifier |
| userId | varchar | FK → users.id, UNIQUE, NOT NULL | Wallet owner |
| balance | decimal(12,2) | NOT NULL, default 0 | Current balance |
| totalEarned | decimal(12,2) | NOT NULL, default 0 | Lifetime earnings |
| updatedAt | timestamp | NOT NULL | Last update |

#### `platformSettings`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Setting identifier |
| key | text | UNIQUE, NOT NULL | Setting key |
| value | text | NOT NULL | Setting value |
| updatedAt | timestamp | NOT NULL | Last update |
| updatedBy | varchar | FK → users.id, nullable | Admin who changed |

#### `checkinScans`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | varchar (UUID) | PK | Scan identifier |
| bookingId | varchar | FK → bookings.id, NOT NULL | Scanned booking |
| pilgrimId | varchar | FK → pilgrims.id, NOT NULL | Scanned pilgrim |
| scannedBy | varchar | FK → users.id, NOT NULL | Scanning hotel user |
| scannedAt | timestamp | NOT NULL | Scan timestamp |
| isValid | boolean | NOT NULL, default true | Scan validity |

### 2.3 Enum Definitions

| Enum | Values |
|------|--------|
| user_role | ADMIN, HOTEL, BROKER, AGENT |
| auction_status | ACTIVE, ENDED, CANCELLED |
| markup_type | FIXED, PERCENTAGE |
| block_visibility | PUBLIC, PRIVATE, DIRECT |
| offer_status | PENDING, ACCEPTED, DECLINED |
| escrow_status | FUNDED, MILESTONE_1_PAID, SETTLED, AUTO_RELEASED, FROZEN, DISPUTED, REFUNDED |
| escrow_event_type | FUNDED, BROKER_PAYOUT_20, CHECKIN_RELEASE, AUTO_RELEASE, PLATFORM_FEE, FREEZE, UNFREEZE, DISPUTE, REFUND |

---

## 3. API Specification

### 3.1 Authentication Endpoints

| Method | Path | Auth | Role | Request Body | Response | Description |
|--------|------|------|------|--------------|----------|-------------|
| POST | /api/auth/register | No | Any | `{ email, password, role, businessName }` | User (no password) | Register new user |
| POST | /api/auth/login | No | Any | `{ email, password }` | User (no password) | Login |
| GET | /api/auth/me | Yes | Any | - | User + impersonation flag | Current user |
| POST | /api/auth/logout | Yes | Any | - | `{ message }` | Destroy session |

### 3.2 Dashboard Endpoints

| Method | Path | Auth | Role | Response | Description |
|--------|------|------|------|----------|-------------|
| GET | /api/dashboard/stats | Yes | Any | Role-specific stats object | Dashboard statistics |

### 3.3 Auction Endpoints

| Method | Path | Auth | Role | Request/Response | Description |
|--------|------|------|------|------------------|-------------|
| GET | /api/auctions | Yes | Any | Auction[] with bids/hotel info | List auctions (role-filtered) |
| POST | /api/auctions | Yes | HOTEL (verified) | `{ roomType, distance, quantity, floorPrice, endTime }` → Auction | Create auction |
| POST | /api/auctions/:id/close | Yes | HOTEL | - → `{ auction, wonBlock? }` | Close and settle |

### 3.4 Bidding Endpoints

| Method | Path | Auth | Role | Request/Response | Description |
|--------|------|------|------|------------------|-------------|
| POST | /api/bids | Yes | BROKER (verified) | `{ auctionId, amount }` → `{ bid, auctionExtended }` | Place atomic bid |

### 3.5 Inventory Endpoints

| Method | Path | Auth | Role | Request/Response | Description |
|--------|------|------|------|------------------|-------------|
| GET | /api/inventory | Yes | BROKER | WonBlock[] enriched | List broker's won blocks |
| PATCH | /api/inventory/:id | Yes | BROKER | `{ markupType?, markupAmount?, etc. }` → WonBlock | Update block settings |

### 3.6 Marketplace & Booking Endpoints

| Method | Path | Auth | Role | Request/Response | Description |
|--------|------|------|------|------------------|-------------|
| GET | /api/marketplace | Yes | AGENT | Sanitized block list | Available rooms |
| GET | /api/bookings | Yes | AGENT/ADMIN | Booking[] with details | List bookings |
| POST | /api/bookings | Yes | AGENT | `{ blockId, roomCount }` → Booking | Atomic room booking |

### 3.7 Pilgrim & Voucher Endpoints

| Method | Path | Auth | Role | Request/Response | Description |
|--------|------|------|------|------------------|-------------|
| POST | /api/pilgrims | Yes | AGENT | `{ bookingId, fullName, passportNo, gender }` → Pilgrim | Register pilgrim |
| POST | /api/bookings/:id/pilgrims/bulk | Yes | AGENT | `{ pilgrims: CSV[] }` → Result | Bulk CSV upload |
| GET | /api/bookings/:id/voucher | Yes | AGENT | PDF binary | Download voucher |
| GET | /api/hotel/rooming-list/:auctionId | Yes | HOTEL | Rooming list | Pilgrim rooming list |

### 3.8 Broker-Agent Endpoints

| Method | Path | Auth | Role | Request/Response | Description |
|--------|------|------|------|------------------|-------------|
| GET | /api/broker/agents | Yes | BROKER | Agent[] | Verified agent directory |
| GET | /api/broker/group | Yes | BROKER | GroupMember[] | Broker's agent group |
| POST | /api/broker/group/:agentId | Yes | BROKER | BrokerAgent | Add agent to group |
| DELETE | /api/broker/group/:agentId | Yes | BROKER | `{ message }` | Remove from group |

### 3.9 Direct Offer Endpoints

| Method | Path | Auth | Role | Request/Response | Description |
|--------|------|------|------|------------------|-------------|
| POST | /api/direct-offers | Yes | BROKER | `{ blockId, agentId, pricePerRoom, roomCount }` → Offer | Send offer |
| GET | /api/direct-offers/agent | Yes | AGENT | Offer[] enriched | Agent's pending offers |
| POST | /api/direct-offers/:id/accept | Yes | AGENT | Booking | Accept offer (atomic) |
| POST | /api/direct-offers/:id/decline | Yes | AGENT | Offer | Decline offer |

### 3.10 Admin Endpoints

| Method | Path | Auth | Role | Request/Response | Description |
|--------|------|------|------|------------------|-------------|
| GET | /api/admin/users | Yes | ADMIN | User[] (no passwords) | All users |
| PATCH | /api/admin/users/:id/verify | Yes | ADMIN | `{ isVerified }` → User | Toggle verification |
| POST | /api/admin/impersonate/:userId | Yes | ADMIN | User (target) | Start impersonation |
| POST | /api/admin/end-impersonate | Yes | ADMIN | User (admin) | End impersonation |
| GET | /api/admin/reports | Yes | ADMIN | Report stats | Platform reports |
| GET | /api/admin/financial-ledger | Yes | ADMIN | Financial stats | Financial overview |
| GET | /api/admin/direct-offers/audit | Yes | ADMIN | Offer[] enriched | Offer audit log |
| GET | /api/admin/direct-offers/stale | Yes | ADMIN | Offer[] | Stale offers (>72h) |
| GET | /api/admin/broker/:brokerId/group | Yes | ADMIN | GroupMember[] | Broker's group |
| GET | /api/admin/offers/:brokerId/:agentId | Yes | ADMIN | Offer[] | Offer history |

### 3.11 Escrow & Financial Endpoints

| Method | Path | Auth | Role | Request/Response | Description |
|--------|------|------|------|------------------|-------------|
| GET | /api/admin/escrow | Yes | ADMIN | EscrowRecord[] enriched | All escrow records |
| GET | /api/admin/escrow/:id/events | Yes | ADMIN | EscrowEvent[] | Escrow event log |
| POST | /api/admin/escrow/:id/freeze | Yes | ADMIN | `{ reason? }` → EscrowRecord | Freeze escrow |
| POST | /api/admin/escrow/:id/unfreeze | Yes | ADMIN | EscrowRecord | Unfreeze escrow |
| GET | /api/admin/platform-fee | Yes | ADMIN | `{ platformFeePct }` | Current fee |
| PATCH | /api/admin/platform-fee | Yes | ADMIN | `{ pct }` → PlatformSetting | Update fee |
| POST | /api/hotel/checkin/:bookingId | Yes | HOTEL | `{ pilgrimId? }` → `{ scan, message }` | QR check-in |
| GET | /api/hotel/checkin-scans/:bookingId | Yes | HOTEL | CheckinScan[] | Booking scans |
| GET | /api/hotel/bookings | Yes | HOTEL | Booking[] with escrow | Hotel's bookings |
| GET | /api/wallet | Yes | Any | Wallet | User's wallet |
| GET | /api/escrow/booking/:bookingId | Yes | Authorized | EscrowRecord | Escrow by booking |

---

## 4. Business Logic

### 4.1 Markup Calculation

```typescript
function calculateAgentPrice(winningPrice, markupType, markupAmount, markupPercentage): number {
  const base = parseFloat(winningPrice);
  if (markupType === "PERCENTAGE") {
    return base + (base * parseFloat(markupPercentage) / 100);
  }
  return base + parseFloat(markupAmount);
}
```

### 4.2 Room Capacity

```typescript
function getRoomCapacity(roomType: string): number {
  const capacities = { Single: 1, Double: 2, Triple: 3, Quad: 4, Suite: 2 };
  return capacities[roomType] || 2;
}
```

### 4.3 Escrow 80/20 Split

```
On booking/offer acceptance:
  totalPaid = booking.totalPrice
  brokerPayout = totalPaid * 0.20  → Instant release to broker wallet
  escrowBalance = totalPaid * 0.80 → Held in PHX Global Escrow
  status = MILESTONE_1_PAID
```

### 4.4 Escrow Settlement (Check-In)

```
On hotel QR check-in scan:
  platformFeePct = getPlatformFeePct()  (default 5%)
  fee = escrowBalance * platformFeePct / 100
  hotelPayout = escrowBalance - fee
  
  → Credit hotel wallet with hotelPayout
  → Set escrowBalance = 0
  → Set status = SETTLED
  → Record PLATFORM_FEE and CHECKIN_RELEASE events
```

### 4.5 Auto-Release Logic

```
Every hour, background worker scans for:
  - status = MILESTONE_1_PAID
  - qrScannedAt = NULL
  - checkOutDate <= (now - 48 hours)
  - status != FROZEN and status != DISPUTED

For each qualifying record:
  → Same settlement as check-in but status = AUTO_RELEASED
  → Record AUTO_RELEASE event
```

### 4.6 Anti-Sniping

```
On bid placement:
  msUntilEnd = auction.endTime - now
  if msUntilEnd <= 60000 and msUntilEnd > 0:
    newEndTime = auction.endTime + 60 seconds
    → Update auction.endTime
    → Broadcast auction_extended via WebSocket
    → Reschedule expiry worker
```

---

## 5. Background Workers

### 5.1 Auction Expiry Worker (`auction-worker.ts`)

- **Trigger:** Application startup + auction creation
- **Behavior:** Schedules setTimeout for each active auction based on endTime
- **Action:** Auto-settles auction (creates WonBlock for highest bidder, sets status ENDED)
- **WebSocket:** Broadcasts auction_settled event

### 5.2 Escrow Auto-Release Worker (`escrow-worker.ts`)

- **Trigger:** Application startup
- **Interval:** Every 60 minutes (setInterval)
- **Criteria:** MILESTONE_1_PAID + no QR scan + 48h past checkout + not frozen/disputed
- **Action:** Calculates fee, credits hotel wallet, sets status AUTO_RELEASED
- **Error Handling:** Per-record try/catch, logs failures, continues processing

---

## 6. Security Model

### 6.1 Authentication

- Session-based with `express-session`
- Passwords hashed with `bcrypt`
- Session cookie: httpOnly, 7-day expiry, sameSite=lax

### 6.2 Authorization Layers

| Layer | Implementation |
|-------|---------------|
| Route-level | `requireAuth` middleware checks session |
| Role-level | `requireRole(...roles)` checks user role |
| Resource-level | Endpoint logic checks ownership (e.g., auction.hotelId === user.id) |
| Escrow access | Admin OR involved party (agent/broker/hotel) |
| Impersonation | originalAdminId stored, prevents nested impersonation |

### 6.3 Data Sanitization

- Marketplace API strips: winningPrice, markupAmount, markupPercentage, brokerId
- User API strips: password field from all responses
- Escrow API: role-based access control on booking-level queries

---

## 7. Environment & Deployment

### 7.1 Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| SESSION_SECRET | Yes | Express session encryption key |
| PORT | No | Server port (default 5000) |

### 7.2 Build & Run

```bash
# Development
npm run dev          # Starts Express + Vite dev server

# Production
npm run build        # Builds frontend with Vite
npm start            # Starts production Express server

# Database
npm run db:push      # Syncs Drizzle schema to PostgreSQL
```

### 7.3 WebSocket

- Path: `/ws` on same HTTP server
- Events: `bid_placed`, `auction_extended`, `auction_settled`
- Client: Auto-reconnect hook in `lib/websocket.ts`
