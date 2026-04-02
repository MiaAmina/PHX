# PHX Exchange — Future Features Roadmap

## 1. Foreign Agent Portal
- Dedicated login role for foreign agents (non-Saudi licensed agents)
- Upload pilgrim lists directly to the platform
- Download CSV template with the exact format required
- Track submission status: pending, synced to Nusuk, visa issued
- Link each foreign agent to their Tawafa partner on the platform
- Eliminates email/WhatsApp back-and-forth for pilgrim data

## 2. Smart CSV Column Mapping
- Accept any spreadsheet format from foreign agents (Excel, CSV)
- Interactive column mapper: "this column is passport number, this one is full name"
- Auto-detect common column names across languages (English, Arabic, Urdu, Indonesian)
- Validation preview before import — show errors and warnings before committing
- Tawafa agents no longer need to reformat foreign agent spreadsheets manually

## 3. Tawafa–Foreign Agent Communication Hub
- In-platform messaging between Tawafa and their foreign agents
- Automated notifications: "Your pilgrim list has been received," "3 records failed validation," "Visas issued for 47 pilgrims"
- Document sharing for contracts, authorization letters, and MOU agreements
- Activity timeline showing every interaction for audit purposes

## 4. Public Agent Directory
- Public page where pilgrims can search for verified agents
- Filter by country, language, specialization (Hajj, Umrah, VIP packages)
- Display agent ratings, verified status, and storefront link
- Helps pilgrims find trusted agents without relying on word of mouth

## 5. Advanced File Upload Security (Production)
- File size limits and rate limiting on uploads
- Virus/malware scanning on all uploaded files before processing
- Encrypted storage of pilgrim personal data at rest (AES-256)
- Data residency enforcement — all data hosted on Saudi sovereign cloud
- Automatic PII redaction in logs and error messages
- Compliance with NCA Essential Cybersecurity Controls and NDMO data classification

## 6. Multi-Format Document Import
- Accept Excel (.xlsx), Google Sheets links, and PDF scans in addition to CSV
- OCR processing for scanned pilgrim lists (passport photo pages)
- Auto-extraction of passport data from uploaded passport images
- Reduces manual data entry for both Tawafa and foreign agents

## 7. Mobile Application
- Native iOS and Android apps for agents and Tawafa
- Push notifications for auction updates, booking confirmations, and visa status
- Offline mode for areas with poor connectivity
- QR code scanning for pilgrim check-in at hotels

## 8. SMS and Email Notifications
- Pilgrim booking confirmation via SMS and email
- Visa status updates sent directly to pilgrims
- Auction alerts for brokers (new listings, outbid notifications)
- Escrow release notifications for hotels
- Requires collecting pilgrim contact information during booking

## 9. AI-Driven Capacity Planning
- Predictive analytics for accommodation demand based on historical Hajj data
- Dynamic pricing recommendations for hotels based on supply/demand
- Occupancy forecasting for Ministry planning
- Early warning system for accommodation shortages in specific zones

## 10. Smart Hajj IoT Integration
- Hotel room sensors for automated check-in/check-out verification
- Pilgrim wristband integration for location tracking and emergency services
- Real-time occupancy dashboards for Ministry operations centers
- Automated escrow release triggered by IoT check-in confirmation

## 11. Multi-Language Support Expansion
- Add Bahasa Indonesia, Turkish, Malay, Bengali, and French
- Automated translation of booking vouchers and tax invoices
- Right-to-left and left-to-right layout switching per user preference

## 12. Financial Services Integration
- Integration with Saudi payment gateways (mada, STC Pay, Apple Pay)
- Installment payment plans for pilgrims (Buy Now Pay Later)
- Automated VAT filing with ZATCA Fatoora platform
- Bank reconciliation tools for hotels and brokers
- Multi-currency settlement (pay in local currency, settle in SAR)

## 13. Dispute Resolution Enhancement
- Tiered dispute resolution: auto-resolve, agent mediation, Ministry arbitration
- Photo/video evidence upload for accommodation complaints
- SLA tracking — disputes must be resolved within defined timeframes
- Historical dispute analytics for identifying repeat offenders

## 14. API for Third-Party Integration
- RESTful API for existing Hajj management systems to connect to PHX
- Webhook notifications for real-time event streaming
- Integration with government systems (Absher, Muqeem, Tawakkalna)
- White-label option for Tawafa establishments to embed PHX into their own websites

