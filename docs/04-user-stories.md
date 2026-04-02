# PHX Core - User Stories

## Overview

This document captures all user stories organized by role and development phase. Each story follows the standard format: **As a [role], I want to [action], so that [benefit].**

---

## 1. Authentication & Access (Phase 1)

### US-001: User Registration
**As a** new user (Hotel owner, Broker, or Travel Agent),
**I want to** register on the platform with my email, password, and business name,
**so that** I can access role-specific features and participate in the marketplace.

**Acceptance Criteria:**
- Registration form collects email, password (min 6 chars), business name, and role
- Email must be unique across all users
- Password is securely hashed before storage
- User is automatically logged in after registration
- User is redirected to their role-specific dashboard

---

### US-002: User Login
**As a** registered user,
**I want to** log in with my email and password,
**so that** I can access my account and continue my work.

**Acceptance Criteria:**
- Login form validates email format and password length
- Invalid credentials show a clear error message
- Successful login creates a session and redirects to dashboard
- Session persists for 7 days

---

### US-003: Role-Based Navigation
**As a** logged-in user,
**I want to** see only the navigation items relevant to my role,
**so that** I am not confused by features I cannot access.

**Acceptance Criteria:**
- Hotel sees: Dashboard, Wholesale Listings, Guest Check-In
- Broker sees: Dashboard, Live Auctions, My Inventory, My Group
- Agent sees: Dashboard, Available Rooms, My Bookings
- Admin sees: Dashboard, All Auctions, Users, Reports, Offer Audit, Escrow Ledger

---

### US-004: Secure Logout
**As a** logged-in user,
**I want to** log out of my account,
**so that** my session is securely terminated and others cannot access my account.

**Acceptance Criteria:**
- Logout button in sidebar footer
- Session is destroyed server-side
- User is redirected to login page

---

## 2. Auction Management (Phases 2 & 3)

### US-010: Create Room Auction
**As a** verified Hotel owner,
**I want to** create an auction for a block of rooms specifying type, distance from Haram, quantity, minimum price, and end time,
**so that** Brokers can compete to purchase my room inventory at the best price.

**Acceptance Criteria:**
- Form includes room type (Single/Double/Triple/Quad/Suite), distance (meters), quantity, floor price, and end time
- Only verified Hotels can create auctions
- Unverified Hotels see a clear message about the verification requirement
- Auction appears with ACTIVE status and a live countdown timer

---

### US-011: Place Competitive Bid
**As a** verified Broker,
**I want to** place bids on active hotel auctions,
**so that** I can win room inventory at competitive wholesale prices.

**Acceptance Criteria:**
- Bid must meet or exceed the floor price
- Bid must exceed the current highest bid
- Bid amount and count update in real-time for all viewers via WebSocket
- Unverified Brokers cannot place bids

---

### US-012: Anti-Sniping Protection
**As a** Broker participating in an auction,
**I want** the auction to extend by 60 seconds if a bid is placed in the final minute,
**so that** I have a fair chance to respond to last-second competitive bids.

**Acceptance Criteria:**
- Bids placed within the last 60 seconds automatically extend the auction by 60 seconds
- Extension is broadcast to all connected clients
- Timer updates to reflect the new end time

---

### US-013: Live Auction Monitoring
**As a** Broker or Hotel,
**I want to** see real-time bid updates and a live countdown timer,
**so that** I can make informed decisions during the auction.

**Acceptance Criteria:**
- Countdown timer ticks every second in "Xd HH:MM:SS" format
- "LIVE" badge with animated icon on active auctions
- New bids appear instantly without page refresh
- Anti-sniping extensions update the timer in real-time

---

### US-014: Auction Settlement
**As a** Hotel owner,
**I want** auctions to automatically settle when they expire (or when I manually close them),
**so that** the winning Broker receives the room inventory immediately.

**Acceptance Criteria:**
- Background worker auto-settles expired auctions
- Manual close button available for Hotel to end early
- Highest bidder receives a WonBlock record with the room quantity
- Auction status changes to ENDED

---

## 3. Inventory & Marketplace (Phases 4 & 7)

### US-020: Configure Inventory Pricing
**As a** Broker with won room inventory,
**I want to** set markup pricing (fixed amount or percentage) on my inventory,
**so that** I can earn profit when Travel Agents book rooms through me.

**Acceptance Criteria:**
- Toggle between FIXED and PERCENTAGE markup types
- For FIXED: agent price = wholesale price + fixed amount
- For PERCENTAGE: agent price = wholesale + (wholesale * percentage / 100)
- Dynamic preview shows what agents will pay
- Pricing updates take effect immediately

---

### US-021: Publish Inventory to Marketplace
**As a** Broker,
**I want to** publish my inventory to the marketplace with visibility controls,
**so that** I can decide which agents can see and book my rooms.

**Acceptance Criteria:**
- Toggle to publish/unpublish inventory
- Visibility options: PUBLIC (all agents), PRIVATE (my group only), DIRECT (specific agent)
- Inventory automatically unlists when available quantity reaches zero

---

