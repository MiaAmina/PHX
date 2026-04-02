# Land Information Management System (LIMS)
## Complete Requirements Specification

**Reverse-engineered from:** alemcor.eastus.cloudapp.azure.com/LandManagementSystem
**Original Developer:** ALEM-COR Engineering (2018)
**Build Version:** 2.0.0.774 (September 21, 2025)
**Original Framework:** OpenXava 6.4 on Apache Tomcat 9 / Java / PostgreSQL
**Document Date:** March 10, 2026

---

## 1. SYSTEM OVERVIEW

The LIMS (Land Information Management System) is a comprehensive government/municipal land administration platform designed to manage land ownership, property registration, tax assessment, and related services. It supports multi-organization deployment with role-based access control.

### 1.1 Core Capabilities
- Land/property registration and ownership management
- Parcel/plot identification and geographic referencing
- Property valuation and tax assessment (urban and rural)
- Deed management and ownership transfers
- Business licensing and permits
- Utility meter tracking (electricity, water)
- Vehicle registration
- Birth/personal identification records
- Rental agreement management
- Notary services
- Bank account management
- Payment processing and fee collection
- User/role administration with LDAP support

### 1.2 System Architecture (Original)
- **Backend:** Java (OpenXava 6.4 framework) on Apache Tomcat 9.0.13
- **Database:** PostgreSQL (relational)
- **Frontend:** Server-rendered HTML with DWR (Direct Web Remoting) for AJAX
- **Authentication:** Session-based with organization context, LDAP optional
- **Deployment:** Microsoft Azure (East US region)
- **Themes:** Multiple color themes (dark green default, light blue, red, navy blue, black/white, terra)

---

## 2. USER MANAGEMENT & AUTHENTICATION

### 2.1 Organizations
The system supports multi-organization/multi-tenant deployment. Each organization has:
- Organization ID
- Organization name
- Institution type (dropdown selector at top of every page)

Users log in with Organization + Username + Password.

### 2.2 User Entity
| Field | Type | Notes |
|-------|------|-------|
| User (username) | Text | Primary login identifier |
| Password | Password | Hashed |
| Creation date | Date | Auto-set |
| Last login date | Date | Auto-updated |
| Active | Boolean | Enable/disable account |
| Force change password | Boolean | Force password reset on next login |
| Authenticate with LDAP | Boolean | Use LDAP directory instead of local password |
| Email | Text | |
| Given name | Text | |
| Family name | Text | |
| Job title | Text | |
| Middle name | Text | |
| Nick name | Text | |
| Birth date | Date | |
| Failed login attempts | Integer | Lockout counter |
| Password recovering date | Date | |
| Privacy policy acceptance date | Date | |
| Allowed IP | Text | Restrict login to specific IPs |

**Relationships:**
- User has many Roles (many-to-many)
- User has many Module permissions (Module name, Unrestricted flag, Hidden flag)
- User has Sessions record (Sign-in time log)

### 2.3 Role Entity
| Field | Type | Notes |
|-------|------|-------|
| Name | Text | Role identifier (e.g., "admin", "joine") |
| Description | Text | Role description |

**Relationships:**
- Role has many Module Rights:
  - Module (module name)
  - Excluded actions (specific actions denied)
  - Excluded data (specific data hidden)
  - Read only data (data visible but not editable)

### 2.4 Pre-defined Roles
- **admin:** Manages users, roles, folders, modules, organizations, etc.
- **joine:** (Custom role observed in system)

---

## 3. NAVIGATION & MODULE STRUCTURE

The application uses a hierarchical folder/module navigation sidebar:

### 3.1 Top-Level Folders & Complete Sub-Module Inventory (82+ modules)

```
Admin (System Administration)
  ├── Change password (/m/ChangePassword)
  ├── Folders (/m/Folder)
  ├── History (/m/History)
  ├── Modules (/m/Module)
  ├── My personal data (/m/MyPersonalData)
  ├── Roles (/m/Role)
  └── Users (/m/User)

00-Geodata (Geographic Reference Data)
  ├── Country (/m/Country)
  ├── Region (/m/Region)
  ├── District (/m/District)
  └── City (/m/City)

01-Owner (Ownership Registry)
  ├── Identification document type (/m/IdentificationDocumentType)
  └── Owner (/m/Owner)

02-Land-Property (Land & Property Management — 30 sub-modules)
  ├── Parcel (/m/Parcel) — main entity
  ├── Parcel fee (/m/ParcelFee)
  ├── Parcel type (/m/ParcelType)
  ├── Parcel use type (/m/ParcelUseType)
  ├── Property title deeds (/m/PropertyTitleDeeds)
  ├── Property category type (/m/PropertyCategoryType)
  ├── Plot (/m/Plot)
  ├── Zone (/m/Zone)
  ├── Neighborhood (/m/Neighborhood)
  ├── Geographic zone (/m/GeographicZone) — *likely module name*
  ├── Flat (/m/Flat)
  ├── Floor (/m/Floor)
  ├── Block (/m/Block)
  ├── Lot (/m/Lot)
  ├── Section (/m/Section)
  ├── Quarter section (/m/QuarterSection)
  ├── Towinship (/m/Towinship) — *note: original spelling*
  ├── Number of floors (/m/NumberOfFloors)
  ├── Standard floor hight range type (/m/StandardFloorHightRangeType)
  ├── Unit type (/m/UnitType) — measurement units
  ├── Owner ship type (/m/OwnerShipType)
  ├── Occupation type (/m/OccupationType)
  ├── Land use types (/m/LandUseTypes) — *likely module name*
  ├── Land category (/m/LandCategory) — *likely module name*
  ├── Instrument type (/m/InstrumentType)
  ├── File status type (/m/FileStatusType)
  ├── Fee type (/m/FeeType)
  ├── Valuation method type (/m/ValuationMethodType)
  ├── Urban assessment (/m/UrbanAssessment)
  ├── Urban assessment discount rate (/m/UrbanAssessmentDiscountRate)
  └── Rural assessment (/m/RuralAssessment)

03-Notary (Notary & Legal Services — 13 sub-modules)
  ├── Notary registration (/m/NotaryRegistration) — *likely module name*
  ├── Notary type (/m/NotaryType)
  ├── Notary user (/m/NotaryUser)
  ├── Notary account (/m/NotaryAccount)
  ├── Notary certificate form category (/m/NotaryCertificateFormCategory)
  ├── General services (/m/GeneralServices) — *likely module name*
  ├── Land and property services (/m/LandAndPropertyServices) — *likely*
  ├── Vehicle services (/m/VehicleServices) — *likely module name*
  ├── Lawyer registration (/m/LawyerRegistration) — *likely module name*
  ├── Program type (/m/ProgramType)
  ├── Qualification type (/m/QualificationType)
  ├── Sales tax fee (/m/SalesTaxFee)
  └── Service types (/m/ServiceTypes) — *likely module name*

04-Payments (Financial Transactions)
  └── Payment (/m/Payment)

05-Business (Business Registration — 6 sub-modules)
  ├── Business (/m/Business)
  ├── Business class type (/m/BusinessClassType)
  ├── Business type (/m/BusinessType)
  ├── Contact person (/m/ContactPerson)
  ├── Owner type (/m/OwnerType)
  └── Title type (/m/TitleType)

06-Permits (Building & Construction)
  └── Building permit (/m/BuildingPermit)

07-Banks (Financial Institutions)
  ├── Financial institution (/m/FinancialInstitution)
  └── Financial institution type (/m/FinancialInstitutionType)

08-Utility (Utility Meters)
  ├── Electricity meter (/m/ElectricityMeter)
  └── Water meter (/m/WaterMeter)

09-Vehicles (Vehicle Registry)
  ├── Make (/m/Make) — vehicle manufacturers
  └── Model (/m/Model) — vehicle models

10-Birth-Personal-ID (Civil Registry — 5 sub-modules)
  ├── Personal information (/m/PersonalInformation) — *likely "Perosnal" in original*
  ├── Gender type (/m/GenderType)
  ├── Marital status type (/m/MaritalStatusType)
  ├── Education level type (/m/EducationLevelType)
  └── Color type (/m/ColorType) — *likely eye/hair/skin color*

11-Rentals (Rental Management)
  ├── Tenant (/m/Tenant)
  └── Residence type (/m/ResidenceType)

Global (Available on all pages)
  └── Institution type (/m/InstitutionType)
```

