# PHX Exchange - Comprehensive Test Document

## Demo Account Credentials

| Role   | Email                 | Password   |
|--------|-----------------------|------------|
| Admin  | admin@phxcore.com     | admin123   |
| Hotel  | almadinah@hotel.com   | hotel123   |
| Broker | summit@broker.com     | broker123  |
| Agent  | alnoor@agent.com      | agent123   |

---

## 1. Authentication

### TC-AUTH-001: Register as Admin
- **Feature**: User Registration
- **Description**: Register a new admin account
- **Preconditions**: No existing account with the test email
- **Steps**:
  1. Navigate to `/auth`
  2. Select the "Admin" role card
  3. Fill in username, email, password
  4. Click Register
- **Expected Result**: Account created, user redirected to admin dashboard

### TC-AUTH-002: Register as Hotel
- **Feature**: User Registration
- **Description**: Register a new hotel account
- **Preconditions**: No existing account with the test email
- **Steps**:
  1. Navigate to `/auth`
  2. Select the "Hotel" role card
  3. Fill in company name, email, password
  4. Click Register
- **Expected Result**: Account created with verificationStatus = PENDING, user redirected to hotel dashboard

### TC-AUTH-003: Register as Broker
- **Feature**: User Registration
- **Description**: Register a new broker account
- **Preconditions**: No existing account with the test email
- **Steps**:
  1. Navigate to `/auth`
  2. Select the "Broker" role card
  3. Fill in company name, email, password
  4. Click Register
- **Expected Result**: Account created with verificationStatus = PENDING, user redirected to broker dashboard

### TC-AUTH-004: Register as Agent
- **Feature**: User Registration
- **Description**: Register a new agent account
- **Preconditions**: No existing account with the test email
- **Steps**:
  1. Navigate to `/auth`
  2. Select the "Agent" role card
  3. Fill in company name, email, password
  4. Click Register
- **Expected Result**: Account created with verificationStatus = PENDING, user redirected to agent dashboard

### TC-AUTH-005: Login with valid credentials
- **Feature**: User Login
- **Description**: Login using valid demo credentials
- **Preconditions**: Demo accounts seeded in database
- **Steps**:
  1. Navigate to `/auth`
  2. Enter email and password for any demo account
  3. Click Login
- **Expected Result**: User authenticated, redirected to role-specific dashboard

### TC-AUTH-006: Login with invalid credentials
- **Feature**: User Login
- **Description**: Attempt login with incorrect password
- **Preconditions**: None
- **Steps**:
  1. Navigate to `/auth`
  2. Enter valid email but wrong password
  3. Click Login
- **Expected Result**: Error toast displayed, user stays on auth page

### TC-AUTH-007: Logout
- **Feature**: User Logout
- **Description**: Log out of current session
- **Preconditions**: User is logged in
- **Steps**:
  1. Click the logout button in sidebar or header
  2. Confirm logout
- **Expected Result**: Session destroyed, user redirected to `/auth`

### TC-AUTH-008: Session persistence
- **Feature**: Session Persistence
- **Description**: Verify session survives page refresh
- **Preconditions**: User is logged in
- **Steps**:
  1. Log in with any demo account
  2. Refresh the browser page (F5)
  3. Observe dashboard loads without re-authentication
- **Expected Result**: User remains authenticated, dashboard loads correctly via `GET /api/auth/me`

---

## 2. Dashboard

### TC-DASH-001: Admin dashboard stats
- **Feature**: Admin Dashboard
- **Description**: Verify admin sees platform-wide statistics
- **Preconditions**: Logged in as Admin
- **Steps**:
  1. Navigate to `/dashboard`
  2. Observe stat cards and activity section
- **Expected Result**: Dashboard shows total users, active auctions, total bookings, revenue metrics with color-coded stat cards and gradient hero banner

### TC-DASH-002: Hotel dashboard stats
- **Feature**: Hotel Dashboard
- **Description**: Verify hotel sees their auction and booking stats
- **Preconditions**: Logged in as Hotel
- **Steps**:
  1. Navigate to `/dashboard`
  2. Observe stat cards and recent activity
- **Expected Result**: Dashboard shows hotel-specific stats (active auctions, won blocks, bookings, revenue) with "Maximize Your Yield" tagline

### TC-DASH-003: Broker dashboard stats
- **Feature**: Broker Dashboard
- **Description**: Verify broker sees inventory and trading stats
- **Preconditions**: Logged in as Broker
- **Steps**:
  1. Navigate to `/dashboard`
  2. Observe stat cards and activity feed
- **Expected Result**: Dashboard shows broker-specific stats (won auctions, inventory blocks, active agents, revenue) with "Trade with Speed" tagline

### TC-DASH-004: Agent dashboard stats
- **Feature**: Agent Dashboard
- **Description**: Verify agent sees booking and pilgrim stats
- **Preconditions**: Logged in as Agent
- **Steps**:
  1. Navigate to `/dashboard`
  2. Observe stat cards
- **Expected Result**: Dashboard shows agent-specific stats (bookings, pilgrims registered, available rooms, spending) with "Book with Certainty" tagline

### TC-DASH-005: Clickable dashboard stat cards
- **Feature**: Dashboard Navigation
- **Description**: Verify stat cards navigate to relevant pages
- **Preconditions**: Logged in as any role
- **Steps**:
  1. Navigate to `/dashboard`
  2. Click on a stat card
- **Expected Result**: User is navigated to the relevant page (e.g., clicking bookings card goes to `/bookings`)

---

## 3. Auctions

### TC-AUC-001: Create auction listing as Hotel
- **Feature**: Auction Creation
- **Description**: Hotel creates a new room block auction
- **Preconditions**: Logged in as Hotel, verification status is VERIFIED
- **Steps**:
  1. Navigate to `/auctions`
  2. Click "Create Auction" button
  3. Fill in hotel name, room type, number of rooms, check-in/check-out dates, starting price
  4. Submit the form
- **Expected Result**: Auction created and appears in the auction list with ACTIVE status

### TC-AUC-002: Verification gate blocks unverified Hotel
- **Feature**: Verification Gate
- **Description**: Unverified hotel cannot create auctions
- **Preconditions**: Logged in as Hotel with PENDING verification
- **Steps**:
  1. Navigate to `/auctions`
  2. Observe verification gate message
- **Expected Result**: VerificationGate component blocks access, shows message to complete compliance profile

### TC-AUC-003: Broker places bid on auction
- **Feature**: Auction Bidding
- **Description**: Verified broker places a bid on an active auction
- **Preconditions**: Logged in as verified Broker, active auction exists
- **Steps**:
  1. Navigate to `/auctions`
  2. Find an active auction
  3. Enter bid amount (must exceed current highest bid)
  4. Click "Place Bid"
- **Expected Result**: Bid recorded, auction updates with new highest bid, WebSocket broadcasts update

### TC-AUC-004: Anti-sniping extension
- **Feature**: Anti-Sniping
- **Description**: Bid placed in final minutes extends auction
- **Preconditions**: Active auction within last 2 minutes of closing
- **Steps**:
  1. Wait for auction to be within 2 minutes of closing
  2. Place a bid as Broker
- **Expected Result**: Auction end time extended by additional minutes to prevent sniping

### TC-AUC-005: Close and settle auction
- **Feature**: Auction Settlement
- **Description**: Hotel closes auction and settles to winning bidder
- **Preconditions**: Logged in as Hotel, auction has bids, auction period has ended
- **Steps**:
  1. Navigate to `/auctions`
  2. Find ended auction with bids
  3. Click "Close & Settle"
- **Expected Result**: Auction status changes to CLOSED, winning broker receives inventory block, escrow records created

### TC-AUC-006: WebSocket live bid updates
- **Feature**: Real-time Updates
- **Description**: Other users see bid updates in real time
- **Preconditions**: Two browser sessions open (Hotel and Broker), active auction
- **Steps**:
  1. Open auction page in both sessions
  2. Place bid from Broker session
- **Expected Result**: Hotel session sees bid update in real time without page refresh

---

## 4. Inventory

### TC-INV-001: View won inventory blocks
- **Feature**: Inventory Management
- **Description**: Broker views their won auction blocks
- **Preconditions**: Logged in as Broker, has won at least one auction
- **Steps**:
  1. Navigate to `/inventory`
  2. Observe inventory list
- **Expected Result**: All won blocks displayed with room details, dates, and pricing

### TC-INV-002: Set fixed markup
- **Feature**: Markup Configuration
- **Description**: Broker sets a fixed SAR markup on inventory
- **Preconditions**: Logged in as Broker, has inventory
- **Steps**:
  1. Navigate to `/inventory`
  2. Select a block
  3. Set markup type to "Fixed"
  4. Enter fixed amount (e.g., 50 SAR)
  5. Save
- **Expected Result**: Block price updated with fixed markup added to base price

