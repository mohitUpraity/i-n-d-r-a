import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';

// Central place to define the report status lifecycle used across the UI.
// Keeping this in one file makes it trivial to move the same logic into a
// Firebase Cloud Function later (e.g. to validate transitions on the backend).
export const REPORT_STATUSES = ['submitted', 'reviewed', 'working', 'resolved'];

export const getNextStatus = (current) => {
  const idx = REPORT_STATUSES.indexOf(current);
  if (idx === -1 || idx === REPORT_STATUSES.length - 1) return null;
  return REPORT_STATUSES[idx + 1];
};

export const canTransitionStatus = (fromStatus, toStatus) => {
  const fromIndex = REPORT_STATUSES.indexOf(fromStatus);
  const toIndex = REPORT_STATUSES.indexOf(toStatus);
  // Only allow strictly forward, single-step moves in the status array.
  return fromIndex !== -1 && toIndex === fromIndex + 1;
};

// ---------- Citizen helpers ----------

export const createCitizenReport = async ({ title, description, category, locationText }) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User must be signed in to create a report');

  // NOTE: In this prototype, we set the initial status from the client.
  // In a production system, this responsibility should live in a trusted
  // backend (Cloud Function / server) to avoid tampering. We deliberately
  // keep the logic small and centralized so it can be moved later.
  const payload = {
    citizenId: user.uid,
    citizenEmail: user.email || null,
    title: title.trim(),
    description: description.trim(),
    category,
    locationText: locationText.trim(),
    status: 'submitted',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const colRef = collection(db, 'reports');
  const docRef = await addDoc(colRef, payload);
  return docRef;
};

export const subscribeToCitizenReports = (citizenId, callback, errorCallback) => {
  const colRef = collection(db, 'reports');
  // We scope by citizenId only; the fact that this represents a "citizen view"
  // is a UI concern. Firestore security rules should separately ensure that a
  // citizen can only read their own reports.
  // NOTE: We intentionally avoid combining where+orderBy here to prevent
  // requiring a composite index during early development. If you want strictly
  // ordered results, you can add an index in Firestore and reintroduce
  // orderBy('createdAt', 'desc').
  const q = query(colRef, where('citizenId', '==', citizenId));
  return onSnapshot(q, callback, errorCallback);
};

// ---------- Operator/Admin helpers ----------

export const subscribeToAllReports = (callback, errorCallback) => {
  const colRef = collection(db, 'reports');
  // Operators are allowed to see all citizen reports so they can triage and
  // coordinate response. Firestore rules (not UI checks) are the source of
  // truth that restrict this to operator/admin accounts.
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, callback, errorCallback);
};

export const updateReportStatus = async (reportId, currentStatus) => {
  const nextStatus = getNextStatus(currentStatus);
  if (!nextStatus) return null;

  // NOTE: In the prototype we do this write directly from the operator UI.
  // Later, this should move into a Cloud Function that:
  //   - validates the transition server-side (e.g. prevents skipping states)
  //   - checks the caller's role via auth token claims
  //   - optionally writes an audit trail.
  const ref = doc(db, 'reports', reportId);
  await updateDoc(ref, {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });

  return nextStatus;
};