### 3.2 Global Actions (Available on all list views)
- **New** — Create new record
- **Delete** — Delete selected record(s)
- **Generate PDF** — Export to PDF
- **Generate Excel** — Export to spreadsheet
- **Import data** — Bulk import (CSV/Excel)

### 3.3 Form Actions
- **List** — Return to list view
- **New** — Create blank record
- **Save** — Persist changes
- **Refresh** — Reload current record

### 3.4 List View Features
- Column sorting
- Grouping (by name, description, etc.)
- Configurable rows per page (5, 10, 12, 15, 20, 50)
- Record count display
- Change column name / remove columns

---

## 4. MODULE SPECIFICATIONS

### 4.1 MODULE: Owner (Folder: 01-Owner)

The Owner module is the central entity representing land/property owners. It contains 5 major sections with embedded sub-entities.

#### Section 1.1: REGISTRAR-INFO
| Field | Type | Notes |
|-------|------|-------|
| Organization | Text/Select | Registrar's organization |
| Registrar full name | Text | |
| Registrar id | Text | |
| Registrar phone | Text | |
| Registrar email | Text/Email | |

#### Section 1.2: OWNER-INFO
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto/Text | System-generated or manual |
| State registration number | Text | Government registration ID |
| Id document type | Dropdown | Type of identification document |
| Id document number | Text | Document number |
| Photo | File Upload | Drag & Drop supported |
| Finger print | File Upload | Drag & Drop supported |
| Registration date | Date | |
| Full name | Text | Auto-composed or manual |
| First name | Text | |
| Middle name | Text | |
| Last name | Text | |
| Place of birth | Text | |
| Date of birth | Date | |
| Age | Integer | Possibly auto-calculated |
| Gender | Dropdown | |
| Phone | Text | |
| Email | Text/Email | |

#### Section 1.3: RESIDENTIAL-ADDRESS
| Field | Type | Notes |
|-------|------|-------|
| Flat number | Text | |
| Street number | Text | |
| Street name | Text | |
| District | Dropdown/Ref | Reference to District entity |
| Location | Text | |
| City | Dropdown/Ref | Reference to City entity |
| Postal code | Text | |

#### Section 1.4: LEGAL-WILL-OF-OWNER
| Field | Type | Notes |
|-------|------|-------|
| Contact full name | Text | Emergency/legal contact |
| Contact phone number | Text | |
| Contact email | Text/Email | |
| Relationship | Text/Dropdown | Relationship to owner |

#### Section 1.5: OWNED-ASSETS (Tabs)
Three tabs showing owned assets:
- **PARCEL (count)** — List of owned parcels (inline table with CRUD)
- **VEHICLE** — List of owned vehicles
- **BUSINESS** — List of owned businesses

Each tab has: New, Remove, Cut, Generate PDF, Generate Excel actions.

**Parcel inline table columns:**
Id, Src id, Unit number, Platenumber, Plannumber, Document, Land category, Type, Presumed value, Square meter value, Area, Taxable value, Market value, Tax, Floor, Geographic zone, Flat, Plot, Registration date, Location, East/West/North/South boundaries, Location map, District, City, Township, Neighborhood, Zone, Section, Quarter section, Block, Lot, Land use types, Valuation method, Area name, Land dimensions (width/length/height/area), Building dimensions, Flat dimensions, Wall dimensions, Various unit references, Band category, Lat/Long, Zoning type, Occupancy type, Location description, Enumerator info, Registrar info, Tenant, Electricity meter, Water meter, Tax status, Property category, Number of floors, Standard floor height, Parcel area, Property registration number, File number, Municipal address, Record of notes

---

### 4.2 MODULE: Parcel (Folder: 02-Land-Property)

The Parcel module is the most complex entity with 93 input fields across multiple sections.

#### Section 2.1.1.0: PROPERTY-IDENTIFICATION
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto/Text | Primary identifier |
| Src id | Text | Source/external ID |

#### Section 2.1.1.1: ENUMERATOR-INFORMATION
| Field | Type | Notes |
|-------|------|-------|
| Enumerator organization | Text | Surveyor's organization |
| Enumerator name | Text | |
| Enumerator id | Text | |
| Enumerator phone | Text | |
| Enumerator email | Text/Email | |

#### Section 2.1.1.2: REGISTRAR-INFORMATION
| Field | Type | Notes |
|-------|------|-------|
| Registrar organization | Text | |
| Registrar name | Text | |
| Registrar id | Text | |
| Registrar phone | Text | |
| Registrar email | Text/Email | |

#### Section 2.1.1.3: PROPERTY-REGISTRATION
| Field | Type | Notes |
|-------|------|-------|
| Registration date | Date | |
| Property registration number | Text | Official registration number |
| File number | Text | Physical file reference |
| Plate number | Text | Land plate/survey number |
| Document | File Upload | Drag & Drop supported |

#### Section: GEO-REFERENCE-LOCATION
| Field | Type | Notes |
|-------|------|-------|
| Location map | Map/Image | Visual map reference |
| Latitude | Decimal | GPS coordinate |
| Longitude | Decimal | GPS coordinate |
| Location precision | Text | Accuracy of GPS reading |

#### Section: PROPERTY-LOCATION
| Field | Type | Notes |
|-------|------|-------|
| District | Dropdown/Ref | Reference to District entity |
| Area name | Text | |
| Location | Text | General location description |
| City | Dropdown/Ref | Reference to City entity |
| Neighborhood | Dropdown/Ref | |
| Zone | Dropdown/Ref | Reference to Zone entity |
| Unit number | Text | |
| East (bari) | Text | Eastern boundary |
| West (galbeed) | Text | Western boundary |
| North (waqooyi) | Text | Northern boundary |
| South (koonfur) | Text | Southern boundary |

*Note: Boundary terms are in Somali language (bari=east, galbeed=west, waqooyi=north, koonfur=south)*