### TC-INV-003: Set percentage markup
- **Feature**: Markup Configuration
- **Description**: Broker sets a percentage markup on inventory
- **Preconditions**: Logged in as Broker, has inventory
- **Steps**:
  1. Navigate to `/inventory`
  2. Select a block
  3. Set markup type to "Percentage"
  4. Enter percentage (e.g., 10%)
  5. Save
- **Expected Result**: Block price updated with percentage markup applied to base price

### TC-INV-004: Set visibility to Public
- **Feature**: Visibility Controls
- **Description**: Broker makes inventory publicly visible to all agents
- **Preconditions**: Logged in as Broker, has inventory
- **Steps**:
  1. Navigate to `/inventory`
  2. Select a block
  3. Set visibility to "Public"
  4. Save
- **Expected Result**: Block appears in marketplace for all verified agents

### TC-INV-005: Set visibility to Private
- **Feature**: Visibility Controls
- **Description**: Broker hides inventory from marketplace
- **Preconditions**: Logged in as Broker, has inventory
- **Steps**:
  1. Navigate to `/inventory`
  2. Select a block
  3. Set visibility to "Private"
  4. Save
- **Expected Result**: Block does not appear in marketplace for any agent

### TC-INV-006: Set visibility to Direct (specific agents)
- **Feature**: Visibility Controls
- **Description**: Broker makes inventory visible only to specific agents via direct offer
- **Preconditions**: Logged in as Broker, has inventory and agents in group
- **Steps**:
  1. Navigate to `/inventory`
  2. Select a block
  3. Set visibility to "Direct"
  4. Save
- **Expected Result**: Block visible only to agents who receive a direct offer

### TC-INV-007: Release deadline 7-day countdown
- **Feature**: Release Deadline
- **Description**: Inventory shows 7-day release deadline with countdown
- **Preconditions**: Logged in as Broker, has recently won inventory
- **Steps**:
  1. Navigate to `/inventory`
  2. Observe countdown timer on inventory block
- **Expected Result**: Countdown displays remaining time before 7-day auto-release; expired blocks revert automatically

### TC-INV-008: Assign BRN code (Hotel)
- **Feature**: BRN Assignment
- **Description**: Hotel assigns Ministry BRN code to a won block
- **Preconditions**: Logged in as Hotel, auction has been settled
- **Steps**:
  1. Navigate to blocks requiring BRN
  2. Enter BRN code
  3. Save
- **Expected Result**: BRN code saved, required for voucher generation

---

## 5. Marketplace

### TC-MKT-001: Browse listed blocks
- **Feature**: Marketplace Browsing
- **Description**: Verified agent browses available room blocks
- **Preconditions**: Logged in as verified Agent, public inventory exists
- **Steps**:
  1. Navigate to `/marketplace`
  2. Browse available room blocks
- **Expected Result**: Listed blocks displayed with hotel name, room type, dates, price with VAT breakdown

### TC-MKT-002: Verification gate blocks unverified Agent
- **Feature**: Verification Gate
- **Description**: Unverified agent cannot access marketplace
- **Preconditions**: Logged in as Agent with PENDING verification
- **Steps**:
  1. Navigate to `/marketplace`
- **Expected Result**: VerificationGate blocks access, shows compliance submission message

### TC-MKT-003: Book rooms from marketplace
- **Feature**: Room Booking
- **Description**: Agent books rooms from a listed block
- **Preconditions**: Logged in as verified Agent, available inventory in marketplace
- **Steps**:
  1. Navigate to `/marketplace`
  2. Select a room block
  3. Enter number of rooms to book
  4. Confirm booking
- **Expected Result**: Booking created, rooms deducted from available inventory, escrow record created with 80/20 split

### TC-MKT-004: Accept direct offer
- **Feature**: Direct Offers
- **Description**: Agent accepts a direct offer from a broker
- **Preconditions**: Logged in as Agent, pending direct offer exists
- **Steps**:
  1. View received direct offers
  2. Click "Accept" on a pending offer
- **Expected Result**: Offer status changes to ACCEPTED, booking created

### TC-MKT-005: Decline direct offer
- **Feature**: Direct Offers
- **Description**: Agent declines a direct offer from a broker
- **Preconditions**: Logged in as Agent, pending direct offer exists
- **Steps**:
  1. View received direct offers
  2. Click "Decline" on a pending offer
- **Expected Result**: Offer status changes to DECLINED, no booking created

---

## 6. Bookings

### TC-BKG-001: View bookings list
- **Feature**: Booking Management
- **Description**: Agent views their bookings
- **Preconditions**: Logged in as verified Agent, has bookings
- **Steps**:
  1. Navigate to `/bookings`
  2. Observe booking list
- **Expected Result**: All bookings displayed with hotel, dates, rooms, status, price

### TC-BKG-002: Register pilgrim
- **Feature**: Pilgrim Registration
- **Description**: Agent registers a pilgrim for a booking
- **Preconditions**: Logged in as Agent, has an active booking
- **Steps**:
  1. Navigate to `/bookings`
  2. Select a booking
  3. Click "Add Pilgrim"
  4. Fill in pilgrim details (name, passport, DOB, visa number, vaccination status)
  5. Submit
- **Expected Result**: Pilgrim registered and associated with the booking

### TC-BKG-003: CSV bulk upload pilgrims
- **Feature**: Bulk Pilgrim Upload
- **Description**: Agent uploads multiple pilgrims via CSV file
- **Preconditions**: Logged in as Agent, has booking, CSV file with pilgrim data prepared
- **Steps**:
  1. Navigate to `/bookings`
  2. Select a booking
  3. Click "Bulk Upload" or CSV upload button
  4. Select CSV file with pilgrim data
  5. Upload
- **Expected Result**: All pilgrims from CSV parsed and registered to the booking, success count shown

### TC-BKG-004: Download PDF voucher
- **Feature**: PDF Voucher
- **Description**: Agent downloads PDF voucher for a booking
- **Preconditions**: Logged in as Agent, booking exists, BRN code assigned by hotel
- **Steps**:
  1. Navigate to `/bookings`
  2. Select a booking with BRN assigned
  3. Click "Download Voucher"
- **Expected Result**: PDF voucher downloaded with booking details, hotel info, pilgrim list, and BRN code

### TC-BKG-005: Download tax invoice
- **Feature**: Tax Invoice
- **Description**: Agent downloads ZATCA-compliant tax invoice
- **Preconditions**: Logged in as Agent, booking exists
- **Steps**:
  1. Navigate to `/bookings`
  2. Select a booking
  3. Click "Tax Invoice" or navigate to invoice
- **Expected Result**: Tax invoice generated with sequential PHX-YYYY-XXXX number, VAT 15% breakdown, QR code with seller/VAT data

### TC-BKG-006: Voucher requires BRN
- **Feature**: BRN Requirement
- **Description**: Voucher download blocked when BRN not assigned
- **Preconditions**: Logged in as Agent, booking exists without BRN
- **Steps**:
  1. Navigate to `/bookings`
  2. Attempt to download voucher for booking without BRN
- **Expected Result**: Error or disabled button indicating BRN assignment required

---

## 7. Broker Group

### TC-BGP-001: Add agent to group
- **Feature**: Agent Group Management
- **Description**: Broker adds an agent to their group
- **Preconditions**: Logged in as Broker, agent account exists
- **Steps**:
  1. Navigate to `/broker/group`
  2. Search for agent in directory
  3. Click "Add" to add agent to group
- **Expected Result**: Agent added to broker's group, appears in group list

### TC-BGP-002: Remove agent from group
- **Feature**: Agent Group Management
- **Description**: Broker removes an agent from their group
- **Preconditions**: Logged in as Broker, agent is in broker's group
- **Steps**:
  1. Navigate to `/broker/group`
  2. Find agent in group list
  3. Click "Remove"
- **Expected Result**: Agent removed from group, no longer receives direct offers

### TC-BGP-003: Search agent directory
- **Feature**: Agent Directory
- **Description**: Broker searches for agents to add to group
- **Preconditions**: Logged in as Broker, agent accounts exist
- **Steps**:
  1. Navigate to `/broker/group`
  2. Use search field to find agents by name or company
- **Expected Result**: Matching agents displayed in search results

### TC-BGP-004: Send direct offer to agent
- **Feature**: Direct Offers
- **Description**: Broker sends a direct offer to a grouped agent
- **Preconditions**: Logged in as Broker, agent in group, inventory available
- **Steps**:
  1. Navigate to direct offer creation
  2. Select agent from group
  3. Select inventory block
  4. Set price and submit offer
- **Expected Result**: Direct offer created with PENDING status, agent can view in their offers

---

## 8. Hotel Profile

### TC-HPR-001: Set hotel image URL
- **Feature**: Hotel Profile
- **Description**: Hotel sets their property image
- **Preconditions**: Logged in as Hotel
- **Steps**:
  1. Navigate to `/hotel/profile`
  2. Enter image URL
  3. Save profile
- **Expected Result**: Hotel image URL saved and displayed on profile

