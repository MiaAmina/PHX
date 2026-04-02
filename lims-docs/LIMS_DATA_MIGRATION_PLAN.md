# LIMS Platform — Data Migration Plan

*Strategy for migrating data from legacy systems (paper, spreadsheets, or existing digital registries) into the new LIMS platform*

---

## 1. MIGRATION OVERVIEW

### 1.1 Migration Scenarios

| Source | Complexity | Timeline | Approach |
|--------|-----------|----------|----------|
| **Legacy LIMS (OpenXava/PostgreSQL)** | Medium | 2-4 weeks | Direct database-to-database migration |
| **Spreadsheets (Excel/CSV)** | Low-Medium | 1-3 weeks | Bulk import with validation |
| **Paper Records** | High | 3-12 months | Digitization campaign with data entry |
| **Other Digital Systems** | Medium-High | 3-6 weeks | API integration or ETL pipeline |
| **Greenfield (no existing data)** | N/A | N/A | Start fresh with lookup table seeding |

### 1.2 Migration Principles

1. **No data loss** — Every record from the source must be accounted for (migrated, rejected with reason, or archived)
2. **Validation first** — All data passes through validation rules before insertion
3. **Audit trail** — Every migration action is logged with timestamp, source record, and outcome
4. **Rollback capability** — Ability to reverse any migration batch
5. **Incremental** — Support for phased migration (e.g., one district at a time)
6. **Parallel operation** — Old and new systems can run simultaneously during transition

---

## 2. PHASE 1: ASSESSMENT & PREPARATION (Weeks 1-2)

### 2.1 Data Inventory

Before migration, conduct a complete inventory of source data:

| Task | Deliverable |
|------|-------------|
| Count records per entity type | Record volume report |
| Identify data quality issues | Quality assessment report |
| Map source fields to LIMS fields | Field mapping document |
| Identify missing/incomplete records | Gap analysis |
| Document data formats and encoding | Format specification |
| Identify duplicate records | Deduplication strategy |

### 2.2 Source-to-Target Field Mapping

#### Example: Owner Entity

| Source Field (Legacy) | Target Field (New LIMS) | Transformation | Validation |
|----------------------|------------------------|----------------|------------|
| owner_id | id | Auto-generate new UUID | N/A |
| first_name | firstName | Trim whitespace, title case | Required, max 100 chars |
| last_name | lastName | Trim whitespace, title case | Required, max 100 chars |
| full_name | fullName | Concat first+middle+last if blank | Required |
| id_doc_type | idDocumentTypeId | Map to lookup table ID | Must match existing type |
| id_number | idDocumentNumber | Uppercase, remove spaces | Required, unique per type |
| dob | dateOfBirth | Parse date format | Valid date, not future |
| gender | genderId | Map M/F/Other to lookup ID | Must match GenderType |
| phone | phone | Format: +XXX-XXX-XXXX | Valid phone format |
| photo_blob | photoUrl | Export to file, store path | Max 5MB, jpg/png |
| fingerprint_blob | fingerprintUrl | Export to file, store path | Max 2MB |

#### Example: Parcel Entity

| Source Field | Target Field | Transformation | Validation |
|-------------|-------------|----------------|------------|
| parcel_id | id | Auto-generate | N/A |
| src_id | srcId | Preserve original | Unique |
| prop_reg_no | propertyRegistrationNumber | Uppercase | Unique, required |
| latitude | latitude | Decimal degrees | -90 to +90 |
| longitude | longitude | Decimal degrees | -180 to +180 |
| district_name | districtId | Lookup by name → ID | Must exist in Districts |
| city_name | cityId | Lookup by name → ID | Must exist in Cities |
| land_width | landWidth | Convert to standard unit | Numeric, positive |
| market_value | marketValue | Convert to base currency | Numeric, positive |
| tax_status | taxStatus | Map text to enum | Valid status value |

### 2.3 Data Cleaning Rules

