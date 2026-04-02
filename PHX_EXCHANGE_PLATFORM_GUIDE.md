# PHX Exchange Platform Guide

## What is PHX Exchange?

PHX Exchange is a B2B marketplace built for the Hajj and Umrah accommodation industry. It connects four types of users to streamline the entire process of hotel room trading, pilgrim registration, and ministry compliance.

The platform handles the complete lifecycle: from a hotel listing rooms for auction, to a broker winning and reselling those rooms, to an agent booking rooms for pilgrims, all the way through to ministry visa issuance.

---

## The Four Roles

**Hotels** own room inventory near Al-Haram and list blocks of rooms for wholesale auction.

**Brokers** are wholesale buyers who bid on hotel room blocks at auction, win inventory, and resell it to travel agents with a markup.

**Agents** are travel companies that purchase rooms from brokers (via the marketplace) and manage pilgrim bookings, including registration and ministry submissions.

**Admins** oversee the entire platform: user verification, financial reports, escrow management, and dispute resolution.

---

## End-to-End Flow: From Hotel Room to Pilgrim Visa

This is the complete journey of a room block from listing to visa issuance.

### Phase 1: Hotel Lists Rooms for Auction

1. A hotel logs in and navigates to the Auctions page
2. The hotel clicks "New Listing" and creates a room block auction:
   - Room type (Quad, Triple, Double, Single, Suite)
   - Distance from Al-Haram in meters
   - Number of rooms in the block
   - Floor price (minimum bid per room in SAR)
   - Auction end time
3. The auction goes live immediately
4. All brokers on the platform can see the listing and bid in real-time

### Phase 2: Broker Wins Auction and Lists Inventory

1. A broker sees the live auction and places a bid
2. Bids are broadcast in real-time via WebSocket — all participants see updates instantly
3. Anti-sniping protection: if a bid comes in during the final moments, the auction auto-extends
4. When the auction ends, the highest bidder wins the room block
5. The won block appears in the broker's Inventory page
6. The broker sets a markup percentage (e.g., 15%) on top of the wholesale price
7. The broker toggles "Listed" to make the rooms visible on the Agent Marketplace
8. The broker can also toggle Public/Private:
   - Public: all agents can see and book
   - Private: only agents in the broker's whitelist can see
9. A 7-day deadline starts — if rooms are not listed within 7 days, they revert back to the hotel

### Phase 3: Agent Books Rooms from Marketplace

1. An agent logs in and navigates to the Marketplace
2. The agent sees available room blocks with hotel images, room type, distance from Al-Haram, and price including 15% VAT breakdown
3. The agent clicks "Book Now" on a listing
4. The agent enters the number of rooms needed and reviews the price summary:
   - Subtotal (excluding VAT)
   - VAT at 15%
   - Total with VAT
5. The agent confirms the booking
6. Payment is processed through the escrow system:
   - 20% released to the broker immediately
   - 80% held in escrow until hotel check-in is confirmed

### Phase 4: Pilgrim Booking Through Agent Storefront

Each agent can set up a public-facing storefront for pilgrims to book directly.

**Agent sets up the storefront:**
1. Agent navigates to Storefront > Setup tab
2. Configures a URL slug (e.g., "al-noor-travel"), display name, description, and commission rate
3. Clicks "Update Settings" to save
4. Toggles "Active" to make the storefront live
5. Shares the public URL with clients: /s/al-noor-travel

**Pilgrim makes a booking:**
1. Pilgrim visits the agent's public storefront URL (no login required)
2. Pilgrim browses available rooms with hotel details and pricing
3. Pilgrim fills out the booking form with personal details:
   - Full name, passport number, nationality, gender, date of birth
   - Nusuk ID (10-digit number)
   - Passport expiry date
   - Vaccination status
4. For individual bookings: pilgrim fills out the form directly
5. For group bookings: a group leader enters their own details, then adds each pilgrim individually or uploads a CSV file with all pilgrim data
6. After submission, the pilgrim receives a Voucher ID (format: PHX-2026-XXXXX)
7. The booking and all pilgrim data are saved immediately to the database

### Phase 5: Agent Reviews Pilgrim Data

This is a critical step. The agent acts as the gatekeeper between pilgrim data and the Saudi Ministry of Hajj.

1. Agent logs in and navigates to the Bookings page
2. The new booking from the storefront appears in the agent's booking list
3. Agent expands the booking to see all submitted pilgrim details:
   - Names, passport numbers, Nusuk IDs, nationalities, genders, vaccination status
4. If a group leader submitted via CSV, all pilgrims from the file appear here
5. Agent reviews and verifies the information for accuracy
6. Agent can correct errors before submitting to the ministry
7. At this point, nothing has been sent to the ministry yet — the agent controls when that happens

### Phase 6: Agent Syncs to Nusuk (Ministry of Hajj)

Only the agent can initiate ministry submissions. Pilgrims never interact with the ministry directly.

1. Agent navigates to Storefront > Nusuk Dashboard tab
2. The dashboard shows all pilgrim bookings with their current sync status
3. Agent selects the bookings they want to submit
4. Agent clicks "Sync to Nusuk"
5. The system performs pre-flight validation:
   - Passport expiry date must be after December 20, 2026
   - Nusuk ID must be exactly 10 digits
   - Names are transliterated to uppercase Latin characters for the ministry
