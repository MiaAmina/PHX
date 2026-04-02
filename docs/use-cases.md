# PHX Exchange — Use Cases by Role

## ADMIN

- Full platform oversight and dashboard with key metrics
- Manage all users — approve/reject verification documents, suspend accounts
- Review and process the verification queue for Hotels, Brokers, and Agents
- Financial reporting — view platform-wide revenue, transaction volumes
- Escrow control — freeze/unfreeze escrow funds, set platform fees
- Approve or reject payout requests from user wallets
- Manage disputes — review agent-filed disputes, decide to release funds to hotel or refund to agent
- View all auctions, bookings, and transactions across the platform

## HOTEL

- Create and manage hotel profile (name, location, distance from Haram)
- Create room block auctions — set room type, quantity, starting price, and auction duration
- Anti-sniping protection on active auctions with live countdowns
- Assign BRN (Business Registration Number) codes to room blocks
- Handle guest check-ins, which triggers escrow release
- View auction history (active, ended, expired, cancelled)
- Submit compliance/verification documents for admin review

## BROKER

- Browse and bid on active hotel room auctions in real-time via WebSocket
- Manage won inventory — room blocks acquired through auctions
- Set markup pricing on acquired inventory for resale to agents
- List inventory on the marketplace for agents to browse
- Manage agent groups — whitelist specific agents
- Send direct offers to whitelisted agents
- Wallet with full transaction ledger — track earnings, request payouts
- 7-day clawback rule: if won rooms aren't listed/sold within 7 days, they revert to the hotel
- Submit compliance/verification documents for admin review

## AGENT

- Browse the marketplace for available room blocks
- Make bookings from broker inventory
- Register pilgrims with full details (passport, Nusuk ID, citizenship, DOB)
- Storefront (B2B2C) — create a public-facing storefront with a custom URL slug
  - Set agency name, description, and markup percentage
  - Toggle storefront active/inactive
  - Pilgrims can book directly without logging in
- Group leader booking flow — pilgrims can book for a group via a two-step process with CSV upload support
- Nusuk sync — sync individual or batch pilgrim bookings to Nusuk Masar (simulated)
- Ministry approval simulation — trigger mock visa issuance for synced bookings
- View ZATCA-compliant tax invoices with QR codes, downloadable as PDF
- Wallet with full transaction ledger — track spending, escrow status
- File disputes on bookings to freeze escrow and trigger admin review
- Submit compliance/verification documents for admin review

## ALL ROLES (Shared Features)

- Multi-language support — English, Arabic, Urdu, Farsi
- Multi-currency display — SAR, USD, IDR, PKR
- Light/dark theme toggle
- Session-based authentication

## PUBLIC (No Login Required)

- Browse an agent's public storefront and book rooms as a pilgrim
- Group booking with group leader flow
- Check booking/visa status at /booking-status using voucher ID and passport number
