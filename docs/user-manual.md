# PHX Exchange — User Manual

## Table of Contents

1. [Getting Started](#getting-started)
2. [Platform Overview](#platform-overview)
3. [Shared Features](#shared-features)
4. [Admin Guide](#admin-guide)
5. [Hotel Guide](#hotel-guide)
6. [Broker Guide](#broker-guide)
7. [Agent Guide](#agent-guide)
8. [Public Pilgrim Guide](#public-pilgrim-guide)
9. [Glossary](#glossary)

---

## Getting Started

### Creating an Account

1. Open the PHX Exchange login page.
2. Click the **Register** tab.
3. Fill in your business email, password, and business name.
4. Select your role: **Hotel**, **Broker**, or **Agent**.
5. Click **Register** to create your account.

### Logging In

1. Enter your email and password on the login page.
2. Click **Login** to access your dashboard.

### Verification Process

After registering, you must submit compliance documents before accessing gated features:

1. Navigate to the **Compliance** page from the sidebar.
2. Upload the required documents for your role (CR copy, tourism license, VAT certificate, etc.).
3. Submit for review. An Admin will approve or reject your submission.
4. Once verified, a green "Verified" badge appears on your profile and all features become available.

---

## Platform Overview

PHX Exchange is a B2B marketplace for Hajj and Umrah hotel accommodations. It connects four types of users:

- **Hotels** list room blocks for auction.
- **Brokers** bid on auctions and resell inventory to agents.
- **Agents** book rooms for pilgrims and manage a public storefront.
- **Admins** oversee the entire platform, manage users, and handle disputes.

All financial transactions use Saudi Riyals (SAR) as the base currency. Prices can be displayed in SAR, USD, IDR, or PKR using the currency toggle.

---

## Shared Features

### Language Selection

Click the language icon in the top header to switch between:
- English
- Arabic (right-to-left)
- Urdu (right-to-left)
- Farsi/Persian (right-to-left)

### Currency Display

Click the dollar sign icon in the top header to switch the display currency:
- SAR (Saudi Riyal) — base currency
- USD (US Dollar)
- IDR (Indonesian Rupiah)
- PKR (Pakistani Rupee)

All prices are stored in SAR. Currency conversion is for display purposes only.

### Light/Dark Theme

Click the sun/moon icon in the top header to toggle between light and dark mode. Your preference is saved automatically.

### Sidebar Navigation

Use the sidebar on the left to navigate between pages. Click the menu icon at the top to collapse or expand the sidebar.

---

## Admin Guide

### Dashboard

The Admin dashboard provides a high-level overview of platform activity:
- Total users, auctions, bookings, and revenue
- Recent activity feed

### User Management

1. Navigate to **Users** from the sidebar.
2. View all registered users across all roles.
3. Click on a user to see their profile details and verification status.

### Verification Queue

1. Navigate to **Verification** from the sidebar.
2. Review pending verification submissions from Hotels, Brokers, and Agents.
3. Click **Approve** to verify a user or **Reject** with a reason to deny access.
4. Verified users can access all role-specific features. Rejected users are notified with the rejection reason.

### Escrow Management

1. Navigate to **Escrow** from the sidebar.
2. View all active escrow records across the platform.
3. **Freeze** escrow to hold funds during a dispute investigation.
4. **Unfreeze** escrow to resume normal payout processing.
5. Set the platform fee percentage that is deducted from transactions.

### Financial Reports

1. Navigate to **Reports** from the sidebar.
2. View platform-wide financial summaries: total revenue, transaction volumes, escrow balances.
3. Data updates in real-time as transactions occur.

### Dispute Resolution

1. Navigate to **Disputes** from the sidebar.
2. Review disputes filed by agents. Each dispute shows the booking details, agent, and escrow amount.
3. Decide the outcome:
   - **Release to Hotel** — releases the escrowed funds to the hotel.
   - **Refund to Agent** — returns the funds to the agent's wallet.
4. The dispute status updates and the escrow is processed accordingly.

### Payout Approvals

1. Navigate to **Wallet** or **Transactions** from the sidebar.
2. Review payout requests submitted by Brokers and Agents.
3. Approve or reject each request. Approved payouts are logged in the wallet ledger.

---

## Hotel Guide

### Dashboard

The Hotel dashboard shows:
- Total room blocks listed
- Active auctions and their current status
- Recent bidding activity

### Creating an Auction

1. Navigate to **Auctions** from the sidebar.
2. Click **Create Auction**.
3. Fill in the auction details:
   - Room type (e.g., Suite, Standard, Deluxe)
   - Number of rooms in the block
   - Starting price per night
   - Auction duration
4. Click **Submit** to start the auction.
5. The auction goes live immediately and brokers can begin bidding.

### Auction Statuses

- **ACTIVE** — auction is live, brokers can bid
- **ENDED** — auction closed with a winning bid
- **EXPIRED** — auction closed with zero bids, rooms return to your inventory
- **CANCELLED** — you cancelled the auction before it ended

### Anti-Sniping Protection

If a bid is placed in the final minutes of an auction, the countdown timer automatically extends to prevent last-second sniping.

### Assigning BRN Codes

1. Navigate to your room blocks.
2. Click **Assign BRN** on a room block.
3. Enter the Ministry Business Registration Number.
4. The BRN is recorded and included on booking vouchers.

### Guest Check-In

1. When a pilgrim arrives, navigate to the booking record.
2. Click **Check In** to confirm the guest's arrival.
3. This triggers the release of the 80% escrow held for that booking.

---

## Broker Guide

### Dashboard

The Broker dashboard shows:
- Active auctions available for bidding
- Won inventory summary
- Wallet balance and recent transactions

### Bidding on Auctions

1. Navigate to **Auctions** from the sidebar.
2. Browse active hotel room auctions. Each shows the hotel name, room type, current price, and time remaining.
3. Click on an auction to view details.
4. Enter your bid amount (must be higher than the current price).
5. Click **Place Bid**. Bidding happens in real-time via WebSocket — you'll see other bids appear live.
6. If you win, the room block is added to your inventory.

### Managing Inventory

1. Navigate to **Inventory** from the sidebar.
2. View all room blocks you've won through auctions.
3. For each block, you can:
   - **Set Markup** — add your percentage on top of the base price
   - **List on Marketplace** — make it available for agents to book
4. The 7-day rule applies: if a won block is not listed or sold within 7 days, it automatically reverts to the hotel.

### Direct Offers

1. Navigate to **Agent Groups** from the sidebar.
2. Create agent groups and whitelist specific agents.
3. Navigate to **Direct Offers**.
4. Select a room block and an agent from your whitelist.
5. Set the offer price and send it directly to the agent.

### Wallet and Payouts

1. Navigate to **Wallet** from the sidebar.
2. View your balance breakdown:
   - **Available** — funds ready for withdrawal
   - **Locked** — funds held in escrow (released after hotel check-in)
   - **Total Earned** — lifetime earnings
3. The 80/20 escrow rule: when an agent books through your inventory, 20% is released to you instantly and 80% is held until the hotel confirms check-in.
4. Click **Request Payout** to submit a withdrawal request for admin approval.
5. View your full transaction history in the ledger below.

---

## Agent Guide

### Dashboard

The Agent dashboard shows:
- Total bookings made
- Total pilgrims registered
- Available rooms on the marketplace
- Total amount spent

### Browsing the Marketplace

1. Navigate to **Marketplace** from the sidebar.
2. Browse available room blocks listed by brokers.
3. Each listing shows the hotel name, room type, city, price per night, and available rooms.
4. Click **Book** to reserve rooms for your pilgrims.

### Making Bookings

1. Select a room block from the marketplace.
2. Enter the number of rooms needed.
3. Fill in pilgrim details: full name, passport number, Nusuk ID, citizenship, date of birth, and passport expiry.
4. Review the price breakdown (base price + markup + 15% VAT).
5. Confirm the booking. A booking reference (PHX-2026-XXXXX) is generated automatically.

### Managing Your Storefront

The storefront is your public-facing booking page where pilgrims can book rooms directly.

1. Navigate to **Storefront** from the sidebar.
2. If you haven't created a storefront yet, click **Create Storefront**.
3. Configure your storefront settings:
   - **Agency Name** — displayed on the public page
   - **URL Slug** — the custom path for your storefront (e.g., `/s/your-agency`)
   - **Description** — a short description of your agency
   - **Markup Percentage** — the markup you add on top of room prices
   - **Active/Inactive** — toggle your storefront on or off
4. Click **Update Settings** to save changes.
5. Share your **Public URL** with pilgrims so they can book directly.

### Pilgrim Bookings

1. On the Storefront page, scroll down to view all pilgrim bookings.
2. Each booking shows: booking reference, pilgrim name, passport, Nusuk ID, room count, price, and status.
3. Group bookings are shown together with the group leader's contact information.

### Nusuk Sync

Nusuk sync submits pilgrim booking data to the Saudi government's Nusuk Masar system.

1. On the Storefront page, find a booking that has not been synced (no green "Synced" badge).
2. Click **Sync to Nusuk Masar** on an individual booking to preview the data payload and submit.
3. Or click **Sync Entire Group** to sync all bookings in a group at once.
4. The system validates each pilgrim's data before submission:
   - Passport expiry must be after December 20, 2026
   - Nusuk ID must be exactly 10 digits
   - Names are automatically sanitized to uppercase Latin characters
5. Once synced, a green "Synced" badge appears on the booking.

### Ministry Approval (Simulation)

1. After a booking is synced to Nusuk, a **Simulate Ministry Approval** button appears.
2. Click it to generate a mock visa number (V-2026-XXXXX format).
3. Once approved, the visa status changes to "ISSUED" and a green visa number badge replaces the button.

### Tax Invoices

1. Navigate to **Bookings** from the sidebar.
2. Find a booking and click **Download Tax Invoice**.
3. The PDF includes:
   - Seller and buyer compliance profiles
   - Line items with prices, VAT breakdown (15%)
   - ZATCA-compliant QR code with TLV-encoded data

### Filing a Dispute

1. Navigate to **Bookings** from the sidebar.
2. Find the booking you want to dispute and click **File Dispute**.
3. The escrow for that booking is immediately frozen.
4. An Admin will review the dispute and either release funds to the hotel or refund you.

---

## Public Pilgrim Guide

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

1. Go to the **Booking Status** page.
2. Enter your:
   - Accommodation Voucher ID (PHX-2026-XXXXX)
   - Passport number
3. Click **Look Up**.
4. You'll see:
   - Your name (partially masked for privacy)
   - Hotel and room information
   - Visa status and visa number (if issued)
   - No financial data is shown for security

---

## Glossary

| Term | Definition |
|------|-----------|
| **Auction** | A time-limited sale where hotels list room blocks and brokers compete by placing bids. |
| **BRN** | Business Registration Number — a Saudi ministry code assigned to hotel room blocks. |
| **Escrow** | A holding mechanism for funds. 80% of a booking payment is held in escrow until the hotel confirms guest check-in. |
| **80/20 Rule** | When a booking is made, 20% goes to the broker immediately and 80% is held in escrow. |
| **7-Day Clawback** | If a broker doesn't list or sell a won room block within 7 days, it automatically reverts to the hotel. |
| **Markup** | The percentage a broker or agent adds on top of the base room price. |
| **Nusuk ID** | A 10-digit identification number issued by the Saudi Nusuk system for pilgrims. |
| **Nusuk Masar** | The Saudi government system for managing pilgrim accommodation and visa records. |
| **Storefront** | An agent's public-facing booking page where pilgrims can reserve rooms without logging in. |
| **VAT** | Value Added Tax at 15%, applied to all bookings per Saudi ZATCA regulations. |
| **ZATCA** | Saudi Arabian Tax Authority — governs VAT calculation and electronic invoicing requirements. |
| **Voucher ID** | A unique booking reference (PHX-2026-XXXXX) used to track and look up pilgrim bookings. |
| **Anti-Sniping** | Automatic auction time extension when a bid is placed near the end, preventing last-second bidding tactics. |
| **Wallet Ledger** | A detailed record of all financial transactions in a user's wallet. |
| **Dispute** | A formal complaint filed by an agent that freezes the associated escrow until an admin resolves it. |
| **Slug** | The custom URL path for an agent's public storefront (e.g., "al-noor-travel" in `/s/al-noor-travel`). |