### TC-HPR-002: Set GPS coordinates
- **Feature**: Hotel Location
- **Description**: Hotel sets latitude and longitude
- **Preconditions**: Logged in as Hotel
- **Steps**:
  1. Navigate to `/hotel/profile`
  2. Enter latitude and longitude values
  3. Save profile
- **Expected Result**: GPS coordinates saved, Leaflet map updates to show hotel location

### TC-HPR-003: Distance from Haram calculation
- **Feature**: Distance Display
- **Description**: Hotel profile shows distance from Masjid al-Haram
- **Preconditions**: Hotel has GPS coordinates set
- **Steps**:
  1. Navigate to `/hotel/profile`
  2. Observe distance display
- **Expected Result**: Distance from Haram calculated and displayed based on GPS coordinates

### TC-HPR-004: Leaflet map display
- **Feature**: Map Integration
- **Description**: Hotel location shown on interactive map
- **Preconditions**: Hotel has GPS coordinates set
- **Steps**:
  1. Navigate to `/hotel/profile`
  2. Observe the Leaflet map
- **Expected Result**: Map renders with marker at hotel's GPS coordinates, interactive zoom/pan

---

## 9. Hotel Check-in

### TC-CHK-001: Guest verification check-in
- **Feature**: Guest Check-in
- **Description**: Hotel verifies guest arrival
- **Preconditions**: Logged in as Hotel, booking exists with registered pilgrims
- **Steps**:
  1. Navigate to `/hotel/checkin`
  2. Find booking by ID or pilgrim name
  3. Click "Check In" or scan verification
- **Expected Result**: Guest marked as checked in, check-in scan recorded with timestamp

### TC-CHK-002: Escrow release on check-in
- **Feature**: Escrow Release
- **Description**: Check-in triggers escrow release to hotel
- **Preconditions**: Logged in as Hotel, booking with held escrow
- **Steps**:
  1. Perform check-in for a booking
  2. Observe escrow status change
- **Expected Result**: 80% escrow (minus platform fee) released to hotel wallet, escrow event logged

### TC-CHK-003: View check-in scan history
- **Feature**: Scan History
- **Description**: Hotel views check-in scan records
- **Preconditions**: Check-in scans have been performed
- **Steps**:
  1. Navigate to check-in scan history for a booking
- **Expected Result**: List of all check-in scans with timestamps displayed

---

## 10. Compliance Profile

### TC-CMP-001: Submit common compliance fields
- **Feature**: Compliance Profile
- **Description**: User submits common compliance fields (CR Number, VAT Number, National Address)
- **Preconditions**: Logged in as Hotel, Broker, or Agent
- **Steps**:
  1. Navigate to `/agent/compliance`
  2. Enter CR Number (10 digits)
  3. Enter VAT Number
  4. Enter National Address (min 8 characters)
  5. Save
- **Expected Result**: Common compliance fields saved successfully

### TC-CMP-002: CR Number validation (10 digits)
- **Feature**: Field Validation
- **Description**: CR Number must be exactly 10 digits
- **Preconditions**: On compliance page
- **Steps**:
  1. Enter CR Number with less than 10 digits
  2. Attempt to save
- **Expected Result**: Validation error displayed, save blocked

### TC-CMP-003: Hotel-specific fields (MoT License, Civil Defense)
- **Feature**: Hotel Compliance
- **Description**: Hotel submits role-specific compliance documents
- **Preconditions**: Logged in as Hotel
- **Steps**:
  1. Navigate to `/agent/compliance`
  2. Upload MoT License file
  3. Upload Civil Defense Certificate file
  4. Set Civil Defense Expiry date
  5. Enter Nusuk ID
  6. Save
- **Expected Result**: Hotel-specific compliance fields and files saved

### TC-CMP-004: Broker-specific fields (MoHU, Bank Guarantee, IATA)
- **Feature**: Broker Compliance
- **Description**: Broker submits role-specific compliance documents
- **Preconditions**: Logged in as Broker
- **Steps**:
  1. Navigate to `/agent/compliance`
  2. Upload MoHU License file
  3. Upload Bank Guarantee file
  4. Enter IATA Number
  5. Save
- **Expected Result**: Broker-specific compliance fields and files saved

### TC-CMP-005: Agent-specific fields (Tourism License, Signatory, Articles)
- **Feature**: Agent Compliance
- **Description**: Agent submits role-specific compliance documents
- **Preconditions**: Logged in as Agent
- **Steps**:
  1. Navigate to `/agent/compliance`
  2. Enter Tourism License number
  3. Enter Nusuk ID
  4. Upload VAT Certificate
  5. Upload Signatory ID
  6. Upload Articles of Association
  7. Save
- **Expected Result**: Agent-specific compliance fields and files saved

### TC-CMP-006: Bank details with IBAN validation
- **Feature**: Bank Details
- **Description**: User enters bank details with Saudi IBAN validation
- **Preconditions**: On compliance page
- **Steps**:
  1. Enter IBAN starting with "SA" followed by 22 digits
  2. Enter Swift/BIC code
  3. Save
- **Expected Result**: IBAN validated (SA + 22 digits format), bank details saved

### TC-CMP-007: Invalid IBAN rejected
- **Feature**: IBAN Validation
- **Description**: Invalid IBAN format shows error
- **Preconditions**: On compliance page
- **Steps**:
  1. Enter IBAN that doesn't match SA + 22 digits pattern
  2. Attempt to save
- **Expected Result**: IBAN field highlighted in red, validation error shown

### TC-CMP-008: File upload for compliance documents
- **Feature**: Document Upload
- **Description**: User uploads compliance document files
- **Preconditions**: On compliance page
- **Steps**:
  1. Click upload button for a document field (CR Copy, License, etc.)
  2. Select file from device
  3. Upload completes
- **Expected Result**: File uploaded successfully, "View Current File" link appears

### TC-CMP-009: Expiry date guards (past dates rejected)
- **Feature**: Expiry Date Validation
- **Description**: Past dates rejected for CR/License expiry fields
- **Preconditions**: On compliance page
- **Steps**:
  1. Enter a past date for CR Expiry or Civil Defense Expiry
  2. Attempt to save
- **Expected Result**: Validation error, past dates not accepted for expiry fields

### TC-CMP-010: Legal agreement checkbox
- **Feature**: Agreement Checkbox
- **Description**: User must accept terms agreement
- **Preconditions**: On compliance page
- **Steps**:
  1. Fill all required compliance fields
  2. Check the agreement checkbox
  3. Save
- **Expected Result**: Agreement timestamp recorded, compliance profile saved

### TC-CMP-011: View rejection reason
- **Feature**: Rejection Feedback
- **Description**: Rejected user sees rejection reason on compliance page
- **Preconditions**: User's verification has been rejected by admin with a reason
- **Steps**:
  1. Navigate to `/agent/compliance`
  2. Observe rejection reason display
- **Expected Result**: Rejection reason from admin displayed prominently on the page

---

## 11. Admin Verification Queue

### TC-AVQ-001: View all pending verifications
- **Feature**: Verification Queue
- **Description**: Admin views all users awaiting verification
- **Preconditions**: Logged in as Admin, users with PENDING status exist
- **Steps**:
  1. Navigate to `/admin/verification`
  2. View "All" tab
- **Expected Result**: All pending users from all roles displayed

### TC-AVQ-002: Filter by Hotels tab
- **Feature**: Role Filtering
- **Description**: Admin filters verification queue to Hotels only
- **Preconditions**: Logged in as Admin
- **Steps**:
  1. Navigate to `/admin/verification`
  2. Click "Hotels" tab
- **Expected Result**: Only hotel users shown in queue

### TC-AVQ-003: Filter by Brokers tab
- **Feature**: Role Filtering
- **Description**: Admin filters verification queue to Brokers only
- **Preconditions**: Logged in as Admin
- **Steps**:
  1. Navigate to `/admin/verification`
  2. Click "Brokers" tab
- **Expected Result**: Only broker users shown in queue

### TC-AVQ-004: Filter by Agents tab
- **Feature**: Role Filtering
- **Description**: Admin filters verification queue to Agents only
- **Preconditions**: Logged in as Admin
- **Steps**:
  1. Navigate to `/admin/verification`
  2. Click "Agents" tab
- **Expected Result**: Only agent users shown in queue

### TC-AVQ-005: Side-by-side document review
- **Feature**: Document Review
- **Description**: Admin reviews submitted compliance documents side-by-side
- **Preconditions**: Logged in as Admin, user has submitted compliance docs
- **Steps**:
  1. Navigate to `/admin/verification`
  2. Select a user from the queue
  3. Review documents in side-by-side layout
- **Expected Result**: All submitted documents, fields, and uploaded files displayed for review

### TC-AVQ-006: Approve user verification
- **Feature**: Verification Approval
- **Description**: Admin approves a user's verification
- **Preconditions**: Logged in as Admin, user with PENDING status
- **Steps**:
  1. Navigate to `/admin/verification`
  2. Select user
  3. Review documents
  4. Click "Approve"
