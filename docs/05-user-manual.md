# PHX Exchange - User Manual

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Wallet & Financial Ledger](#2-wallet--financial-ledger)
3. [Dispute Management](#3-dispute-management)
4. [ZATCA Tax Invoices](#4-zatca-tax-invoices)
5. [Safety & Risk Controls](#5-safety--risk-controls)
6. [Agent Storefront (B2B2C)](#6-agent-storefront-b2b2c)
7. [Public Pilgrim Guide](#7-public-pilgrim-guide)

---

## 1. Getting Started

### Logging In

1. Navigate to the PHX Exchange login page.
2. Select your role (Hotel, Broker, Agent, or Admin) from the role cards on the left panel.
3. Enter your email and password in the sign-in form on the right panel.
4. Click **Sign In** to access your role-specific dashboard.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@phxcore.com | admin123 |
| Hotel | almadinah@hotel.com | hotel123 |
| Broker | alhijaz@broker.com | broker123 |
| Agent | alnoor@agent.com | agent123 |

### Verification Requirement

Most platform features require account verification. After registering, navigate to **Compliance** in the sidebar to submit your business documents (CR Number, VAT Certificate, Tourism License, etc.). An Admin will review and approve your verification. Until verified, features like auction creation, bidding, booking, and wallet access are restricted.

---

## 2. Wallet & Financial Ledger

The Wallet provides a complete, audit-ready record of all financial transactions on the platform. Every booking, escrow event, and payout is automatically logged.

### Accessing the Wallet

Click **Wallet** in the sidebar navigation. The wallet is available to all verified users (Hotel, Broker, Agent).

### Understanding the Balance Cards

At the top of the Wallet page, you will see three summary cards:

| Card | Description |
|------|-------------|
| **Available Balance** | Funds available for withdrawal or use. Shown in green. |
| **Locked for Withdrawal** | Funds that have been requested for payout but are awaiting admin approval. Shown in amber. |
| **Total Earned** | Lifetime earnings on the platform. Shown in blue. |

### Transaction History

Below the balance cards is a table showing all wallet transactions. Each entry includes:

- **Type** — The category of the transaction, color-coded:
  - **ESCROW_HOLD** (blue) — Funds locked when a booking is made
  - **COMMISSION_CREDIT** (green) — Earnings credited (broker 20% on booking, hotel 80% on check-in)
  - **PLATFORM_FEE** (red) — Platform service fee deducted from escrow settlements
  - **PAYOUT_PENDING** (amber) — Payout requested, awaiting admin approval
  - **PAYOUT_COMPLETED** (emerald) — Payout approved and processed

- **Amount** — The transaction amount in SAR
- **Reference** — The related booking or auction ID (first 8 characters)
- **Status** — Current state of the transaction:
  - **SETTLED** (green) — Transaction complete
  - **PENDING** (yellow) — Awaiting processing
  - **FROZEN** (red) — Transaction frozen due to dispute
- **Date** — When the transaction occurred

### Requesting a Payout (Hotels & Brokers Only)

1. On the Wallet page, click the **Request Payout** button (top right).
2. Enter the amount you wish to withdraw (minimum SAR 10).
3. The amount must not exceed your available balance.
4. Click **Submit** to create the payout request.
5. The requested amount moves from Available Balance to Locked for Withdrawal.
6. An Admin will review and approve the payout. Once approved, the status changes to PAYOUT_COMPLETED.

### How Transactions Are Created Automatically

You do not need to manually create transactions. They are generated automatically by the platform:

| Event | Transactions Created |
|-------|---------------------|
| Agent books rooms | ESCROW_HOLD on agent wallet |
| Hotel verifies check-in | COMMISSION_CREDIT on hotel wallet, PLATFORM_FEE deducted |
| 48-hour auto-release | Same as check-in (COMMISSION_CREDIT + PLATFORM_FEE) |
| Broker receives 20% | COMMISSION_CREDIT on broker wallet at booking time |
| Dispute filed | ESCROW_HOLD status changed to FROZEN |

---

## 3. Dispute Management

The dispute system allows Agents to challenge bookings when issues arise, triggering an escrow freeze and admin-managed resolution process.

### For Agents: Filing a Dispute

1. Navigate to **My Bookings** in the sidebar.
2. Find the booking you want to dispute. The booking must have an active escrow (status: MILESTONE_1_PAID) — this means the booking has been paid and the broker's 20% commission has been released.
3. Click the **File Dispute** button (red, with warning icon) on the booking card.
4. A dialog will open asking for a reason. Describe the issue in detail (minimum 5 characters).
5. Click **Submit Dispute**.
6. The escrow is immediately frozen, preventing the hotel from performing check-in.
7. A red **Disputed** badge with a snowflake icon will appear on the booking card.
8. All platform admins are notified automatically.

### What Happens When a Dispute Is Filed

- The escrow balance is frozen — no funds can be released to the hotel or broker.
- The hotel's "Verify Check-in" button is disabled for this booking.
- A wallet transaction is recorded showing the FROZEN status.
- The admin receives a notification to review the dispute.

### For Admins: Resolving Disputes

1. Navigate to **Disputes** in the sidebar (Admin only).
2. The Disputes page shows:
   - **Summary Cards** — Active disputes count, total frozen funds, average wait time
   - **Dispute Table** — All frozen bookings with agent/broker/hotel names, escrow amount, reason, and frozen date

3. For each dispute, you have two resolution options:

#### Release to Hotel
- Click **Release to Hotel** to rule in the hotel's favor.
- The escrow amount (minus platform fee) is credited to the hotel's wallet.
- The booking escrow status changes to SETTLED.

#### Refund to Agent
- Click **Refund to Agent** to rule in the agent's favor.
- The full amount (escrow held + broker's 20% commission) is refunded to the agent's wallet.
- The broker's wallet is debited for the commission amount (up to available balance).
- The booking escrow status changes to REFUNDED.

4. Both the agent and hotel are notified of the resolution via in-platform notifications.

### Notifications

- Agents and hotels receive notifications when disputes are resolved.
- Admins receive notifications when disputes are filed.
- Check the notification bell icon in the sidebar for unread notifications.

---

## 4. ZATCA Tax Invoices

PHX Exchange generates ZATCA-compliant (Saudi Arabian Tax Authority) tax invoices for every booking. These invoices comply with Saudi B2B electronic invoicing requirements and include the mandatory TLV-encoded QR code.

### What Is ZATCA Compliance?

ZATCA (Zakat, Tax, and Customs Authority) requires all B2B transactions in Saudi Arabia to include electronic tax invoices with specific data fields. PHX Exchange invoices include:

- **15% VAT** calculated on all transactions
- **Seller and Buyer information** including business names and VAT registration numbers
- **QR Code** containing TLV (Tag-Length-Value) encoded data in Base64 format

### QR Code Contents (TLV Format)

The QR code on every invoice contains 5 mandatory fields encoded in ZATCA's TLV binary format:

| Tag | Field | Example |
|-----|-------|---------|
| 1 | Seller Name | Al Madinah Grand Hotel |
| 2 | VAT Number | 300012345600003 |
| 3 | Timestamp | 2026-03-01T12:00:00.000Z |
| 4 | Total Amount (incl. VAT) | 263.35 |
| 5 | VAT Amount | 34.35 |

This data is encoded as binary TLV bytes, then Base64-encoded, and rendered as a scannable QR code.

### Viewing a Tax Invoice (Dialog)

1. Navigate to **My Bookings** as an Agent.
2. Click the **Tax Invoice** button (receipt icon) on any booking card.
3. The Tax Invoice dialog opens showing:
   - **QR Code** — Scannable ZATCA TLV-encoded QR with a label below it
   - **Seller Card** — Hotel's business name, VAT number, and BRN (if assigned)
   - **Buyer Card** — Agent's business name and VAT number
   - **Invoice Details** — Invoice number (PHX-YYYY-NNNN format), date, room type, room count
   - **Financial Breakdown** — Price per room, subtotal (excl. VAT), VAT (15%), total (incl. VAT)
   - **Multi-currency Note** — If your display currency differs from SAR, an official SAR total is shown for compliance

### Downloading the PDF Tax Invoice

There are two ways to download the PDF:

#### Method 1: Direct Download from Booking Card
1. On the **My Bookings** page, find the booking you want an invoice for.
2. Click the **Download PDF** button (gold-colored, with download icon).
3. The PDF is generated on the server and downloaded to your device.

#### Method 2: Download from Invoice Dialog
1. Open the Tax Invoice dialog (click **Tax Invoice** on a booking card).
2. Review the invoice details.
3. Click the **Download PDF** button at the bottom-right of the dialog.
4. The PDF is saved to your device.

### PDF Invoice Layout

The downloaded PDF includes a professional layout with:

- **Header** — PHX Exchange logo and tagline in dark blue, invoice number and date
- **QR Code** — ZATCA TLV-encoded QR code in the top-right corner
- **Seller Section** — Hotel business name, VAT number, CR number, Ministry BRN
- **Buyer Section** — Agent business name, VAT number, CR number
- **Line Item Table** — Room description, quantity, unit price, VAT, and total
- **Financial Summary** — Subtotal, VAT (15%), and grand total with gold accent
- **Compliance Footer** — ZATCA compliance statement, TLV encoding note, generation timestamp

### Invoice Numbers

Each booking is assigned a unique invoice number in the format **PHX-YYYY-NNNN** (e.g., PHX-2026-0012). This number is displayed on both the dialog view and the PDF.

### Ensuring Complete Seller/Buyer Information

For the most complete invoices, ensure your compliance profile is filled out:

- **Hotels** should enter their VAT Number, CR Number, and assign Ministry BRN codes to their auctions.
- **Agents** should enter their VAT Number and CR Number in the Compliance section.

If these fields are not filled in, the invoice will show "N/A" for missing values. The invoice is still generated but may not be fully ZATCA-compliant without proper VAT registration numbers.

---

## 5. Safety & Risk Controls

PHX Exchange includes several automated safety mechanisms to protect all parties and ensure fair trading.

### Zero-Bid Auction Expiry

When an auction reaches its listing end time with zero bids placed:

- The auction status automatically changes to **EXPIRED** (shown as an orange badge on the UI).
- The room count remains associated with the hotel — rooms are not "lost" to the system.
- The hotel can create a new auction for those rooms at any time.
- This is different from **ENDED** status, which means a broker won the auction with at least one bid.

| Auction Outcome | Status | What Happens |
|----------------|--------|-------------|
| 1+ bids received | **ENDED** | Highest bidder wins, inventory block created for broker |
| 0 bids received | **EXPIRED** | Rooms return to hotel, no inventory block created |
| Hotel manually closes | **CANCELLED** | Auction removed from active listings |

### Verification Gate

All users must be verified by an Admin before accessing critical platform features. This ensures only legitimate businesses can trade on the platform.

**What is blocked for unverified users:**

| Role | Blocked Feature | Error Message |
|------|----------------|---------------|
| Hotel | Create New Listing (auction) | "Your account must be verified before creating auctions" |
| Broker | Place Bid on auction | "Your account must be verified before placing bids" |
| Agent | Book rooms from marketplace | Verification gate blur overlay |
| All | Wallet, Transactions, Compliance pages | Verification gate blur overlay |

**How to get verified:**
1. Navigate to **Compliance** in the sidebar.
2. Fill in your business details (CR Number, VAT Number, etc.).
3. Upload required documents (CR Copy, Tourism License, etc.).
4. Wait for an Admin to review and approve your application.
5. You will receive a notification when your status changes to **VERIFIED**.

### 7-Day Clawback

When a broker wins an auction, they receive an inventory block with a 7-day deadline to list or sell the rooms. If the deadline passes with unsold inventory:

1. **Automatic reversion** — The remaining unsold rooms are reverted back to the hotel.
2. **Block delisted** — The inventory block is marked as released and can no longer be sold.
3. **REVERSION transaction logged** — Both the hotel and broker receive a REVERSION entry in their wallet transaction history, recording the clawback event.
4. **Quantity zeroed** — The block's available quantity is set to 0.

The clawback worker runs every hour. If a broker lists and sells rooms before the deadline, only the unsold remainder (if any) is clawed back.

**Timeline example:**
- Day 0: Broker wins auction for 20 rooms
- Day 3: Broker lists rooms and sells 12 to agents
- Day 7: Deadline passes — 8 remaining rooms reverted to hotel, REVERSION logged in wallet

---

## 6. Agent Storefront (B2B2C)

The storefront is your public-facing booking page where pilgrims can book rooms directly without creating an account.

### Setting Up Your Storefront

1. Navigate to **Storefront** from the sidebar (Agent only).
2. If you haven't created a storefront yet, click **Create Storefront**.
3. Configure your storefront settings:
   - **Agency Name** — displayed on the public page
   - **URL Slug** — the custom URL path for your storefront (e.g., `/s/your-agency`)
   - **Description** — a short description of your agency
   - **Markup Percentage** — the percentage you add on top of room prices
   - **Active/Inactive** — toggle your storefront on or off
4. Click **Update Settings** to save any changes.
5. Your **Public URL** is shown at the bottom of the settings form. Share this with pilgrims so they can book directly.

### Pending Sync Notifications

When pilgrims submit bookings through your storefront, you'll see amber notification alerts reminding you to submit their data to the Ministry:

- **On the Dashboard** — an amber banner shows the number of pilgrims pending Nusuk submission, with a direct link to the Storefront page.
- **On the Bookings page** — a similar amber banner shows unsynced storefront bookings.

Both alerts disappear automatically once you sync all pilgrim bookings to Nusuk.

### Viewing Pilgrim Bookings

1. On the Storefront page, scroll down to view all pilgrim bookings.
2. Each booking shows: booking reference (PHX-2026-XXXXX), pilgrim name, passport, Nusuk ID, room count, price, and status.
3. Group bookings are displayed together with the group leader's contact information.

### Nusuk Sync

Nusuk sync submits pilgrim booking data to the Saudi government's Nusuk Masar system.

1. On the Storefront page, find a booking that has not been synced (no green "Synced" badge).
2. Click **Sync to Nusuk Masar** on an individual booking to preview the data payload and submit.
3. Or click **Sync Entire Group** to batch-sync all bookings in a group at once.
4. The system validates each pilgrim's data before submission:
   - Passport expiry must be after December 20, 2026
   - Nusuk ID must be exactly 10 digits
   - Names are automatically sanitized to uppercase Latin characters (e.g., "Müller" becomes "MUELLER")
5. Once synced, a green "Synced" badge appears on the booking.

### Ministry Approval (Simulation)

1. After a booking is synced to Nusuk, a **Simulate Ministry Approval** button appears.
2. Click it to generate a mock visa number (V-2026-XXXXX format).
3. Once approved, the visa status changes to "ISSUED" and a green visa number badge replaces the button.

---

## 7. Public Pilgrim Guide

### Booking Through an Agent's Storefront

Pilgrims can book rooms without creating an account.

1. Open the agent's storefront URL (provided by your travel agent).
2. Browse available room listings. Each shows the hotel name, room type, price per night, and available rooms.
3. Click **Book** on a listing.
4. Choose booking type:
   - **Individual Booking** — book for yourself
   - **Group Booking** — book for multiple pilgrims

### Individual Booking

1. Fill in your details:
   - Full name (as on passport)
   - Citizenship (select country)
   - Passport number
   - Date of birth
   - Passport expiry date (must be after December 20, 2026)
   - Nusuk ID (10 digits)
   - Number of rooms
2. Review the price breakdown (room price + VAT).
3. Click **Confirm Booking**.
4. A confirmation screen appears with your **Accommodation Voucher ID** (PHX-2026-XXXXX). Save this — you'll need it to check your booking and visa status.
5. The confirmation screen includes a **Track Your Visa Status** link that takes you directly to the Booking Status page where you can look up your booking anytime.

### Group Booking

1. **Step 1 — Group Leader Info:**
   - Enter the group leader's name, phone, and email
   - Select the total number of rooms needed for the group
2. **Step 2 — Add Pilgrims:**
   - Add each pilgrim one by one with their details, or
   - Click **Download CSV Template**, fill it in, and upload it to add multiple pilgrims at once
   - The progress bar shows how many rooms have been assigned
3. Once all rooms are assigned, click **Confirm Group Booking**.
4. A confirmation screen lists each pilgrim with their own **Accommodation Voucher ID** (PHX-2026-XXXXX) and the group total.
5. The confirmation screen includes a **Track Your Group's Visa Status** link that takes you directly to the Booking Status page. Each pilgrim can look up their own booking using their individual voucher ID.

### Checking Booking Status

You can check your booking and visa status at any time — no login required. You can reach this page in three ways:
- From the **booking confirmation screen** after completing a booking (click the "Track Your Visa Status" link)
- From the **login page** (click "Check your booking status" at the bottom)
- By navigating directly to `/booking-status`

How to use it:

1. Go to the **Booking Status** page.
2. Enter your:
   - Accommodation Voucher ID (PHX-2026-XXXXX)
   - Passport number
3. Click **Look Up**.
4. You'll see:
   - Your name (partially masked for privacy, e.g., "M****r")
   - Hotel and room information
   - No financial data is shown for security
   - A **3-step progress tracker** showing exactly where your application stands:

| Step | Status | What It Means |
|------|--------|---------------|
| ✅ Booking Received | Always completed | Your booking has been received and confirmed by the travel agent. |
| ⏳ / ✅ Submitted to Ministry | Updates after agent syncs | Your agent submitted your details to the Ministry of Hajj (shows the date). If still pending: "Waiting for your travel agent to submit your details." |
| ⏳ / ✅ Visa Issued | Updates after Ministry approves | Your visa has been approved (shows your visa number). A **Download Voucher** button appears so you can save your accommodation voucher as a PDF. |

5. The progress tracker updates automatically as your application moves through each stage. You can check back anytime — no login required.

---

## Quick Reference: Key Pages by Role

| Page | Hotel | Broker | Agent | Admin |
|------|-------|--------|-------|-------|
| Dashboard | Yes | Yes | Yes | Yes |
| Wholesale Listings / Auctions | Yes | Yes (Live Auctions) | — | Yes (All Auctions) |
| My Inventory | — | Yes | — | — |
| My Group | — | Yes | — | — |
| Available Rooms | — | — | Yes | — |
| My Bookings | — | — | Yes | — |
| Storefront | — | — | Yes | — |
| Guest Check-In | Yes | — | — | — |
| Wallet | Yes | Yes | Yes | — |
| Compliance | Yes | Yes | Yes | — |
| Users | — | — | — | Yes |
| Reports | — | — | — | Yes |
| Escrow Ledger | — | — | — | Yes |
| Disputes | — | — | — | Yes |
| Offer Audit | — | — | — | Yes |
| Verification Queue | — | — | — | Yes |
| Transactions | Yes | Yes | Yes | Yes |

### Public Pages (No Login Required)

| Page | URL | Purpose |
|------|-----|---------|
| Agent Storefront | `/s/:slug` | Pilgrims browse rooms and book directly |
| Booking Status | `/booking-status` | Pilgrims check booking and visa status |
