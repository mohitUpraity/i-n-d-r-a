import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, arrayUnion, arrayRemove, increment, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import * as geofire from 'geofire-common';

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
export const createCitizenReport = async ({ title, description, category, locationText, lat = null, lng = null, state = null, city = null }) => {
  // on run this function it gets the user
  const user = auth.currentUser;
  if (!user) throw new Error('User must be signed in to create a report');

  // GEOSPATIAL LOGIC (The "Engine"):
  // If we have Lat/Lng, we calculate the Geohash.
  // This is what allows us to efficiently query "Radius 5km" later.
  let geohash = null;
  if (lat && lng) {
    geohash = geofire.geohashForLocation([lat, lng]);
  }

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
    // Geo fields
    lat: lat || null,
    lng: lng || null,
    geohash: geohash, // The magic key for "Near Me" queries
    // Administrative fields (for filtering)
    state,
    city,
    status: 'submitted',
    state,
    city,
    status: 'submitted',
    // Community Verification Fields
    yesCount: 0,
    noCount: 0, // In UI this is "Uncertain/Not Sure"
    confidenceLevel: 'low', // low, medium, high
    voters: {}, // Map of userId -> voteType ('yes'  or 'no')
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

// GEOSPATIAL QUERY (The "Reader"):
// This function finds reports within X km of a center point.
// Since Firestore requires multiple queries for this, we return a Promise (one-time fetch)
// instead of a real-time stream for simplicity in V1.
export const getNearbyReports = async (centerLat, centerLng, radiusInKm) => {
  const center = [centerLat, centerLng];
  const radiusInM = radiusInKm * 1000;

  // 1. Calculate the "bounds" (the list of geohashes we need to search)
  // detailed explanation: https://firebase.google.com/docs/firestore/solutions/geoqueries
  const bounds = geofire.geohashQueryBounds(center, radiusInM);
  const promises = [];

  for (const b of bounds) {
    const q = query(
      collection(db, 'reports'),
      orderBy('geohash'),
      where('geohash', '>=', b[0]),
      where('geohash', '<=', b[1])
    );
    promises.push(getDocs(q));
  }

  // 2. Run all queries in parallel
  const snapshots = await Promise.all(promises);
  const matchingDocs = [];

  for (const snap of snapshots) {
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.lat && data.lng) {
        // 3. Client-side filtering: The query gives us a "Box" around the circle.
        // We must manually check the exact distance to filter out the corners of the box.
        const distanceInKm = geofire.distanceBetween([data.lat, data.lng], center);
        if (distanceInKm <= radiusInKm) {
          matchingDocs.push({ id: doc.id, ...data, distanceInKm });
        }
      }
    }
  }

  // Sort by distance (closest first)
  matchingDocs.sort((a, b) => a.distanceInKm - b.distanceInKm);
  return matchingDocs;
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

// COMMUNITY VERIFICATION (The "Truth Engine"):
// Allows users to vote "yes" (confirm) or "no" (uncertain).
// Handles confidence score calculation.
export const voteOnReport = async (reportId, voteType) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to verify');
  if (!['yes', 'no'].includes(voteType)) throw new Error('Invalid vote type');

  const ref = doc(db, 'reports', reportId);
  const snap = await getDoc(ref);
  
  if (!snap.exists()) throw new Error('Report not found');
  const data = snap.data();

  // Prevent owner from voting
  if (data.citizenId === user.uid) {
    throw new Error('You cannot verify your own report');
  }

  // Check if user already voted
  const currentVoters = data.voters || {};
  if (currentVoters[user.uid]) {
    throw new Error('You have already voted on this report');
  }

  // Calculate new counts
  let newYes = data.yesCount || 0;
  let newNo = data.noCount || 0;

  if (voteType === 'yes') newYes++;
  else newNo++;

  // Calculate Confidence Level
  // Logic: Yes increases confidence. No slows it down (doesn't explicitly decrease, but makes the threshold for high harder)
  // Simple heuristic: 
  //   High: Yes > 5 AND Yes > No * 2
  //   Medium: Yes > 2 
  //   Low: Default
  let newConfidence = 'low';
  if (newYes >= 5 && newYes > (newNo * 2)) {
    newConfidence = 'high';
  } else if (newYes >= 2) {
    newConfidence = 'medium';
  }

  await updateDoc(ref, {
    [`voters.${user.uid}`]: voteType,
    yesCount: newYes,
    noCount: newNo,
    confidenceLevel: newConfidence,
    updatedAt: serverTimestamp()
  });

  return { yesCount: newYes, noCount: newNo, confidenceLevel: newConfidence };
};
