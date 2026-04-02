# PHX Exchange — Frequently Asked Questions (Q&A)

---

## 1. PLATFORM OVERVIEW

### Q: What is PHX Exchange?
**A:** PHX Exchange is a multi-role B2B marketplace designed for Hajj and Umrah accommodation bookings. It connects hotels, brokers, and travel agents in a transparent, regulated environment where hotel room blocks are auctioned, resold, and booked for pilgrims — all with built-in escrow protection and compliance controls.

### Q: Who are the users of PHX Exchange?
**A:** There are four user roles:
- **Hotels** — List room blocks for auction, confirm guest check-ins, and receive payouts
- **Brokers** — Bid on room blocks, manage inventory, set markups, and resell to agents
- **Agents** — Purchase rooms from brokers, register pilgrims, manage storefronts, and handle ministry submissions
- **Admin** — Oversees the entire platform, manages users, resolves disputes, and monitors financial activity

### Q: What problem does PHX Exchange solve?
**A:** The traditional Hajj/Umrah accommodation market suffers from opacity, double-booking risks, payment disputes, and lack of accountability. PHX Exchange brings transparency through real-time auctions, financial security through escrow, and trust through a verified user system with full audit trails.

---

## 2. BOOKING FLOW

### Q: How does the booking process work end-to-end?
**A:** The process flows through three stages:
1. **Hotel → Broker (via Auction):** Hotels create room block auctions. Brokers bid in real-time. The highest bidder wins the entire block when the auction ends.
2. **Broker → Agent (via Marketplace):** The winning broker sets a markup percentage, lists rooms in the Marketplace. Agents browse and purchase rooms at the marked-up price plus 15% VAT.
3. **Agent → Pilgrims:** After booking rooms, the agent assigns individual pilgrims to the booking (name, passport, Nusuk ID), then submits pilgrim data to the Ministry for visa processing.

### Q: When an agent clicks "Book Now," who are they booking for?
**A:** The agent is booking rooms **for their travel agency's pilgrim clients**. The agent is the buyer in this transaction — they are purchasing rooms from a broker at the listed price. After booking, the agent then assigns individual pilgrims to those rooms through the Bookings page.

### Q: Who receives the booking confirmation?
**A:** The **agent** receives the confirmation within their PHX Exchange account. It appears on their Bookings page showing the room details, number of rooms booked, total price paid, and escrow status. The broker also sees their inventory count decrease. Pilgrims are not notified at this stage — they receive vouchers later when the agent adds them to the booking.

### Q: Can an agent book rooms directly from a hotel?
**A:** No. The platform enforces the auction pipeline: Hotels → Brokers → Agents. This ensures price discovery through competitive bidding and gives brokers their intermediary role. However, brokers can send **Direct Offers** to specific agents with custom pricing, bypassing the public Marketplace listing.

---

## 3. DOUBLE-BOOKING PREVENTION

### Q: What happens if multiple agents try to book the same rooms at the same time?
**A:** The system uses **atomic database transactions** to prevent double-booking. Here's exactly what happens:

1. A broker has 50 rooms listed in the Marketplace
2. Agent A clicks "Book Now" for 30 rooms
3. Agent B clicks "Book Now" for 30 rooms at nearly the same instant
4. The database processes one request at a time:
   - Agent A's request is processed first → inventory drops from 50 to 20 → booking confirmed
   - Agent B's request is processed next → only 20 rooms remain, but they requested 30 → **booking rejected** with a clear error message
5. If Agent B had requested 20 or fewer, both bookings would succeed

This is the same principle banks use — the database locks the inventory count during each booking to ensure the numbers never go below zero and the same room is never sold twice.

### Q: How does the system prevent auction double-bidding?
**A:** Auction bidding also uses atomic transactions (`placeBidAtomically`). Each bid must exceed the current highest bid. If two brokers submit bids at the same millisecond, only one is accepted — the database processes them sequentially, and the second bidder is informed their amount is no longer the highest.

