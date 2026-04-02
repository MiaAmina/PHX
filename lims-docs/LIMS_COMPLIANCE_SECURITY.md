# LIMS Platform — Compliance & Security Document

*Data protection, security architecture, and regulatory compliance framework*

---

## 1. EXECUTIVE OVERVIEW

The LIMS platform handles sensitive government data including citizen identity information, biometric data (photos, fingerprints), land ownership records, financial transactions, and tax assessments. This document defines the security architecture, data protection policies, and compliance framework required for production deployment.

---

## 2. DATA CLASSIFICATION

### 2.1 Data Sensitivity Levels

| Level | Classification | Examples | Handling Requirements |
|-------|---------------|----------|----------------------|
| **CRITICAL** | Biometric & Authentication | Fingerprints, passwords, session tokens | Encrypted at rest + in transit, access logging, retention limits, separate storage |
| **HIGH** | Personal Identity | Full names, DOB, ID numbers, photos, addresses, phone numbers | Encrypted at rest, access controls, audit trail |
| **HIGH** | Financial | Tax amounts, payment records, valuations, notary fees | Encrypted at rest, dual-authorization for changes, audit trail |
| **MEDIUM** | Property Records | Parcel details, GPS coordinates, boundaries, dimensions | Access-controlled, audit trail |
| **LOW** | Reference Data | Lookup tables (unit types, categories, zones) | Standard access controls |
| **LOW** | System Data | Logs, configuration, module definitions | Admin-only access |

### 2.2 Data Inventory

| Data Category | Volume (Typical) | Retention | Owner |
|--------------|-----------------|-----------|-------|
| User accounts | 50-500 | Active + 2 years after deactivation | IT Admin |
| Owner records | 5,000-500,000 | Permanent (land registry) | Registrar General |
| Parcel records | 10,000-1,000,000 | Permanent (land registry) | Registrar General |
| Biometric data | 5,000-500,000 | Active + 5 years post-deletion | Data Protection Officer |
| Financial records | 10,000-5,000,000 | 7 years minimum (tax law) | Finance Director |
| Notary transactions | 1,000-100,000 | 10 years minimum (legal) | Notary Registrar |
| Audit logs | Unlimited | 5 years minimum | IT Admin |
| System logs | Rolling | 90 days active, 1 year archive | IT Admin |

---

## 3. SECURITY ARCHITECTURE

### 3.1 Authentication

| Feature | Implementation |
|---------|---------------|
| **Authentication method** | Session-based with bcrypt-hashed passwords |
| **Password requirements** | Minimum 8 characters, mixed case + number + special character |
| **Password storage** | bcrypt with cost factor 12 (never stored in plaintext) |
| **Session management** | Server-side sessions with secure, httpOnly, sameSite cookies |
| **Session timeout** | 30 minutes idle, 8 hours absolute maximum |
| **Failed login handling** | Account lockout after 5 failed attempts (30-minute cooldown) |
| **Multi-organization** | Organization context required at login, scopes all data access |
| **Force password change** | Admin can require password change on next login |
| **LDAP integration** | Optional — delegate authentication to enterprise directory |

### 3.2 Authorization

| Level | Mechanism |
|-------|-----------|
| **Organization scoping** | All queries filtered by organization ID — no cross-org data access |
| **Role-based access** | Users assigned to roles, roles define module permissions |
| **Module-level permissions** | Per module: Unrestricted, Read-only, or Hidden |
| **Action-level exclusions** | Per module per role: exclude specific actions (New, Save, Delete, Export) |
| **IP allowlisting** | Optional per-user IP restriction |
| **Time-based access** | Optional start/end dates for user accounts |

### 3.3 Authorization Matrix (Default Roles)

| Module | Admin | Registrar | Tax Collector | Data Entry | Viewer |
|--------|-------|-----------|--------------|------------|--------|
| User Management | Full | Hidden | Hidden | Hidden | Hidden |
| Role Management | Full | Hidden | Hidden | Hidden | Hidden |
| Owner | Full | Full | Read-only | Full | Read-only |
| Parcel | Full | Full | Read-only | Full | Read-only |
| Payment | Full | Read-only | Full | No Delete | Read-only |
| Valuation Bands | Full | Full | Read-only | Hidden | Hidden |
| Notary Services | Full | Full | Read-only | No Delete | Read-only |
| Business | Full | Full | Read-only | Full | Read-only |
| System Logs | Full | Read-only | Hidden | Hidden | Hidden |
| Audit History | Full | Read-only | Read-only | Hidden | Hidden |