#### Section: MUNICIPAL-ADDRESS
| Field | Type | Notes |
|-------|------|-------|
| Flat number | Text | |
| Street number | Text | |
| Street name | Text | |
| City | Text | (Municipal context) |
| Postal code | Text | |

#### Section: BY-PROPERTY-TYPE
| Field | Type | Notes |
|-------|------|-------|
| Property category type | Dropdown/Ref | Links to property type lookup |

#### Section: LAND-PROPERTY
| Field | Type | Notes |
|-------|------|-------|
| Land width | Decimal | |
| Land width unit | Dropdown/Ref | Unit of measurement |
| Land length | Decimal | |
| Land length unit | Dropdown/Ref | |
| Land area | Decimal | Calculated or manual |
| Land area unit | Dropdown/Ref | |

#### Section: BUILDING-PROPERTY
| Field | Type | Notes |
|-------|------|-------|
| Building width | Decimal | |
| Building width unit | Dropdown/Ref | |
| Building length | Decimal | |
| Building length unit | Dropdown/Ref | |
| Building base area | Decimal | |
| Building base area unit | Dropdown/Ref | |
| Number of floors | Dropdown/Ref | |
| Build standard floor height | Decimal | |
| Build standard floor height unit | Dropdown/Ref | |
| Building height | Decimal | |
| Building height unit | Dropdown/Ref | |
| Building total floor area | Decimal | |
| Building total floor area unit | Dropdown/Ref | |
| Building capacity | Decimal | |
| Building capacity unit | Dropdown/Ref | |

#### Section: FLAT-PROPERTY
| Field | Type | Notes |
|-------|------|-------|
| Flat width | Decimal | |
| Flat length | Decimal | |
| Flat area | Decimal | |
| Flat area unit | Dropdown/Ref | |

#### Section: LAND-CATEGORY
| Field | Type | Notes |
|-------|------|-------|
| Land category | Dropdown/Ref | Reference to land classification |

#### Section: LAND-LOCATION
| Field | Type | Notes |
|-------|------|-------|
| Location description | Dropdown | Yes/No |
| Geographic zone | Dropdown/Ref | |
| Township | Text | |
| Section | Text | |
| Quarter section | Text | |
| Block | Text | |
| Plot | Text | |
| Lot | Text | |
| Plan number | Text | |

#### Section: LAND-ZONING-TYPE
| Field | Type | Notes |
|-------|------|-------|
| Zoning type | Dropdown/Ref | Parcel zoning classification |

#### Section: LAND-USE-TYPE
| Field | Type | Notes |
|-------|------|-------|
| Land use type | Dropdown/Ref | How the land is used |

#### Section: OWNERSHIP-TYPE
| Field | Type | Notes |
|-------|------|-------|
| Type | Dropdown/Ref | Ownership classification |

#### Section: OCCUPANCY-TYPE
| Field | Type | Notes |
|-------|------|-------|
| Occupancy type | Dropdown/Ref | How the property is occupied |

#### Section: VALUATION-CATEGORY
| Field | Type | Notes |
|-------|------|-------|
| Valuation method | Dropdown/Ref | Method used for valuation |
| Market value | Decimal/Currency | Current market value |
| Presumed value | Decimal/Currency | Assessed/presumed value |
| Area | Decimal | Area used for valuation |
| Band category | Text/Ref | Valuation band |
| Square meter value | Decimal/Currency | Value per sqm |

#### Section: TAX
| Field | Type | Notes |
|-------|------|-------|
| Taxable value | Decimal/Currency | |
| Tax | Decimal/Currency | Computed tax amount |
| Tax status | Text/Dropdown | Current tax status |

#### Section: REMARKS
| Field | Type | Notes |
|-------|------|-------|
| Record of notes | Textarea | Free-text notes |

#### Parcel Sub-Entity Tabs:
- **OWNER** — Link to owner entity
- **FEES (count)** — Fee records attached to this parcel
- **URBAN ASSESSMENT (count)** — Urban tax assessments
- **RURAL ASSESSMENT (count)** — Rural tax assessments
- **PAYMENTS (count)** — Payment records
- **LAND DEEDS (count)** — Deed records
- **BUSINESS (count)** — Businesses operating on this parcel
- **TENANT** — Current tenant information
- **ELECTRICITY METER** — Electricity meter details
- **WATER METER** — Water meter details

---

### 4.3 MODULE: Plot

Simple entity for plot management.

| Field | Type | Notes |
|-------|------|-------|
| Id | Auto/Text | |
| Plot | Text | Plot identifier/name |

---

### 4.4 MODULE: Country (Folder: 00-Geodata)

| Field | Type | Notes |
|-------|------|-------|
| Id | Auto/Text | |
| Name | Text | Country name |
| Photo | File Upload | Flag or image |

**Relationships:**
- Country has many Regions (inline table: Id, Name, Photo)

---

### 4.5 MODULE: Region (Folder: 00-Geodata)

| Field | Type | Notes |
|-------|------|-------|
| Id | Auto/Text | |
| Name | Text | Region name |
| Photo | File Upload | |

**Relationships:**
- Region has many Districts (inline table: Id, Dname, Photo)

---

### 4.6 MODULE: District (Folder: 00-Geodata)

#### Section: General Info
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto/Text | |
| Photo | File Upload | |
| Dname | Text | District name |
| City | Dropdown/Ref | Reference to City entity |

#### Valuation Band Data (Property Tax Assessment)
The District entity includes a comprehensive **valuation banding system** used for property tax calculations. This contains:

**Base Band Info:**
| Field | Type |
|-------|------|
| Band creation date | Date |
| Base band name | Text |
| Base band weight | Decimal |
| Base band square meter value | Decimal/Currency |

**Six Valuation Bands (A through F), each with:**
| Field | Type |
|-------|------|
| Lower limit | Decimal |
| Higher limit | Decimal |
| Width | Decimal |
| Weight | Decimal |
| Mid point value | Decimal |
| Mid point value ratio | Decimal |
| Band sqm values | Decimal |

**Totals:**
| Field | Type |
|-------|------|
| Width total | Decimal |
| Lower limit (overall) | Decimal |
| Higher limit (overall) | Decimal |

**Inline Tables:**
- Parcels belonging to this district (Id, Src id, etc.)

---

### 4.7 MODULE: City (Folder: 00-Geodata)

#### Section: General Info
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto/Text | |
| Name | Text | City name |
| Photo | File Upload | |

#### Neighborhoods (inline table)
| Column | Type |
|--------|------|
| Id | Auto |
| Name | Text |
| Presumed value | Decimal/Currency |
| Lower | Decimal |
| Higher | Decimal |
| Band | Text |
| Mid point value | Decimal |

#### City also includes the same Valuation Band structure as District:
- Base band info
- Bands A through F (lower/upper limits, width, weight, midpoint, ratio, sqm values)
- Width total, lower limit, higher limit

---

### 4.8 MODULE: Zone

Simple lookup entity.

| Field | Type | Notes |
|-------|------|-------|
| Id | Auto/Text | |
| Name | Text | Zone name |

---

### 4.9 MODULE: Tenant