## 15. Reporting and Analytics Dashboard
- Customizable reports for hotels, brokers, agents, and Ministry
- Export to Excel, PDF, and PowerPoint for presentations
- Year-over-year Hajj season comparison
- Geographic heat maps showing pilgrim origin countries and accommodation zones

## 16. Cryptographic Data Protection Service (`crypto-service.ts`)
- Field-level AES-256 encryption for all sensitive pilgrim data at rest
- Encrypted fields: passport numbers, Nusuk IDs, visa numbers, full names
- Data stored in database as ciphertext — unreadable even if the database is breached
- Decryption happens in application memory only when needed (display, API calls to Nusuk)
- Encryption key stored as environment variable, separate from the database
- Transparent to the rest of the application — encrypt on write, decrypt on read
- Key rotation support — re-encrypt all records with a new key without downtime
- Compliance with Saudi PDPL (Personal Data Protection Law), NDMO data classification, and NCA Essential Cybersecurity Controls
- Audit logging of all decryption events for security monitoring
- PII masking in the UI — display `XXXX-1234` unless user has explicit "PII View" permission

## 17. ZATCA Phase 2 Compliance
- Generate PDF/A-3 archival-grade invoices with UBL 2.1 XML embedded inside the PDF
- Cryptographic stamp (hash + digital signature) on every invoice using ZATCA-issued CSID and private key
- Libraries required: `pdf-lib` (PDF/A-3 generation), `fast-xml-parser` (UBL 2.1 XML), `node-forge` (cryptographic signing)
- ZATCA onboarding script (`scripts/zatca-onboarding.ts`) to exchange OTP for production certificates
- CSID and private key stored as environment variables, rotated per ZATCA renewal schedule
- Replaces current simplified invoice generation with full Phase 2 clearance/reporting model

## 18. NCA ECC-1:2018 Cybersecurity Hardening
- Immutable audit logs — revoke DELETE permissions on `system_logs` table in production; no admin can erase the trail
- Role-based session timeouts — 15-minute inactivity timeout for admin roles, 30 minutes for other roles
- Security disclosure file (`public/.well-known/security.txt`) for responsible vulnerability reporting
- Compliance mapping document linking each ECC control to the corresponding PHX feature

## 19. NDMO Data Residency & Classification
- Data classification framework applied to all database tables:
  - Level 1 (Public): Hotel names, general rates, auction listings
  - Level 2 (Internal): Booking counts, revenue figures, platform analytics
  - Level 3 (Sensitive/Personal): Pilgrim names, passport numbers, visa numbers, payment records
- Level 3 data must not leave Saudi borders — enforced by deploying to Saudi sovereign cloud (STC Cloud, Oracle Jeddah, SDAIA)
- S3-compatible object storage for passport uploads hosted in Saudi region only
- Data residency audit trail — log the geographic origin of every data access request

## 20. Production Deployment Infrastructure
- Dockerfile and .dockerignore for containerized deployment to Saudi cloud providers
- PM2 ecosystem configuration (`ecosystem.config.js`) for VPS-based deployments with auto-restart
- Kubernetes manifests for scaling during Hajj season (horizontal pod autoscaler)
- CI/CD pipeline configuration for automated testing and deployment

## 21. Account Security Hardening
- Email verification — require email confirmation before account activation to prevent fake accounts
- CAPTCHA on registration — block bot-driven account creation (Google reCAPTCHA or hCaptcha)
- Brute force lockout — lock account after 5 consecutive failed login attempts (30-minute cooldown)
- Two-factor authentication (2FA) — optional or mandatory TOTP-based 2FA, especially for Admin role
- IP-based tracking — flag suspicious patterns (multiple accounts from same IP, geographic anomalies)
- Password strength enforcement — minimum length, complexity rules, common password blacklist

## 22. Pilgrim Account Portal
- Pilgrims create accounts to track all their bookings in one place
- Booking history with visa status across multiple agents/seasons
- Contact information collection for SMS/email notifications

## 23. Advanced Marketplace Features
- Advanced search and filters — distance, star rating, room type, price range
- Booking calendar view — visual availability across dates
- Favorites and watchlist — agents save preferred blocks, get price change alerts
- Reviews and ratings — post-stay agent ratings on hotel quality and accuracy

## 24. Storefront Enhancements
- Custom branding — agent uploads logo, sets colors, optional custom domain
- Storefront analytics — page views, conversion rates, popular room types
- Multi-language auto-detection — pilgrim-facing pages detect browser language
