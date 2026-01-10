import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// ------------------------------------------------------------------
// FILE PURPOSE:
// This file is responsible for managing User Profiles in Firestore.
// It bridges the gap between Firebase Authentication (email/login)
// and your Database (user roles, status, custom data).
// ------------------------------------------------------------------

// SCALABILITY & MIGRATION NOTE:
// Currently, this function (`ensureUserProfile`) runs on the CLIENT side
// immediately after a user successfully logs in via Google/Email.
//
// WHY MOVE THIS LATER?
// In a production-grade app, you should not trust the client to set their own
// 'userType' or 'status'. A malicious user could theoretically modify this code
// to make themselves an 'admin' or 'approved'.
//
// HOW TO MOVE:
// 1. Create a Firebase Cloud Function: `functions.auth.user().onCreate((user) => { ... })`
// 2. Move the logic inside `ensureUserProfile` to that function.
// 3. Remove the client-side call or keep it as a read-only check.
// ------------------------------------------------------------------

/**
 * ensureUserProfile
 * 
 * Ensures that a Firestore document exists for the logged-in user.
 * If the user is new, it creates a profile with default values.
 * If the user exists, it updates/merges the latest data (like email).
 * 
 * @param {Object} userAuth - The user object returned from Firebase Auth (contains uid, email, etc.)
 * @param {Object} additionalData - (Optional) Extra fields to set, e.g., { userType: 'operator' }
 * @param {Object} options - (Optional) Configuration for retries.
 * 
 * @returns {Object} result - { success: true/false, ref: docRef, error: errorObj }
 */
export const ensureUserProfile = async (userAuth, additionalData = {}, options = {}) => {
  // Configurable retry settings for robustness (network flakes, etc.)
  const { maxRetries = 3, retryDelayMs = 500 } = options;

  // Validation: We need a valid UID to write to the database.
  if (!userAuth || !userAuth.uid) {
    return { success: false, error: 'invalid-user' };
  }

  // Reference to the specific user document in the 'users' collection.
  // path: users/{uid}
  const ref = doc(db, 'users', userAuth.uid);

  // Default Logic for Roles:
  // - If no userType is specified, default to 'citizen'.
  // - Citizens are auto-approved.
  // - Operators/Admins start as 'pending' and need manual approval.
  const { userType = 'citizen' } = additionalData;
  
  const newData = {
    uid: userAuth.uid,
    email: userAuth.email || null,
    userType,
    // If citizen, role is citizen. If operator/admin, role is initially null (or custom).
    role: userType === 'citizen' ? 'citizen' : null,
    // Citizens can act immediately. Others must wait.
    status: userType === 'citizen' ? 'approved' : 'pending',
    // Timestamps for auditing
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    // Spread any other custom data passed in
    ...additionalData,
  };

  // Helper function to pause execution (used for exponential backoff)
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // Retry Loop:
  // We try to write to Firestore up to `maxRetries` times.
  // This is crucial for mobile apps where network might be spotty.
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // setDoc with { merge: true } is INDRA's "Upsert" (Update or Insert).
      // 1. If doc doesn't exist -> Create it with newData.
      // 2. If doc exists -> Update fields in newData, leave others alone.
      await setDoc(ref, newData, { merge: true });

      // If we retried and succeeded, log it for debugging.
      if (attempt > 1) {
        console.info(`ensureUserProfile: succeeded on attempt ${attempt} for ${userAuth.uid}`);
      }
      
      return { success: true, ref };
      
    } catch (err) {
      // FAILURE BLOCK
      console.warn(`ensureUserProfile attempt ${attempt} failed for ${userAuth.uid}:`, err?.code || err?.message || err);

      // logic: if we haven't hit max retries, wait and try again.
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * attempt); // e.g. 500ms, then 1000ms, then 1500ms
        continue; // Restart loop
      }

      // If we are here, we ran out of retries. Return failure.
      console.error('Failed to ensure user profile for', userAuth.uid, err?.code || err?.message || err);
      return { success: false, error: err };
    }
  }
};