| Field | Type | Notes |
|-------|------|-------|
| Id | Auto/Text | |
| Full name | Text | |
| First name | Text | |
| Last name | Text | |
| Phone | Text | |

---

### 4.10 MODULE: Payment (Folder: 04-Payments)

**STATUS: JSP rendering error in original system** — The Payment module throws a server-side exception in `xava/detail.jsp` at line 209/299. The module entity exists but the form cannot render. Based on context from the Parcel module (which has a PAYMENTS tab) and the Notary services (which track service fees/tax fees), payments likely contain:

| Probable Field | Type | Notes |
|----------------|------|-------|
| Id | Auto | Payment identifier |
| Parcel reference | Reference | Link to parcel |
| Owner reference | Reference | Link to owner |
| Payment date | Date | When payment was made |
| Amount | Decimal/Currency | Payment amount |
| Payment method | Dropdown | Cash, bank transfer, etc. |
| Receipt number | Text | Payment receipt |
| Period/Year | Text | Tax period covered |
| Status | Dropdown | Paid, pending, overdue |
| Notes | Textarea | Payment notes |

---

### 4.11 MODULE: PropertyTitleDeeds (Folder: 02-Land-Property)

Property title deed management — records ownership transfers and legal instruments for parcels.

#### Section: Parcel Reference
| Field | Type | Notes |
|-------|------|-------|
| Parcel info table | Inline table | Shows: Id, Property registration number, Registration date, Tax status |

#### Section: Property Title Deeds
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Property registration number | Text | Registration reference |
| Effective date | Date | When the deed takes effect |
| Instrument type | Dropdown/Ref | Reference to InstrumentType entity |
| Instrument description | Textarea | Details of the legal instrument |
| Document link | File Upload | Drag & Drop upload for deed document |
| Amount | Decimal/Currency | Transaction amount |
| Change from | Text/Ref | Previous owner/status |
| Change to | Text/Ref | New owner/status |
| Charge date | Date | Date of charge/lien |
| Discharge date | Date | Date charge was discharged |
| Tax status | Dropdown | Tax status of the deed |
| Condition status | Dropdown | Condition of the deed |
| File status | Dropdown/Ref | Reference to FileStatusType |

---

### 4.12 MODULE: Neighborhood (Folder: 02-Land-Property)

Neighborhood registry with built-in valuation banding.

#### Section: Neighborhood Info
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Name | Text | Neighborhood name |
| City | Dropdown/Ref | Reference to City entity |

#### Section: General Info
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Name | Text | |
| Photo | File Upload | Neighborhood photo/image |

#### Section: Presumed Value / Valuation
| Field | Type | Notes |
|-------|------|-------|
| Presumed value | Decimal/Currency | Government-assessed value for the neighborhood |
| Lower | Decimal | Lower bound of valuation range |
| Higher | Decimal | Upper bound of valuation range |
| Band | Text | Valuation band classification |
| Midpointvalue | Decimal | Mid-point value in the range |

#### Band Information (A through F)
Same 6-band structure as District/City:
| Field per band | Type |
|----------------|------|
| Lower limit | Decimal |
| Higher limit | Decimal |
| Width | Decimal |
| Weight | Decimal |
| Mid point value | Decimal |
| Mid point value ratio | Decimal |
| Band sqm values | Decimal |

**List Columns:** Id | Name | Presumed value | Lower | Higher | Band | Midpointvalue

---

### 4.13 MODULE: FeeType (Folder: 02-Land-Property)

Fee type definitions with fixed/variable fee classification.

| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| TypeFee or rate | Text | Name/label of the fee type |
| Is fixed fee | Boolean dropdown | TRUE or FALSE — determines if fee is fixed amount or rate |
| Description | Textarea | Details about the fee type |

---

### 4.14 MODULE: ParcelFee (Folder: 02-Land-Property)

**STATUS: JSP rendering error in original system** — Same rendering bug as Payment module (exception at line 299 in `xava/detail.jsp`). Based on context, Parcel Fees are fee records attached to individual parcels, likely containing:

| Probable Field | Type | Notes |
|----------------|------|-------|
| Id | Auto | |
| Parcel reference | Reference | Link to parcel |
| Fee type | Reference | Link to FeeType entity |
| Amount | Decimal/Currency | Fee amount |
| Date | Date | Fee date |
| Status | Dropdown | Paid, pending, etc. |

---

### 4.15 MODULE: Notary Services (Folder: 03-Notary)

The Notary module group handles legal service transactions. There are three main service modules (GeneralServices, LandAndPropertyServices, VehicleServices) that share a common form structure but with domain-specific fields.

#### 4.15.1 NotaryRegistration — Register Notary Offices

##### Section: 3.1.1-NOTARY-REGISTRATION
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Registation date | Date | Registration date |
| Notary regisration number | Text | Unique notary registration number |
| Notary name | Text | Official notary office name |
| Support documents | File Upload | Drag & Drop |
| Notary type | Dropdown/Ref | Reference to NotaryType entity |
| Street number | Text | |
| Street name | Text | |
| District | Dropdown/Ref | |
| City | Dropdown/Ref | |
| Notary phone number | Text | |
| Email | Text | |

##### Sub-entity: Lawyer
Inline table: Id | Full name | License number

##### Section: Certificate
| Field | Type | Notes |
|-------|------|-------|
| Photo | File Upload | Notary photo |
| Finger print | File Upload | Fingerprint scan |
| Selected certificate form | File Upload | Certificate template selection |
| Updated certificate form | File Upload | Completed certificate |
| Issue date | Date | Certificate issue date |
| Expiry date | Date | Certificate expiry |
| Condition status | Dropdown | Active, suspended, etc. |
| File status | Dropdown/Ref | Reference to FileStatusType |
| Remarks | Textarea | |

#### 4.15.2 NotaryAccount — Notary Financial Accounts

##### Section: Notary Reference
Inline table: Id | Notary name | Notary registration number | License number

##### Section: 3.1.2-NOTARY-ACCOUNT
| Field | Type | Notes |
|-------|------|-------|
| Account registration date | Date | |
| Notary account number | Text | Unique account number |
| Notary regisration number | Text | |
| Notary name | Text | |
| District | Dropdown/Ref | |
| Lawyer name | Text/Ref | |
| Noratry phone number | Text | |
| Noratry email | Text | |

##### Accumulative Fee Tracking:
| Section | Fields |
|---------|--------|
| GENERAL-SERVICES | General service accumulative service tax fee |
| LAND-AND-PROPERTY | Land and property accumulative sale tax fee, Land and property accumulative service tax fee |
| VEHICLES | Vehicle accumulative sale tax fee, Vehicle accumulative service tax fee |

##### Transaction Tabs:
- **GENERAL-SERVICES TRANSACTIONS** — Table: Service date | Reg number | Notary name | Service fee | Service tax rate | Service tax fee
- **LAND-AND-PROPERTY TRANSACTIONS** — Same columns
- **VEHICLE TRANSACTIONS** — Same columns

#### 4.15.3 GeneralServices — Non-Land Notary Services