| Issue | Detection | Resolution |
|-------|-----------|------------|
| Duplicate owners | Match on name + DOB + ID number | Merge records, keep most complete |
| Orphan parcels | Parcel with no matching owner | Flag for manual review |
| Invalid coordinates | Lat/Long outside country bounds | Flag for manual correction |
| Missing required fields | Null checks on mandatory fields | Reject with error report |
| Inconsistent naming | Same entity with different spellings | Standardize with lookup table |
| Invalid dates | Future dates, impossible values | Flag for manual review |
| Encoding issues | Non-UTF8 characters | Convert to UTF-8, flag special chars |
| Currency mismatches | Multiple currencies in amounts | Convert to base currency (SAR/USD) |

---

## 3. PHASE 2: LOOKUP TABLE SEEDING (Week 2)

Before migrating transactional data, all reference/lookup tables must be populated.

### 3.1 Seeding Order (Dependency Chain)

```
TIER 1 — No dependencies (can load in parallel):
  ├── GenderType
  ├── MaritalStatusType
  ├── EducationLevelType
  ├── ColorType
  ├── IdentificationDocumentType
  ├── InstitutionType
  ├── UnitType
  ├── ValuationMethodType
  ├── PropertyCategoryType
  ├── ParcelType
  ├── ParcelUseType
  ├── LandUseTypes
  ├── OwnerShipType
  ├── OccupationType
  ├── InstrumentType
  ├── FileStatusType
  ├── FeeType
  ├── NumberOfFloors
  ├── StandardFloorHightRangeType
  ├── UrbanAssessmentDiscountRate
  ├── NotaryType
  ├── ProgramType
  ├── QualificationType
  ├── SalesTaxFee
  ├── ServiceType
  ├── BusinessType
  ├── BusinessClassType
  ├── OwnerType
  ├── TitleType
  ├── FinancialInstitutionType
  ├── ResidenceType
  └── NotaryCertificateFormCategory

TIER 2 — Depends on Tier 1:
  ├── Country
  ├── FinancialInstitution (→ FinancialInstitutionType)
  └── Make (→ Country)

TIER 3 — Depends on Tier 2:
  ├── Region (→ Country)
  └── Model (→ Make)

TIER 4 — Depends on Tier 3:
  └── District (→ Region, includes Valuation Bands A-F)

TIER 5 — Depends on Tier 4:
  ├── City (→ District, includes Valuation Bands A-F)
  └── Towinship (→ District)

TIER 6 — Depends on Tier 5:
  ├── Neighborhood (→ City, includes Valuation Bands)
  ├── Section
  ├── QuarterSection
  ├── Block
  ├── Lot
  ├── Floor
  ├── Flat
  ├── GeographicZone
  ├── Zone
  └── Plot
```

### 3.2 Seed Data Format

Each lookup table should be provided as a CSV or JSON file:

```csv
# gender_types.csv
id,gender
1,Male
2,Female
3,Other
```

```csv
# unit_types.csv
id,unit
1,Square Meters (sqm)
2,Hectares (ha)
3,Square Feet (sqft)
4,Acres
5,Meters (m)
6,Feet (ft)
7,Centimeters (cm)
```

### 3.3 Valuation Band Seeding

Districts, Cities, and Neighborhoods require 6-band valuation data. Format:

```json
{
  "district": "Mogadishu Central",
  "baseBand": {
    "name": "Standard Urban",
    "weight": 1.0,
    "sqmValue": 250.00,
    "creationDate": "2025-01-15"
  },
  "bands": [
    { "band": "A", "lower": 0, "higher": 50000, "weight": 0.60 },
    { "band": "B", "lower": 50000, "higher": 100000, "weight": 0.80 },
    { "band": "C", "lower": 100000, "higher": 200000, "weight": 1.00 },
    { "band": "D", "lower": 200000, "higher": 350000, "weight": 1.20 },
    { "band": "E", "lower": 350000, "higher": 500000, "weight": 1.40 },
    { "band": "F", "lower": 500000, "higher": 1000000, "weight": 1.60 }
  ]
}
```

---

## 4. PHASE 3: CORE DATA MIGRATION (Weeks 3-5)

### 4.1 Migration Order (Entity Dependencies)