### 3.4 Data Protection — Encryption

| Layer | Method | Details |
|-------|--------|---------|
| **In transit** | TLS 1.2+ (HTTPS) | All client-server communication encrypted |
| **At rest — Database** | PostgreSQL Transparent Data Encryption (TDE) or disk encryption | AES-256 |
| **At rest — Files** | Encrypted filesystem or cloud storage encryption | AES-256 |
| **At rest — Backups** | Encrypted backup archives | AES-256, separate key storage |
| **Passwords** | bcrypt (one-way hash) | Cost factor 12, not reversible |
| **Session tokens** | Cryptographically random | 256-bit entropy |

### 3.5 Network Security

| Control | Implementation |
|---------|---------------|
| **HTTPS only** | HTTP redirects to HTTPS, HSTS header enabled |
| **CORS** | Restricted to application domain only |
| **Rate limiting** | Auth: 10 requests/15 min, API: 100 requests/15 min, Public: 30 requests/15 min |
| **Request validation** | Zod schema validation on all API inputs |
| **SQL injection prevention** | Parameterized queries via Drizzle ORM (no raw SQL) |
| **XSS prevention** | React auto-escapes output, CSP headers |
| **CSRF protection** | SameSite cookies + CSRF token on state-changing requests |
| **File upload validation** | Type checking, size limits, virus scanning (recommended) |
| **Headers** | X-Content-Type-Options, X-Frame-Options, Referrer-Policy |

### 3.6 Infrastructure Security

| Control | Implementation |
|---------|---------------|
| **Hosting** | Cloud provider with SOC 2 / ISO 27001 certification |
| **Database access** | Private network only — no public internet exposure |
| **SSH access** | Key-based only, no password authentication |
| **Firewall** | Allowlist: port 443 (HTTPS) only from public internet |
| **OS patching** | Automated security updates, monthly full patch cycle |
| **Dependency scanning** | npm audit on every deployment, Dependabot/Snyk integration |
| **Container isolation** | Application runs in isolated container/VM |
| **Secrets management** | Environment variables, never committed to source code |

---

## 4. AUDIT & LOGGING

### 4.1 Audit Trail Requirements

Every data modification must be logged with:

| Field | Description |
|-------|-------------|
| Timestamp | UTC timestamp of the action |
| User ID | Who performed the action |
| Organization | Which organization context |
| Action | CREATE, UPDATE, DELETE, VIEW (sensitive data) |
| Entity type | Owner, Parcel, Payment, etc. |
| Entity ID | Record identifier |
| Field changes | Old value → New value (for updates) |
| IP address | Client IP address |
| User agent | Browser/client identifier |

### 4.2 Audit Log Retention

| Log Type | Active Storage | Archive Storage | Total Retention |
|----------|---------------|----------------|-----------------|
| Data changes | 1 year | 4 years (compressed) | 5 years |
| Authentication events | 6 months | 18 months | 2 years |
| System errors | 90 days | 270 days | 1 year |
| Access logs | 90 days | 270 days | 1 year |
| Financial transactions | 2 years | 5 years | 7 years |

### 4.3 Monitoring & Alerting

| Event | Alert Level | Response |
|-------|------------|----------|
| 5 failed login attempts | Warning | Account lockout, notify admin |
| 10+ failed logins from same IP | Critical | IP block, security review |
| Admin account access outside hours | Warning | Notify security team |
| Bulk data export (>1000 records) | Info | Log and notify admin |
| Database connection failure | Critical | Auto-restart, page on-call |
| Unauthorized module access attempt | Warning | Log, notify admin |
| SSL certificate expiring (<30 days) | Warning | Auto-renew or notify ops |
| Disk usage >80% | Warning | Notify ops, plan expansion |

---

