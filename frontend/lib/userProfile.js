import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const ensureUserProfile = async (userAuth, additionalData = {}) => {
  if (!userAuth || !userAuth.uid) return { success: false, error: 'invalid-user' };

  const ref = doc(db, 'users', userAuth.uid);

  try {
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

    // Use merge so we don't overwrite existing fields and ensure fields are present
    await setDoc(ref, newData, { merge: true });

    return { success: true, ref };
  } catch (err) {
    console.error('Failed to ensure user profile for', userAuth.uid, err?.code || err?.message || err);
    return { success: false, error: err };
  }
};