##### Section: 3.2.1-GENERAL-SERVICES
| Field | Type | Notes |
|-------|------|-------|
| Notary account | Ref selector | Shows: Notary account number, Notary name, Registration number, Accumulative tax fee |
| Id | Auto | |
| Service date | Date | |
| Service refrence number | Text | Unique service reference |
| Reg number | Text | |
| Notary name | Text | |
| Name | Text | Client/applicant name |
| Photo | File Upload | |
| Finger print | File Upload | |
| Support documents | File Upload | |
| Phone | Text | |
| District | Dropdown/Ref | |
| City | Dropdown/Ref | |
| Service type | Dropdown/Ref | Reference to ServiceTypes entity |
| Application form | File Upload | |
| Updated document | File Upload | |
| Service fee | Decimal/Currency | |
| Service tax rate | Decimal/Percentage | |
| Service tax fee | Decimal/Currency | Computed from fee × rate |
| Comments | Textarea | |

#### 4.15.4 LandAndPropertyServices — Land-Related Notary Services

Same form as GeneralServices, plus additional fields:

| Additional Field | Type | Notes |
|------------------|------|-------|
| Parcel | Ref selector | Shows: Id, Property registration number, Registration date, Tax status |
| Plate number | Text | Property plate/survey number |
| Sale price | Decimal/Currency | Property sale amount |
| Sale tax rate | Decimal/Percentage | |
| Sale tax fee | Decimal/Currency | Computed |

#### 4.15.5 VehicleServices — Vehicle-Related Notary Services

Same form as LandAndPropertyServices (includes sale price/tax fields), but for vehicle transactions instead of land.

#### 4.15.6 Notary Lookup Tables

| Module | Fields | Notes |
|--------|--------|-------|
| NotaryType | Id, Typename | Types of notary offices |
| NotaryUser | Id, First name, Middle name, Last name | Staff accounts for notary offices |
| NotaryCertificateFormCategory | Id, Name, Description, Document (file upload) | Certificate template categories |
| ProgramType | Id, Name | Legal program classifications |
| QualificationType | Id, Type | Professional qualification types |
| SalesTaxFee | Id, Fee | Tax fee rate lookup |
| ServiceTypes | Id, Name | Master list of service categories |

#### 4.15.7 LawyerRegistration — Register Legal Practitioners

##### Section: 3.0.1-REGISTRAR-INFORMATION
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Organization name | Text | |
| Registrar full name | Text | |
| Registrar id | Text | |
| Registrar contact info | Text | |
| Registrar phone | Text | |
| Registrar email | Text | |

##### Section: 3.0.2-LAWYER-INFORMATION
| Field | Type | Notes |
|-------|------|-------|
| Lawyer id document type | Dropdown/Ref | Reference to IdentificationDocumentType |
| Lawyer id documen number | Text | |
| Registrationdate | Date | |
| License number | Text | Unique legal license |
| Photo | File Upload | |
| Finger print | File Upload | |
| Support documents | File Upload | |
| Full name | Text | |
| First name | Text | |
| Middle name | Text | |
| Last name | Text | |
| Date of birth | Date | |
| Place of birth | Text | |
| Gender | Dropdown/Ref | |
| Age | Number (computed) | |
| Phone | Text | |
| Email | Text | |

##### Section: 3.0.3-ADDRESS
| Field | Type | Notes |
|-------|------|-------|
| Flat number | Text | |
| Street number | Text | |
| Street name | Text | |
| Location | Text | |
| City | Dropdown/Ref | |
| District | Dropdown/Ref | |
| Postal code | Text | |

##### Section: 3.0.4-CREDENTIAL-INFORMATION
| Field | Type | Notes |
|-------|------|-------|
| Instituation name | Text | Educational institution |
| City of institiuation | Text | |
| Discipline | Text | Field of study |
| Graduation date | Date | |
| Qualification | Dropdown/Ref | Reference to QualificationType |

##### Section: 3.0.5-REMARKS
| Field | Type | Notes |
|-------|------|-------|
| Remarks | Textarea | |

---

### 4.16 MODULE: Business (Folder: 05-Business)

**STATUS: JSP rendering error in original system** — HTTP 500 error: "streetnumber is not recognized as property of view Simple3 of Parcel". The Business module exists but has a configuration bug referencing a non-existent Parcel view property.

Based on context and the sub-modules in the Business folder:

| Probable Field | Type | Notes |
|----------------|------|-------|
| Id | Auto | |
| Business name | Text | |
| Business type | Dropdown/Ref | Reference to BusinessType |
| Business class type | Dropdown/Ref | Reference to BusinessClassType |
| Owner | Ref | Reference to Owner entity |
| Parcel | Ref | Reference to Parcel entity |
| Registration date | Date | |
| License number | Text | |
| Contact person | Ref | Reference to ContactPerson entity |
| Address fields | Text | Street, district, city, etc. |
| Status | Dropdown | Active, suspended, etc. |

#### Business Lookup Tables (all confirmed via crawl)

| Module | Fields | Notes |
|--------|--------|-------|
| BusinessClassType | Id, Business class, Description | Business classification (retail, manufacturing, etc.) |
| BusinessType | Id, Type | Specific business types |
| ContactPerson | Id, First name, Middle name, Last name, Title, Phone, Email | Business contact details |
| OwnerType | Id, Type | Ownership structure (sole proprietor, partnership, etc.) |
| TitleType | Id, Title | Job titles/positions |

---

### 4.17 MODULE: BuildingPermit (Folder: 06-Permits)

Building/construction permit management. **Minimally implemented** in the original system — the form only shows:

| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | Permit identifier |

*The original system appears to have this as a stub/placeholder module that was not fully developed.*

---

### 4.18 MODULE: FinancialInstitution (Folder: 07-Banks)

| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Name | Text | Institution name |
| Financial institution type | Dropdown/Ref | Reference to FinancialInstitutionType |
| Photo | File Upload | Institution logo/image |

#### Lookup Table

| Module | Fields | Notes |
|--------|--------|-------|
| FinancialInstitutionType | Id, Type | Bank, microfinance, cooperative, etc. |

---

### 4.19 MODULE: Utility (Folder: 08-Utility)

#### ElectricityMeter
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Number | Text | Meter serial number |
| Provider | Text | Electricity provider name |

#### WaterMeter
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Number | Text | Meter serial number |
| Provider | Text | Water provider name |

---

### 4.20 MODULE: Vehicles (Folder: 09-Vehicles)

#### Make (Vehicle Manufacturer)
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Photo | File Upload | Manufacturer logo |
| Country | Dropdown/Ref | Country of origin |
| Name | Text | Manufacturer name (Toyota, Ford, etc.) |

**Sub-entity:** Model (inline table: Id, Name)

#### Model (Vehicle Model)
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Name | Text | Model name (Camry, Focus, etc.) |

---

### 4.21 MODULE: PerosnalInformation (Folder: 10-Birth-Personal-ID)

Personal/civil registry module — uses the **same form structure as Owner** (sections 1.1 through 1.5) with full asset listing. This appears to be an alternative view of citizen data that includes all owned parcels, vehicles, and businesses inline.