## 5. REGULATORY COMPLIANCE

### 5.1 Applicable Regulations by Region

| Region | Regulation | Key Requirements |
|--------|-----------|-----------------|
| **Global** | ISO 27001 | Information security management system |
| **Global** | ISO 19152 (LADM) | Land Administration Domain Model standard |
| **Somalia (Primary)** | Provisional Constitution (Article 26) | Right to property ownership; government duty to protect property rights |
| **Somalia** | National Communications Act | Governs electronic data; data sovereignty requirements |
| **Somalia** | FGS Data Governance (emerging) | Government data must be stored under Somali jurisdiction or authorized partners |
| **Somalia** | Sharia-compliant provisions | Land inheritance, family property divisions must align with Islamic law where applicable |
| **Somalia** | FMS Administrative Laws | Each Federal Member State has authority over local land administration |
| **EU (if donor-funded)** | GDPR | Data protection if EU-funded programs require compliance; right to erasure, DPO |
| **East Africa** | EAC Data Protection Framework | Cross-border data transfer rules (relevant for expansion) |
| **Kenya** | Kenya Data Protection Act 2019 | Consent, data minimization, breach notification (expansion market) |

### 5.2 Somalia-Specific Compliance Considerations

| Requirement | Implementation |
|------------|----------------|
| **Data sovereignty** | Production data hosted in-country or in approved jurisdiction (currently no Somali data center — use UAE/Kenya with FGS approval) |
| **Multi-authority structure** | FGS and FMS both have jurisdiction — system must support federal/state-level data separation |
| **Clan sensitivity** | Ownership data must not expose clan affiliations; access controls prevent unauthorized demographic analysis |
| **IDP (displaced persons) data** | Special handling for land claims by internally displaced persons — immutable historical records |
| **Islamic inheritance** | System should support Sharia-compliant property division calculations (future feature) |
| **Bilingual** | All official records in both Somali (af-Soomaali) and Arabic; English for international reporting |
| **Conflict sensitivity** | "Do no harm" principle — data must not be weaponizable for land grabbing or targeting |
| **Donor reporting** | If funded by World Bank/UN, must meet their data handling and transparency standards |
| **Mobile money integration** | Payment records must comply with Central Bank of Somalia mobile money regulations |

### 5.3 GDPR Compliance (if deploying in EU-connected contexts)

| Requirement | Implementation |
|------------|----------------|
| **Lawful basis** | Public task (government land administration) or consent |
| **Data minimization** | Only collect fields required for land registration |
| **Right to access** | Users can request export of all their personal data |
| **Right to rectification** | Users can request correction of inaccurate data |
| **Right to erasure** | Limited — land registry data may be exempt as public record |
| **Data portability** | Export personal data in machine-readable format (JSON/CSV) |
| **Breach notification** | 72-hour notification to supervisory authority |
| **DPO** | Data Protection Officer appointed for government deployments |
| **Privacy Impact Assessment** | Required before processing biometric data |
| **Records of processing** | Maintained via audit trail system |

### 5.4 Data Sovereignty & Localization

Some countries require government data to be stored within national borders:

| Requirement | Implementation |
|------------|----------------|
| **In-country hosting** | Deploy on local cloud provider or government data center |
| **Cross-border transfer** | Restrict data export, require authorization for international transfers |
| **Backup location** | Backups stored in-country or in approved jurisdiction |
| **Personnel access** | Only authorized nationals can access production data |
| **Subprocessor agreements** | Cloud providers must sign data processing agreements |

### 5.5 Land-Specific Compliance

| Requirement | Implementation |
|------------|----------------|
| **Public registry** | Certain land records must be publicly searchable (title, ownership) |
| **Immutability** | Historical ownership records must not be deletable |
| **Legal weight** | Digital records must have same legal standing as paper |
| **Witness/attestation** | Some transactions require digital signatures or witness records |
| **Stamp duty** | Property transfers may require stamp duty calculation and payment |
| **Survey standards** | GPS coordinates must meet national survey accuracy standards |

---

## 6. BIOMETRIC DATA HANDLING

### 6.1 Special Requirements for Fingerprints and Photos