### US-022: Browse Available Rooms
**As a** Travel Agent,
**I want to** browse available rooms showing hotel name, room type, distance from Haram, price, and availability,
**so that** I can find the best accommodations for my pilgrims.

**Acceptance Criteria:**
- Only PUBLIC rooms visible to all agents
- PRIVATE rooms visible only to agents in the broker's group
- DIRECT rooms visible only to the assigned agent
- Wholesale price, markup details, and broker identity are hidden
- Room count selector allows booking multiple rooms

---

### US-023: Book Rooms Atomically
**As a** Travel Agent,
**I want to** book rooms with guaranteed availability,
**so that** I do not get double-booked even if multiple agents try to book the last room simultaneously.

**Acceptance Criteria:**
- SELECT FOR UPDATE prevents concurrent overbooking
- Available quantity decrements atomically
- Booking confirmation shows total price (price per room * count)
- Inventory auto-unlists when all rooms are booked

---

### US-024: Manage Broker Group
**As a** Broker,
**I want to** maintain a whitelist of trusted Travel Agents,
**so that** I can offer them exclusive room access and direct offers.

**Acceptance Criteria:**
- Search verified agent directory
- Add/remove agents from my group
- Duplicate additions prevented by database constraint
- Group members see my PRIVATE inventory
- Group members eligible for direct offers

---

### US-025: Send Direct Offer
**As a** Broker,
**I want to** send targeted room offers to specific agents in my group with custom pricing,
**so that** I can negotiate deals directly with trusted partners.

**Acceptance Criteria:**
- Select inventory block, choose agent, set price and room count
- Offer created with PENDING status
- Agent sees offer prominently in their marketplace

---

### US-026: Accept or Decline Direct Offer
**As a** Travel Agent,
**I want to** accept or decline direct offers from brokers,
**so that** I can evaluate and choose the best deals for my clients.

**Acceptance Criteria:**
- Accept creates booking atomically (decrements inventory)
- Decline changes offer status to DECLINED
- Accepted offer updates inventory quantity

---

## 4. Guest Management (Phase 5)

### US-030: Register Pilgrims
**As a** Travel Agent,
**I want to** register pilgrim details (name, passport, gender) for my bookings,
**so that** hotels have the guest information they need for check-in.

**Acceptance Criteria:**
- Manual registration form per pilgrim
- Registration count limited by room capacity (Single=1, Double=2, Triple=3, Quad=4, Suite=2)
- Guest management dialog shows required/registered/remaining counts

---

### US-031: Bulk Upload Pilgrims via CSV
**As a** Travel Agent with many bookings,
**I want to** upload pilgrim data in bulk using a CSV file,
**so that** I can efficiently register large groups without manual entry.

**Acceptance Criteria:**
- CSV parser accepts fullName, passportNo, gender columns
- Client-side validation catches missing fields and invalid gender
- Server-side validation catches duplicate passports and capacity overflow
- Partial success: valid rows are processed, errors reported per row
- Clear error and warning messages for each issue

---

### US-032: Download PDF Voucher
**As a** Travel Agent,
**I want to** download a professional PDF voucher for each booking,
**so that** my pilgrims have a physical check-in document with a scannable QR code.

**Acceptance Criteria:**
- Multi-page PDF with one page per pilgrim
- Each page includes: PHX CORE header, QR code, booking ID, hotel name, room type, distance, guest name, passport number, "PHX CONFIRMED" stamp
- Generated date and guest number (e.g., "Guest 3 of 8") on each page

---

### US-033: View Rooming List
**As a** Hotel owner,
**I want to** view a rooming list for my ended auctions showing all pilgrim details grouped by booking and agent,
**so that** I can prepare for guest arrivals.

**Acceptance Criteria:**
- Only available for ended auctions
- Shows agent name, room count per booking
- Lists each pilgrim's full name, passport number, and gender
- Only accessible by the hotel that created the auction

---

## 5. Admin Oversight (Phases 6 & 7)

### US-040: Manage Users
**As a** Platform Admin,
**I want to** view all users with summary statistics and toggle their verification status,
**so that** I can control who can create auctions and place bids.

**Acceptance Criteria:**
- Summary cards show total users, verified count, and per-role counts
- Master table lists all users with role, business name, email, verified status
- Verification toggle switch per user
- Verification changes take effect immediately on the user's permissions

---

### US-041: Impersonate Users (Shadow Mode)
**As a** Platform Admin,
**I want to** temporarily assume the identity of any user,
**so that** I can diagnose issues, view their experience, and provide better support.

**Acceptance Criteria:**
- "Login as User" button on each user row
- Session swaps to target user securely
- Persistent amber "IMPERSONATING" banner with target user info
- "Return to Admin" button restores original admin session
- Nested impersonation is blocked

---

### US-042: View Financial Ledger
**As a** Platform Admin,
**I want to** see a comprehensive financial overview of the platform,
**so that** I can understand revenue, margins, and market dynamics.

**Acceptance Criteria:**
- Total GMV (booking value), wholesale value (auction prices), broker delta (markup profit)
- Live and ended auction counts
- Room inventory metrics (total rooms, booked, available)

