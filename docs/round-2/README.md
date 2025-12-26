# INDRA – Round 2 Roadmap & Improvements

## 1. Purpose of this document

This README describes **what we will add or improve in Round 2** in a way that is easy to evaluate and compare. It focuses on:
- Concrete new capabilities (not just "nice to have" ideas)
- Efficiency and scalability of the system
- How we will keep the design original and avoid plagiarism
- How our **4‑member team** (with a **team leader**) will split the work

For functional flows and DFDs, see `../flows/README.md`.

---

## 2. High‑level Round 2 goals

1. **Make the system operationally useful** for real district/state control rooms.
2. **Upgrade from prototype logic to automation**:
   - Cloud Functions for risk scoring, grid aggregation and alerts.
3. **Improve observability and transparency**:
   - Visual grids, clear audit trails, and explainable risk scores.
4. **Expand coverage and channels** beyond a single web UI (SMS/low‑connectivity paths).

---

## 3. New product features (Round 2)

### 3.1 Live grid map & heatmaps

**What we will add**
- A real map view for operators showing **grid cells** colored by risk (Low/Medium/High/Critical).
- Hover/click on a grid opens:
  - Incidents in that grid (with filters).
  - AI‑generated one‑line summary plus a more detailed explanation.

**Why it matters**
- Converts abstract lists into **actionable geography**.
- Aligns with how real control rooms think: "which valleys/roads/blocks are at risk right now?".

**How we’ll implement it**
- Use a web mapping library (e.g. Leaflet/MapLibre) rendered in the operator dashboard.
- Store grid polygons + centroids in a `grids` collection.
- Use Cloud Functions to keep `grids` documents updated from raw `reports`.

---

### 3.2 Automated grid risk engine (Cloud Functions)

**What we will add**
- Firestore triggers for `reports`:
  - On create/update, pass each report through an **AI-assisted risk engine** that applies our custom risk-calculation algorithms.
  - Recompute the affected grid’s risk level based on the engine’s output.
- Scheduled job to **decay** old incidents over time so risk reflects recency.

**Why it matters**
- Moves risk computation away from the frontend and into a **governed backend**.
- Keeps the citizen and operator UIs consistently in sync.

**How we’ll implement it**
- `functions/index.js` will define:
  - `onReportCreated` (Firestore `onCreate` handler):
    - Validate data, map coordinates → grid ID, update `grids/{gridId}`.
  - `onReportUpdated` (Firestore `onUpdate` handler):
    - Adjust counts and severities if type/status changes.
  - `recomputeGridRisk` (scheduled):
    - Periodically recalculates risk and clears stale alerts.


---

### 3.3 Alerting pipeline (citizen + operator)

**What we will add**
- Alert documents in a dedicated `alerts` collection:
  - `type` ("entering-high-risk-grid", "new-critical-grid", etc.)
  - `userId` / `gridId`
  - `seen` status.
- Operator dashboard surface:
  - "New critical grids" and "unacknowledged alerts" stream.
- Citizen UI surfaces:
  - In‑app banners when their current grid becomes risky.

**Why it matters**
- Moves from passive dashboards to **actionable notifications**.

**How we’ll implement it**
- Use Cloud Functions that watch `grids`:
  - When `riskLevel` crosses a threshold, create `alerts`.
- Frontend subscribes to `alerts` filtered by `userId` (citizen) or role (operator).

---

### 3.4 Low‑connectivity & SMS support (pilot)

**What we will add**
- Minimal **SMS entry point** for citizens:
  - Citizens can send a short code with incident type and rough location.
- A small **SMS gateway function**:
  - Converts incoming SMS to `reports` documents with approximate location.

**Why it matters**
- Many disaster‑prone regions have poor mobile data connectivity.
- SMS gives a fallback channel when the web app is unusable.

**How we’ll implement it**
- Use a webhook‑based SMS provider (Twilio or equivalent) (mocked/stubbed if needed for cost).
- Deploy an HTTP Cloud Function to:
  - Parse SMS payload.
  - Map sender and message content into a structured `report`.

---

### 3.5 Responder & NGO module (MVP)

**What we will add**
- A new **Responder** role with its own dashboard.
- Task assignment flow:
  - Operators create tasks linked to grids/reports.
  - Responders see a prioritized list of tasks with status updates.

**Why it matters**
- Closes the loop between **decision** (operators) and **execution** (field teams/NGOs).