```
STEP 1: Users & Roles
  → Create admin accounts
  → Set up role definitions with module permissions
  → Configure organization settings

STEP 2: Owners
  → Migrate owner records with identity, address, legal will
  → Upload photos and fingerprints to file storage
  → Link to IdentificationDocumentType
  → Generate migration ID mapping (old_id → new_id)

STEP 3: Parcels
  → Migrate parcel records with all 93 fields
  → Link to Owner (using ID mapping from Step 2)
  → Link to District, City, Neighborhood, Zone, etc.
  → Link to all lookup table references
  → Upload location maps and documents

STEP 4: Related Entities (can parallelize)
  → Tenants (link to Parcels)
  → Electricity Meters (link to Parcels)
  → Water Meters (link to Parcels)
  → Businesses (link to Owners + Parcels)
  → Vehicles (link to Owners)

STEP 5: Financial Data
  → Parcel Fees
  → Urban Assessments
  → Rural Assessments
  → Property Title Deeds
  → Payments

STEP 6: Notary Data
  → Lawyer Registrations
  → Notary Registrations
  → Notary Accounts
  → Service Transactions (General, Land, Vehicle)

STEP 7: Validation & Reconciliation
  → Count verification (source vs. target)
  → Sample audit (random 5% spot check)
  → Relationship integrity verification
  → Financial totals reconciliation
```

### 4.2 Migration Script Architecture

```
migration/
├── config.ts                 # Source DB connection, batch sizes, flags
├── mapping/
│   ├── owner-mapping.ts      # Source→target field transforms for Owner
│   ├── parcel-mapping.ts     # Source→target for Parcel
│   ├── notary-mapping.ts     # Source→target for Notary entities
│   └── lookup-mapping.ts     # Lookup table value mappings
├── validators/
│   ├── owner-validator.ts    # Owner data validation rules
│   ├── parcel-validator.ts   # Parcel validation (GPS bounds, required fields)
│   └── financial-validator.ts# Currency, amount, date validations
├── importers/
│   ├── csv-importer.ts       # Parse CSV files with papaparse
│   ├── excel-importer.ts     # Parse Excel with ExcelJS
│   ├── db-importer.ts        # Direct PostgreSQL→PostgreSQL migration
│   └── file-importer.ts      # Photo/document file migration
├── runners/
│   ├── seed-lookups.ts       # Tier 1-6 lookup table seeding
│   ├── migrate-owners.ts     # Owner migration with progress tracking
│   ├── migrate-parcels.ts    # Parcel migration with relationship linking
│   ├── migrate-notary.ts     # Notary system migration
│   └── reconcile.ts          # Post-migration validation
├── reports/
│   ├── migration-log.ts      # Per-record migration outcome log
│   ├── error-report.ts       # Failed records with reasons
│   └── reconciliation.ts     # Source vs. target count comparison
└── index.ts                  # Migration orchestrator (run phases in order)
```

### 4.3 Batch Processing

For large datasets, use batch processing:

```
Configuration:
- Batch size: 500 records per batch
- Parallel batches: 3 concurrent (to avoid DB connection exhaustion)
- Retry on failure: 3 attempts with exponential backoff
- Checkpoint: Save progress every 10 batches (resume from last checkpoint)
- Memory: Stream records rather than loading all into memory
```

### 4.4 File Migration (Photos, Documents, Fingerprints)

| File Type | Source Format | Target Format | Storage |
|-----------|-------------|--------------|---------|
| Owner photos | BLOB in DB or filesystem | JPEG/PNG files | /uploads/owners/{id}/photo.jpg |
| Fingerprints | BLOB in DB | PNG files | /uploads/owners/{id}/fingerprint.png |
| Parcel documents | BLOB or filesystem | Original format | /uploads/parcels/{id}/documents/ |
| Notary certificates | BLOB or filesystem | PDF | /uploads/notary/{id}/certificates/ |
| Location maps | BLOB or filesystem | JPEG/PNG | /uploads/parcels/{id}/map.jpg |

---

## 5. PHASE 4: VALIDATION & RECONCILIATION (Week 5-6)

