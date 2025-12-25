import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const ensureUserProfile = async (userAuth, additionalData = {}, options = {}) => {
  const { maxRetries = 3, retryDelayMs = 500 } = options;
  if (!userAuth || !userAuth.uid) return { success: false, error: 'invalid-user' };

  const ref = doc(db, 'users', userAuth.uid);

  const { userType = 'citizen' } = additionalData;
  const newData = {
    uid: userAuth.uid,
    email: userAuth.email || null,
    userType,
    role: userType === 'citizen' ? 'citizen' : null,
    status: userType === 'citizen' ? 'approved' : 'pending',
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    ...additionalData,
  };

  // Helper sleep
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use merge so we don't overwrite existing fields and ensure fields are present
      await setDoc(ref, newData, { merge: true });
      if (attempt > 1) console.info(`ensureUserProfile: succeeded on attempt ${attempt} for ${userAuth.uid}`);
      return { success: true, ref };
    } catch (err) {
      console.warn(`ensureUserProfile attempt ${attempt} failed for ${userAuth.uid}:`, err?.code || err?.message || err);
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * attempt);
        continue;
      }
      console.error('Failed to ensure user profile for', userAuth.uid, err?.code || err?.message || err);
      return { success: false, error: err };
    }
  }
};