- **Expected Result**: User verificationStatus changes to VERIFIED, user gains access to gated features

### TC-AVQ-007: Reject user with required reason
- **Feature**: Verification Rejection
- **Description**: Admin rejects a user's verification with mandatory reason
- **Preconditions**: Logged in as Admin, user with PENDING status
- **Steps**:
  1. Navigate to `/admin/verification`
  2. Select user
  3. Click "Reject"
  4. Enter rejection reason (required field)
  5. Submit rejection
- **Expected Result**: User verificationStatus changes to REJECTED, rejection reason saved and visible to user

### TC-AVQ-008: Reject without reason fails
- **Feature**: Rejection Validation
- **Description**: Admin cannot reject without providing a reason
- **Preconditions**: Logged in as Admin, user with PENDING status
- **Steps**:
  1. Navigate to `/admin/verification`
  2. Select user
  3. Click "Reject"
  4. Leave reason field empty
  5. Attempt to submit
- **Expected Result**: Validation error, rejection requires a reason

### TC-AVQ-009: Suspension badge display
- **Feature**: Suspension Indicator
- **Description**: Suspended users show badge in verification queue
- **Preconditions**: Logged in as Admin, suspended user exists
- **Steps**:
  1. Navigate to `/admin/verification`
  2. Observe suspended user entry
- **Expected Result**: Suspension badge visible on the user's entry in the queue

---

## 12. Escrow Ledger

### TC-ESC-001: View escrow records
- **Feature**: Escrow Ledger
- **Description**: Admin views all escrow records
- **Preconditions**: Logged in as Admin, escrow records exist
- **Steps**:
  1. Navigate to `/admin/escrow`
  2. Observe escrow ledger
- **Expected Result**: All escrow records displayed with booking ID, amounts, status, and event history

### TC-ESC-002: 80/20 rule verification
- **Feature**: Payout Split
- **Description**: Verify escrow splits 80% held / 20% released on booking
- **Preconditions**: A booking has been created
- **Steps**:
  1. Create a booking as Agent
  2. Navigate to `/admin/escrow` as Admin
  3. Find the escrow record for the booking
- **Expected Result**: 20% shown as released to broker wallet, 80% shown as held in PHX Global Escrow

### TC-ESC-003: Freeze escrow
- **Feature**: Escrow Freeze
- **Description**: Admin freezes an escrow record
- **Preconditions**: Logged in as Admin, active escrow record exists
- **Steps**:
  1. Navigate to `/admin/escrow`
  2. Find active escrow record
  3. Click "Freeze"
- **Expected Result**: Escrow status changes to frozen, auto-release prevented, event logged

### TC-ESC-004: Unfreeze escrow
- **Feature**: Escrow Unfreeze
- **Description**: Admin unfreezes a frozen escrow record
- **Preconditions**: Logged in as Admin, frozen escrow record exists
- **Steps**:
  1. Navigate to `/admin/escrow`
  2. Find frozen escrow record
  3. Click "Unfreeze"
- **Expected Result**: Escrow status changes back to active, auto-release timer resumes, event logged

### TC-ESC-005: Auto-release 48h after checkout
- **Feature**: Auto-Release
- **Description**: Escrow auto-releases 48 hours after checkout if no check-in and no freeze
- **Preconditions**: Booking past checkout date, no check-in scan, escrow not frozen
- **Steps**:
  1. Wait for 48 hours after checkout date (or simulate)
  2. Observe escrow status
- **Expected Result**: 80% escrow auto-released to hotel wallet (minus platform fee), event logged

### TC-ESC-006: Platform fee adjustment
- **Feature**: Platform Fee
- **Description**: Admin adjusts platform fee percentage
- **Preconditions**: Logged in as Admin
- **Steps**:
  1. Navigate to platform fee settings
  2. Change fee percentage (default 5%)
  3. Save
- **Expected Result**: New platform fee applied to subsequent escrow releases

### TC-ESC-007: View escrow event log
- **Feature**: Event History
- **Description**: Admin views chronological events for an escrow record
- **Preconditions**: Logged in as Admin, escrow record with events exists
- **Steps**:
  1. Navigate to `/admin/escrow`
  2. Select an escrow record
  3. View event log
- **Expected Result**: All events (creation, freeze, unfreeze, release) displayed chronologically with timestamps

---

## 13. Transactions

### TC-TXN-001: View transactions list
- **Feature**: Transaction Tracking
- **Description**: Verified user views their transactions
- **Preconditions**: Logged in as verified user, transactions exist
- **Steps**:
  1. Navigate to `/transactions`
  2. Observe transaction table
- **Expected Result**: Transactions displayed with booking reference, amount, status, date

### TC-TXN-002: Verification gate on transactions
- **Feature**: Verification Gate
- **Description**: Unverified user cannot access transactions
- **Preconditions**: Logged in as unverified user
- **Steps**:
  1. Navigate to `/transactions`
- **Expected Result**: VerificationGate blocks access, shows compliance message

### TC-TXN-003: Admin updates transaction status to HELD
- **Feature**: Status Management
- **Description**: Admin sets transaction status to HELD
- **Preconditions**: Logged in as Admin, transaction exists
- **Steps**:
  1. Navigate to transactions management
  2. Find a transaction
  3. Change status to "HELD"
  4. Save
- **Expected Result**: Transaction status updated to HELD

### TC-TXN-004: Admin updates transaction status to RELEASED_TO_HOTEL
- **Feature**: Status Management
- **Description**: Admin releases transaction to hotel
- **Preconditions**: Logged in as Admin, HELD transaction exists
- **Steps**:
  1. Find a HELD transaction
  2. Change status to "RELEASED_TO_HOTEL"
  3. Save
- **Expected Result**: Transaction status updated, hotel wallet credited

### TC-TXN-005: Admin updates transaction status to REFUNDED_TO_AGENT
- **Feature**: Status Management
- **Description**: Admin refunds transaction to agent
- **Preconditions**: Logged in as Admin, HELD transaction exists
- **Steps**:
  1. Find a HELD transaction
  2. Change status to "REFUNDED_TO_AGENT"
  3. Save
- **Expected Result**: Transaction status updated to REFUNDED_TO_AGENT

### TC-TXN-006: View transaction for specific booking
- **Feature**: Booking Transaction
- **Description**: View transaction linked to a specific booking
- **Preconditions**: Booking with transaction exists
- **Steps**:
  1. Navigate to booking details
  2. View associated transaction
- **Expected Result**: Transaction details shown with correct booking reference and amounts

---

## 14. Admin Users

### TC-AUS-001: View all users
- **Feature**: User Management
- **Description**: Admin views list of all platform users
- **Preconditions**: Logged in as Admin
- **Steps**:
  1. Navigate to `/admin/users`
  2. Observe user list
- **Expected Result**: All users displayed with username, email, role, verification status

### TC-AUS-002: Toggle user verification
- **Feature**: User Verification Toggle
- **Description**: Admin manually toggles user verification status
- **Preconditions**: Logged in as Admin
- **Steps**:
  1. Navigate to `/admin/users`
  2. Find a user
  3. Toggle verification status
- **Expected Result**: User verification status toggled

### TC-AUS-003: Impersonate user (shadow mode)
- **Feature**: Impersonation
- **Description**: Admin impersonates another user to see their view
- **Preconditions**: Logged in as Admin
- **Steps**:
  1. Navigate to `/admin/users`
  2. Click "Impersonate" on a user
- **Expected Result**: Admin session switches to impersonated user's perspective, shadow mode indicator shown

### TC-AUS-004: End impersonation
- **Feature**: End Impersonation
- **Description**: Admin exits shadow mode
- **Preconditions**: Admin is currently impersonating a user
- **Steps**:
  1. Click "End Impersonation" button
- **Expected Result**: Session returns to admin perspective, shadow mode indicator removed

---

## 15. Admin Reports

### TC-RPT-001: View financial overview
- **Feature**: Financial Reports
- **Description**: Admin views platform financial summary
- **Preconditions**: Logged in as Admin, bookings/transactions exist
- **Steps**:
  1. Navigate to `/admin/reports`
  2. Observe financial overview section
- **Expected Result**: GMV, wholesale value, platform fees, and other financial metrics displayed

### TC-RPT-002: View GMV (Gross Merchandise Value)
- **Feature**: GMV Metric
- **Description**: Verify GMV calculation
- **Preconditions**: Logged in as Admin, bookings exist
- **Steps**:
  1. Navigate to `/admin/reports`
  2. Observe GMV figure
- **Expected Result**: GMV reflects total booking value across platform

### TC-RPT-003: View wholesale value
- **Feature**: Wholesale Value
- **Description**: View total wholesale (auction) value
- **Preconditions**: Logged in as Admin
- **Steps**:
  1. Navigate to `/admin/reports`
  2. Observe wholesale value
