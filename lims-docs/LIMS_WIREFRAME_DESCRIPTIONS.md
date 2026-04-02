# LIMS Platform — Wireframe Descriptions & UI Specifications

*Detailed screen-by-screen descriptions for designer handoff or development reference*

---

## 1. GLOBAL LAYOUT

### 1.1 Application Shell

```
┌──────────────────────────────────────────────────────────────────┐
│  TOP BAR                                                         │
│  [LIMS Logo]  [Organization Name ▼]  [Institution Type ▼]       │
│                                    [Theme ▼] [User ▼] [Sign Out]│
├────────────┬─────────────────────────────────────────────────────┤
│            │                                                     │
│  SIDEBAR   │  MAIN CONTENT AREA                                  │
│            │                                                     │
│  Folders:  │  ┌─────────────────────────────────────────────┐   │
│  ▶ Admin   │  │  TOOLBAR                                     │   │
│  ▶ Geodata │  │  [List] [New] [Save] [Delete] [Refresh]     │   │
│  ▶ Owner   │  │  [PDF] [Excel] [Import]                     │   │
│  ▶ Land..  │  ├─────────────────────────────────────────────┤   │
│  ▶ Notary  │  │                                              │   │
│  ▶ Payment │  │  FORM VIEW or LIST VIEW                      │   │
│  ▶ Business│  │  (switches based on context)                 │   │
│  ▶ Permits │  │                                              │   │
│  ▶ Banks   │  │                                              │   │
│  ▶ Utility │  │                                              │   │
│  ▶ Vehicles│  │                                              │   │
│  ▶ Birth-ID│  │                                              │   │
│  ▶ Rentals │  │                                              │   │
│            │  └─────────────────────────────────────────────┘   │
└────────────┴─────────────────────────────────────────────────────┘
```

**Sidebar behavior:**
- Folders expand/collapse on click to reveal sub-modules
- Active module is highlighted
- Sidebar is collapsible on mobile (hamburger menu)
- Current organization displayed at top

### 1.2 List View (Standard for All Modules)