Biometric data receives the highest level of protection:

| Control | Implementation |
|---------|---------------|
| **Separate storage** | Biometric files stored in separate encrypted volume |
| **Access logging** | Every access to biometric data logged with purpose |
| **Retention limit** | Deleted 5 years after record deactivation (configurable) |
| **Consent** | Explicit consent recorded before biometric capture |
| **Purpose limitation** | Used only for identity verification, not shared externally |
| **Encryption** | AES-256 encryption for stored biometric files |
| **Transmission** | Only transmitted over encrypted channels (TLS 1.2+) |
| **No third-party sharing** | Biometric data never shared with external parties |
| **Deletion** | Secure deletion (overwrite) when retention period expires |

### 6.2 Biometric Capture Best Practices

| Practice | Details |
|----------|---------|
| Photo quality | Minimum 300x300px, JPEG, max 5MB, neutral background |
| Fingerprint quality | Minimum 500 DPI, PNG format, max 2MB |
| Capture environment | Well-lit, standardized positioning |
| Fallback | System must function without biometrics (for accessibility) |

---

## 7. BACKUP & DISASTER RECOVERY

### 7.1 Backup Strategy

| Component | Frequency | Retention | Method |
|-----------|-----------|-----------|--------|
| **Database (full)** | Daily | 30 days | pg_dump, compressed, encrypted |
| **Database (incremental)** | Every 6 hours | 7 days | WAL archiving |
| **File storage** | Daily | 30 days | Filesystem snapshot |
| **Configuration** | On change | 90 days | Git version control |
| **Audit logs** | Daily | 5 years | Compressed archive |

### 7.2 Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| **RPO (Recovery Point Objective)** | 6 hours | Maximum data loss acceptable |
| **RTO (Recovery Time Objective)** | 4 hours | Maximum downtime before recovery |
| **MTTR (Mean Time to Repair)** | 2 hours | Average time to resolve incidents |

### 7.3 Disaster Recovery Plan

| Scenario | Response | Recovery Time |
|----------|----------|--------------|
| **Database corruption** | Restore from latest backup | 1-2 hours |
| **Server failure** | Failover to standby, restore from backup | 2-4 hours |
| **Data center outage** | Activate DR site with replicated data | 4-8 hours |
| **Ransomware/breach** | Isolate, restore from clean backup, forensic analysis | 8-24 hours |
| **Natural disaster** | Activate geographically separate DR site | 24-48 hours |

### 7.4 Backup Testing

| Test | Frequency | Procedure |
|------|-----------|-----------|
| Backup verification | Weekly | Automated: verify backup file integrity |
| Restore test (database) | Monthly | Restore to staging environment, verify data |
| Full DR simulation | Annually | Simulate complete failure, activate DR, verify recovery |

---

## 8. INCIDENT RESPONSE

### 8.1 Incident Classification

| Severity | Definition | Response Time | Examples |
|----------|-----------|--------------|----------|
| **P1 — Critical** | System down, data breach, or data loss | 15 minutes | Database compromise, ransomware, total outage |
| **P2 — High** | Major feature unavailable, security vulnerability | 1 hour | Authentication failure, payment processing down |
| **P3 — Medium** | Degraded performance, non-critical bug | 4 hours | Slow queries, file upload issues |
| **P4 — Low** | Minor issue, cosmetic problem | 24 hours | UI glitch, report formatting issue |

### 8.2 Data Breach Response Plan

```
STEP 1: DETECT & CONTAIN (0-1 hour)
  → Identify the breach vector
  → Isolate affected systems
  → Preserve evidence (logs, snapshots)
  → Disable compromised accounts

STEP 2: ASSESS (1-4 hours)
  → Determine scope (what data was accessed/exfiltrated)
  → Identify affected individuals
  → Assess regulatory notification requirements

STEP 3: NOTIFY (4-72 hours)
  → Internal: Executive team, legal counsel
  → Regulatory: Data protection authority (within 72 hours if GDPR applies)
  → Affected individuals: If high risk to rights and freedoms
  → Law enforcement: If criminal activity suspected

STEP 4: REMEDIATE (1-7 days)
  → Patch vulnerability
  → Reset affected credentials
  → Review and strengthen controls
  → Update monitoring rules

STEP 5: POST-INCIDENT (7-30 days)
  → Root cause analysis
  → Lessons learned document
  → Update incident response plan
  → Staff training/awareness
```

