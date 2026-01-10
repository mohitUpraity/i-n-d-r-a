import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { auth, db } from './firebase';

// Central place to define the report status lifecycle used across the UI.
// Keeping this in one file makes it trivial to move the same logic into a
// Firebase Cloud Function later (e.g. to validate transitions on the backend).
export const REPORT_STATUSES = ['submitted', 'reviewed', 'working', 'resolved'];

// this tracks and updates the report status
// use in updateReportStatus to update the report status

export const getNextStatus = (current) => {
  const idx = REPORT_STATUSES.indexOf(current);
  if (idx === -1 || idx === REPORT_STATUSES.length - 1) return null;
  return REPORT_STATUSES[idx + 1];
};

// canTransitionStatus this function checks if the transition is valid or not
// this means that the transition is valid only if the toStatus is the next status in the REPORT_STATUSES array

export const canTransitionStatus = (fromStatus, toStatus) => {
  const fromIndex = REPORT_STATUSES.indexOf(fromStatus);
  const toIndex = REPORT_STATUSES.indexOf(toStatus);
  // Only allow strictly forward, single-step moves in the status array.
  return fromIndex !== -1 && toIndex === fromIndex + 1;
};


// ---------- Citizen helpers ----------

// createCitizenReport this function creates a new report for the citizen
// it takes in the title, description, category, locationText as parameters
// it returns the document reference of the created report
// it can be used in citizen view to create a new report
export const createCitizenReport = async ({ title, description, category, locationText }) => {
  // on run this function it gets the user
  const user = auth.currentUser;
  if (!user) throw new Error('User must be signed in to create a report');

  // NOTE: In this prototype, we set the initial status from the client.
  // In a production system, this responsibility should live in a trusted
  // backend (Cloud Function / server) to avoid tampering. We deliberately
  // keep the logic small and centralized so it can be moved later.
  //
  // this payload means that we are creating a new report for the citizen 
  // this is the schema of the report
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

  // collection reference (colRef)
  const colRef = collection(db, 'reports');
  // document reference (docRef) add report according to the payload
  const docRef = await addDoc(colRef, payload);
  return docRef;
};

// this function is used to subscribe to the citizen reports
//
// the main function of this function is to get all the reports of a citizen (maybe)
//
// it takes in the citizenId, callback, errorCallback as parameters
// it returns the unsubscribe function
// it can be used in citizen view to subscribe to the citizen reports
export const subscribeToCitizenReports = (citizenId, callback, errorCallback) => {
  const colRef = collection(db, 'reports');
  // We scope by citizenId only; the fact that this represents a "citizen view"
  // is a UI concern. Firestore security rules should separately ensure that a
  // citizen can only read their own reports.
  // NOTE: We intentionally avoid combining where+orderBy here to prevent
  // requiring a composite index during early development. If you want strictly
  // ordered results, you can add an index in Firestore and reintroduce
  // orderBy('createdAt', 'desc').
  //
  //this check the citizenId and returns the reports of that citizen
  // where is used as condition to filter the reports
  const q = query(colRef, where('citizenId', '==', citizenId),orderBy('createdAt','desc'));
  // this returns the snapshot of the query
  return onSnapshot(q, callback, errorCallback);
};

// ---------- Operator/Admin helpers ----------

// subscribeToAllReports means to get the all reports from the db
export const subscribeToAllReports = (callback, errorCallback) => {
  const colRef = collection(db, 'reports');
  // Operators are allowed to see all citizen reports so they can triage and
  // coordinate response. Firestore rules (not UI checks) are the source of
  // truth that restrict this to operator/admin accounts.
  // orderBy is used to order the reports by createdAt in descending order
  // this is used to get the latest reports first
  const q = query(colRef, orderBy('createdAt', 'desc'));
  // this returns the snapshot of the query
  return onSnapshot(q, callback, errorCallback);
};

// this function tracks the current report status and updates it from db from repors collection using reportId and return next status and it is controlled by getNextStatus function thst has hardcoded array of statuses
// this function is used to update the report status
export const updateReportStatus = async (reportId, currentStatus) => {
  const nextStatus = getNextStatus(currentStatus);
  if (!nextStatus) return null;

  // NOTE: In the prototype we do this write directly from the operator UI.
  // Later, this should move into a Cloud Function that:
  //   - validates the transition server-side (e.g. prevents skipping states)
  //   - checks the caller's role via auth token claims
  //   - optionally writes an audit trail.
  // this gets the speific document in the reports collection
  const ref = doc(db, 'reports', reportId);
  // this updates the document
  await updateDoc(ref, {
    status: nextStatus,
    updatedAt: serverTimestamp(),
  });

  return nextStatus;
};