### Q: What about the anti-sniping protection?
**A:** If a broker places a bid in the final moments before an auction closes, the system automatically extends the auction timer. This prevents last-second "sniping" and gives other brokers a fair chance to respond with counter-bids.

### Q: Does the Marketplace inventory update in real-time?
**A:** Yes. The platform uses **WebSocket connections** for real-time updates. When an agent books rooms, all other agents viewing that listing see the available room count decrease immediately — they don't need to refresh the page. This minimizes the chance of agents attempting to book rooms that have just been taken.

---

## 4. FINANCIAL SYSTEM

### Q: How does the escrow system work?
**A:** When an agent books rooms, the payment goes into **escrow** — it's held by the platform, not paid directly to the broker or hotel. The payout follows an **80/20 rule**:
- **80% is released** to the broker/hotel when the hotel confirms that pilgrims have physically checked in
- **20% is held** as a retention until the booking period is fully completed
This protects agents from paying for rooms where pilgrims never arrive, and protects hotels from non-payment.

### Q: What currencies does PHX Exchange support?
**A:** All base prices are in **Saudi Riyals (SAR)**. The platform displays converted prices in:
- USD (US Dollars)
- IDR (Indonesian Rupiah)
- PKR (Pakistani Rupee)

Conversions are calculated from the SAR base price.

### Q: How are taxes handled?
**A:** All Marketplace prices include a **15% VAT** (Value Added Tax), compliant with Saudi B2B regulations. The platform generates **ZATCA-compliant tax invoices** with TLV QR codes for every booking, which can be downloaded as PDFs.

### Q: What is the wallet ledger?
**A:** Every user has a **wallet** within PHX Exchange. All financial movements — auction wins, bookings, escrow holds, payouts, refunds — are recorded as double-entry transactions in the wallet ledger. This creates a complete, audit-ready financial trail.

---

## 5. DISPUTES AND PROTECTION

### Q: What happens if there's a dispute?
**A:** Agents can file a dispute on any booking by clicking the dispute icon and entering a reason. When a dispute is filed:
1. The **escrow is immediately frozen** — no funds are released to anyone
2. The **admin is notified** of the dispute
3. The admin reviews the case and makes a resolution decision
4. Funds are released or refunded based on the resolution

### Q: What protections exist for each party?
**A:**
- **Hotels** are protected by escrow — they receive 80% payout upon confirmed check-in
- **Brokers** are protected by the auction system — they win blocks at fair market price
- **Agents** are protected by escrow — they don't lose money if pilgrims can't check in, and they can file disputes
- **Pilgrims** are protected by the voucher system — they have documented proof of their booking

---

## 6. COMPLIANCE AND VERIFICATION

### Q: What is the verification system?
**A:** Before users can access key features (bidding, booking, financial transactions), they must be **verified by an admin**. This ensures only legitimate businesses operate on the platform. Unverified users can browse but cannot transact.

### Q: What is the 7-day listing deadline?
**A:** After a broker wins a room block at auction, they have **7 days** to list those rooms in the Marketplace. If they fail to list within 7 days, the rooms are automatically **clawed back** and returned to the hotel. This prevents brokers from hoarding inventory.

### Q: What about license expiry?
**A:** The platform includes a background worker that checks for expired business licenses daily. If a broker or agent's license expires, their account functionality is suspended until renewed. This ensures all active participants have valid credentials.

---

## 7. PILGRIM MANAGEMENT

### Q: How are pilgrims registered?
**A:** After an agent books rooms, they add pilgrims to the booking in two ways:
- **Individual entry** — Fill in each pilgrim's details (name, passport number, Nusuk ID, nationality, etc.)
- **CSV bulk upload** — Upload a spreadsheet with multiple pilgrims at once using the built-in CSV import tool

### Q: What is the Nusuk integration?
**A:** Nusuk is the Saudi Ministry's pilgrim management system. PHX Exchange integrates with it so agents can:
1. **Sync pilgrim data** to Nusuk — the system validates passport expiry, Nusuk ID format, and name transliteration
2. **Request Ministry approval** — submit for visa processing
3. **Track status** — see whether visas are ISSUED, PENDING, SYNCED, FAILED, or QUEUED