- **Expected Result**: Wholesale value reflects total auction settlement amounts

### TC-RPT-004: View room inventory stats
- **Feature**: Inventory Statistics
- **Description**: View room inventory statistics across platform
- **Preconditions**: Logged in as Admin
- **Steps**:
  1. Navigate to `/admin/reports`
  2. Observe room inventory section
- **Expected Result**: Total rooms, available rooms, booked rooms displayed

---

## 16. Admin Offer Audit

### TC-AOA-001: View direct offer audit log
- **Feature**: Offer Audit
- **Description**: Admin views all direct offers across platform
- **Preconditions**: Logged in as Admin, direct offers exist
- **Steps**:
  1. Navigate to `/admin/offer-audit`
  2. Observe audit log
- **Expected Result**: All direct offers listed with broker, agent, block, price, status, timestamps

### TC-AOA-002: Identify stale offers (72h)
- **Feature**: Stale Offer Detection
- **Description**: Admin identifies offers pending for more than 72 hours
- **Preconditions**: Logged in as Admin, offers older than 72h exist
- **Steps**:
  1. Navigate to `/admin/offer-audit`
  2. Check stale offers section or filter
- **Expected Result**: Offers pending for more than 72 hours highlighted or filtered separately

### TC-AOA-003: Hidden markup detection
- **Feature**: Markup Transparency
- **Description**: Admin reviews markup applied by brokers on direct offers
- **Preconditions**: Logged in as Admin, direct offers with markup exist
- **Steps**:
  1. Navigate to `/admin/offer-audit`
  2. Review offer prices vs. wholesale prices
- **Expected Result**: Markup amounts visible, difference between wholesale and offered price shown

### TC-AOA-004: View broker-agent offer history
- **Feature**: Offer History
- **Description**: Admin views offer history between specific broker-agent pair
- **Preconditions**: Logged in as Admin, multiple offers between a broker and agent exist
- **Steps**:
  1. Navigate to `/admin/offer-audit`
  2. Select broker-agent pair
- **Expected Result**: Complete offer history between the pair displayed chronologically

---

## 17. Internationalization (i18n)

### TC-I18-001: Switch to English
- **Feature**: Language Selection
- **Description**: Switch UI to English
- **Preconditions**: App is loaded
- **Steps**:
  1. Click language switcher in header
  2. Select "English"
- **Expected Result**: All UI text switches to English, LTR layout

### TC-I18-002: Switch to Arabic
- **Feature**: Language Selection
- **Description**: Switch UI to Arabic
- **Preconditions**: App is loaded
- **Steps**:
  1. Click language switcher in header
  2. Select "Arabic"
- **Expected Result**: All UI text switches to Arabic, layout changes to RTL

### TC-I18-003: Switch to Urdu
- **Feature**: Language Selection
- **Description**: Switch UI to Urdu
- **Preconditions**: App is loaded
- **Steps**:
  1. Click language switcher in header
  2. Select "Urdu"
- **Expected Result**: All UI text switches to Urdu, layout changes to RTL

### TC-I18-004: Switch to Farsi (Persian)
- **Feature**: Language Selection
- **Description**: Switch UI to Farsi
- **Preconditions**: App is loaded
- **Steps**:
  1. Click language switcher in header
  2. Select "Farsi"
- **Expected Result**: All UI text switches to Farsi, layout changes to RTL

### TC-I18-005: RTL layout for Arabic
- **Feature**: RTL Support
- **Description**: Verify RTL layout when Arabic is selected
- **Preconditions**: Arabic language selected
- **Steps**:
  1. Switch to Arabic
  2. Inspect page layout direction
  3. Check sidebar position, text alignment, form fields
- **Expected Result**: Document dir="rtl", sidebar on right side, text right-aligned, form labels correct

### TC-I18-006: RTL layout for Urdu
- **Feature**: RTL Support
- **Description**: Verify RTL layout when Urdu is selected
- **Preconditions**: Urdu language selected
- **Steps**:
  1. Switch to Urdu
  2. Inspect layout direction
- **Expected Result**: Document dir="rtl", all layout elements mirrored correctly

### TC-I18-007: RTL layout for Farsi
- **Feature**: RTL Support
- **Description**: Verify RTL layout when Farsi is selected
- **Preconditions**: Farsi language selected
- **Steps**:
  1. Switch to Farsi
  2. Inspect layout direction
- **Expected Result**: Document dir="rtl", all layout elements mirrored correctly

### TC-I18-008: Language toggle persistence
- **Feature**: Language Persistence
- **Description**: Selected language persists across page refreshes
- **Preconditions**: App is loaded
- **Steps**:
  1. Switch to Arabic (or any non-English language)
  2. Refresh the browser
  3. Observe selected language
- **Expected Result**: Language selection persisted in localStorage, same language loaded after refresh

---

## 18. Saudi B2B Compliance

### TC-SAU-001: ZATCA VAT 15% calculation
- **Feature**: VAT Calculation
- **Description**: Verify 15% VAT is applied on all bookings
- **Preconditions**: Booking flow is active
- **Steps**:
  1. Create a booking as Agent
  2. Observe price breakdown
- **Expected Result**: VAT amount = 15% of base price, totalWithVat = base + VAT

### TC-SAU-002: Ministry BRN codes
- **Feature**: BRN Assignment
- **Description**: Hotels can assign Ministry BRN codes to blocks
- **Preconditions**: Logged in as Hotel, settled auction exists
- **Steps**:
  1. Find won block
  2. Assign BRN code
  3. Save
- **Expected Result**: BRN code stored and associated with the block

### TC-SAU-003: Multi-currency toggle SAR
- **Feature**: Currency Display
- **Description**: View prices in SAR (base currency)
- **Preconditions**: Logged in as Agent or Broker
- **Steps**:
  1. Click currency toggle
  2. Select SAR
- **Expected Result**: All prices displayed in SAR

### TC-SAU-004: Multi-currency toggle USD
- **Feature**: Currency Display
- **Description**: View prices in USD
- **Preconditions**: Logged in as Agent or Broker
- **Steps**:
  1. Click currency toggle
  2. Select USD
- **Expected Result**: All prices converted and displayed in USD

### TC-SAU-005: Multi-currency toggle IDR
- **Feature**: Currency Display
- **Description**: View prices in IDR
- **Preconditions**: Logged in as Agent or Broker
- **Steps**:
  1. Click currency toggle
  2. Select IDR
- **Expected Result**: All prices converted and displayed in IDR

### TC-SAU-006: Multi-currency toggle PKR
- **Feature**: Currency Display
- **Description**: View prices in PKR
- **Preconditions**: Logged in as Agent or Broker
- **Steps**:
  1. Click currency toggle
  2. Select PKR
- **Expected Result**: All prices converted and displayed in PKR

### TC-SAU-007: Tax invoice sequential numbering
- **Feature**: Invoice Numbering
- **Description**: Tax invoices use sequential PHX-YYYY-XXXX format
- **Preconditions**: Multiple bookings exist
- **Steps**:
  1. Generate tax invoices for multiple bookings
  2. Compare invoice numbers
- **Expected Result**: Sequential numbering in PHX-YYYY-XXXX format (e.g., PHX-2025-0001, PHX-2025-0002)

### TC-SAU-008: Tax invoice QR code
- **Feature**: Invoice QR Code
- **Description**: Tax invoice contains QR code with seller/VAT data
- **Preconditions**: Booking with invoice exists
- **Steps**:
  1. Generate tax invoice
  2. Inspect QR code
- **Expected Result**: QR code present encoding seller info and VAT registration data

### TC-SAU-009: SAR base note on non-SAR invoices
- **Feature**: SAR Reference
- **Description**: Non-SAR invoices show official SAR totals
- **Preconditions**: Currency set to non-SAR (e.g., USD)
- **Steps**:
  1. Set currency to USD
  2. Generate tax invoice
- **Expected Result**: Invoice shows amounts in selected currency with SAR official totals at bottom

---

## 19. License Expiry Worker

### TC-LEW-001: Daily auto-suspension on expired CR
- **Feature**: License Expiry Check
- **Description**: Users with expired CR are auto-suspended
- **Preconditions**: User has CR expiry date in the past
- **Steps**:
  1. Set a user's CR expiry to a past date
  2. Wait for daily worker to run (or trigger manually)
- **Expected Result**: User's verification status changed to suspended, cannot access gated features

### TC-LEW-002: Auto-suspension on expired tourism license
- **Feature**: License Expiry Check
- **Description**: Users with expired tourism license are auto-suspended
- **Preconditions**: User has tourism license expiry in the past
- **Steps**:
  1. Set tourism license expiry to past date
  2. Worker runs
- **Expected Result**: User auto-suspended

### TC-LEW-003: Auto-suspension on expired civil defense certificate
- **Feature**: License Expiry Check
- **Description**: Hotels with expired civil defense cert are auto-suspended
- **Preconditions**: Hotel has civil defense expiry in the past
- **Steps**:
  1. Set hotel's civil defense expiry to past date
  2. Worker runs