**Form is identical to Owner module (see section 4.1)** with all 5 sections:
- 1.1 Registrar Info
- 1.2 Owner/Person Info (photo, fingerprint, identity)
- 1.3 Residential Address
- 1.4 Legal Will
- 1.5 Owned Assets (inline: Parcel, Vehicle, Business)

The Parcel inline table within this view shows the complete parcel field set (93+ fields) for each owned parcel.

#### Birth-Personal-ID Lookup Tables (all confirmed via crawl)

| Module | Fields | Notes |
|--------|--------|-------|
| GenderType | Id, Gender | Male, Female, etc. |
| MaritalStatusType | Id, Status | **JSP error** — module has rendering bug ("status is not recognized as property") |
| EducationLevelType | Id, Level | Primary, Secondary, University, etc. |
| ColorType | Id, Color | Physical attribute classifications (eye/hair/skin color) |

---

### 4.22 MODULE: Rentals (Folder: 11-Rentals)

#### Tenant
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Full name | Text | |
| First name | Text | |
| Last name | Text | |
| Phone | Text | |

#### ResidenceType
| Field | Type | Notes |
|-------|------|-------|
| Id | Auto | |
| Name | Text | House, apartment, flat, etc. |

---

### 4.23 Land-Property Lookup Tables (Folder: 02-Land-Property)

All simple lookup/reference entities confirmed via crawl:

| Module | Section Label | Fields | Notes |
|--------|--------------|--------|-------|
| Towinship | General info | Id, Name, District (ref) | Township registry |
| Section | Section info | Id, Section | Survey section |
| Block | Section info | Id, Block | Survey block |
| QuarterSection | QS info | Id, Qs | Quarter section |
| Lot | Section info | Id, Lot | Survey lot |
| Floor | General info | Id, Floor | Floor level |
| Flat | General info | Id, Flat | Flat/apartment unit |
| GeographicZone | General info | Id, G area | Geographic zone area |
| UnitType | Units info | Id, Unit | Measurement unit |
| ValuationMethodType | Info | Id, Valuation method | Appraisal methodology |
| StandardFloorHightRangeType | General info | Id, Value | Floor height standard |
| NumberOfFloors | General info | Id, Value | Floor count option |
| PropertyCategoryType | General info | Id, Type | Property classification |
| ParcelUseType | Parcel use type info | Id, Parcel use type | How parcel is used |
| ParcelType | Parcel type info | Id, Parcel type | Parcel classification |
| OwnerShipType | General info | Id, Otype | Ownership type |
| OccupationType | Section info | Id, Occupation | Occupancy classification |
| LandUseTypes | General info | Id, Utype | Land use zoning |
| InstrumentType | General info | Id, Type | Legal instrument type |
| FileStatusType | General info | Id, Status | Document filing status |
| UrbanAssessmentDiscountRate | Rate info | Id, Discount rate | Urban assessment discount |
| UrbanAssessment | (list view only) | — | Urban tax assessments (no New form available) |
| RuralAssessment | (list view only) | — | Rural tax assessments (no New form available) |
| IdentificationDocumentType | General info | Id, Type | ID document types (passport, national ID) |
| InstitutionType | General info | Id, Name | Institution classifications |
| ServiceType | Section info | Id, Name | Service categories |

---

## 5. DATA MODEL & RELATIONSHIPS

### 5.1 Entity Relationship Diagram (Textual)

```
GEOGRAPHIC HIERARCHY:
Country (1) ──> (N) Region (1) ──> (N) District (1) ──> (N) City
                                          │                   │
                                          ├─ Valuation Bands  ├──> (N) Neighborhood
                                          │  (A-F, 6 bands)   │       ├─ Valuation Bands (A-F)
                                          │                    │       └─ Presumed value, Band
                                          └─ Parcels           └─ Valuation Bands (A-F)

CORE LAND REGISTRY:
Owner (1) ──> (N) Parcel (owned assets)
       │ ──> (N) Vehicle
       │ ──> (N) Business
       └──── Legal Will Contact (emergency contact)

Parcel (1) ──> (1) Owner
        │ ──> (N) ParcelFee
        │ ──> (N) Urban Assessment
        │ ──> (N) Rural Assessment
        │ ──> (N) Payment
        │ ──> (N) PropertyTitleDeeds
        │ ──> (N) Business
        │ ──> (1) Tenant
        │ ──> (1) ElectricityMeter
        │ ──> (1) WaterMeter
        │ ──> (1) District (ref)
        │ ──> (1) City (ref)
        │ ──> (1) Zone (ref)
        │ ──> (1) GeographicZone (ref)
        │ ──> (1) Neighborhood (ref)
        │ ──> (1) Towinship (ref)
        └──── Lookup refs: LandUseTypes, ParcelType, ParcelUseType,
              OwnerShipType, OccupationType, ValuationMethodType,
              PropertyCategoryType, NumberOfFloors,
              StandardFloorHightRangeType + 12 UnitType refs

NOTARY SYSTEM:
NotaryRegistration (1) ──> (1) NotaryType
                    │ ──> (N) Lawyer (inline)
                    └──── NotaryCertificateFormCategory

NotaryAccount (1) ──> (1) NotaryRegistration
              └──> (N) Transactions (General, Land, Vehicle)

GeneralServices ──> (1) NotaryAccount
                ──> (1) ServiceType
LandAndPropertyServices ──> (1) NotaryAccount
                        ──> (1) Parcel
                        ──> (1) ServiceType
VehicleServices ──> (1) NotaryAccount
                ──> (1) ServiceType

LawyerRegistration ──> (1) IdentificationDocumentType
                   ──> (1) QualificationType

VEHICLES:
Make (1) ──> (1) Country (origin)
     └──> (N) Model (inline)

BUSINESS:
Business ──> (1) BusinessType
         ──> (1) BusinessClassType
         ──> (1) Parcel
         ──> (1) Owner
         ──> (N) ContactPerson

FINANCIAL:
FinancialInstitution ──> (1) FinancialInstitutionType

ADMINISTRATION:
User ──> (N) Role (many-to-many)
Role ──> (N) Module Rights (per-module: unrestricted/hidden/read-only)

PerosnalInformation = Owner (same entity, alternate view for civil registry)
```

### 5.2 Complete Lookup/Reference Table Inventory

These appear as dropdown selectors in forms. All confirmed via crawl with exact field names:

**Land & Property Lookups (19 tables):**
- ParcelType (Id, Parcel type)
- ParcelUseType (Id, Parcel use type)
- LandUseTypes (Id, Utype)
- OwnerShipType (Id, Otype)
- OccupationType (Id, Occupation)
- ValuationMethodType (Id, Valuation method)
- PropertyCategoryType (Id, Type)
- NumberOfFloors (Id, Value)
- StandardFloorHightRangeType (Id, Value)
- UnitType (Id, Unit) — used for 12+ measurement fields
- GeographicZone (Id, G area)
- InstrumentType (Id, Type)
- FileStatusType (Id, Status)
- FeeType (Id, TypeFee or rate, Is fixed fee, Description)
- UrbanAssessmentDiscountRate (Id, Discount rate)
- Towinship (Id, Name, District)
- Section (Id, Section)
- Block (Id, Block)
- QuarterSection (Id, Qs)
- Lot (Id, Lot)
- Floor (Id, Floor)
- Flat (Id, Flat)

