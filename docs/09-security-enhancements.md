# PHX Exchange — Future Features & Enhancements

This document tracks planned improvements, security hardening, and feature additions for future development phases.

---

## 1. Security Hardening

| Priority | Feature | Description | Status |
|----------|---------|-------------|--------|
| HIGH | Email Verification | Require email confirmation before account activation — prevents fake account creation | PLANNED |
| HIGH | CAPTCHA on Registration | Add CAPTCHA (e.g., Google reCAPTCHA or hCaptcha) to block bot-driven account creation | PLANNED |
| HIGH | Brute Force Lockout | Lock account after X consecutive failed login attempts (e.g., 5 failures = 30-minute lockout) | PLANNED |
| HIGH | Two-Factor Authentication (2FA) | Optional or mandatory TOTP-based 2FA for all roles, especially Admin | PLANNED |
| MEDIUM | IP-Based Tracking | Track and flag suspicious IP patterns (multiple accounts from same IP, geo-anomalies) | PLANNED |
| MEDIUM | Session Timeout | Auto-logout after period of inactivity (e.g., 30 minutes for financial roles) | PLANNED |
| MEDIUM | Password Strength Enforcement | Minimum length, complexity requirements, and common password blacklist | PLANNED |
| LOW | Audit Log for Auth Events | Log all login attempts, password changes, and session events to system_logs | PLANNED |

---

## 2. Notifications & Communication

| Priority | Feature | Description | Status |
|----------|---------|-------------|--------|
| HIGH | Email Notifications | Transactional emails for booking confirmations, dispute updates, escrow releases | PLANNED |
| HIGH | SMS Notifications | SMS alerts for critical events (visa issued, escrow released, dispute filed) | PLANNED |
| MEDIUM | In-App Notification Center | Bell icon with unread count, notification history, mark-as-read | PLANNED |
| MEDIUM | WhatsApp Business Integration | Send booking confirmations and visa updates via WhatsApp API | PLANNED |
| LOW | Push Notifications | Browser push notifications for real-time auction updates | PLANNED |

---

## 3. Payment & Financial

| Priority | Feature | Description | Status |
|----------|---------|-------------|--------|
| HIGH | Real Payment Gateway | Integrate with SADAD, Mada, or HyperPay for actual SAR transactions | PLANNED |
| HIGH | Bank Transfer Verification | Automated bank transfer matching for escrow funding | PLANNED |
| MEDIUM | Auto-Reconciliation | Daily reconciliation reports matching wallet balances to escrow records | PLANNED |
| MEDIUM | Refund Automation | Automated refund processing when disputes are resolved in agent's favor | PLANNED |
| LOW | Multi-Currency Wallets | Separate wallet balances per currency instead of SAR-only conversion | PLANNED |

---

## 4. Compliance & Regulatory

| Priority | Feature | Description | Status |
|----------|---------|-------------|--------|
| HIGH | Live Nusuk API Integration | Replace simulation mode with real Ministry of Hajj Nusuk Masar API | PLANNED |
| HIGH | Live ZATCA E-Invoicing | Connect to ZATCA Fatoorah platform for real-time invoice clearance | PLANNED |
| HIGH | KYC/KYB Verification | Automated business verification via commercial registry API lookups | PLANNED |
| MEDIUM | Document Expiry Alerts | Email/SMS warnings 30/14/7 days before license expiry with auto-suspension | PLANNED |
| MEDIUM | GDPR/PDPL Data Retention | Automated data purging for pilgrim PII after configurable retention period | PLANNED |
| LOW | Audit Export | One-click export of all compliance data for regulatory inspections | PLANNED |

---

## 5. Platform Features

| Priority | Feature | Description | Status |
|----------|---------|-------------|--------|
| HIGH | Hotel Image Gallery | Multiple photos per hotel with room-level images | PLANNED |
| MEDIUM | Auction Templates | Hotels can save and reuse auction configurations | PLANNED |
| MEDIUM | Advanced Search & Filters | Filter marketplace by distance, star rating, room type, price range | PLANNED |
| MEDIUM | Booking Calendar View | Visual calendar showing room availability across dates | PLANNED |
| MEDIUM | Bulk Auction Creation | Hotels create multiple room type auctions in one flow | PLANNED |
| LOW | Favorites & Watchlist | Agents can save preferred blocks and get alerts on price changes | PLANNED |
| LOW | Reviews & Ratings | Post-stay ratings from agents on hotel quality and accuracy | PLANNED |
| LOW | Analytics Dashboard | Charts and trends for each role (revenue over time, booking patterns) | PLANNED |

---

## 6. Mobile & Accessibility

| Priority | Feature | Description | Status |
|----------|---------|-------------|--------|
| MEDIUM | Mobile-Responsive Optimization | Full responsive testing and fixes for all pages on mobile/tablet | PLANNED |
| MEDIUM | Progressive Web App (PWA) | Installable PWA with offline support for key pages | PLANNED |
| LOW | Native Mobile App | React Native app for agents and pilgrims | PLANNED |
| LOW | Screen Reader Accessibility | WCAG 2.1 AA compliance audit and fixes | PLANNED |

---

## 7. Operations & Scalability

| Priority | Feature | Description | Status |
|----------|---------|-------------|--------|
| HIGH | Saudi Cloud Migration | Move hosting to Saudi-based cloud (STC Cloud, Alibaba Cloud KSA) for data residency | PLANNED |
| MEDIUM | Database Read Replicas | Read replicas for reporting queries to reduce primary DB load | PLANNED |
| MEDIUM | CDN for Static Assets | CloudFront or equivalent for hotel images and PDF downloads | PLANNED |
| MEDIUM | Automated Backups | Scheduled pg_dump with point-in-time recovery | PLANNED |
| LOW | Horizontal Scaling | Stateless session store (Redis) to enable multi-instance deployment | PLANNED |
| LOW | CI/CD Pipeline | Automated testing and deployment on merge to main | PLANNED |

---

## 8. Storefront Enhancements

| Priority | Feature | Description | Status |
|----------|---------|-------------|--------|
| MEDIUM | Custom Branding | Agent uploads logo, sets colors, custom domain for storefront | PLANNED |
| MEDIUM | Pilgrim Account Portal | Pilgrims create accounts to track all their bookings in one place | PLANNED |
| LOW | Storefront Analytics | Page views, conversion rates, popular room types for agents | PLANNED |
| LOW | Multi-Language Storefront | Pilgrim-facing pages auto-detect browser language | PLANNED |

---

*Last updated: March 2026*
