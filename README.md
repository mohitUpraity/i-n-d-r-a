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

INDRA addresses these gaps by acting as a **central intelligence and coordination layer** with two primary user-facing surfaces:

- **Citizens (public app)** – report what they see on the ground and receive grid-level safety signals.
- **Operators (government dashboard)** – monitor risk, plan resources, and coordinate actions across regions.

At a system level, INDRA:

- Aggregates citizen-reported incidents (text, photos, categories).
- Encodes locations using a **grid-based geospatial model inspired by DIGIPIN**, so that decisions are taken on areas, not just points.
- Computes region-level risk scores in the backend.
- Continuously checks where citizens (who have opted in to GPS) are located relative to risky grids and surfaces **real-time alerts** when they enter high-risk cells.
- Presents simplified risk views to citizens and detailed, explainable views to authorities.
- Supports response coordination and post-disaster assessment across the full disaster lifecycle (**before**, **during**, and **after** an event).

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
- Submit structured incident reports (category, description, optional media).
- Allow the app (when open and with GPS permission) to track their current grid and receive **real-time alerts** when they enter or move within **critical or high-risk grids**.
- View a simplified “is my area safe?” status derived from the backend grid risk model.
- Track status of submitted reports and see when authorities have acknowledged or acted on them.

### Authorities (Operators)
- View **grid-wise risk summaries** with color-coded levels (Low / Medium / High).
- See **incident density, trends, and AI-generated summaries** of what is happening in each grid.
- Use AI-assisted suggestions on:
  - Which regions to prioritize first.
  - How to pre-position and allocate resources (teams, vehicles, medical kits).
  - How many temporary shelters might be required based on affected population estimates (heuristic in Round 1).
- Log decisions, actions taken, and expected impact for auditability.

### Emergency Responders & NGOs
- Planned modules for future rounds
- Receive assignments and view needs-based information

Roles are **assigned by the system**, not chosen by users, to prevent misuse of operator capabilities.

---

## 7. Core Features (Round 1 Scope)

- Citizen incident reporting.
- Grid-based risk aggregation (DIGIPIN-inspired, area-based).
- Real-time citizen alerts when entering risky grids (opt-in GPS, app open).
- Authority command dashboard with AI-assisted summaries.
- Risk level categorization (Low / Medium / High; extensible to more granular levels).
- Backend-driven alert triggers and escalation rules.
- Role-based data visibility (citizen vs operator).
- Coverage of **all three disaster stages**:
  - **Before**: watchlists for vulnerable grids, early alerts, preventive inspections.
  - **During**: live incident triage, hotspots, and shelter suggestions.
  - **After**: damage and needs logging per grid, recovery prioritization (what to repair or restore first).

---

## 8. Grid-Based Risk Intelligence

INDRA uses a **grid-based risk model** inspired by India’s Digital Public Infrastructure (DIGIPIN):

- Individual reports are tagged with precise location encoding.
- Reports are aggregated into larger decision-level grids.
- Each grid maintains a dynamic, time-aware risk score.
- Risk evolves based on incident type, severity, frequency, and recency.
- Overall risk is **calculated at the grid level, not just at a single point**, which better matches how field teams and districts plan interventions.

This area-first approach aligns with how governments act on **regions**, not individual coordinates, and reflects patterns in disaster-management research where:
- Community-reported data is fused with geospatial zoning; and
- Decisions are based on vulnerability of zones rather than isolated pins.

INDRA brings these research-backed ideas into a practical, hackathon-ready implementation for Himalayan states.

---

## 9. Methodology & Data Flow (End-to-End)

1. Citizen opens the app, signs in, and (optionally) grants GPS permission.
2. Citizen submits a structured report (category, description, optional media).
3. The report is stored as untrusted input in Firestore.
4. A backend Cloud Function validates, normalizes, and maps the report to a grid.
5. The relevant grid’s risk score is updated using a rule-based, data-driven heuristic.
6. The authority dashboard reflects updated risk and AI generates short, human-readable summaries of the situation per grid.
7. If thresholds are crossed, alert events are generated:
   - Citizens in or entering that grid (with app open and location on) see warnings.
   - Operators receive highlighted grids and recommended follow-up actions.
8. During and after the event, operators log actions taken and resources deployed, gradually building a recovery and "lessons learned" dataset for that grid.

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