```
┌─────────────────────────────────────────────────────────────────┐
│  [List] [New] [Save] [Delete] [Refresh] [PDF] [Excel] [Import] │
├─────────────────────────────────────────────────────────────────┤
│  Search: [________________________] [Filter ▼] [Columns ▼]      │
├────┬──────────┬──────────────┬──────────┬──────────┬────────────┤
│ □  │ Id       │ Name         │ Status   │ Date     │ Actions    │
├────┼──────────┼──────────────┼──────────┼──────────┼────────────┤
│ □  │ 001      │ Sample Item  │ Active   │ 2026-01  │ [Edit][Del]│
│ □  │ 002      │ Another Item │ Pending  │ 2026-02  │ [Edit][Del]│
│ □  │ 003      │ Third Item   │ Active   │ 2026-03  │ [Edit][Del]│
├────┴──────────┴──────────────┴──────────┴──────────┴────────────┤
│  Showing 1-3 of 45    [◀ Prev] Page 1 of 15 [Next ▶]           │
│  Rows per page: [5 ▼] [10] [15] [20] [50]                      │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Checkbox selection for bulk actions
- Sortable columns (click header to sort)
- Column visibility toggle
- Pagination with configurable page size (5, 10, 12, 15, 20, 50)
- Search/filter bar
- Click any row to open in form view

---

## 2. LOGIN SCREEN

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    ┌─────────────────────┐                       │
│                    │                     │                       │
│                    │    [LIMS LOGO]      │                       │
│                    │                     │                       │
│                    │  Organization:      │                       │
│                    │  [______________ ▼] │                       │
│                    │                     │                       │
│                    │  Username:          │                       │
│                    │  [________________] │                       │
│                    │                     │                       │
│                    │  Password:          │                       │
│                    │  [________________] │                       │
│                    │                     │                       │
│                    │  [    Sign In     ] │                       │
│                    │                     │                       │
│                    └─────────────────────┘                       │
│                                                                  │
│                    Powered by LIMS v2.0                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- Organization is a dropdown selector (multi-tenant)
- Failed login shows inline error message
- Redirects to last visited module after login
- "Forgot password" link if enabled by admin

---

## 3. DASHBOARD (New — Not in Legacy System)

```
┌─────────────────────────────────────────────────────────────────┐
│  DASHBOARD                                         [Date Range ▼]│
├──────────────────┬──────────────────┬────────────────────────────┤
│                  │                  │                             │
│  ┌────────────┐  │  ┌────────────┐  │  ┌────────────────────┐    │
│  │ PARCELS    │  │  │ OWNERS     │  │  │ TAX COLLECTED      │    │
│  │            │  │  │            │  │  │                    │    │
│  │   12,847   │  │  │    8,234   │  │  │  $2.4M / $3.1M    │    │
│  │  +234 MTD  │  │  │  +156 MTD  │  │  │  ██████████░░ 77% │    │
│  └────────────┘  │  └────────────┘  │  └────────────────────┘    │
│                  │                  │                             │
├──────────────────┴──────────────────┼────────────────────────────┤
│                                     │                            │
│  PARCEL MAP                         │  RECENT ACTIVITY           │
│  ┌───────────────────────────┐      │                            │
│  │                           │      │  • New parcel registered   │
│  │    [Leaflet Map with      │      │    by John D. — 2 min ago │
│  │     GPS-pinned parcels    │      │                            │
│  │     color-coded by        │      │  • Tax payment received    │
│  │     tax status]           │      │    $1,200 — 15 min ago    │
│  │                           │      │                            │
│  │                           │      │  • Title deed issued       │
│  │                           │      │    Parcel #4521 — 1hr ago │
│  └───────────────────────────┘      │                            │
│                                     │  • Business registered     │
├─────────────────────────────────────┤    on Parcel #3211         │
│                                     │                            │
│  TAX BY DISTRICT (Bar Chart)        │  • Owner updated           │
│  ┌───────────────────────────┐      │    ID: 8921 — 3hr ago     │
│  │  Dist A  ████████ $800K   │      │                            │
│  │  Dist B  ██████ $600K     │      │  [View All Activity →]    │
│  │  Dist C  █████ $500K      │      │                            │
│  │  Dist D  ███ $300K        │      │                            │
│  └───────────────────────────┘      │                            │
└─────────────────────────────────────┴────────────────────────────┘
```

**Widgets:**
- Total parcels (with month-to-date additions)
- Total registered owners
- Tax collection progress (collected vs. assessed, percentage bar)
- Interactive Leaflet map showing parcel locations color-coded by tax status (green = paid, red = overdue, yellow = pending)
- Recent activity feed (audit log latest entries)
- Tax revenue by district (bar chart)
- Quick-action buttons: Register Parcel, Add Owner, Record Payment

---

## 4. OWNER REGISTRATION FORM

```
┌─────────────────────────────────────────────────────────────────┐
│  [List] [New] [Save] [Delete] [Refresh]                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ═══ 1.1 - REGISTRAR INFO ═══                                   │
│                                                                  │
│  Organization:        [________________]                         │
│  Registrar Full Name: [________________]                         │
│  Registrar ID:        [________________]                         │
│  Registrar Phone:     [________________]                         │
│  Registrar Email:     [________________]                         │
│                                                                  │
│  ═══ 1.2 - OWNER INFO ═══                                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │              │  │              │  State Reg Number: [______]  │
│  │  [PHOTO]     │  │ [FINGERPRINT]│  ID Doc Type: [_________ ▼] │
│  │  Drag & Drop │  │  Drag & Drop │  ID Doc Number: [__________]│
│  │  or Browse   │  │  or Browse   │                              │
│  └──────────────┘  └──────────────┘  Registration Date: [📅____]│
│                                                                  │
│  Full Name:   [________________]                                 │
│  First Name:  [________] Middle: [________] Last: [________]    │
│                                                                  │
│  Place of Birth: [________________]  Date of Birth: [📅________]│
│  Age: [auto-calc]                    Gender: [______________ ▼] │
│  Phone: [________________]           Email: [________________]  │
│                                                                  │
│  ═══ 1.3 - RESIDENTIAL ADDRESS ═══                               │
│                                                                  │
│  Flat No: [____]  Street No: [____]  Street Name: [____________]│
│  District: [____________ ▼]          Location: [_______________]│
│  City: [____________ ▼]             Postal Code: [_____________]│
│                                                                  │
│  ═══ 1.4 - LEGAL WILL OF OWNER ═══                              │
│                                                                  │
│  Contact Full Name:    [________________]                        │
│  Contact Phone:        [________________]                        │
│  Contact Email:        [________________]                        │
│  Relationship:         [________________]                        │
│                                                                  │
│  ═══ 1.5 - OWNED ASSETS ═══                                     │
│                                                                  │
│  [PARCEL (3)] [VEHICLE (1)] [BUSINESS (2)]   ← Tab navigation   │
│  ┌───┬────────┬──────────────┬──────────┬──────────────────────┐ │
│  │ □ │ Id     │ Reg Number   │ Location │ Tax Status           │ │
│  ├───┼────────┼──────────────┼──────────┼──────────────────────┤ │
│  │ □ │ P-001  │ PRN-2025-001 │ Dist A   │ ● Paid              │ │
│  │ □ │ P-002  │ PRN-2025-045 │ Dist B   │ ● Overdue           │ │
│  │ □ │ P-003  │ PRN-2026-012 │ Dist A   │ ● Pending           │ │
│  └───┴────────┴──────────────┴──────────┴──────────────────────┘ │
│  [New] [Remove]                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. PARCEL REGISTRATION FORM

