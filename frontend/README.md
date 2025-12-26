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

## Authentication notes (Round 1)

- Auth persistence: the frontend sets Firebase `browserLocalPersistence`, so users remain signed in on the same browser across sessions until they explicitly sign out.
- Google sign-in: the UI uses `signInWithPopup`. Redirect-based sign-in has been removed to avoid duplicate or ambiguous flows; if your browser blocks popups, please allow popups and retry the sign-in.
- Cross-device persistence: users must sign in on each device/browser. Silent cross-device sign-in requires SSO or server session cookies (out of scope for Round 1).

**Quick debug tips for deployed site:**

- If Google sign-in popup closes immediately or does not complete, check **Firebase Console → Authentication → Sign-in method → Authorized domains** and ensure your hosting domain is listed.
- To quickly verify which Firebase project the deployed frontend is using, add `?debug=auth` to the auth page URL (e.g. `/auth/citizen?debug=auth`). The page will show the `projectId` and whether `auth.currentUser` is present.
- If profiles are not appearing in Firestore, check **Firestore → Data** and the **Authentication → Users** list to see if sign-ins are creating Auth users but profile writes are failing. If writes are blocked, inspect Firestore rules or Cloud Function permissions.


## Admin approvals (Operators)

- Operator signups create a profile with `userType: 'operator'` and `status: 'pending'`.
- Admins can visit `/admin` to review pending operator requests and click **Approve** / **Reject**.
- NOTE (development): callable Cloud Functions are temporarily **disabled**. The `/admin` UI now performs direct Firestore updates when the current user matches a development admin UID (see `frontend/lib/config.js`).
- To enable admin testing locally, edit `frontend/lib/config.js` and set `DEV_HARDCODED_ADMIN_UID` to your UID (found in Firebase Console → Authentication → Users), then sign in as that user and visit `/admin`.

Deployment notes:
- Deploy Firestore rules: `firebase deploy --only firestore:rules` (uses `frontend/firestore.rules`).
- (When re-enabling functions) Deploy functions: `cd backend/functions && npm install && firebase deploy --only functions`.

---

## 15. Future Scope (Round 2 Reference)

- Live weather and terrain data integration
- Grid and heatmap visualization
- SMS and offline alerts
- Expansion to other Himalayan states
- Responder and NGO modules

---

**INDRA is designed to be built incrementally, responsibly, and in close alignment with real governance needs.**

## Appendix: Firebase security, Cloud Functions, and real-time wiring

This section explains how the current implementation uses Firebase for security, scalability, and real-time updates, and how the frontend is kept strictly separate from backend logic.

### A. Firebase services and separation of concerns

- **Firebase Auth** (see `frontend/lib/auth.js`, `context/AuthContext.jsx`)
  - Handles all user identity: citizens, operators, and admins.
  - Uses `browserLocalPersistence` so users stay signed in on the same browser until they explicitly sign out.
- **Cloud Firestore** (see `frontend/lib/firebase.js`, `frontend/firestore.rules`)
  - Stores user profiles and incident reports.
  - Enforces server-side access control via security rules; the frontend cannot bypass these.
- **(Planned) Firebase Cloud Functions** (see `backend/functions/README.md`)
  - Own all privileged operations like role approvals and risk aggregation.
  - Use the Admin SDK and custom claims; this code never runs in the browser.

The React frontends talk only to Firebase Auth, Firestore, and (when enabled) callable/HTTP Cloud Functions. They never import backend Node.js code or hold admin credentials.

### B. Authentication and role enforcement

- Sign-in flows use Firebase Auth (Google sign-in and email/password helpers in `lib/auth.js`).
- `ProtectedRoute` (`src/components/ProtectedRoute.jsx`):
  - Listens to `onAuthStateChanged` and blocks unauthenticated users from protected routes.
  - If a `requiredRole` (e.g. `'admin'` or `'operator'`) is specified, it checks **both**:
    - ID token custom claims (e.g. `claims.admin === true`), and
    - Firestore profile (`users/{uid}`) fields (`role` / `userType`).
  - Shows an "Unauthorized" screen instead of sensitive pages when checks fail.