6. Each booking gets a status:
   - **SYNCED** — data validated and sent successfully
   - **FAILED** — validation error (agent needs to fix the data)
   - **QUEUED** — will be retried automatically
7. Failed syncs enter the Retry Queue and are automatically re-attempted with exponential backoff (increasing wait times between retries, up to 5 attempts)

### Phase 7: Ministry Approval and Visa Issuance

1. After bookings are synced, the agent clicks "Request Ministry Approval" for each synced booking
2. The system sends the pilgrim data to the Ministry of Hajj (Nusuk Masar) for visa processing
3. The ministry responds with visa numbers for approved pilgrims
4. The response appears on the agent's Nusuk Dashboard:
   - **ISSUED** — visa number has been assigned
   - **PENDING** — still being processed

### Phase 8: Pilgrim Checks Status

1. The pilgrim visits the Booking Status page (accessible from the login page without logging in)
2. The pilgrim enters their Voucher ID (PHX-2026-XXXXX) and passport number
3. The system displays:
   - Booking confirmation status
   - Hotel name and details
   - Check-in date
   - Visa status (ISSUED or PENDING)
4. Sensitive information (passport number, Nusuk ID) is partially masked for security
5. Once the agent has submitted to the ministry and the visa is issued, the pilgrim can see it here

### Phase 9: Hotel Check-In and Escrow Release

1. When the pilgrim arrives at the hotel, the hotel confirms check-in on the platform
2. Check-in confirmation triggers the escrow release:
   - The remaining 80% of the payment is released to the broker/hotel
3. The full transaction is recorded in the wallet ledger for audit purposes

---

## Financial System

**Escrow (80/20 Rule):**
When an agent books rooms, payment enters escrow. 20% is released immediately. 80% is held until the hotel confirms the guest has checked in. This protects all parties.

**VAT Compliance:**
All prices include a 15% VAT calculation compliant with Saudi Arabia's ZATCA regulations. Tax invoices can be generated as PDFs with TLV-encoded QR codes for electronic verification.

**Multi-Currency Display:**
Prices are stored in SAR (Saudi Riyal) as the base currency. The platform can display prices in USD, IDR (Indonesian Rupiah), and PKR (Pakistani Rupee) using currency conversion.

**Wallet Ledger:**
Every financial transaction is tracked in a double-entry style ledger, providing a complete audit trail of all money movement on the platform.

---

## Dispute Resolution

If an agent has a problem with a booking:
1. Agent clicks the dispute icon on the booking
2. Agent enters the reason for the dispute
3. The booking's escrow is immediately frozen
4. An admin is notified
5. Admin reviews the dispute in the Escrow management page
6. Admin resolves the dispute and releases or refunds the escrow accordingly

---

## Direct Offers (Broker to Agent)

Besides listing rooms on the public marketplace, brokers can send private offers directly to specific agents:
1. Broker selects a room block in their Inventory
2. Broker clicks "Send Offer" and chooses an agent
3. Broker sets the number of rooms and price per room
4. The agent sees the offer in their Marketplace page with accept/decline buttons
5. If accepted, a booking is created automatically

---

## Admin Controls

The admin has visibility and control over the entire platform:

**User Management:**
- View all registered users with role, verification status, and business name
- Toggle verification status to approve or reject users
- Impersonate any user to troubleshoot their experience

**Financial Reports:**
- Platform-wide financial summaries
- Transaction volumes and fee collections

**Escrow Management:**
- View all escrow holds and pending releases
- Process releases and resolve disputes

**System Logs (Audit Trail):**
- Every API request is logged with a unique request ID
- Filterable by severity level, source, action, and date
- Supports full request tracing for debugging

**Task Queue:**
- Monitor background tasks (Nusuk syncs, retries)
- View pending, processing, completed, and failed tasks
- See error details and retry schedules for failed tasks

---

## Language and Currency Settings

The platform supports four languages:
- English (default)
- Arabic (with RTL layout)
- Urdu (with RTL layout)
- Farsi/Persian (with RTL layout)

Switch language using the globe icon in the sidebar. The entire interface, including labels, messages, and navigation, translates automatically.

Switch currency using the currency selector. Available currencies: SAR, USD, IDR, PKR.

---

## Compliance and Verification

All users must go through a verification process before accessing core features. This is managed by admins through the Users page. Unverified users have limited access until approved.

Hotels assign Ministry BRN (Business Registration Number) codes to room blocks after auctions end, linking them to the regulatory system.

---

## Summary: Who Does What

| Step | Who | What Happens |
|------|-----|--------------|
| 1 | Hotel | Lists room block for auction |
| 2 | Broker | Bids on auction, wins room block |
| 3 | Broker | Sets markup, lists on marketplace |
| 4 | Agent | Books rooms from marketplace |
| 5 | Pilgrim | Submits booking on agent's public storefront |
| 6 | Agent | Reviews pilgrim data in Bookings page |
| 7 | Agent | Syncs to Nusuk, validates data |
| 8 | Agent | Requests ministry approval (visa) |
| 9 | Ministry | Issues visa numbers |
| 10 | Pilgrim | Checks visa status on public Booking Status page |
| 11 | Hotel | Confirms guest check-in |
| 12 | System | Releases 80% escrow to broker/hotel |