```
┌─────────────────────────────────────────────────────────────────┐
│  [List] [New] [Save] [Delete] [Refresh]                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ═══ PROPERTY IDENTIFICATION ═══                                 │
│                                                                  │
│  Src ID: [________]  Property Reg No: [__________]              │
│  Unit Number: [____]  Plate Number: [____]  Plan Number: [____] │
│  File Number: [____]  Registration Date: [📅__________]         │
│                                                                  │
│  ═══ ENUMERATOR INFO ═══              ═══ REGISTRAR INFO ═══    │
│  Organization: [__________]           Organization: [__________]│
│  Name: [__________]                   Name: [__________]        │
│  ID: [__________]                     ID: [__________]          │
│  Phone: [__________]                  Phone: [__________]       │
│  Email: [__________]                  Email: [__________]       │
│                                                                  │
│  ═══ GPS COORDINATES ═══                                         │
│  Latitude: [__________]  Longitude: [__________]                │
│  Location Precision: [__________]                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │              [LEAFLET MAP]                              │    │
│  │              Interactive map with pin                   │    │
│  │              Click to set coordinates                   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ═══ LOCATION HIERARCHY ═══                                      │
│  District: [________ ▼]  City: [________ ▼]  Township: [____ ▼] │
│  Neighborhood: [____ ▼]  Zone: [________ ▼]                     │
│  Section: [____ ▼]  Quarter Section: [____ ▼]                   │
│  Block: [____ ▼]  Lot: [____ ▼]  Geographic Zone: [________ ▼] │
│                                                                  │
│  ═══ ADDRESS ═══                                                 │
│  Flat No: [____]  Street No: [____]  Street Name: [____________]│
│  Postal Code: [________]  Location: [__________________________]│
│  Location Description: [_______________________________________]│
│  Area Name: [_________________________________________________] │
│                                                                  │
│  ═══ BOUNDARIES ═══                                              │
│  East (Bari):     [________________________]                     │
│  West (Galbeed):  [________________________]                     │
│  North (Waqooyi): [________________________]                     │
│  South (Koonfur): [________________________]                     │
│                                                                  │
│  ═══ LAND DIMENSIONS ═══          ═══ BUILDING DIMENSIONS ═══   │
│  Width: [______] Unit: [___ ▼]    Height: [______]              │
│  Length: [______] Unit: [___ ▼]   Width: [______]               │
│  Wall Height: [__] Unit: [__ ▼]   Length: [______]              │
│  Area: [________] Unit: [___ ▼]   Base Area: [______]           │
│  Hectares: [____] Unit: [___ ▼]   Total Area: [______]          │
│                                    Total Floor Area: [______]    │
│  ═══ FLAT DIMENSIONS ═══          Floor Height: [______]        │
│  Width: [______] Unit: [___ ▼]    Capacity: [______]            │
│  Length: [______] Unit: [___ ▼]                                  │
│  Area: [________]                                                │
│                                                                  │
│  ═══ CLASSIFICATION ═══                                          │
│  Land Use Type: [_____________ ▼]  Parcel Type: [__________ ▼] │
│  Parcel Use Type: [__________ ▼]   Ownership Type: [_______ ▼] │
│  Occupancy Type: [___________ ▼]   Property Category: [____ ▼] │
│  Number of Floors: [_________ ▼]   Floor Height Std: [_____ ▼] │
│  Land Category: [____________]                                   │
│                                                                  │
│  ═══ VALUATION ═══                                               │
│  Valuation Method: [____________ ▼]                              │
│  Market Value: [$___________]  Presumed Value: [$___________]   │
│  Area: [________]  Square Meter Value: [$___________]           │
│  Band Category: [____________]                                   │
│                                                                  │
│  ═══ TAX ═══                                                     │
│  Taxable Value: [$___________]  Tax: [$___________]             │
│  Tax Status: [____________ ▼]                                    │
│                                                                  │
│  ═══ REMARKS ═══                                                 │
│  Record of Notes: [____________________________________________]│
│  [                                                              ]│
│                                                                  │
│  ═══ LINKED ENTITIES ═══                                         │
│  [OWNER] [FEES(2)] [URBAN(1)] [RURAL(0)] [PAYMENTS(3)]         │
│  [DEEDS(1)] [BUSINESS(0)] [TENANT] [ELECTRICITY] [WATER]       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Currently viewing: OWNER                                │   │
│  │  Name: Ahmed Hassan          Phone: +252-xxx-xxxx       │   │
│  │  ID Doc: Passport #A1234567  [View Full Record →]       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. NOTARY SERVICE TRANSACTION FORM

```
┌─────────────────────────────────────────────────────────────────┐
│  LAND AND PROPERTY SERVICE                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ═══ NOTARY ACCOUNT ═══                                          │
│  [Select Notary Account ▼]                                       │
│  Account #: NA-2026-001  |  Name: Central Notary Office         │
│  Reg #: NR-0045  |  Accum. Service Tax: $12,450                 │
│  Accum. Sale Tax: $45,200                                        │
│                                                                  │
│  ═══ PARCEL REFERENCE ═══                                        │
│  [Select Parcel ▼]                                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ ID: P-001 | Reg#: PRN-2025-001 | Tax: Paid | Dist: A │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ═══ SERVICE DETAILS ═══                                         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐                                     │
│  │ [PHOTO]  │  │[FINGER-  │  Registration Date: [📅________]   │
│  │ Upload   │  │ PRINT]   │  Plate Number: [__________]        │
│  └──────────┘  └──────────┘  Reg Number: [__________]          │
│                               Notary Name: [__________]         │
│  Support Documents: [Drag & Drop or Browse]                      │
│                                                                  │
│  District: [__________ ▼]    City: [__________ ▼]               │
│  Service Type: [________________________ ▼]                      │
│                                                                  │
│  Application Form: [Drag & Drop or Browse]                       │
│  Updated Document:  [Drag & Drop or Browse]                      │
│                                                                  │
│  ═══ FEES & TAX ═══                                              │
│                                                                  │
│  Service Fee:      [$___________]                                │
│  Service Tax Rate: [________ %]                                  │
│  Service Tax Fee:  [$___________]  (auto-computed)               │
│                                                                  │
│  Sale Price:       [$___________]                                │
│  Sale Tax Rate:    [________ %]                                  │
│  Sale Tax Fee:     [$___________]  (auto-computed)               │
│                                                                  │
│  ═══ COMMENTS ═══                                                │
│  [____________________________________________________________] │
│  [                                                              ] │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. VALUATION BAND CONFIGURATION (District/City/Neighborhood)