**Person/Identity Lookups (5 tables):**
- IdentificationDocumentType (Id, Type)
- GenderType (Id, Gender)
- MaritalStatusType (Id, Status) — *has rendering bug*
- EducationLevelType (Id, Level)
- ColorType (Id, Color)

**Business Lookups (4 tables):**
- BusinessType (Id, Type)
- BusinessClassType (Id, Business class, Description)
- OwnerType (Id, Type)
- TitleType (Id, Title)

**Notary Lookups (5 tables):**
- NotaryType (Id, Typename)
- ProgramType (Id, Name)
- QualificationType (Id, Type)
- SalesTaxFee (Id, Fee)
- ServiceType (Id, Name)

**Other Lookups (4 tables):**
- InstitutionType (Id, Name)
- FinancialInstitutionType (Id, Type)
- ResidenceType (Id, Name)
- NotaryCertificateFormCategory (Id, Name, Description, Document)

---

## 6. VALUATION & TAX ASSESSMENT SYSTEM

### 6.1 Banding System
The system uses a sophisticated 6-band (A-F) property valuation system at the District and City level:

Each band defines:
- **Lower limit / Higher limit** — Value range boundaries
- **Width** — Range span
- **Weight** — Band weight factor
- **Mid point value** — Center value of the range
- **Mid point value ratio** — Ratio calculation
- **Band sqm values** — Square meter value for this band

**Base band** defines the foundation:
- Base band name, weight, square meter value, creation date

### 6.2 Tax Calculation
Parcels have:
- **Presumed value** — Government-assessed value
- **Market value** — Current market value
- **Square meter value** — Per-sqm value
- **Area** — Parcel area
- **Taxable value** — Computed from valuation
- **Tax** — Final tax amount
- **Tax status** — Current payment status

### 6.3 Assessment Types
- **Urban Assessment** — For city/urban parcels
- **Rural Assessment** — For rural/agricultural parcels

---

## 7. GEOGRAPHIC & BOUNDARY SYSTEM

### 7.1 Hierarchy
Country → Region → District → City → Neighborhood → Zone

### 7.2 Parcel Boundaries
Parcels record boundaries using cardinal directions:
- East (bari) — Somali terminology
- West (galbeed)
- North (waqooyi)
- South (koonfur)

### 7.3 GPS Integration
- Latitude/Longitude coordinates
- Location precision indicator
- Location map field (image/embedded map)

### 7.4 Land Survey Grid
- Section → Quarter Section → Block → Plot → Lot
- Plan number

---

## 8. DOCUMENT MANAGEMENT

### 8.1 File Upload Capabilities
- Drag & Drop file upload (FilePond library)
- Owner photo
- Owner fingerprint
- Property/parcel documents
- District/Region/City/Country photos

### 8.2 Document Generation
- **PDF Generation** — Export any record or list to PDF
- **Excel Generation** — Export to spreadsheet
- **Import** — Bulk data import capability

---

## 9. LOCALIZATION NOTES

### 9.1 Language Context
The system is designed for **Somalia** (confirmed by project owner):
- Boundary terms in Somali: bari (east), galbeed (west), waqooyi (north), koonfur (south)
- Geographic hierarchy matches Somali federal administrative divisions (Federal Member States → Regions → Districts → Cities → Neighborhoods)
- Township references align with Somali urban planning terminology

### 9.2 Required Languages for New Build
| Language | Code | Script | Direction | Priority |
|----------|------|--------|-----------|----------|
| Somali (af-Soomaali) | so | Latin | LTR | Primary |
| Arabic | ar | Arabic | RTL | Secondary (official language) |
| English | en | Latin | LTR | International reporting / donor interfaces |

### 9.3 Somali Administrative Terminology
| English Term | Somali Term | Usage |
|-------------|-------------|-------|
| East boundary | Bari | Parcel boundaries |
| West boundary | Galbeed | Parcel boundaries |
| North boundary | Waqooyi | Parcel boundaries |
| South boundary | Koonfur | Parcel boundaries |
| District | Degmo | Administrative division |
| Region | Gobol | Administrative division |
| City | Magaalo | Administrative division |
| Neighborhood | Xaafad | Administrative division |
| Owner | Milkiile | Land registry |
| Parcel | Dhul | Land registry |
| Tax | Canshuur | Financial |
| Payment | Lacag bixin | Financial |

### 9.4 Multi-Theme Support
Themes available:
- Dark green (default)
- Light blue
- Red
- Navy blue
- Black & white
- Terra

---

## 10. NON-FUNCTIONAL REQUIREMENTS

### 10.1 Security
- Session-based authentication
- Organization-scoped access
- Role-based module access (unrestricted, hidden, read-only)
- Per-action permission exclusions
- IP allowlisting per user
- LDAP integration option
- Failed login attempt tracking
- Forced password change capability
- Session recording/audit trail

### 10.2 Data Export
- PDF generation for all records
- Excel export for all lists
- Bulk data import

### 10.3 Scalability
- Multi-organization (tenant) support
- Configurable list pagination (5-50 records per page)
- Column visibility management
- Data grouping and sorting

---

## 11. MODULE COVERAGE SUMMARY

All modules have been documented with field-level detail in section 4. This section provides a cross-reference.

### 11.1 Fully Documented Modules (complete field-level specs from crawl)

| # | Module | Section | Fields |
|---|--------|---------|--------|
| 1 | Owner | 4.1 | 37+ fields, 5 sections |
| 2 | Parcel | 4.2 | 93 fields, 20+ sections |
| 3 | Plot | 4.3 | 2 fields |
| 4 | Country | 4.4 | 3 fields + inline Regions |
| 5 | Region | 4.5 | 3 fields + inline Districts |
| 6 | District | 4.6 | 4 fields + 6-band valuation |
| 7 | City | 4.7 | 3 fields + neighborhoods + 6-band valuation |
| 8 | Zone | 4.8 | 2 fields |
| 9 | Tenant | 4.9 / 4.22 | 5 fields |
| 10 | PropertyTitleDeeds | 4.11 | 15 fields |
| 11 | Neighborhood | 4.12 | 5+ fields + 6-band valuation |
| 12 | FeeType | 4.13 | 4 fields |
| 13 | NotaryRegistration | 4.15.1 | 18+ fields |
| 14 | NotaryAccount | 4.15.2 | 8 fields + 3 transaction tabs |
| 15 | GeneralServices | 4.15.3 | 20+ fields |
| 16 | LandAndPropertyServices | 4.15.4 | 25+ fields |
| 17 | VehicleServices | 4.15.5 | 25+ fields |
| 18 | LawyerRegistration | 4.15.7 | 30+ fields, 5 sections |
| 19 | All Notary lookups (7) | 4.15.6 | 2-4 fields each |
| 20 | All Business lookups (5) | 4.16 | 2-7 fields each |
| 21 | BuildingPermit | 4.17 | 1 field (stub) |
| 22 | FinancialInstitution | 4.18 | 4 fields |
| 23 | ElectricityMeter | 4.19 | 3 fields |
| 24 | WaterMeter | 4.19 | 3 fields |
| 25 | Make (vehicle) | 4.20 | 4 fields + inline Models |
| 26 | Model (vehicle) | 4.20 | 2 fields |
| 27 | PerosnalInformation | 4.21 | Same as Owner (37+ fields) |
| 28 | All Birth-ID lookups (4) | 4.21 | 2 fields each |
| 29 | ResidenceType | 4.22 | 2 fields |
| 30 | All Land-Property lookups (25) | 4.23 | 2-3 fields each |
| 31 | User | 2.2 | 20+ fields |
| 32 | Role | 2.3 | 5+ fields + module rights |
| 33 | Admin modules (7) | 11.3 | Described below |

