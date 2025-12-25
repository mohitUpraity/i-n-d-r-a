# Cloud Functions for Indra

This folder contains Firebase Cloud Functions used by the Indra app.

Functions:
- `approveOperator` (callable) — Approves an operator request: sets `users/{uid}` { status: 'approved', role: 'operator' } and sets the Auth custom claim `{ operator: true }`.
- `rejectOperator` (callable) — Rejects a request: sets `users/{uid}` { status: 'rejected' } and clears custom claims.

Deployment:
1. Install dependencies: `cd backend/functions && npm install`.
2. Ensure you have the Firebase CLI installed and logged in: `npm i -g firebase-tools` and `firebase login`.
3. Initialize if needed: `firebase init functions` (skip if already configured).
4. Deploy functions: `firebase deploy --only functions`.

Security:
- The functions check `context.auth.token.admin === true` and will throw `permission-denied` if called by non-admins.

Local testing:
- You can call the functions using Firebase client SDK `httpsCallable(functions, 'approveOperator')({ uid })` from an admin user.