### 5.1 Automated Validation Checks

| Check | Query | Pass Criteria |
|-------|-------|--------------|
| Record counts | SELECT COUNT(*) from each table | Source count = target count (±rejected) |
| Owner-Parcel links | Owners with no parcels, Parcels with no owner | All parcels have valid owner reference |
| GPS bounds | Latitude/Longitude within country boundaries | 100% within bounds |
| Financial totals | SUM(tax) by district | Source totals = target totals |
| Lookup references | Foreign key integrity on all lookup fields | 0 orphan references |
| File existence | Check every file path exists on disk | 100% files present |
| Duplicate check | Unique constraints on Reg Numbers, IDs | 0 duplicates |
| Date sanity | No future dates, no dates before 1900 | 100% valid |

### 5.2 Manual Validation (Sample Audit)

- Pull 5% random sample from each entity type
- Compare source record to target record field-by-field
- Verify photos and documents are correctly linked
- Check computed fields (age from DOB, tax from valuation)
- Sign off by data owner/registrar

### 5.3 Reconciliation Report

```
═══════════════════════════════════════════════
MIGRATION RECONCILIATION REPORT
Date: 2026-XX-XX
Organization: [Name]
═══════════════════════════════════════════════

ENTITY COUNTS:
  Owners:     Source: 8,234    Target: 8,230    Rejected: 4
  Parcels:    Source: 12,847   Target: 12,845   Rejected: 2
  Businesses: Source: 1,456    Target: 1,456    Rejected: 0
  Payments:   Source: 34,567   Target: 34,567   Rejected: 0
  Deeds:      Source: 5,678    Target: 5,678    Rejected: 0

REJECTIONS:
  Owner #4521: Missing required field 'firstName'
  Owner #6789: Duplicate ID document number
  Owner #7234: Invalid date of birth (future date)
  Owner #8901: Corrupted photo file
  Parcel #2345: GPS coordinates outside country bounds
  Parcel #9012: No matching owner in source data

FINANCIAL RECONCILIATION:
  Total tax assessed: Source $2,345,678.00 = Target $2,345,678.00 ✓
  Total payments:     Source $1,890,234.00 = Target $1,890,234.00 ✓
  Outstanding:        Source $455,444.00   = Target $455,444.00   ✓

FILE MIGRATION:
  Photos:      8,230 / 8,234 (4 corrupted in source)
  Fingerprints: 7,100 / 8,234 (1,134 not captured in source)
  Documents:   15,678 / 15,678 (100%)

STATUS: PASSED (99.97% migration rate)
═══════════════════════════════════════════════
```

---

## 6. PHASE 5: CUTOVER & GO-LIVE (Week 6-7)

### 6.1 Cutover Strategy

| Approach | Description | Risk | Recommendation |
|----------|------------|------|----------------|
| **Big Bang** | Switch from old to new on a single date | High (no fallback) | Not recommended |
| **Parallel Run** | Both systems active for 2-4 weeks | Medium (data sync needed) | Recommended |
| **Phased** | Migrate one district/department at a time | Low | Best for large deployments |

### 6.2 Recommended: Parallel Run with Phased Cutover

```
Week 1: Migrate District A → New system
  - Staff trained on new system
  - New entries go into new system only
  - Old system read-only for District A

Week 2: Migrate District B → New system
  - District A fully operational on new system
  - Old system read-only for District B

Week 3: Migrate remaining districts
  - All staff on new system
  - Old system kept as read-only archive (90 days)

Week 4: Decommission old system
  - Final data export/archive
  - Database backup stored securely
  - DNS/access redirected to new system
```

### 6.3 Rollback Plan

If critical issues arise during cutover:

1. **Data:** PostgreSQL point-in-time recovery from pre-migration backup
2. **Application:** Revert to legacy system (kept in parallel)
3. **Files:** File storage snapshots taken before migration
4. **Decision criteria:** Rollback if >1% data integrity failures or system unavailable >4 hours
5. **Decision authority:** Project lead + IT director + registrar general

### 6.4 Post-Migration Support