- `AuthContext` (`context/AuthContext.jsx`) keeps an in-memory copy of the Firebase user + profile and steers users to the right app surface (e.g. operator dashboard vs. pending screen).
- For development only, `DEV_HARDCODED_ADMIN_UID` (`lib/config.js`) can temporarily treat a specific UID as an admin without custom claims; this is documented and intended only for local testing.

Result: UI routes for citizens, operators, and admins are all guarded on the **server-verified identity**, not on any client-side flag.

### C. Secure incident reporting flow (citizen app)

When a citizen clicks **Send Report** on the incident form (`pages/citizen/Reports.jsx`):

1. The browser collects a minimal payload:
   - `type` (what happened),
   - optional `description`,
   - approximate `location` from the device (`lat`, `lng`),
   - `createdBy` set to the authenticated user’s UID,
   - `status` initialised to `'Submitted'`, plus `createdAt = serverTimestamp()`.
2. The frontend writes this document to Firestore using:
   - `addDoc(collection(db, 'reports'), payload)`.
3. The report is treated as **untrusted input**. Any future grid-based risk scoring, alerting, or enrichment is performed in backend logic (Cloud Functions / analysis layer), not in the browser.

In the citizen "My Reports" screen (`pages/citizen/ReportsList.jsx`), the app subscribes to a Firestore query filtered by `createdBy`:

- `onSnapshot(query(collection(db, 'reports'), where('createdBy', '==', uid), orderBy('createdAt', 'desc')), ...)`

This gives the citizen **real-time updates** as their report status evolves, without polling.

### D. Admin/operator approvals and security

- Role requests (operators/admins) are stored as documents under `users/{uid}` with fields like `userType` and `status`.
- The admin dashboard (`pages/admin/AdminDashboard.jsx`):
  - Subscribes in real time to pending operator and admin requests using `onSnapshot` queries on the `users` collection.
  - Lets approved admins click **Approve** / **Reject**, which updates `status` (and role metadata) in Firestore.

Planned Cloud Functions (see `backend/functions/README.md`):

- `approveOperator` (callable):
  - Checks `context.auth.token.admin === true`.
  - Updates `users/{uid}` to `{ status: 'approved', role: 'operator' }`.
  - Sets an Auth custom claim `{ operator: true }`.
- `rejectOperator` (callable):
  - Checks `context.auth.token.admin === true`.
  - Marks `users/{uid}` as `{ status: 'rejected' }` and clears related claims.

During early hackathon iterations, these Cloud Functions are deliberately disabled (`backend/functions/index.js` is a placeholder), and the admin UI performs **direct Firestore updates**. In a hardened deployment, these updates move fully behind callable functions plus stricter Firestore rules.

### E. Firestore security rules and data isolation

The Firestore rules file used for this frontend is `frontend/firestore.rules`:

- `users/{userId}`:
  - **Create**: only allowed when `request.auth.uid == userId`.
  - **Update (safe fields)**: users can only update a limited, whitelisted set of profile fields (display name, phone, photo URL, bio).
  - **Update (role/status)**: restricted to admins or a single development admin UID.
  - **Read**: any authenticated user can read their own profile; listing all users is restricted to admins.
- **Fallback**: everything else (`match /{document=**}`) is denied by default.

This "deny by default" posture means new collections (such as derived risk grids) must be explicitly opened with rules or accessed only from Cloud Functions using the Admin SDK.

### F. Real-time updates at scale

- Citizens:
  - Subscribe to their own `reports` via `onSnapshot`, filtered by `createdBy`.
- Admins:
  - Subscribe to `users` documents with `status == 'pending'` and `userType == 'operator'` or `'admin'`.

Firestore manages **fan-out and scaling** of these real-time listeners. As the number of users grows, Firebase allocates more capacity; no app server needs manual load balancing.

### G. "Frontend doesn’t touch backend code"

Concretely, this means:

- React apps never import or execute any of the Node.js backend / Cloud Functions code.
- Frontend code only:
  - Calls Firebase Auth APIs,
  - Reads/writes Firestore documents that pass security rules,
  - (When enabled) calls named Cloud Functions over HTTPS.
- All sensitive logic — risk scoring, role escalations, custom claims, and any cross-user data access — lives in backend functions and Firestore rules, where it can be centrally audited and scaled.

This ensures INDRA can grow from a hackathon prototype into a production-ready system without changing the mental model: **thin, role-aware frontends on top of a secure, function-driven backend.**
