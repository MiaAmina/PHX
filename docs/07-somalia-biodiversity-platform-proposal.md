# iKoor: A Digital Biodiversity Observation Platform for Somalia

## Funding Proposal

---

## 1. Executive Summary

Somalia possesses one of the most ecologically diverse yet least documented environments in the Horn of Africa. From the coral reefs of the Indian Ocean coastline to the acacia woodlands of the interior, the juniper forests of the Cal Madow mountains, and the unique desert ecosystems of the north — Somalia's biodiversity is vast, vulnerable, and largely unmapped in any digital system.

**iKoor** is a proposed digital platform that enables citizens, researchers, conservation workers, and government agencies to document, identify, and track wildlife and plant species across Somalia. Inspired by the global success of iNaturalist (which has catalogued over 150 million observations worldwide), iKoor adapts this model for the Somali context — with offline-first capability, Somali and Arabic language support, integration with Important Bird Area (IBA) mapping, and alignment with Somalia's national biodiversity commitments.

The platform would serve as Somalia's first national digital biodiversity registry, providing a critical tool for the Ministry of Environment and Climate Change's Green Somalia initiatives, supporting Nature Somalia's IBA monitoring efforts, and delivering measurable data for UNDP-funded conservation projects.

**Funding Requested:** $245,000 USD
**Project Duration:** 18 months (Phase 1 and Phase 2)
**Implementing Entity:** [Your Company/Organization Name]

---

## 2. The Problem

### 2.1 Somalia's Biodiversity Knowledge Gap

Somalia's biodiversity has been severely under-documented due to decades of conflict, institutional disruption, and lack of digital infrastructure. The consequences are significant:

| Challenge | Impact |
|-----------|--------|
| **No centralized species database** | Biodiversity data is scattered across disconnected reports, academic papers, and NGO project files with no unified digital record |
| **Limited field documentation tools** | Conservation workers rely on paper forms, WhatsApp photo sharing, and Excel spreadsheets to record observations |
| **IBA monitoring gaps** | Nature Somalia has identified Important Bird Areas, but ongoing monitoring depends on manual reporting with no real-time data aggregation |
| **Difficulty measuring conservation impact** | UNDP and government programmes cannot easily track biodiversity indicators over time without a structured data platform |
| **No citizen science infrastructure** | Somalia's young, mobile-connected population has no accessible tool to contribute to biodiversity documentation |
| **Climate change vulnerability** | Without baseline biodiversity data, measuring the ecological impact of climate change in Somalia is nearly impossible |

### 2.2 Why Existing Platforms Don't Work for Somalia

**iNaturalist**, while globally successful, has significant limitations for the Somali context:

- No Somali language support
- Requires consistent internet connectivity (many observation areas in Somalia lack coverage)
- Species identification models are trained primarily on North American and European species — poor accuracy for Horn of Africa fauna and flora
- No integration with Somalia-specific frameworks (IBA designations, national conservation priorities)
- Data is hosted internationally with no data sovereignty alignment
- No institutional reporting features for government ministries or NGOs

---

## 3. The Proposed Solution: iKoor

### 3.1 Platform Overview

iKoor is a web and mobile platform that enables structured biodiversity observation, community-driven species identification, and institutional reporting — purpose-built for Somalia's ecological, linguistic, and connectivity context.

### 3.2 Core Features

#### For Citizens and Field Workers
- **Photo-based observation submission** — Capture and upload photos of plants, animals, insects, and marine life with GPS location tagging
- **Offline-first mobile app** — Record observations without internet; data syncs automatically when connectivity is available
- **Somali and Arabic interface** — Full platform available in Somali (af-Soomaali) and Arabic, with English as a secondary option
- **Community identification** — Other users and experts can help identify species from uploaded photos
- **Species guide** — A growing reference library of Somali wildlife and plants with photos, descriptions, and conservation status

#### For Researchers and Conservation Organizations
- **IBA integration** — Observations are automatically tagged to Important Bird Areas when GPS coordinates fall within IBA boundaries
- **Project workspaces** — Organizations like Nature Somalia can create focused monitoring projects (e.g., "Cal Madow Forest Survey 2027") and invite contributors
- **Data export** — Download observation data in CSV, GeoJSON, and Darwin Core formats for scientific analysis
- **Verification workflow** — Expert reviewers can confirm or correct species identifications, building a validated dataset
- **Seasonal and trend analysis** — Track species presence over time to detect migration patterns, population changes, and habitat shifts

