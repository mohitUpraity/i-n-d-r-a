import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const ensureUserProfile = async (userAuth, additionalData = {}) => {
  if (!userAuth || !userAuth.uid) return null;

  const ref = doc(db, 'users', userAuth.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const { userType = 'citizen' } = additionalData;
    const newData = {
      uid: userAuth.uid,
      email: userAuth.email || null,
      userType,
      role: userType === 'citizen' ? 'citizen' : null,
      status: userType === 'citizen' ? 'approved' : 'pending',
      createdAt: serverTimestamp(),
      ...additionalData,
    };

    await setDoc(ref, newData);
  }

  return ref;
};