---

## 9. DEVELOPMENT SECURITY PRACTICES

### 9.1 Secure Development Lifecycle

| Phase | Security Activity |
|-------|------------------|
| **Design** | Threat modeling, security requirements definition |
| **Development** | Secure coding standards, input validation, parameterized queries |
| **Code Review** | Peer review with security checklist |
| **Testing** | Automated security scanning (SAST), dependency vulnerability checking |
| **Deployment** | Environment hardening, secrets management, access controls |
| **Operations** | Monitoring, log analysis, vulnerability patching |

### 9.2 Secure Coding Standards

| Rule | Implementation |
|------|---------------|
| No hardcoded secrets | All credentials via environment variables |
| Input validation | Zod schemas on every API endpoint |
| Output encoding | React auto-escaping, no dangerouslySetInnerHTML |
| Parameterized queries | Drizzle ORM (no raw SQL string concatenation) |
| Error handling | Generic error messages to users, detailed logs internally |
| Dependency management | Lock files committed, weekly audit, auto-update for patches |
| File upload security | Whitelist extensions, check MIME types, size limits, no execution |
| API authentication | Every endpoint checks session, verifies organization scope |

### 9.3 Code Review Security Checklist

- [ ] No secrets or credentials in source code
- [ ] All inputs validated with Zod schemas
- [ ] SQL queries use parameterized ORM methods
- [ ] File uploads validated (type, size, content)
- [ ] Authorization checks on every API endpoint
- [ ] Organization scoping on all database queries
- [ ] Error messages don't expose internal details
- [ ] Sensitive data not logged (passwords, tokens, biometrics)
- [ ] CORS and security headers properly configured
- [ ] Rate limiting applied to authentication endpoints

---

## 10. COMPLIANCE CERTIFICATION ROADMAP

### 10.1 Recommended Certifications

| Certification | Priority | Timeline | Purpose |
|--------------|----------|----------|---------|
| **ISO 27001** | High | 6-12 months | Information security management — required by most governments |
| **SOC 2 Type II** | Medium | 6-12 months | Trust service criteria — valuable for international clients |
| **ISO 19152 (LADM)** | Medium | 3-6 months | Land administration domain model compliance |
| **Country-specific** | High | Varies | National data protection registration |

### 10.2 Pre-Certification Checklist

- [ ] Information Security Policy documented
- [ ] Data classification scheme implemented
- [ ] Access control policies defined and enforced
- [ ] Encryption implemented (at rest and in transit)
- [ ] Audit logging operational
- [ ] Backup and recovery tested
- [ ] Incident response plan documented and tested
- [ ] Security awareness training for all staff
- [ ] Vulnerability management process established
- [ ] Third-party/vendor security assessments conducted
- [ ] Physical security controls at data center
- [ ] Business continuity plan documented

---

## 11. SUMMARY OF SECURITY CONTROLS

| Domain | Controls Implemented |
|--------|---------------------|
| **Authentication** | Bcrypt passwords, session management, lockout, LDAP optional |
| **Authorization** | Multi-tenant, RBAC, module/action-level, IP restriction |
| **Encryption** | TLS 1.2+ in transit, AES-256 at rest, bcrypt for passwords |
| **Audit** | Full change tracking, authentication logging, access logging |
| **Network** | HTTPS-only, CORS, rate limiting, security headers, CSP |
| **Application** | Input validation, parameterized queries, XSS prevention, CSRF |
| **Data** | Classification, retention policies, biometric special handling |
| **Backup** | Daily full, 6-hour incremental, 30-day retention, encrypted |
| **Disaster Recovery** | 6-hour RPO, 4-hour RTO, annual DR testing |
| **Incident Response** | 4-tier severity, breach response plan, 72-hour notification |
| **Compliance** | GDPR-ready, ISO 27001 roadmap, data sovereignty support |
| **Development** | Secure SDLC, code review checklist, dependency scanning |
