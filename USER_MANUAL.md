# PHX Exchange - User Manual

**PHX Exchange: The Liquidity Layer for Hajj & Umrah**

---

## Table of Contents

1. [General Overview](#general-overview)
2. [Getting Started](#getting-started)
3. [Hotel User Guide](#hotel-user-guide)
4. [Broker User Guide](#broker-user-guide)
5. [Agent User Guide](#agent-user-guide)
6. [Admin User Guide](#admin-user-guide)
7. [Key Concepts](#key-concepts)
8. [Demo Accounts](#demo-accounts-for-testing)

---

## General Overview

**PHX Exchange** is a business-to-business (B2B) marketplace designed for trading hotel room blocks for **Hajj and Umrah** pilgrimages. The platform connects hotels, brokers, and travel agents in a secure, transparent environment with built-in Saudi regulatory compliance.

### The Four Roles

| Role | Description |
|------|-------------|
| **Hotel** | Lists room blocks for wholesale auction to brokers |
| **Broker** | Bids on hotel room blocks, wins inventory, and resells to agents |
| **Agent** | Books rooms for pilgrims, registers travelers, and generates vouchers |
| **Admin** | Oversees the entire platform, manages users, and controls escrow funds |

### How the Platform Works

1. **Hotel lists rooms** — A hotel creates an auction for a block of rooms (e.g., 50 Double rooms at a floor price of $150/night).
2. **Broker bids and wins** — Brokers browse live auctions and place competitive bids. The highest bidder wins the room block when the auction closes.
3. **Broker marks up and lists** — The winning broker adds a markup to the rooms and lists them on the marketplace for agents to purchase.
4. **Agent books for pilgrims** — Travel agents browse available rooms, book them for their pilgrim groups, register each traveler, and download official vouchers.

All payments flow through a secure **escrow system** that protects every party in the transaction.

---

## Getting Started

### How to Register

1. Go to the PHX Exchange login page.
2. On the left side, you will see **role selection cards** — Hotel, Broker, or Agent.
3. Click the card that matches your business type.
4. Fill in the registration form:
   - **Business Name** — Your company or hotel name
   - **Email** — Your business email address
   - **Password** — Choose a secure password
5. Click **Register** to create your account.

### How to Login

1. Go to the PHX Exchange login page.
2. On the right side, enter your **email** and **password** in the login form.
3. Click **Login**.
4. You will be taken to your role-specific **Dashboard**.

### Compliance Verification

**All roles** (Hotel, Broker, and Agent) must submit compliance documents before accessing key platform features.

- Until your account is **verified** by an Admin, you will see a verification notice on restricted pages.
- Hotels cannot create auctions, Brokers cannot bid on auctions, and Agents cannot access the marketplace or make bookings until verified.
- Navigate to **Compliance Profile** in the sidebar to submit your documents.
- After submission, an Admin will review your documents and either **approve** or **reject** your application (with a reason provided if rejected).

### Language Switching

PHX Exchange supports **four languages**:

- **English** (default)
- **Arabic** (right-to-left layout)
- **Urdu** (right-to-left layout)
- **Farsi / Persian** (right-to-left layout)

To switch languages, click the **language toggle** button in the top header bar. Your language preference is saved automatically.

---

## Hotel User Guide

*Tagline: "Maximize Your Yield"*

### Submitting Compliance Documents

1. Click **Compliance Profile** in the sidebar.
2. Fill in the required fields:
   - **CR Number** — Your Commercial Registration number (10 digits)
   - **CR Copy** — Upload a copy of your Commercial Registration
   - **CR Expiry Date** — Must be a future date
   - **VAT Number** — Your tax registration number
   - **National Address** — Your registered business address (8 characters minimum)
   - **MoT License** — Upload your Ministry of Tourism license
   - **Civil Defense Certificate** — Upload your Civil Defense safety certificate
   - **Civil Defense Expiry Date** — Must be a future date
   - **Nusuk ID** — Your Nusuk platform identifier
3. Fill in your **bank details**:
   - **Bank Name**
   - **IBAN** — Must start with "SA" followed by 22 digits
   - **Swift/BIC Code**
   - **Beneficiary Name**
4. Check the **terms and conditions** agreement box.
5. Click **Save** to submit your compliance profile.
6. Wait for Admin approval. You will see your verification status on the Compliance Profile page.

### Creating an Auction

1. Click **Wholesale Listings** in the sidebar.
2. Click the **New Listing** button (gold button, top of page).
3. Fill in the auction details:
   - **Room Type** — Select from Quad, Triple, Double, Single, or Suite
   - **Distance to Haram** — Enter the distance in meters (e.g., 200)
   - **Number of Rooms** — How many rooms in this block (e.g., 50)
   - **Floor Price** — The minimum bid amount per room in SAR (e.g., 150.00)
   - **Listing End Time** — When bidding closes (date and time picker)
4. Click **Create Listing** to publish your auction.
5. Your auction is now **live** and visible to verified brokers.

### Monitoring Live Bids

- On the **Wholesale Listings** page, each auction card shows:
  - A **live countdown timer** showing time remaining
  - The **number of bids** received
  - The **highest bid** amount (highlighted in gold)
- Bids update in **real-time** via live connection — no need to refresh the page.
- When less than 60 seconds remain, the timer turns red and pulses to indicate urgency.

### Closing and Settling an Auction

1. Go to **Wholesale Listings** in the sidebar.
2. Find your active auction.
3. Click the **Close Listing** button.
4. The system automatically settles the auction:
   - The highest bidder wins the room block
   - The room inventory is transferred to the winning broker's account
   - A 7-day **release deadline** begins for the broker to list the rooms

### Assigning BRN Codes

**BRN (Booking Reference Number)** is a requirement from the Saudi Ministry. Hotels must assign a BRN code to every won room block. **Agents cannot download vouchers until a BRN is assigned.**

1. Go to **Wholesale Listings** in the sidebar.
2. Find an auction that has **ended** (status shows "ENDED").
3. Below the auction card, you will see a **BRN input field**.
4. Enter the **Ministry BRN Code** provided by the Saudi authorities.
5. Click the **Set BRN** button.
6. Once set, the BRN appears as a green badge on the auction card.
7. Agents can now download PDF vouchers for bookings associated with this block.

### Managing Hotel Profile

1. Click **Hotel Profile** in the sidebar.
2. Update your hotel information:
   - **Hotel Image** — Upload a photo of your property (shown to agents on the marketplace)
   - **GPS Coordinates** — Set your hotel's latitude and longitude (displayed on an interactive map)
   - **Distance from Haram** — Enter the walking distance in meters
3. Click **Save** to update your profile.
4. Your hotel image and location details appear on marketplace listings for agents.

### Guest Check-in Verification

When pilgrims arrive at your hotel, you must verify their check-in to release escrow funds.

1. Click **Guest Check-in** in the sidebar.
2. You will see a table of all bookings assigned to your hotel.
3. Each row shows:
   - **Booking ID**
   - **Agent name**
   - **Room type and count**
   - **Total price**
   - **Escrow status**
4. For bookings with escrow status **MILESTONE_1_PAID**, click the **Verify Check-in** button.
5. Clicking **Verify Check-in** releases the **80% escrow funds** (minus platform fee) to your hotel wallet.
6. If no check-in is verified, funds are **auto-released after 48 hours**.

### Viewing Transactions

1. Click **Transactions** in the sidebar.
2. View all payment transactions related to your hotel.
3. Each transaction shows the booking ID, amount, status (**HELD**, **RELEASED_TO_HOTEL**, or **REFUNDED_TO_AGENT**), and date.

---

## Broker User Guide

*Tagline: "Trade with Speed"*

### Submitting Compliance Documents

1. Click **Compliance Profile** in the sidebar.
2. Fill in the required fields:
   - **CR Number** — Your Commercial Registration number (10 digits)
   - **CR Copy** — Upload a copy of your Commercial Registration
   - **CR Expiry Date** — Must be a future date
   - **VAT Number** — Your tax registration number
   - **National Address** — Your registered business address (8 characters minimum)
   - **MoHU License** — Upload your Ministry of Hajj and Umrah license
   - **Bank Guarantee** — Upload your bank guarantee document
   - **IATA Number** — Your International Air Transport Association number
3. Fill in your **bank details**:
   - **Bank Name**
   - **IBAN** — Must start with "SA" followed by 22 digits
   - **Swift/BIC Code**
   - **Beneficiary Name**
4. Check the **terms and conditions** agreement box.
5. Click **Save** to submit.
6. Wait for Admin approval before you can bid on auctions.

### Browsing Live Auctions and Placing Bids

1. Click **Live Auctions** in the sidebar.
2. Browse available auctions. Each card shows:
   - **Room type** (Single, Double, Triple, Quad, Suite)
   - **Distance to Haram** in meters
   - **Number of rooms** in the block
   - **Floor price** (minimum bid)
   - **Live countdown timer**
   - **Current highest bid** and number of bids
3. To place a bid, click the **Place Bid** button (gold button) on an active auction.
4. Enter your **bid amount** — must be higher than the current highest bid (or the floor price if no bids exist).
5. Click **Confirm Bid** to submit.
6. Your bid is processed instantly. If outbid, you can bid again.
7. The system includes **anti-sniping protection** — last-second bids may extend the auction.

### Managing Won Inventory

After winning an auction, the room block appears in your inventory.

1. Click **My Inventory** in the sidebar.
2. Each inventory card shows:
   - **Room type** and hotel name
   - **Winning price** per room
   - **Available rooms** remaining
   - **Current markup** and agent price
   - **Release deadline countdown** (7 days to list/sell)

#### Setting Your Markup

1. Click the **Markup** button on an inventory card.
2. Choose your **markup type**:
   - **Fixed Amount** — Add a flat dollar amount per room (e.g., +$25.00)
   - **Percentage** — Add a percentage on top of your winning price (e.g., +10%)
3. A **price preview** shows the calculated agent price.
4. Click **Save Markup** to apply.

#### Listing Your Inventory

- Toggle the **Listed** switch to **ON** to make rooms available on the marketplace.
- Toggle it **OFF** to hide rooms from agents.

### Visibility Settings

Control who can see your listed rooms using the **visibility dropdown** on each inventory card:

| Setting | How It Works |
|---------|-------------|
| **PUBLIC** | Rooms appear on the marketplace for **all verified agents**. Simply set your markup and toggle Listed ON. |
| **PRIVATE (Group Only)** | Only agents in your **Broker Group** can see the rooms. Other agents will not see them on the marketplace. |
| **DIRECT** | Send a **private offer** to a specific agent with custom pricing. The **Send Offer** button only appears when this mode is selected. |

### Managing Your Agent Group

Your **Broker Group** is a list of agents you have a business relationship with. Agents in your group can see your PRIVATE listings.

1. Click **My Group** in the sidebar.
2. To **add an agent**: Search for the agent and click the add button.
3. To **remove an agent**: Click the remove button next to their name.
4. Agents in your group can see rooms you set to **PRIVATE** visibility.

### Sending Direct Offers to Agents

1. Go to **My Inventory** in the sidebar.
2. Set the visibility of a room block to **DIRECT**.
3. Click the **Send Offer** button that appears.
4. In the dialog:
   - **Select an Agent** from your Broker Group
   - **Set the price per room** (can be different from your standard markup)
   - **Choose the number of rooms** to offer
5. Review the total at the bottom.
6. Click **Send Offer**.
7. The agent will see the offer on their marketplace page and can **accept** or **decline** it.

### Viewing Transactions and Wallet Balance

1. Click **Transactions** in the sidebar to view all payment records.
2. Your **wallet balance** reflects the 20% instant commission from each booking.
3. Each transaction shows the status, amount, and associated booking.

---

## Agent User Guide

*Tagline: "Book with Certainty"*

### Submitting Compliance Documents

1. Click **Compliance Profile** in the sidebar.
2. Fill in the required fields:
   - **CR Number** — Your Commercial Registration number (10 digits)
   - **CR Copy** — Upload a copy of your Commercial Registration
   - **CR Expiry Date** — Must be a future date
   - **VAT Number** — Your tax registration number
   - **National Address** — Your registered business address (8 characters minimum)
   - **Tourism License** — Your tourism license number
   - **Tourism License File** — Upload a copy
   - **Tourism License Expiry** — Must be a future date
   - **Nusuk ID** — Your Nusuk platform identifier
   - **VAT Certificate** — Upload your VAT registration certificate
   - **Signatory ID** — Upload the authorized signatory identification document
   - **Articles of Association** — Upload your company's articles of association
3. Fill in your **bank details**:
   - **Bank Name**
   - **IBAN** — Must start with "SA" followed by 22 digits
   - **Swift/BIC Code**
   - **Beneficiary Name**
4. Check the **terms and conditions** agreement box.
5. Click **Save** to submit.
6. Wait for Admin approval before accessing the marketplace and making bookings.

### Browsing the Marketplace

1. Click **Available Rooms** in the sidebar.
2. The marketplace shows two sections:
   - **Direct Offers** (top) — Private offers sent to you by brokers, shown with a gold icon
   - **Marketplace** (below) — All publicly listed rooms available for booking
3. Each room listing card shows:
   - **Room type** and hotel name (with verified badge if applicable)
   - **Hotel image** (click to view hotel details, map, and distance from Haram)
   - **Distance to Haram** in meters
   - **Available rooms** count
   - **Price per room** (excluding VAT)
   - **VAT amount** (15%) and total price including VAT
   - **BRN status** — If BRN is not yet assigned, a warning appears in amber

### Accepting or Declining Direct Offers

When a broker sends you a direct offer:

1. The offer appears at the top of the **Available Rooms** page under **Direct Offers**.
2. Each offer card shows:
   - The **broker's name** who sent the offer
   - **Room type**, distance, and hotel name
   - **Price per room** and total price
3. Click **Accept** (gold button) to accept the offer — a booking is created automatically.
4. Click **Decline** to reject the offer.
5. Past offers (accepted or declined) appear at the bottom under **Past Offers**.

### Booking Rooms

1. On the marketplace, find the rooms you want.
2. Click the **Book Now** button on a listing card.
3. In the booking dialog:
   - Enter the **number of rooms** you want (up to the available quantity)
   - Review the price breakdown: subtotal, VAT (15%), and total with VAT
4. Click **Book X Room(s)** to confirm.
5. The booking appears on your **My Bookings** page.

### Registering Pilgrims

After booking rooms, you must register the pilgrims who will stay in them.

#### Manual Entry

1. Go to **My Bookings** in the sidebar.
2. Find your booking and click **Add Pilgrim**.
3. Fill in the pilgrim details:
   - **Full Name** (required)
   - **Passport Number** (required)
   - **Nationality** (required — select from country list)
   - **Date of Birth**
   - **Gender** — Male or Female (required)
   - **Visa Number**
   - **Vaccination Status** — Yes or No
4. Click **Register Pilgrim** to save.
5. The progress bar on the booking card shows how many pilgrims are registered versus the total capacity.

#### CSV Bulk Upload

1. On your booking, click **Manage Guests**.
2. Click **Upload CSV** and select your CSV file.
3. The CSV must include these columns: `fullName`, `passportNo`, `nationality`, `gender`
4. Optional columns: `dateOfBirth`, `visaNumber`, `vaccinationStatus`
5. The system validates the data and shows any errors or warnings.
6. Review the parsed data, then click **Upload** to register all pilgrims at once.

### Downloading PDF Vouchers

1. Go to **My Bookings** in the sidebar.
2. Find a booking that has registered pilgrims.
3. Click the **Download Voucher** button.
4. A PDF voucher is generated and downloaded to your device.
5. **Note:** The hotel must assign a **BRN code** before vouchers can be downloaded. If the BRN is not yet assigned, you will see an error message.

### Downloading Tax Invoices

1. Go to **My Bookings** in the sidebar.
2. Click the **Tax Invoice** button on a booking.
3. A ZATCA-compliant tax invoice is generated with:
   - Sequential invoice number (format: PHX-YYYY-XXXX)
   - Seller and buyer VAT details
   - Line items with 15% VAT breakdown
   - QR code with encoded seller and VAT data
4. If viewing in a non-SAR currency, the invoice shows the official SAR totals at the bottom.

### Multi-Currency Display

PHX Exchange displays prices in **Saudi Riyal (SAR)** by default. You can toggle the display currency using the **currency switcher** in the header:

- **SAR** — Saudi Riyal (base currency)
- **USD** — US Dollar
- **IDR** — Indonesian Rupiah
- **PKR** — Pakistani Rupee

**Note:** All transactions are processed in SAR. Other currencies are shown for reference only.

### Viewing Transactions

1. Click **Transactions** in the sidebar.
2. View all your payment records with status, amount, and booking reference.

---

## Admin User Guide

### Dashboard Overview

1. After logging in, the **Dashboard** shows platform-wide statistics:
   - Total users across all roles
   - Active auctions
   - Total bookings
   - Revenue metrics
2. Stat cards are clickable and link to their respective management pages.

### User Management

1. Click **Users** in the sidebar.
2. View a table of all registered users with their:
   - Business name and email
   - Role (Hotel, Broker, Agent)
   - Verification status
3. **Toggle verification** — Click the verify/unverify button to manually change a user's verification status.
4. **Impersonation** — See the Shadow Mode section below.

### Verification Queue

1. Click **Verification Queue** in the sidebar.
2. At the top, see summary counts: **Pending**, **Verified**, and **Rejected**.
3. Use the **role filter tabs** to view specific roles:
   - **All** — Shows Hotels, Brokers, and Agents together
   - **Hotels** — Only hotel accounts
   - **Brokers** — Only broker accounts
   - **Agents** — Only agent accounts
4. Click **Review** on any user to open the detailed review dialog.
5. The review dialog shows a **side-by-side layout**:
   - **Left panel** — User information (CR Number, VAT Number, role-specific fields, bank details)
   - **Right panel** — Uploaded documents (with clickable links to view each file) and a verification checklist
6. To **approve**: Check all items in the verification checklist, then click **Approve**.
7. To **reject**: Click **Reject**, enter a **rejection reason** (required), and confirm. The reason is shown to the user on their Compliance Profile page.

### Escrow Ledger

1. Click **Escrow Ledger** in the sidebar.
2. View all escrow records across the platform.
3. Each record shows:
   - Booking ID
   - Amount held
   - Escrow status (MILESTONE_1_PAID, SETTLED, AUTO_RELEASED, FROZEN)
   - Event history
4. **Freeze escrow** — Click the freeze button on any active escrow to prevent fund release (e.g., in case of a dispute).
5. **Unfreeze escrow** — Click unfreeze to resume normal escrow flow.
6. **Platform fee adjustment** — Adjust the platform fee percentage (default is 5%) that is deducted from escrow settlements.

### Transaction Management

1. Click **Transactions** in the sidebar.
2. View all transactions across the platform.
3. To update a transaction status, use the status dropdown to change between:
   - **HELD** — Payment is being held in escrow
   - **RELEASED_TO_HOTEL** — Payment has been released to the hotel
   - **REFUNDED_TO_AGENT** — Payment has been refunded to the agent

### Financial Reports

1. Click **Reports** in the sidebar.
2. View platform-wide financial analytics:
   - Total revenue
   - Platform fees collected
   - Escrow balances
   - Transaction volumes

### Direct Offer Audit Log

1. Click **Offer Audit** in the sidebar.
2. Monitor all direct offers between brokers and agents.
3. View offer details: broker, agent, price, room count, status, and timestamps.
4. Check for **stale offers** — pending offers that have been waiting too long without a response.

### Shadow Mode / Impersonation

Shadow mode allows you to view the platform exactly as any user sees it.

1. Go to **Users** in the sidebar.
2. Find the user you want to impersonate.
3. Click the **Impersonate** button next to their name.
4. The platform switches to show that user's view — their dashboard, auctions, bookings, etc.
5. A banner at the top indicates you are in **Shadow Mode**.
6. To return to your Admin account, click **End Impersonation**.

**Note:** Shadow mode is read-only for observation. Use it to troubleshoot user issues or verify the user experience.

---

## Key Concepts

### Escrow 80/20 Rule

PHX Exchange uses a secure escrow system to protect all parties:

- When an agent **books rooms**, the payment is split:
  - **20%** goes **instantly** to the broker's wallet as commission
  - **80%** is **held in escrow** by PHX Exchange
- When the hotel **verifies guest check-in**, the 80% escrow is released:
  - The **platform fee** (default 5%) is deducted
  - The remaining amount goes to the **hotel's wallet**
- If no check-in is verified within **48 hours** after the scheduled checkout, the escrow is **auto-released** to the hotel.

### ZATCA VAT

All bookings on PHX Exchange include **15% VAT** as required by the Saudi **Zakat, Tax and Customs Authority (ZATCA)**.

- VAT is automatically calculated on every booking.
- Prices are shown both excluding and including VAT.
- Tax invoices include VAT breakdowns and QR codes for compliance.

### Ministry BRN

**BRN (Booking Reference Number)** is a code required by the Saudi Ministry for all hotel room blocks.

- Hotels must assign a BRN code to every won auction block.
- Without a BRN, agents **cannot download PDF vouchers** for their bookings.
- BRN codes are entered on the **Wholesale Listings** page after an auction ends.

### Release Deadline

Brokers have a **7-day window** to list and sell their won inventory.

- The countdown begins when the broker wins an auction.
- If the broker does not list or sell the rooms within 7 days, the inventory **automatically reverts** back to the hotel.
- A countdown timer is displayed on each inventory card.
- When less than 2 days remain, the timer turns amber as a warning.

### License Expiry

The system runs a **daily check** on all compliance documents.

- If a user's CR, license, or Civil Defense certificate has **expired**, their account is **automatically suspended**.
- Suspended users cannot access platform features until they update their expired documents and are re-verified by an Admin.
- Admins can see suspended users marked with a red "Suspended" badge in the Verification Queue.

---

## Demo Accounts (for testing)

Use these pre-configured accounts to explore the platform:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@phxcore.com | admin123 |
| Hotel | almadinah@hotel.com | hotel123 |
| Broker | summit@broker.com | broker123 |
| Agent | alnoor@agent.com | agent123 |

---

*PHX Exchange — The Liquidity Layer for Hajj & Umrah*