### 11.2 Modules with Known Bugs (in original system)

| Module | Error | Impact |
|--------|-------|--------|
| Payment | JSP exception at line 209/299 | Form cannot render; fields inferred from context |
| ParcelFee | JSP exception at line 299 | Same rendering bug |
| Business | HTTP 500: "streetnumber is not recognized as property of view Simple3 of Parcel" | Parcel reference misconfigured |
| MaritalStatusType | HTTP 500: "status is not recognized as property of view" | View definition bug |
| ServiceTypes | AUTH REQUIRED | Module accessible only via specific permissions |

### 11.3 Admin Modules

| Module | Purpose |
|--------|---------|
| ChangePassword | User password management |
| Folder | Navigation folder management — organizes modules into collapsible groups |
| History | Audit history viewer — shows all data changes with timestamps |
| Module | Module configuration — controls module visibility, names, and ordering |
| MyPersonalData | Current user profile editor |
| Role | Role and permission management (detailed in section 2.3) |
| User | User account administration (detailed in section 2.2) |

---

## 12. RECOMMENDED TECHNOLOGY STACK (New Build)

For rebuilding this system on Replit:

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TailwindCSS + shadcn/ui |
| Routing | wouter |
| State | TanStack Query |
| Backend | Express.js + Node.js |
| Database | PostgreSQL (Drizzle ORM) |
| Auth | express-session + bcrypt |
| Maps | Leaflet + react-leaflet (for GPS/parcel maps) |
| File Upload | multer (server) + FilePond-style drag-drop (client) |
| PDF | jsPDF or PDFKit |
| Excel | ExcelJS or xlsx |
| CSV Import | papaparse |

### Key Design Decisions for New Build:
1. **Multi-tenant** — Organization selector at login, all queries scoped
2. **Role-based** — Granular module/action permissions per role
3. **Responsive** — Mobile-friendly (original was desktop-only)
4. **Dark mode** — Default dark theme with theme switching
5. **RTL support** — If deploying in Arabic-speaking regions
6. **Map integration** — Leaflet for parcel boundary visualization
7. **File storage** — Local filesystem or cloud storage for documents/photos
8. **Valuation engine** — Implement the 6-band tax calculation algorithm
9. **Audit trail** — Log all data changes with user/timestamp

---

## APPENDIX A: COMPLETE MODULE INVENTORY (82+ Modules)

### Confirmed via Direct URL Access (12 modules)
```
Owner, Parcel, Plot, Payment, Zone, District, Tenant,
Country, Region, City, User, Role
```

### Confirmed via Folder Navigation (70+ additional modules)
```
Admin: ChangePassword, Folder, History, Module, MyPersonalData, Role, User
00-Geodata: Country, Region, District, City
01-Owner: IdentificationDocumentType, Owner
02-Land-Property: Towinship, Section, Block, UrbanAssessmentDiscountRate,
  UrbanAssessment, UnitType, ValuationMethodType, StandardFloorHightRangeType,
  Zone, RuralAssessment, QuarterSection, PropertyTitleDeeds,
  PropertyCategoryType, Plot, ParcelUseType, ParcelType, ParcelFee, Parcel,
  OwnerShipType, OccupationType, NumberOfFloors, Neighborhood, Lot,
  LandUseTypes, InstrumentType, GeographicZone, Floor, Flat, FileStatusType,
  FeeType
03-Notary: GeneralServices, LandAndPropertyServices, LawyerRegistration,
  NotaryAccount, NotaryCertificateFormCategory, NotaryRegistration,
  NotaryType, NotaryUser, ProgramType, QualificationType, SalesTaxFee,
  ServiceTypes, VehicleServices
04-Payments: Payment
05-Business: Business, BusinessClassType, BusinessType, ContactPerson,
  OwnerType, TitleType
06-Permits: BuildingPermit
07-Banks: FinancialInstitution, FinancialInstitutionType
08-Utility: ElectricityMeter, WaterMeter
09-Vehicles: Make, Model
10-Birth-Personal-ID: PersonalInformation (Perosnal), GenderType,
  MaritalStatusType, EducationLevelType, ColorType
11-Rentals: Tenant, ResidenceType
Global: InstitutionType
```

## APPENDIX B: TEST CREDENTIALS

- **Organization:** LIMSAPPLICATIONADMINSTRATION
- **Username:** admin
- **Password:** admin

## APPENDIX C: KNOWN BUGS IN EXISTING SYSTEM

1. **Payment module JSP error:** The Payment module throws a server-side exception in `xava/detail.jsp` at line 209. The module loads but cannot render its form view. This appears to be a reference mapping bug in the OpenXava JPA entity definition.

2. **Folder navigation persistence:** Clicking folders in the sidebar does not always update the sub-module list correctly. Some folder IDs require the DWR `naviox.goFolder()` call with specific UUIDs rather than simple click events.

## APPENDIX D: DEVELOPMENT PHASES (Recommended)

### Phase 1: Foundation (Weeks 1-2)
- Database schema design (all lookup tables, core entities)
- Authentication & authorization (multi-org, roles, permissions)
- Admin module (Users, Roles, Folders, Modules)
- Geodata hierarchy (Country → Region → District → City → Neighborhood)

### Phase 2: Core Land Registry (Weeks 3-5)
- Owner module (full 5-section form with photo/fingerprint upload)
- Parcel module (93-field form with all sub-sections)
- All Land-Property lookup tables (30 modules)
- Plot, Zone, Block, Section, Lot, Township management

### Phase 3: Valuation & Tax (Weeks 6-7)
- 6-band valuation system (A-F bands per District/City)
- Urban assessment module with discount rates
- Rural assessment module
- Tax calculation engine
- Fee management (Parcel fees, Fee types)

### Phase 4: Supporting Modules (Weeks 8-10)
- Business registration (6 sub-modules)
- Notary services (13 sub-modules)
- Building permits
- Financial institutions (banks)
- Utility meters (electricity, water)
- Vehicle registration (Make, Model)
- Civil registry / Birth / Personal ID (5 sub-modules)
- Rentals (Tenant, Residence type)

### Phase 5: Advanced Features (Weeks 11-12)
- Payment processing and receipt generation
- Property title deeds and ownership transfers
- PDF/Excel export for all modules
- Bulk data import (CSV/Excel)
- Map integration (Leaflet) for parcel GPS visualization
- Dashboard and reporting
- Audit history/logging