```
┌─────────────────────────────────────────────────────────────────┐
│  DISTRICT: Mogadishu Central                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ═══ GENERAL INFO ═══                                            │
│  Name: [Mogadishu Central]  City: [Mogadishu ▼]                 │
│  Photo: [Upload]                                                 │
│                                                                  │
│  ═══ BASE BAND ═══                                               │
│  Creation Date: [📅 2025-01-15]                                  │
│  Base Band Name: [Standard Urban]                                │
│  Base Band Weight: [1.00]                                        │
│  Base Band SQM Value: [$250.00]                                  │
│                                                                  │
│  ═══ VALUATION BANDS ═══                                         │
│  ┌──────┬──────────┬──────────┬───────┬────────┬─────────┬─────┐│
│  │ Band │ Lower    │ Higher   │ Width │ Weight │Midpoint │ SQM ││
│  ├──────┼──────────┼──────────┼───────┼────────┼─────────┼─────┤│
│  │ A    │ $0       │ $50,000  │50,000 │ 0.60   │$25,000  │$150 ││
│  │ B    │ $50,000  │ $100,000 │50,000 │ 0.80   │$75,000  │$200 ││
│  │ C    │ $100,000 │ $200,000 │100K   │ 1.00   │$150,000 │$250 ││
│  │ D    │ $200,000 │ $350,000 │150K   │ 1.20   │$275,000 │$300 ││
│  │ E    │ $350,000 │ $500,000 │150K   │ 1.40   │$425,000 │$350 ││
│  │ F    │ $500,000 │ $1,000K  │500K   │ 1.60   │$750,000 │$400 ││
│  └──────┴──────────┴──────────┴───────┴────────┴─────────┴─────┘│
│                                                                  │
│  Totals: Width: $1,000,000  Lower: $0  Higher: $1,000,000      │
│                                                                  │
│  ═══ PARCELS IN THIS DISTRICT ═══                                │
│  ┌────────┬──────────────┬──────────┬───────────┬──────────────┐│
│  │ Id     │ Reg Number   │ Owner    │ Band      │ Tax Status   ││
│  ├────────┼──────────────┼──────────┼───────────┼──────────────┤│
│  │ P-001  │ PRN-2025-001 │ A.Hassan │ C         │ ● Paid       ││
│  │ P-002  │ PRN-2025-045 │ F.Omar   │ B         │ ● Overdue    ││
│  └────────┴──────────────┴──────────┴───────────┴──────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. MAP VIEW (New — GPS Parcel Visualization)

```
┌─────────────────────────────────────────────────────────────────┐
│  PARCEL MAP                                    [Filters ▼]       │
├──────────────────────────────────────────┬──────────────────────┤
│                                          │                      │
│  ┌──────────────────────────────────┐    │  LEGEND              │
│  │                                  │    │  ● Green = Tax Paid  │
│  │                                  │    │  ● Yellow = Pending  │
│  │         [LEAFLET MAP]            │    │  ● Red = Overdue     │
│  │                                  │    │  ○ Blue = Selected   │
│  │    Markers for each parcel       │    │                      │
│  │    with GPS coordinates          │    │  FILTERS             │
│  │                                  │    │  District: [All ▼]   │
│  │    Click marker to see:          │    │  Status: [All ▼]     │
│  │    - Parcel ID                   │    │  Band: [All ▼]       │
│  │    - Owner name                  │    │  Use Type: [All ▼]   │
│  │    - Tax status                  │    │                      │
│  │    - Valuation                   │    │  STATS               │
│  │    - [View Full Record →]        │    │  Showing: 847 / 12K  │
│  │                                  │    │  Paid: 623 (73%)     │
│  │    [+] [-] zoom controls         │    │  Overdue: 124 (15%)  │
│  │    [📍] Center on district       │    │  Pending: 100 (12%)  │
│  │    [⬜] Toggle satellite view    │    │                      │
│  │                                  │    │                      │
│  └──────────────────────────────────┘    │                      │
│                                          │                      │
└──────────────────────────────────────────┴──────────────────────┘
```

**Interactions:**
- Click parcel marker → popup with summary + link to full record
- Filter by district, tax status, valuation band, land use type
- Cluster markers when zoomed out
- Draw polygon to select parcels in an area
- Export selected parcels to Excel

---

## 9. LAWYER REGISTRATION FORM

```
┌─────────────────────────────────────────────────────────────────┐
│  LAWYER REGISTRATION                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ═══ 3.0.1 - REGISTRAR INFORMATION ═══                          │
│  Organization: [________________]  Registrar Name: [__________] │
│  Registrar ID: [________________]  Phone: [____________________]│
│  Email: [______________________]   Contact Info: [_____________]│
│                                                                  │
│  ═══ 3.0.2 - LAWYER INFORMATION ═══                             │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ID Doc Type: [______________ ▼]   │
│  │ [PHOTO]  │  │[FINGER-  │  ID Doc Number: [______________]   │
│  │          │  │ PRINT]   │  Registration Date: [📅________]   │
│  └──────────┘  └──────────┘  License Number: [______________]  │
│                                                                  │
│  Support Documents: [Drag & Drop or Browse]                      │
│                                                                  │
│  Full Name: [________________]                                   │
│  First: [________] Middle: [________] Last: [________]          │
│  DOB: [📅________]  Place of Birth: [________________]          │
│  Age: [auto]  Gender: [______ ▼]  Phone: [________________]    │
│  Email: [________________]                                       │
│                                                                  │
│  ═══ 3.0.3 - ADDRESS ═══                                        │
│  Flat: [____] Street No: [____] Street: [______________________]│
│  Location: [________________]  City: [_________ ▼]             │
│  District: [_________ ▼]      Postal Code: [__________]        │
│                                                                  │
│  ═══ 3.0.4 - CREDENTIAL INFORMATION ═══                         │
│  Institution: [________________]  City: [________________]      │
│  Discipline: [________________]   Graduation: [📅________]      │
│  Qualification: [________________ ▼]                             │
│                                                                  │
│  ═══ 3.0.5 - REMARKS ═══                                        │
│  [____________________________________________________________] │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. ADMIN — USER MANAGEMENT

