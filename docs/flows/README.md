# INDRA – Technical Flows, DFDs & Real‑Time Wiring

## 1. Purpose of this document

This README explains the **end‑to‑end data flow**, **DFD-style interactions**, and **real‑time wiring** of INDRA. It is written as text so reviewers can quickly compare logic and originality without needing to open PPTs.

The app has three main live surfaces:
- **Citizen app** (reports + personal alerts)
- **Operator dashboard** (grid‑level risk + triage)
- **Admin panel** (role approvals)

All three are **wired live to each other in real time** via Firebase:
- Firebase Auth → identity & roles
- Firestore → real‑time operational database
- (Planned) Cloud Functions → grid risk engine, alerts, automation

---

## 2. Context‑level DFD (Level 0 – system boundary)

**External entities**
- Citizens
- Operators (district / state officials)
- Admins (state control room / superusers)
- External data providers (future: weather, terrain, population datasets)

**Single system**: INDRA platform (web apps + Firebase backend).

**Main data flows**
1. Citizens → INDRA
   - Incident reports (type, description, approximate location)
   - Optional photos / media (future)
2. INDRA → Citizens
   - Grid‑level safety status (safe / caution / critical)
   - Real‑time alerts when entering risky grids
3. Operators/Admins → INDRA
   - Role approvals, actions taken, resource decisions
4. INDRA → Operators/Admins
   - Live incident streams, grid risk levels, AI summaries
5. External sources → INDRA (Round 2+)
   - Weather, rainfall, terrain and population‑at‑risk signals

The **single source of truth** for live data is Firestore; frontends only subscribe and render.

---

## 3. Level 1 DFD – Core sub‑systems

Inside INDRA we separate three logical sub‑systems:

1. **Auth & Identity Layer**
   - Uses Firebase Auth
   - Creates `users/{uid}` documents in Firestore with `userType` and `status`
   - Enforces role‑based access in the UI (citizen/operator/admin)

2. **Incident & Grid Risk Layer**
   - `reports` collection stores raw incident reports (untrusted)
   - (Planned) `grids` collection stores **derived** risk per grid cell
   - An **AI-assisted risk engine** reviews each report using custom risk-calculation algorithms and computes updated risk metrics for the affected grid.
   - Cloud Functions process reports → apply the risk engine → update grid risk → emit alerts

3. **Real‑Time Experience Layer (Frontends)**
   - Citizen web app
   - Operator dashboard
   - Admin dashboard
   - All use Firestore listeners (`onSnapshot`) to receive push updates

Data never flows **directly** between users; it always goes through Auth + Firestore + (optionally) Functions.

---

## 4. Citizen report flow (textual flow chart)

1. **Citizen opens web app**
   - Frontend initializes Firebase Auth (with `browserLocalPersistence`).
   - If already signed in on this browser → user is restored from cache.

2. **Authentication**
   - Citizen authenticates (Google or email/password).
   - Auth success → `AuthContext` loads `users/{uid}` profile.
   - If no profile exists, a basic profile is created.

3. **Report creation (UI → Firestore)**
   - Citizen opens **Report** screen.
   - Fills in: category, description, approximate location (lat/lng), optional fields.
   - On **Send Report**:
     - Frontend builds a minimal payload:
       - `type`, `description`, `location.lat`, `location.lng`
       - `createdBy = uid`
       - `status = 'Submitted'`
       - `createdAt = serverTimestamp()`
     - Uses Firestore SDK to write: `addDoc(collection(db, 'reports'), payload)`.

4. **Backend handling (designed for Cloud Functions)**
   - Firestore `onCreate` trigger (Round 2) receives report.
   - Function:
     - Validates & cleans data.
     - Maps `(lat, lng)` → **grid cell ID** (DIGIPIN‑inspired encoding).
     - Writes / updates `grids/{gridId}` document:
       - Aggregates incident counts, severities, recency.
       - Updates `riskLevel` (Low/Medium/High/Critical).

5. **Real‑time updates back to users**
   - Citizen **My Reports** screen listens on:
     - `reports` where `createdBy == uid`, ordered by `createdAt`.
   - Operator dashboard listens on:
     - `reports` (filtered by region), and
     - `grids` for aggregated risk.
   - Firestore pushes changes; **no polling** from the browser.

---

## 5. Operator monitoring & action flow

1. **Operator authentication**
   - User signs in via operator auth screen.
   - `ProtectedRoute requiredRole="operator"` checks:
     - Firebase ID token claims (future: `operator: true`).
     - Firestore profile fields (`userType === 'operator'`, `status === 'approved'`).

2. **Live incident intake**
   - Operator dashboard subscribes to:
     - Recent `reports` in their jurisdiction.
     - (Round 2) `grids` with `riskLevel != 'Low'`.

3. **Triage & actions**
   - Operator views **grid cards** summarizing:
     - Number of reports, categories, trend.
     - AI‑generated natural‑language summary.
   - Operator logs decisions:
     - Status changes (e.g. "Under verification", "Field team dispatched").
     - Resource allocation (teams, vehicles, shelters) – Round 2.
   - These actions are written back to Firestore.

4. **Real‑time visibility to citizens**
   - Logged actions update report statuses.
   - Citizens see status changes in **My Reports** in real time.

The result: **citizen → system → operator → citizen** feedback loop, fully observable through Firestore.

---

## 6. Admin & role approval flow

1. **Operator/admin signup**
   - On first login, profile is created with:
     - `userType: 'operator'` (or `'admin'`)
     - `status: 'pending'`.

2. **Admin review (real time)**
   - Admin dashboard subscribes to `users` where:
     - `status == 'pending'` and `userType in ['operator', 'admin']`.
   - Admin clicks **Approve** / **Reject`**.

3. **State transitions**
   - For approve:
     - `status` → `'approved'`
     - (Round 2) Cloud Function adds Auth custom claim.
   - For reject:
     - `status` → `'rejected'`.

4. **Frontends react automatically**
   - Because dashboards are listening via `onSnapshot`,
   - Newly approved operators get immediate access to the operator UI,
   - Without browser refresh or manual sync.

---

## 7. Real‑time wiring (how apps are live‑connected)

- **AuthContext** keeps the signed‑in user + profile in memory.
- **ProtectedRoute** blocks/permits access based on Auth + Firestore data.
- **Firestore listeners**:
  - Citizens subscribe to `reports` they created.
  - Operators subscribe to `reports` and `grids` for their region.
  - Admins subscribe to `users` with `status == 'pending'`.
- When **any** of these collections change:
  - Firestore pushes modified documents.
  - React components re‑render, so **all three apps stay in sync in real time**.

This is what we mean when we say: **“the app is wired live to each other in realtime”**.

---

## 8. Where to look in the code

- `frontend/src/App.jsx` – main routing & protected routes.
- `frontend/context/AuthContext.jsx` – authentication + profile context.
- `frontend/pages/citizen/*.jsx` – citizen flows (report create/list/view).
- `frontend/pages/operator/*.jsx` – operator dashboard & pending screen.
- `frontend/pages/admin/*.jsx` – admin dashboard & approvals.
- `frontend/lib/firebase.js` – Firestore client.
- `frontend/lib/auth.js` – Auth utilities.
- `functions/index.js` – placeholder for future Cloud Functions (Round 2).

As Round 2 functions are implemented, this document will be updated with more detailed, function‑level flows.
