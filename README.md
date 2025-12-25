# INDRA – Intelligent National Disaster, Resource & Action Platform

## Hackathon Round: The Nest (Online)

---

## 1. Project Overview

INDRA is a **government-oriented decision-support platform** designed to improve disaster preparedness, response, and recovery in **Himalayan regions**, with an initial focus on **Uttarakhand and Himachal Pradesh**.

The platform helps authorities **identify high-risk regions early**, **prioritize actions**, and **coordinate responses** by combining ground-level reports, grid-based geospatial logic, and backend risk analysis. INDRA is intentionally designed as a **human-in-the-loop system** where technology assists decision-making but does not automate or override human authority.

---

## 2. Problem Statement

Himalayan regions face recurring and interconnected challenges:
- Landslides triggered by rainfall, snowfall, and terrain instability
- Road blockages that isolate villages and delay emergency services
- Structural degradation of bridges and mountain roads
- Cold-wave related health risks
- Fragmented information across departments
- Reactive response mechanisms instead of preventive planning

Existing systems often respond **after damage has occurred**, leading to delayed relief, higher economic loss, and preventable casualties.

---

## 3. Why Existing Systems Fall Short

- Data is siloed across departments
- Risk is assessed manually and infrequently
- Ground-level signals are not captured early
- No unified view of regional risk
- Limited transparency and coordination

As a result, authorities lack a **single source of truth** for decision-making.

---

## 4. Solution Overview

INDRA addresses these gaps by acting as a **central intelligence and coordination layer**:

- Aggregates citizen-reported incidents
- Encodes locations using a **grid-based geospatial model inspired by DIGIPIN**
- Computes region-level risk scores in the backend
- Presents simplified risk views to citizens and detailed views to authorities
- Supports response coordination and post-disaster assessment

**What INDRA is NOT**:
- Not an automated enforcement system
- Not a replacement for government agencies
- Not a predictive guarantee engine

---

## 5. System Architecture (High-Level)

INDRA follows a modular, event-driven architecture:

1. Frontend interfaces (Citizen & Authority)
2. Authentication & role-based access
3. Firestore as the central data store
4. Cloud Functions for risk analysis and alerts
5. Intelligence layer for summarization and pattern support

All critical logic resides in the backend to ensure data integrity and security.

---

## 6. User Roles & Access Model

### Citizens
- Submit incident reports
- View simplified safety alerts
- Track status of submitted reports

### Authorities (Operators)
- View grid-wise risk summaries
- Monitor incident density
- Prioritize and log response actions

### Emergency Responders & NGOs
- Planned modules for future rounds
- Receive assignments and view needs-based information

Roles are **assigned by the system**, not chosen by users.

---

## 7. Core Features (Round 1 Scope)

- Citizen incident reporting
- Grid-based risk aggregation
- Authority command dashboard
- Risk level categorization (Low / Medium / High)
- Backend-driven alert triggers
- Role-based data visibility

---

## 8. Grid-Based Risk Intelligence

INDRA uses a **grid-based risk model** inspired by India’s Digital Public Infrastructure (DIGIPIN):

- Individual reports are tagged with precise location encoding
- Reports are aggregated into larger decision-level grids
- Each grid maintains a dynamic risk score
- Risk evolves based on incident type, severity, and frequency

This approach aligns with how governments act on **regions**, not individual coordinates.

---

## 9. Data Flow (End-to-End)

1. Citizen submits a report
2. Report is stored as untrusted input
3. Backend function processes the report
4. Relevant grid risk score is updated
5. Authority dashboard reflects updated risk
6. Alerts are generated if thresholds are crossed

---

## 10. Security, Privacy & Governance

- No personal addresses are stored
- Location data is encoded mathematically
- Sensitive operational data is restricted to authorities
- All critical updates occur in backend functions
- Decision authority always remains human

The system is designed with **privacy-by-design** principles.

---

## 11. Current Limitations

- Limited to two states for feasibility
- No live weather API integration in Round 1
- Map and grid visualization is conceptual
- Emergency responder module is not yet implemented

These constraints are intentional for hackathon scope.

---

## 12. Tech Stack Justification

- **Vite + React + Tailwind CSS**: Fast iteration and clean UI
- **Firebase Auth & Firestore**: Secure, scalable backend
- **Firebase Cloud Functions**: Event-driven risk logic
- **Google Gemini APIs**: Assistive intelligence and summarization

The stack prioritizes **speed, clarity, and deployability**.

---

## 13. Repository Structure (Overview)

- `/apps/citizen` – Citizen-facing interface
- `/apps/government-dashboard` – Authority command panel
- `/functions` – Backend risk and alert logic
- `/intelligence` – AI-assisted analysis
- `/docs` – Architecture and flow documentation

---

## 14. Hackathon Alignment (Round 1)

This submission emphasizes:
- Original system design
- Clear problem–solution mapping
- Realistic constraints
- Explainable logic
- Modular expansion readiness

---

## 15. Future Scope (Round 2 Reference)

- Live weather and terrain data integration
- Grid and heatmap visualization
- SMS and offline alerts
- Expansion to other Himalayan states
- Responder and NGO modules

---

**INDRA is designed to be built incrementally, responsibly, and in close alignment with real governance needs.**