| Period | Support Level | Activities |
|--------|-------------|------------|
| Week 1-2 | High (on-site) | Real-time issue resolution, user hand-holding |
| Week 3-4 | Medium (remote + on-site) | Issue tracking, configuration adjustments |
| Month 2-3 | Standard (remote) | Bug fixes, performance tuning, training refreshers |
| Month 4+ | Maintenance | Regular updates, new feature requests |

---

## 7. SPECIAL CONSIDERATIONS

### 7.1 Paper-to-Digital Migration

For jurisdictions converting from paper records:

| Activity | Resources | Duration |
|----------|----------|----------|
| Document scanning | Scanners + operators (1 per 500 records/day) | Varies |
| Data entry | Data entry clerks (1 per 100 records/day) | Varies |
| Photo capture | Digital cameras + photo stations | Field campaign |
| GPS survey | GPS devices + field teams | Field campaign |
| Quality review | Supervisors (1 per 5 operators) | Ongoing |

**Estimation formula:**
- Records to digitize: N
- Data entry rate: 100 records/operator/day
- Operators available: X
- Duration = N / (100 × X) working days
- Example: 50,000 records, 10 operators = 50 working days (10 weeks)

### 7.2 Legacy Database Migration (PostgreSQL to PostgreSQL)

For the existing LIMS system specifically:

```sql
-- Step 1: Export from legacy
pg_dump -h legacy_host -U legacy_user -d lims_db \
  --data-only --format=custom -f legacy_export.dump

-- Step 2: Transform (via migration scripts)
-- Run ETL scripts that read legacy tables and write to new schema

-- Step 3: Verify
-- Run reconciliation queries comparing source and target counts
```

**Key differences between legacy and new schema:**
- Legacy uses OpenXava JPA entity naming → New uses Drizzle ORM naming
- Legacy may have BLOB columns for files → New stores files on disk/cloud
- Legacy uses Java-generated IDs → New uses UUID or serial
- Legacy has view-layer bugs → New schema avoids these patterns

### 7.3 Multi-Organization Migration

When deploying for multiple municipalities:

1. Each organization gets its own lookup table seed data (they may have different fee types, zones, etc.)
2. Geographic data (Country→Region→District→City) is shared across organizations
3. User accounts are organization-scoped
4. Migration runs independently per organization
5. Cross-organization reports aggregate at the national level

### 7.4 Data Privacy & Compliance

| Data Category | Sensitivity | Handling |
|--------------|-------------|----------|
| Owner identity (name, DOB, ID) | High | Encrypted at rest, access logged |
| Fingerprint biometrics | Critical | Encrypted, separate storage, deletion policy |
| Photos | Medium | Access-controlled file storage |
| GPS coordinates | Medium | May be restricted by national security laws |
| Financial data (tax, payments) | High | Encrypted, audit trail required |
| Parcel records | Medium-Low | Public registry in most jurisdictions |

---

## 8. TOOLS & TECHNOLOGIES

| Tool | Purpose |
|------|---------|
| **papaparse** | CSV file parsing for bulk imports |
| **ExcelJS** | Excel file parsing and generation |
| **pg (node-postgres)** | Direct PostgreSQL access for DB-to-DB migration |
| **sharp** | Image processing (resize photos, convert formats) |
| **Drizzle ORM** | Target database operations |
| **Winston/Pino** | Migration logging |
| **Progress bar (cli-progress)** | Terminal progress display during long migrations |

---

## 9. RISK MATRIX

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data quality issues in source | High | Medium | Extensive validation, manual review queue |
| Missing records | Medium | High | Pre-migration inventory, reconciliation checks |
| Performance bottleneck | Medium | Medium | Batch processing, indexing, connection pooling |
| Encoding/character set issues | Medium | Low | UTF-8 conversion, character mapping |
| Corrupted files (photos/docs) | Low | Medium | Skip with error log, re-capture campaign |
| Relationship integrity failures | Medium | High | Dependency-ordered migration, FK validation |
| User resistance to new system | High | Medium | Training, parallel run, responsive support |
| Network issues during migration | Low | Medium | Resumable batches, checkpointing |