- **Expected Result**: Hotel auto-suspended, suspension badge appears in admin queue

---

## 20. Wallet System

### TC-WAL-001: View wallet balance
- **Feature**: Wallet Balance
- **Description**: User views their wallet balance
- **Preconditions**: Logged in, wallet exists
- **Steps**:
  1. Check wallet balance via API or dashboard
- **Expected Result**: Current wallet balance displayed in SAR

### TC-WAL-002: Broker wallet credit on booking (20%)
- **Feature**: Wallet Credit
- **Description**: Broker wallet credited with 20% on booking
- **Preconditions**: Agent makes a booking from broker's inventory
- **Steps**:
  1. Agent creates booking from broker's listed block
  2. Check broker's wallet balance
- **Expected Result**: Broker wallet credited with 20% of booking amount

### TC-WAL-003: Hotel wallet credit on check-in (80%)
- **Feature**: Wallet Credit
- **Description**: Hotel wallet credited with 80% minus platform fee on check-in
- **Preconditions**: Booking with held escrow, hotel performs check-in
- **Steps**:
  1. Hotel checks in guest
  2. Check hotel's wallet balance
- **Expected Result**: Hotel wallet credited with 80% minus platform fee (default 5%)

---

## 21. WebSocket

### TC-WS-001: Real-time bid updates
- **Feature**: Live Bid Updates
- **Description**: Auction bids broadcast to all connected clients
- **Preconditions**: Multiple clients viewing same auction, WebSocket connected
- **Steps**:
  1. Open auction page in two browser windows
  2. Place a bid from one window
- **Expected Result**: Second window receives bid update in real time, UI updates without refresh

### TC-WS-002: Auction extension notifications
- **Feature**: Extension Notifications
- **Description**: Anti-sniping extension broadcast via WebSocket
- **Preconditions**: Auction near closing, WebSocket connected
- **Steps**:
  1. Observe auction with less than 2 minutes remaining
  2. Place a bid (triggering anti-sniping)
- **Expected Result**: All connected clients receive notification that auction time has been extended, countdown updates

### TC-WS-003: WebSocket reconnection
- **Feature**: Connection Resilience
- **Description**: WebSocket reconnects after temporary disconnection
- **Preconditions**: WebSocket connected to auction page
- **Steps**:
  1. Temporarily disconnect network
  2. Reconnect network
  3. Observe WebSocket status
- **Expected Result**: WebSocket automatically reconnects, resumes receiving real-time updates

---

## 22. Agent Storefront Setup

### TC-STF-001: Create Storefront
- **Feature**: Storefront Configuration
- **Description**: Agent creates a public storefront
- **Preconditions**: Logged in as verified agent (alnoor@agent.com)
- **Steps**:
  1. Navigate to Storefront page
  2. Go to Setup tab
  3. Enter slug (e.g., "al-noor-travel"), display name, description
  4. Set commission/markup percentage
  5. Click "Update Settings"
- **Expected Result**: Storefront saved, slug URL becomes accessible at `/s/al-noor-travel`

### TC-STF-002: Toggle Storefront Active/Inactive
- **Feature**: Storefront Visibility
- **Description**: Agent toggles storefront on and off
- **Preconditions**: Storefront already created
- **Steps**:
  1. Navigate to Storefront > Setup tab
  2. Toggle the Active switch off
  3. Visit `/s/al-noor-travel` in a new browser
  4. Toggle Active back on
- **Expected Result**: Inactive storefront shows unavailable message; active storefront displays listings

### TC-STF-003: Copy Shareable Link
- **Feature**: Storefront Sharing
- **Description**: Agent copies storefront URL for distribution
- **Preconditions**: Storefront active
- **Steps**:
  1. Navigate to Storefront page
  2. Click the copy/share link button
- **Expected Result**: Storefront URL copied to clipboard, toast confirmation shown

### TC-STF-004: Storefront Displays Available Listings
- **Feature**: Storefront Inventory
- **Description**: Storefront shows rooms from agent's accessible inventory
- **Preconditions**: Broker has listed blocks visible to this agent
- **Steps**:
  1. Visit `/s/al-noor-travel` (no login required)
  2. Browse available room listings
- **Expected Result**: Shows hotel name, room type, distance, price (including agent markup + 15% VAT), available rooms

### TC-STF-005: Storefront Price Calculation
- **Feature**: Layered Markup
- **Description**: Verify prices include broker markup + agent storefront markup + VAT
- **Preconditions**: Broker set markup on block, agent set storefront markup
- **Steps**:
  1. Note broker's winning price and markup
  2. Note agent's storefront markup percentage
  3. Visit public storefront and check displayed price
- **Expected Result**: Price = (broker wholesale + broker markup) + agent markup + 15% VAT

---

## 23. Public Pilgrim Booking

### TC-PLG-001: Individual Pilgrim Booking
- **Feature**: Public Booking
- **Description**: Pilgrim books a room without logging in
- **Preconditions**: Active storefront with available rooms
- **Steps**:
  1. Visit `/s/al-noor-travel`
  2. Click "Book Now" on a listing
  3. Fill in: full name, citizenship, passport number, date of birth, passport expiry, Nusuk ID (10 digits)
  4. Set room count
  5. Submit booking
- **Expected Result**: Booking confirmed, Voucher ID displayed (PHX-2026-XXXXX format), room availability decremented

### TC-PLG-002: Nusuk ID Validation (10 Digits)
- **Feature**: Input Validation
- **Description**: Reject booking with invalid Nusuk ID
- **Preconditions**: Active storefront
- **Steps**:
  1. Start individual booking
  2. Enter Nusuk ID with less than 10 digits (e.g., "12345")
  3. Submit
- **Expected Result**: Validation error, booking rejected

### TC-PLG-003: Passport Expiry Validation
- **Feature**: Input Validation
- **Description**: Reject booking with expired passport
- **Preconditions**: Active storefront
- **Steps**:
  1. Start individual booking
  2. Enter passport expiry date before December 31, 2026
  3. Submit
- **Expected Result**: Validation error about passport expiry

### TC-PLG-004: Group Booking
- **Feature**: Group Pilgrim Booking
- **Description**: Group leader books multiple rooms for a group
- **Preconditions**: Active storefront with multiple rooms available
- **Steps**:
  1. Visit `/s/al-noor-travel`
  2. Select group booking option
  3. Enter group leader details (name, phone, email)
  4. Add pilgrim details for each member
  5. Submit group booking
- **Expected Result**: All pilgrims booked, each gets a unique Voucher ID, room count decremented by total

### TC-PLG-005: CSV Group Upload
- **Feature**: Bulk Pilgrim Booking
- **Description**: Upload CSV file with multiple pilgrim details
- **Preconditions**: Active storefront, CSV file with correct columns
- **Steps**:
  1. Visit storefront, select group booking
  2. Upload CSV with pilgrim data (fullName, citizenship, passportNumber, dob, passportExpiry, nusukId)
  3. Review parsed data
  4. Submit
- **Expected Result**: All valid pilgrims booked, invalid entries show specific errors

### TC-PLG-006: Booking Confirmation Shows Voucher ID
- **Feature**: Booking Confirmation
- **Description**: After booking, pilgrim sees voucher ID and tracking instructions
- **Preconditions**: Successful booking
- **Steps**:
  1. Complete an individual booking
  2. View confirmation dialog
- **Expected Result**: Shows Voucher ID (PHX-2026-XXXXX), "Track Your Visa & Download Voucher" link to `/booking-status`

### TC-PLG-007: Atomic Room Decrement
- **Feature**: Concurrency Safety
- **Description**: Booking atomically decrements room availability
- **Preconditions**: Block with 2 rooms available
- **Steps**:
  1. Book 1 room via storefront
  2. Check block availability
  3. Book another room
  4. Try to book a third room
- **Expected Result**: First two bookings succeed, third fails with "not enough rooms" error

### TC-PLG-008: Escrow Created on Pilgrim Booking
- **Feature**: Financial Flow
- **Description**: Escrow record created with 80/20 split on storefront booking
- **Preconditions**: Successful pilgrim booking
- **Steps**:
  1. Complete a storefront booking
  2. Log in as admin, check escrow ledger
- **Expected Result**: Escrow record exists with FUNDED status, 20% released to broker, 80% held

---

## 24. Nusuk Sync & Ministry Approval

### TC-NUS-001: View Pilgrim Bookings on Agent Dashboard
- **Feature**: Agent Nusuk Dashboard
- **Description**: Agent sees all pilgrim bookings with sync status
- **Preconditions**: Pilgrim bookings exist via storefront
- **Steps**:
  1. Log in as agent (alnoor@agent.com)
  2. Navigate to Storefront > Nusuk Dashboard tab
- **Expected Result**: Table shows all pilgrim bookings with Voucher ID, name, passport, Nusuk ID, sync status (Pending/Synced)