**How we’ll implement it**
- Add `tasks` collection referencing `gridId` and/or `reportId`.
- New frontend pages under `frontend/pages/responder`.
- Role‑based routing using existing `ProtectedRoute` pattern.

---

### 3.6 AI assistance that is auditable and efficient

**What we will add**
- AI pipelines that:
  - Summarize multiple reports into grid‑level narratives.
  - Suggest priority order for grids based on risk and resource constraints.
- For each AI output we will store:
  - Inputs used (IDs only)
  - Model name
  - Timestamp

**Why it matters**
- Keeps AI usage **transparent and explainable** for government reviewers.
- Supports objective, LLM‑based evaluation because prompts and outputs are deterministic and auditable.

**How we’ll implement it**
- Wrap model calls in a single backend service/module.
- Avoid copy‑pasting external prompts; all prompts will be authored by our team and versioned in the repo.

---

## 4. Engineering & performance improvements

### 4.1 Security and governance hardening

- Move all role updates (admin/operator approvals) fully behind Cloud Functions.
- Tighten Firestore rules so only backend service accounts can change roles and grid risk.
- Add audit logs for:
  - Role changes
  - Manual overrides of risk level
  - Task assignments and closures

### 4.2 Cost and efficiency

- Use **batched writes** and **increment operations** in risk functions.
- Add Firestore indexes and queries that limit the number of active listeners per user.
- Paginate incident lists on the operator dashboard.

### 4.3 Reliability & testing

- Unit tests for:
  - Risk aggregation logic.
  - Alert threshold computations.
- Integration tests for:
  - End‑to‑end report → grid risk → alert pipeline.
- Basic load tests on read/write patterns to estimate Firestore/Functions costs.

---

## 5. Team structure (4‑member team)

Our team has **four members**, with one **team leader** responsible for overall architecture and integration. Exact names can be filled in the submission portal; this document focuses on responsibilities.

- **Team Leader (You)**
  - Owns system architecture, data model, and integration across all apps.
  - Coordinates how Cloud Functions, Firestore, and frontends evolve.
  - Reviews critical code (security rules, risk engine, alerting).

- **Frontend Engineer – Citizen & Responder apps**
  - Owns citizen and responder UIs (report flows, tasks, alerts).
  - Implements offline‑friendly patterns and improves UX for low‑connectivity users.

- **Frontend Engineer – Operator & Admin dashboards**
  - Owns map/heatmap views and grid‑level analytics UI.
  - Works on performance optimization (pagination, query tuning).

- **Backend & Data Engineer**
  - Owns Cloud Functions, SMS gateway, and AI integration layer.
  - Designs and tunes risk scoring, decay, and alert thresholds.

This split lets us move quickly in parallel while keeping a single, coherent system design.

---

## 6. How this document will be kept honest

- Each Round 2 feature above will correspond to specific issues / tasks in our tracker.
- Pull requests will reference those tasks and link to the relevant section in this README.
- During submission, we can map **what was promised vs. what was delivered**, allowing objective evaluation by the LLM filter and core team.

This README is the **single source of truth for Round 2 improvements**; any changes to scope will be updated here first.

---

## 7. Team assessment & contributions

Hackathon reviewers will use **LLM-based filtering plus core team assessment** that focuses on **originality, efficiency, and plagiarism checks**. To make this objective, we map responsibilities and expected outputs per role:

- **Team Leader (You)**
  - Assessment focus: overall architecture quality, clarity of flows/DFDs, and how well frontends, Firestore, and Functions are integrated.
  - Measurable outputs: `docs/flows/README.md`, `docs/round-2/README.md`, data models, and review comments on critical PRs.

- **Frontend Engineer – Citizen & Responder apps**
  - Assessment focus: UX for report creation, responder task views, and real-time updates; handling of low-connectivity constraints.
  - Measurable outputs: citizen/responder pages, offline-friendly patterns, and clean component structure.

- **Frontend Engineer – Operator & Admin dashboards**
  - Assessment focus: map/heatmap implementation, performance of queries, clarity of risk visualization, and admin flows.
  - Measurable outputs: operator/admin dashboard code, grid views, pagination and filtering behaviour.

- **Backend & Data Engineer**
  - Assessment focus: Cloud Functions design, correctness and efficiency of risk/alert logic, and quality of AI integration.
  - Measurable outputs: `functions/` implementation, risk engine, alert pipeline, SMS gateway, and tests around these.

This makes it clear how each of the **four team members** contributes to the final system, and gives reviewers concrete artefacts to compare across teams.