#### For Government and Funding Bodies
- **National biodiversity dashboard** — Real-time overview of total observations, species documented, geographic coverage, and contributor activity
- **Conservation indicator tracking** — Align platform metrics with national biodiversity targets and UNDP programme KPIs
- **Regional reporting** — Generate reports by state/region showing biodiversity hotspots and monitoring gaps
- **Protected area monitoring** — Track observation density in national parks, marine reserves, and IBA zones
- **Programme accountability** — Provide UNDP and MoECC with verifiable data on conservation programme outcomes

### 3.3 Technical Approach

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Web Application** | React, Node.js, PostgreSQL | Modern, scalable, and maintainable stack with strong developer ecosystem |
| **Mobile App** | Progressive Web App (PWA) with offline storage | Works on any smartphone browser, no app store dependency, offline-first capability |
| **Mapping** | Leaflet / OpenStreetMap | Free, open-source mapping with good coverage in East Africa |
| **Image Storage** | Cloud object storage (S3-compatible) | Scalable photo storage with CDN delivery |
| **Species Database** | Custom taxonomy database seeded with GBIF and IUCN data | Pre-loaded with known Horn of Africa species for identification suggestions |
| **Multilingual** | i18n framework with Somali, Arabic, English | Full RTL support for Arabic, Somali as primary language |
| **Offline Sync** | Service Workers + IndexedDB | Observations stored locally, synced when connectivity returns |
| **Data Standards** | Darwin Core, GeoJSON | International biodiversity data standards for interoperability |

---

## 4. Alignment with Partner Priorities

### 4.1 Ministry of Environment and Climate Change (MoECC)

The MoECC recently launched an **$18.9M biodiversity programme** under the Green Somalia initiative. iKoor directly supports this programme by:

- Providing a **national digital species registry** — a foundational tool for biodiversity policy and planning
- Enabling **measurable conservation indicators** that can be reported to international bodies (CBD, CITES)
- Demonstrating **Somali technical capability** in environmental technology — a platform built by Somali developers for Somali ecosystems
- Supporting **environmental education** by giving citizens a tool to engage with their natural heritage

### 4.2 Nature Somalia

Nature Somalia is the leading local NGO for biodiversity monitoring, particularly IBA mapping. iKoor supports their work by:

- **Digitizing IBA monitoring** — Replacing manual bird count reports with real-time observation data linked to IBA boundaries
- **Expanding their contributor base** — Enabling citizen scientists across the country to contribute observations, not just trained field teams
- **Strengthening funding applications** — Providing quantifiable data on monitoring coverage and species documentation to support future grant proposals
- **Building institutional knowledge** — Creating a permanent, searchable database of observations that persists beyond individual project cycles

### 4.3 UNDP Somalia

UNDP funds many of Somalia's current biodiversity and climate resilience projects. iKoor provides:

- **Digital infrastructure for programme monitoring** — Track biodiversity indicators across UNDP-funded projects with real data
- **A replicable model** — The platform architecture can be adapted for other Horn of Africa countries (Djibouti, Eritrea, parts of Ethiopia and Kenya)
- **Capacity building** — Training Somali developers and data analysts in biodiversity informatics
- **Alignment with SDGs** — Direct contribution to SDG 14 (Life Below Water) and SDG 15 (Life on Land) reporting

---

## 5. Implementation Plan

### Phase 1: Foundation (Months 1-9) — $130,000

| Deliverable | Timeline | Description |
|-------------|----------|-------------|
| Core web platform | Months 1-4 | User registration, photo observation upload, GPS tagging, species selection, community feed |
| Somali/Arabic localization | Months 2-4 | Full interface translation with RTL support |
| IBA boundary integration | Months 3-5 | Pre-load IBA polygons; auto-tag observations within IBA zones |
| Species reference database | Months 3-5 | Seed with known Somali fauna/flora from GBIF, IUCN Red List, and Nature Somalia records |
| Offline-capable PWA | Months 4-6 | Service worker implementation for offline observation recording |
| Organization workspaces | Months 5-7 | Nature Somalia and MoECC can create monitoring projects and invite contributors |
| Data export (CSV, GeoJSON) | Months 6-7 | Researchers can download validated observation datasets |
| Government dashboard | Months 7-9 | National overview with maps, species counts, contributor metrics, regional breakdowns |
| Pilot launch | Month 9 | Launch with Nature Somalia field teams and select communities in 3 regions |