Failed submissions automatically retry with exponential backoff through the Retry Queue.

### Q: Can pilgrims check their own booking status?
**A:** Yes. Pilgrims can visit a public **Booking Status page**, enter their Voucher ID (format: PHX-2026-XXXXX) and passport number, and see their booking details and visa status. Sensitive data is masked for privacy.

---

## 8. AGENT STOREFRONTS

### Q: What is an Agent Storefront?
**A:** Agents can create a **public-facing storefront** — a branded page where pilgrims can browse available rooms and submit bookings directly. Each storefront has a unique URL (e.g., `/s/al-noor-travel`).

### Q: How does a storefront booking work?
**A:** 
1. A pilgrim visits the agent's storefront URL
2. They browse available rooms and submit a booking (individual, group, or CSV upload)
3. The booking is saved immediately — the agent sees it on their Bookings page
4. The agent reviews the pilgrim data, then submits to the Ministry via the Nusuk Dashboard
5. The pilgrim never interacts with the Ministry directly — the agent handles everything

### Q: Does the agent earn commission on storefront bookings?
**A:** Yes. The agent sets a **commission rate** in their storefront settings, which is applied to bookings made through their public page.

---

## 9. DOCUMENTS AND EXPORTS

### Q: What documents can be generated?
**A:**
- **Booking Voucher PDF** — For pilgrims, showing booking details and voucher ID
- **ZATCA Tax Invoice PDF** — Compliant with Saudi e-invoicing standards, includes TLV QR code
- Both are generated using jsPDF and can be downloaded from the Bookings page

### Q: Is there audit logging?
**A:** Yes. The platform logs all significant actions to a `system_logs` table with:
- Timestamp
- User who performed the action
- Action type
- Source module
- Details

Admins can filter and search logs via the System Logs interface.

---

## 10. TECHNICAL ARCHITECTURE

### Q: What technology stack does PHX Exchange use?
**A:**
- **Frontend:** React + Vite + TailwindCSS + shadcn/ui
- **Backend:** Express.js with session-based authentication
- **Database:** PostgreSQL with Drizzle ORM
- **Real-time:** WebSocket server for live auction updates and inventory changes
- **Languages:** English, Arabic, Urdu, Farsi/Persian with automatic RTL support
- **Maps:** Leaflet for hotel location mapping

### Q: How does real-time bidding work technically?
**A:** The auction engine uses WebSocket connections. When any broker places a bid:
1. The bid is validated and recorded atomically in the database
2. A WebSocket broadcast is sent to all connected clients
3. Every user viewing that auction sees the new bid amount instantly
4. The auction timer is updated if anti-sniping rules are triggered

### Q: What background processes run on the platform?
**A:** Five automated workers run continuously:
1. **Auction Worker** — Closes expired auctions, declares winners
2. **Escrow Worker** — Manages automatic escrow releases after check-in
3. **Release Worker** — Enforces the 7-day listing deadline for broker inventory
4. **License Worker** — Checks for expired business licenses daily
5. **Retry Worker** — Retries failed Nusuk synchronization with exponential backoff

---

## 11. SECURITY AND DATA

### Q: How is authentication handled?
**A:** The platform uses **session-based authentication** with:
- bcrypt-hashed passwords
- Express sessions with secure cookies
- Role-based access control (each role only sees their permitted features)
- Rate limiting to prevent brute-force attacks (10 auth attempts per 15 minutes)

### Q: Is the financial data auditable?
**A:** Yes. The wallet ledger uses **double-entry accounting** — every financial movement creates matching debit and credit records. Combined with the system logs, this provides a complete audit trail for regulatory review.

### Q: What about multi-currency accuracy?
**A:** All calculations are performed in SAR (base currency) to avoid rounding errors. Display currencies (USD, IDR, PKR) are derived from SAR using conversion rates and are for display purposes only — all stored amounts are in SAR.

---

*Document Version: 1.0*
*Last Updated: March 2026*
*PHX Exchange — Revolutionizing Hajj & Umrah Accommodation*