### TC-NUS-002: Sync Individual Booking to Nusuk
- **Feature**: Nusuk Sync
- **Description**: Agent syncs a single booking to Ministry
- **Preconditions**: Unsynced pilgrim booking exists
- **Steps**:
  1. Navigate to Storefront > Nusuk Dashboard
  2. Click "Sync to Nusuk" button on an unsynced booking
  3. Review the JSON payload preview
  4. Confirm sync
- **Expected Result**: Loading animation, success message "Data Package Verified. Awaiting Ministry Visa Issuance.", status changes to "Synced" (green badge)

### TC-NUS-003: Pre-Flight Validation — Invalid Data
- **Feature**: Nusuk Validation
- **Description**: Sync rejected for invalid pilgrim data
- **Preconditions**: Booking with invalid Nusuk ID or expired passport
- **Steps**:
  1. Attempt to sync a booking with non-compliant data
- **Expected Result**: Red error panel showing specific validation failures, sync blocked

### TC-NUS-004: Pre-Flight Validation — Name Transliteration
- **Feature**: Name Sanitization
- **Description**: Names auto-converted to uppercase Latin characters
- **Preconditions**: Pilgrim with non-Latin characters in name (e.g., "Müller")
- **Steps**:
  1. Click sync on a booking with special characters in name
  2. Review JSON payload preview
- **Expected Result**: Name shows as "MUELLER" in the payload, green "Pre-Flight Validation Passed" banner

### TC-NUS-005: Batch Sync Group Bookings
- **Feature**: Batch Nusuk Sync
- **Description**: Agent syncs entire group at once
- **Preconditions**: Group booking with multiple unsynced pilgrims
- **Steps**:
  1. Navigate to Nusuk Dashboard
  2. Find group with unsynced bookings
  3. Click "Sync Entire Group" button (shows X/Y pending count)
- **Expected Result**: All valid bookings synced, failed ones show individual errors, button disappears when all synced

### TC-NUS-006: Request Ministry Approval
- **Feature**: Ministry Visa Approval
- **Description**: Agent requests visa approval for synced booking
- **Preconditions**: Booking already synced to Nusuk
- **Steps**:
  1. Find a synced booking on Nusuk Dashboard
  2. Click "Simulate Ministry Approval"
- **Expected Result**: Visa number generated (V-2026-88XXX format), visa status changes to ISSUED, green visa number badge replaces button

### TC-NUS-007: Ministry Approval Blocked for Unsynced
- **Feature**: Ministry Guard
- **Description**: Cannot request ministry approval before Nusuk sync
- **Preconditions**: Unsynced booking
- **Steps**:
  1. Attempt to call ministry approval API for unsynced booking
- **Expected Result**: 400 error "Booking not yet synced to Nusuk"

### TC-NUS-008: Ministry Approval Blocked for Already Issued
- **Feature**: Ministry Guard
- **Description**: Cannot request ministry approval twice
- **Preconditions**: Booking with visa already ISSUED
- **Steps**:
  1. Attempt ministry approval on booking with existing visa
- **Expected Result**: 400 error "Visa already issued"

### TC-NUS-009: Pending Sync Count on Dashboard
- **Feature**: Sync Notifications
- **Description**: Agent dashboard shows pending sync alert
- **Preconditions**: Unsynced pilgrim bookings exist
- **Steps**:
  1. Log in as agent
  2. View Dashboard page
- **Expected Result**: Amber alert banner showing count of unsynced bookings with "Go to Storefront" CTA

### TC-NUS-010: Pending Sync Alert on Bookings Page
- **Feature**: Sync Notifications
- **Description**: Agent bookings page shows pending sync alert
- **Preconditions**: Unsynced pilgrim bookings exist
- **Steps**:
  1. Navigate to Bookings page
- **Expected Result**: Amber alert with unsynced count and CTA to Storefront, disappears when all synced

---

## 25. Public Booking Status & Visa Tracking

### TC-BST-001: Lookup Booking by Voucher ID + Passport
- **Feature**: Public Booking Status
- **Description**: Pilgrim checks booking status without logging in
- **Preconditions**: Pilgrim booking exists with known Voucher ID
- **Steps**:
  1. Navigate to `/booking-status`
  2. Enter Voucher ID (PHX-2026-XXXXX) and passport number
  3. Submit lookup
- **Expected Result**: Booking details displayed with masked name, hotel info, room type, visa status

### TC-BST-002: GDPR/PDPL Name Masking
- **Feature**: Privacy Protection
- **Description**: Guest name is masked on public lookup
- **Preconditions**: Booking exists for "Mohammed Al-Rahman"
- **Steps**:
  1. Look up booking on `/booking-status`
  2. Check displayed guest name
- **Expected Result**: Name shows as "M*****d A******n" (first and last letter only)

### TC-BST-003: No Financial Data Exposed
- **Feature**: Data Security
- **Description**: Public lookup does not show prices or payment details
- **Preconditions**: Successful booking lookup
- **Steps**:
  1. Look up booking status
  2. Check all displayed fields
- **Expected Result**: Shows hotel name, room type, city, room count, citizenship — no prices, no escrow amounts, no broker/agent info

### TC-BST-004: Visa Status Badge — Pending
- **Feature**: Progress Tracking
- **Description**: Shows pending status when visa not yet issued
- **Preconditions**: Booking synced but visa not yet issued
- **Steps**:
  1. Look up booking status
- **Expected Result**: Amber "PENDING" visa status badge, no download button

### TC-BST-005: Visa Status Badge — Issued
- **Feature**: Progress Tracking
- **Description**: Shows issued status with visa number
- **Preconditions**: Booking with ISSUED visa
- **Steps**:
  1. Look up booking status
- **Expected Result**: Green "ISSUED" visa status badge, visa number displayed, "Download Accommodation Voucher" button visible

### TC-BST-006: 3-Step Progress Tracker
- **Feature**: Pilgrim Progress Tracker
- **Description**: Vertical progress tracker shows booking journey
- **Preconditions**: Booking exists
- **Steps**:
  1. Look up booking status
  2. Observe the 3-step progress tracker
- **Expected Result**:
  - Step 1 "Booking Received" — green checkmark (always complete after lookup)
  - Step 2 "Submitted to Ministry" — green if synced (with date), gray if pending
  - Step 3 "Visa Issued" — green if ISSUED (with visa number), gray if pending

### TC-BST-007: Download Visa Voucher PDF
- **Feature**: Voucher Download
- **Description**: Pilgrim downloads accommodation voucher after visa issued
- **Preconditions**: Booking with ISSUED visa
- **Steps**:
  1. Look up booking status
  2. Click "Download Accommodation Voucher (PDF)"
- **Expected Result**: PDF downloaded with PHX branding, voucher ID, visa number, guest name (unmasked), hotel info

### TC-BST-008: Voucher Download Blocked Before Visa
- **Feature**: Download Guard
- **Description**: Cannot download voucher before visa is issued
- **Preconditions**: Booking with PENDING visa status
- **Steps**:
  1. Look up booking status
  2. Attempt to download voucher (button should not be visible)
  3. Try direct API call to `/api/booking-voucher`
- **Expected Result**: No download button shown; API returns error message

### TC-BST-009: Invalid Voucher ID Lookup
- **Feature**: Error Handling
- **Description**: Lookup with non-existent voucher ID
- **Preconditions**: None
- **Steps**:
  1. Navigate to `/booking-status`
  2. Enter fake voucher ID and passport number
  3. Submit
- **Expected Result**: Error message "Booking not found", no data displayed

### TC-BST-010: POST Method Security
- **Feature**: API Security
- **Description**: Booking status uses POST (not GET) to protect sensitive data
- **Preconditions**: None
- **Steps**:
  1. Attempt GET request to `/api/booking-status?bookingRef=...&passport=...`
- **Expected Result**: GET not supported, data sent via POST body (not URL parameters) to avoid browser history/log exposure

---

## 26. Dispute Management

### TC-DSP-001: Agent Files Dispute
- **Feature**: Dispute Filing
- **Description**: Agent disputes a booking with escrow in MILESTONE_1_PAID status
- **Preconditions**: Active booking with escrow, logged in as agent
- **Steps**:
  1. Navigate to Bookings page
  2. Click dispute icon on a booking
  3. Enter reason for dispute
  4. Submit
- **Expected Result**: Escrow status changes to FROZEN, "Disputed" badge appears on booking card, admin notified

### TC-DSP-002: Disputed Booking Blocks Hotel Check-in
- **Feature**: Check-in Guard
- **Description**: Hotel cannot check in guests for disputed booking
- **Preconditions**: Booking with FROZEN escrow due to dispute
- **Steps**:
  1. Log in as hotel
  2. Navigate to Check-in page
  3. Attempt to check in guest for disputed booking
- **Expected Result**: 400 error "This booking is under dispute — check-in is disabled"