### Phase 2: Scale and Intelligence (Months 10-18) — $90,000

| Deliverable | Timeline | Description |
|-------------|----------|-------------|
| AI-assisted species identification | Months 10-13 | Machine learning model trained on Horn of Africa species to suggest identifications from photos |
| Advanced analytics | Months 11-14 | Seasonal trends, species distribution heatmaps, biodiversity indices by region |
| Marine observation module | Months 12-15 | Specialized tools for coral reef, mangrove, and coastal species documentation |
| Integration with GBIF | Months 14-16 | Publish validated Somali observations to the Global Biodiversity Information Facility |
| Training programme | Months 10-18 | Train 50+ field workers and 10 data analysts across Somalia |
| Scale to 6 regions | Months 15-18 | Expand from 3 pilot regions to national coverage |

---

## 6. Budget Overview

| Category | Phase 1 | Phase 2 | Total |
|----------|---------|---------|-------|
| **Web Platform Development** | $45,000 | $18,000 | $63,000 |
| **Mobile App (iOS + Android)** | $40,000 | $8,000 | $48,000 |
| **Offline Sync & PWA Engineering** | $12,000 | $3,000 | $15,000 |
| **AI Species Identification Model** | — | $30,000 | $30,000 |
| **Species Database & Taxonomy** | $6,000 | $3,000 | $9,000 |
| **Cloud Infrastructure (18 months)** | $4,000 | $4,000 | $8,000 |
| **Localization (Somali/Arabic)** | $4,000 | $2,000 | $6,000 |
| **Mapping & IBA Integration** | $7,000 | $2,000 | $9,000 |
| **Training & Capacity Building** | $2,000 | $12,000 | $14,000 |
| **Project Management** | $10,000 | $8,000 | $18,000 |
| **Total** | **$130,000** | **$90,000** | **$220,000** |

---

## 7. Success Metrics

| Metric | Year 1 Target | Year 2 Target |
|--------|---------------|---------------|
| Total observations recorded | 10,000 | 50,000 |
| Unique species documented | 500 | 1,500 |
| Active contributors | 200 | 1,000 |
| IBAs with active monitoring | 5 | 12 |
| Regions with coverage | 3 | 6 |
| Government reports generated | 4 (quarterly) | 4 (quarterly) |
| Trained field workers | 20 | 50+ |
| Validated observations (expert-confirmed) | 3,000 | 15,000 |
| Data exports to GBIF | 0 | 5,000+ records |

---

## 8. Sustainability

iKoor is designed for long-term sustainability beyond initial project funding:

- **Open-source core** — Platform code is open-source, reducing dependency on any single vendor
- **Government adoption** — MoECC integration ensures institutional commitment and potential for government-funded hosting
- **Low operational cost** — Cloud infrastructure costs scale with usage; estimated $200-500/month for national-scale operations
- **Community-driven content** — Citizen science model means data grows organically without paid field teams
- **Revenue potential** — Future licensing of anonymized biodiversity data to research institutions, conservation consultancies, and international organizations
- **Regional expansion** — Platform architecture supports multi-country deployment across the Horn of Africa

---

## 9. Team

*[Add your team details]*

Relevant capabilities to highlight:
- Full-stack software development experience (demonstrated by PHX Exchange platform)
- Multilingual platform development (Arabic RTL, multi-language i18n)
- Mapping and geospatial integration experience (Leaflet, GPS-based systems)
- Understanding of Somali context, connectivity challenges, and institutional landscape
- Experience building audit-ready data systems with export and reporting capabilities

---

## 10. Why Now

Three factors make this the right moment for iKoor:

1. **The MoECC's $18.9M biodiversity programme is active** — There is dedicated government funding and political will for biodiversity work in Somalia right now. A digital platform amplifies the impact of every dollar spent on fieldwork.

2. **Mobile connectivity in Somalia is growing rapidly** — With Hormuud, Somtel, and other telecom operators expanding 4G coverage, more Somalis than ever have smartphones capable of photo observation and GPS tagging.

3. **Somalia's biodiversity window is closing** — Climate change, urbanization, and deforestation are accelerating habitat loss. Without baseline documentation now, Somalia risks losing species before they are ever recorded.

---

## Contact

[Your Name]
[Your Title/Organization]
[Email]
[Phone]
[Location]

---

*This proposal was prepared for submission to the Ministry of Environment and Climate Change (MoECC), Nature Somalia, and UNDP Somalia.*