```
┌─────────────────────────────────────────────────────────────────┐
│  USER ADMINISTRATION                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ═══ ACCOUNT ═══                                                 │
│  Username: [________________]  Password: [________________]     │
│  Active: [✓]  Force Password Change: [□]                        │
│                                                                  │
│  ═══ PERSONAL INFO ═══                                           │
│  Given Name: [________________]  Family Name: [________________]│
│  Email: [________________]  Middle Name: [________________]     │
│  Job Title: [________________]  Birthday: [📅________]          │
│                                                                  │
│  ═══ SECURITY ═══                                                │
│  Allowed IP: [________________]  (blank = all IPs allowed)      │
│  Start Date: [📅________]  End Date: [📅________]               │
│                                                                  │
│  ═══ LDAP ═══                                                    │
│  Creation Date: [________]                                       │
│                                                                  │
│  ═══ ROLES ═══                                                   │
│  ┌────────────────────────┐                                      │
│  │ □ admin                │                                      │
│  │ ■ registrar            │                                      │
│  │ □ tax_collector        │                                      │
│  │ ■ data_entry           │                                      │
│  │ □ viewer               │                                      │
│  └────────────────────────┘                                      │
│                                                                  │
│  ═══ MODULE RIGHTS (for selected role) ═══                       │
│  ┌──────────────────┬─────────────┬──────────────────────┐      │
│  │ Module           │ Access      │ Excluded Actions     │      │
│  ├──────────────────┼─────────────┼──────────────────────┤      │
│  │ Owner            │ Unrestricted│ [none]               │      │
│  │ Parcel           │ Unrestricted│ Delete               │      │
│  │ Payment          │ Read-only   │ New, Save, Delete    │      │
│  │ User             │ Hidden      │ [all]                │      │
│  └──────────────────┴─────────────┴──────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. MOBILE RESPONSIVE LAYOUTS

### 11.1 Mobile — Sidebar Collapsed
```
┌───────────────────────┐
│ [☰] LIMS    [👤] [⚙] │
├───────────────────────┤
│                       │
│  MAIN CONTENT         │
│  (full width)         │
│                       │
│  Forms stack          │
│  vertically           │
│                       │
│  Tables scroll        │
│  horizontally         │
│                       │
└───────────────────────┘
```

### 11.2 Mobile — Form Layout
```
┌───────────────────────┐
│  ═══ OWNER INFO ═══   │
│                       │
│  [PHOTO]              │
│  [Drag & Drop]        │
│                       │
│  [FINGERPRINT]        │
│  [Drag & Drop]        │
│                       │
│  First Name:          │
│  [________________]   │
│                       │
│  Middle Name:         │
│  [________________]   │
│                       │
│  Last Name:           │
│  [________________]   │
│                       │
│  DOB:                 │
│  [📅______________]   │
│                       │
│  Gender:              │
│  [______________ ▼]   │
│                       │
└───────────────────────┘
```

**Mobile design principles:**
- Sidebar becomes a slide-out drawer
- Multi-column layouts stack vertically
- Tables become scrollable or card-based
- File upload zones are touch-friendly
- Date pickers use native mobile controls

---

## 12. DESIGN SYSTEM NOTES

### Color Palette
| Element | Light Theme | Dark Theme |
|---------|------------|------------|
| Background | #FFFFFF | #1A1A2E |
| Surface | #F8F9FA | #16213E |
| Primary | #2D6A4F (forest green) | #52B788 |
| Secondary | #264653 | #76C893 |
| Accent | #E76F51 | #F4A261 |
| Text Primary | #212529 | #E9ECEF |
| Text Secondary | #6C757D | #ADB5BD |
| Success | #198754 | #40916C |
| Warning | #FFC107 | #FFD166 |
| Danger | #DC3545 | #E63946 |
| Border | #DEE2E6 | #2A2A4A |

### Typography
- Headings: Inter or system sans-serif, semibold
- Body: Inter or system sans-serif, regular
- Monospace: JetBrains Mono (for IDs, codes, coordinates)
- Section headers: uppercase, letter-spacing, with horizontal rule

### Component Standards
- All form inputs: rounded-md, consistent height (40px desktop, 48px mobile)
- Dropdowns: searchable with type-ahead for reference selectors
- File uploads: drag-and-drop zone with preview thumbnails
- Date pickers: calendar popup with keyboard input fallback
- Tables: alternating row colors, sticky headers, sortable columns
- Buttons: primary (filled), secondary (outlined), danger (red)
- Status badges: color-coded pills (green/yellow/red)

### Accessibility
- WCAG 2.1 AA minimum contrast ratios
- All interactive elements keyboard-navigable
- Screen reader labels on all form fields
- Focus indicators on interactive elements
- Error messages associated with form fields via aria-describedby