---

### US-043: Audit Direct Offers
**As a** Platform Admin,
**I want to** view an audit trail of all direct offers between brokers and agents,
**so that** I can ensure fair dealing and detect any issues.

**Acceptance Criteria:**
- Complete list of all offers with broker name, agent name, block details, pricing, status
- Stale offer detection: offers pending for more than 72 hours flagged
- Drill-down into broker-agent pair offer history
- View any broker's agent group membership

---

## 6. Escrow & Financial Protection (Phase 8)

### US-050: Automatic Escrow on Booking
**As a** Travel Agent making a booking,
**I want** 80% of my payment to be held in escrow until the hotel verifies check-in,
**so that** my money is protected if the accommodation does not materialize.

**Acceptance Criteria:**
- On booking or direct offer acceptance, escrow record is automatically created
- 20% instantly released to broker's digital wallet
- 80% held in PHX Global Escrow
- Escrow status set to MILESTONE_1_PAID
- Two events logged: FUNDED and BROKER_PAYOUT_20

---

### US-051: Hotel Check-In Verification
**As a** Hotel owner,
**I want to** verify guest check-ins via QR scan to trigger the release of held escrow funds,
**so that** I receive payment only after confirming the guest has arrived.

**Acceptance Criteria:**
- Guest Check-In page shows all bookings with escrow status
- "Verify Check-In" button available for bookings with MILESTONE_1_PAID escrow
- Clicking triggers check-in scan creation and escrow settlement
- Settlement calculates: platform fee from escrow balance, remaining amount to hotel wallet
- Status changes to SETTLED
- Already-settled or frozen bookings show appropriate status instead of check-in button

---

### US-052: Monitor Escrow Ledger
**As a** Platform Admin,
**I want to** view a real-time ledger of all escrow records with summary statistics,
**so that** I can monitor the financial health of the platform.

**Acceptance Criteria:**
- Summary cards: Global Escrow Balance, Total Broker Payouts, Total Hotel Payouts, Platform Fees Collected
- Detailed table with: booking ID, agent, broker, hotel, total paid, escrow balance, broker 20%, hotel payout, fee, status
- Event log viewer per escrow record (chronological audit trail)
- Status badges with distinct colors for each state

---

### US-053: Freeze/Unfreeze Escrow
**As a** Platform Admin,
**I want to** freeze suspicious escrow records to prevent fund release during disputes,
**so that** I can protect all parties while investigating issues.

**Acceptance Criteria:**
- Freeze button available on MILESTONE_1_PAID escrow records
- Freeze requires a reason (text input)
- Frozen escrow cannot be released via check-in or auto-release
- Unfreeze button available on FROZEN records
- Both actions logged as events in the escrow audit trail
- Frozen count displayed prominently on the ledger page

---

### US-054: Adjust Platform Fee
**As a** Platform Admin,
**I want to** adjust the platform fee percentage that is deducted from escrow settlements,
**so that** I can optimize platform revenue based on market conditions.

**Acceptance Criteria:**
- Platform Fee Adjuster card shows current fee percentage
- Input accepts 0-100% with 0.1 step precision
- Fee update takes effect immediately for future settlements
- Current fee displayed in the Platform Fees Collected summary card

---

### US-055: Automatic Escrow Release
**As a** Hotel owner who forgot to scan guest check-in,
**I want** the escrow to automatically release 48 hours after checkout,
**so that** I still receive my payment even without scanning the QR code.

**Acceptance Criteria:**
- Background worker runs hourly
- Identifies escrow records: MILESTONE_1_PAID status, no QR scan, 48h past checkout date
- Skips frozen or disputed records
- Calculates same fee structure as manual check-in
- Credits hotel wallet with remaining amount
- Sets status to AUTO_RELEASED
- Logs AUTO_RELEASE event

---

### US-056: View Digital Wallet
**As a** Broker or Hotel,
**I want to** see my digital wallet balance and total earnings,
**so that** I can track my income from the platform.

**Acceptance Criteria:**
- Wallet shows current balance and lifetime total earned
- Wallet auto-created on first access
- Broker wallet credited with 20% on each booking/offer
- Hotel wallet credited with escrow remainder on check-in or auto-release

---

### US-057: Escrow Privacy
**As a** user with financial records on the platform,
**I want** my escrow details to only be visible to myself and the admin,
**so that** my financial information is protected from unauthorized access.

**Acceptance Criteria:**
- Agent, broker, and hotel involved in a booking can view its escrow record
- Admin can view any escrow record
- Unrelated users receive 403 Forbidden
- Impersonating admin retains admin-level access to escrow data

---

## Story Map Summary

| Epic | Story Count | Priority |
|------|------------|----------|
| Authentication & Access | 4 | Critical |
| Auction Management | 5 | Critical |
| Inventory & Marketplace | 7 | Critical |
| Guest Management | 4 | High |
| Admin Oversight | 4 | High |
| Escrow & Financial | 8 | Critical |
| **Total** | **32** | |

All 32 user stories have been fully implemented, tested, and validated.