### TC-DSP-003: Admin Views Disputes
- **Feature**: Admin Dispute Dashboard
- **Description**: Admin sees all disputes with details
- **Preconditions**: At least one dispute filed
- **Steps**:
  1. Log in as admin
  2. Navigate to Disputes page
- **Expected Result**: Summary cards + dispute table with booking details, agent name, reason, filing date

### TC-DSP-004: Admin Resolves — Release to Hotel
- **Feature**: Dispute Resolution
- **Description**: Admin resolves dispute in hotel's favor
- **Preconditions**: Active dispute
- **Steps**:
  1. Navigate to Disputes page
  2. Click resolve on a dispute
  3. Select "Release to Hotel"
- **Expected Result**: Escrow settled, platform fee deducted, hotel wallet credited, agent and hotel notified

### TC-DSP-005: Admin Resolves — Refund to Agent
- **Feature**: Dispute Resolution
- **Description**: Admin resolves dispute in agent's favor
- **Preconditions**: Active dispute
- **Steps**:
  1. Navigate to Disputes page
  2. Click resolve on a dispute
  3. Select "Refund to Agent"
- **Expected Result**: Full refund (escrow + broker 20%) returned to agent, broker wallet debited, all parties notified

### TC-DSP-006: Disputed Badge on Booking Card
- **Feature**: Visual Indicator
- **Description**: Disputed bookings show red badge
- **Preconditions**: Booking with active dispute
- **Steps**:
  1. Log in as agent or admin
  2. View bookings list
- **Expected Result**: Red "Disputed" badge with snowflake icon on the booking card

---

## 27. Direct Offers

### TC-DOF-001: Broker Sends Direct Offer
- **Feature**: Direct Offers
- **Description**: Broker sends private offer to an agent in their group
- **Preconditions**: Broker has won blocks and agent in their group
- **Steps**:
  1. Log in as broker
  2. Navigate to Inventory
  3. Select a block, click "Send Direct Offer"
  4. Select agent, set room count and price per room
  5. Submit offer
- **Expected Result**: Offer created with PENDING status, agent can see it in their offers

### TC-DOF-002: Agent Accepts Direct Offer
- **Feature**: Offer Acceptance
- **Description**: Agent accepts a pending offer
- **Preconditions**: Pending direct offer exists for agent
- **Steps**:
  1. Log in as agent
  2. View direct offers
  3. Click "Accept" on pending offer
- **Expected Result**: Booking created atomically, room count decremented from block, escrow created with 80/20 split

### TC-DOF-003: Agent Declines Direct Offer
- **Feature**: Offer Decline
- **Description**: Agent declines a pending offer
- **Preconditions**: Pending direct offer exists
- **Steps**:
  1. Log in as agent
  2. View direct offers
  3. Click "Decline"
- **Expected Result**: Offer status changes to DECLINED, no booking created, rooms unchanged

### TC-DOF-004: Stale Offer Detection
- **Feature**: Admin Oversight
- **Description**: Offers pending over 72 hours are flagged
- **Preconditions**: Offer pending for more than 72 hours
- **Steps**:
  1. Log in as admin
  2. Navigate to Offer Audit page
- **Expected Result**: Stale offers visually flagged/highlighted

---

## 28. Multi-Currency Display

### TC-CUR-001: Currency Toggle
- **Feature**: Multi-Currency
- **Description**: Switch between SAR, USD, IDR, PKR
- **Preconditions**: Logged in, viewing marketplace or bookings
- **Steps**:
  1. Click currency selector in sidebar
  2. Switch from SAR to USD
  3. Check prices on marketplace
  4. Switch to IDR, then PKR
- **Expected Result**: All prices converted correctly, SAR remains base currency

### TC-CUR-002: Invoice Shows SAR
- **Feature**: Tax Invoice Currency
- **Description**: ZATCA invoices always display SAR regardless of currency toggle
- **Preconditions**: Booking exists
- **Steps**:
  1. Set display currency to USD
  2. Download tax invoice PDF
- **Expected Result**: Invoice shows SAR amounts (primary), multi-currency note if applicable

---

## 29. ZATCA Tax Invoice

### TC-ZAT-001: Generate Tax Invoice PDF
- **Feature**: ZATCA Invoice
- **Description**: Agent downloads tax invoice for a booking
- **Preconditions**: Confirmed booking exists
- **Steps**:
  1. Log in as agent
  2. Navigate to Bookings
  3. Click "Invoice" on a booking
- **Expected Result**: PDF generated with PHX branding, line items, VAT breakdown, TLV QR code

### TC-ZAT-002: TLV QR Code on Invoice
- **Feature**: ZATCA Compliance
- **Description**: Invoice contains valid TLV QR code with 5 ZATCA fields
- **Preconditions**: Downloaded tax invoice
- **Steps**:
  1. Open invoice PDF
  2. Scan QR code
- **Expected Result**: QR decodes to TLV-encoded data containing seller name, VAT number, timestamp, total, VAT amount

### TC-ZAT-003: Invoice i18n
- **Feature**: Multi-Language Invoice
- **Description**: Invoice renders in selected language
- **Preconditions**: Language set to Arabic/Urdu/Farsi
- **Steps**:
  1. Switch language to Arabic
  2. Generate invoice
- **Expected Result**: Invoice labels in Arabic, RTL layout applied where appropriate

---

## 30. Safety & Risk Controls

### TC-SAF-001: Zero-Bid Auction Expiry
- **Feature**: Auction Safety
- **Description**: Auction with no bids expires to EXPIRED status
- **Preconditions**: Active auction with no bids, end time reached
- **Steps**:
  1. Create auction as hotel
  2. Wait for end time (or use short duration)
  3. Check auction status
- **Expected Result**: Status = EXPIRED (not ENDED), orange "Expired" badge, rooms stay with hotel

### TC-SAF-002: 7-Day Clawback
- **Feature**: Inventory Clawback
- **Description**: Unsold rooms revert to hotel after 7 days
- **Preconditions**: Won block with unsold rooms, release deadline passed
- **Steps**:
  1. Win an auction as broker
  2. Leave rooms unlisted past the 7-day release deadline
  3. Wait for release worker to run (hourly)
- **Expected Result**: Available quantity set to 0, REVERSION transactions logged for both hotel and broker wallets

### TC-SAF-003: Anti-Sniping Extension
- **Feature**: Auction Fairness
- **Description**: Last-second bid extends auction by 60 seconds
- **Preconditions**: Active auction with less than 60 seconds remaining
- **Steps**:
  1. Place a bid within the final 60 seconds of an auction
- **Expected Result**: Auction end time extended by 60 seconds, "auction_extended" WebSocket broadcast, timer updates for all viewers

---

## Test Coverage Summary

| Feature Area                | Test Cases | IDs                    |
|-----------------------------|-----------|------------------------|
| Authentication              | 8         | TC-AUTH-001 to 008     |
| Dashboard                   | 5         | TC-DASH-001 to 005     |
| Auctions                    | 6         | TC-AUC-001 to 006      |
| Inventory                   | 8         | TC-INV-001 to 008      |
| Marketplace                 | 5         | TC-MKT-001 to 005      |
| Bookings                    | 6         | TC-BKG-001 to 006      |
| Broker Group                | 4         | TC-BGP-001 to 004      |
| Hotel Profile               | 4         | TC-HPR-001 to 004      |
| Hotel Check-in              | 3         | TC-CHK-001 to 003      |
| Compliance Profile          | 11        | TC-CMP-001 to 011      |
| Admin Verification Queue    | 9         | TC-AVQ-001 to 009      |
| Escrow Ledger               | 7         | TC-ESC-001 to 007      |
| Transactions                | 6         | TC-TXN-001 to 006      |
| Admin Users                 | 4         | TC-AUS-001 to 004      |
| Admin Reports               | 4         | TC-RPT-001 to 004      |
| Admin Offer Audit           | 4         | TC-AOA-001 to 004      |
| i18n                        | 8         | TC-I18-001 to 008      |
| Saudi B2B Compliance        | 9         | TC-SAU-001 to 009      |
| License Expiry Worker       | 3         | TC-LEW-001 to 003      |
| Wallet System               | 3         | TC-WAL-001 to 003      |
| WebSocket                   | 3         | TC-WS-001 to 003       |
| Agent Storefront Setup      | 5         | TC-STF-001 to 005      |
| Public Pilgrim Booking      | 8         | TC-PLG-001 to 008      |
| Nusuk Sync & Ministry       | 10        | TC-NUS-001 to 010      |
| Public Booking Status       | 10        | TC-BST-001 to 010      |
| Dispute Management          | 6         | TC-DSP-001 to 006      |
| Direct Offers               | 4         | TC-DOF-001 to 004      |
| Multi-Currency Display      | 2         | TC-CUR-001 to 002      |
| ZATCA Tax Invoice           | 3         | TC-ZAT-001 to 003      |
| Safety & Risk Controls      | 3         | TC-SAF-001 to 003      |
| **Total**                   | **171**   |                        |
