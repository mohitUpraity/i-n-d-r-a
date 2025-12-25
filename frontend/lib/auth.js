import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  
} from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();

export const initAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (err) {
    console.warn('Failed to set auth persistence', err);
  }
};

export const signInWithGoogle = async () => {
  return signInWithPopup(auth, provider);
};



export const signInWithGoogleWithFallback = async (timeoutMs = 5000) => {
  await initAuthPersistence();

  const popupPromise = signInWithPopup(auth, provider);
  const timeout = new Promise((_, reject) => setTimeout(() => reject({ code: 'auth/popup-timeout' }), timeoutMs));

  try {
    const res = await Promise.race([popupPromise, timeout]);
    return res;
  } catch (err) {
    const code = err?.code || '';
    console.warn('Popup sign-in failed or timed out:', code || err?.message || err);

    // We no longer fallback to redirect; surface a clear error so the UI can instruct users to allow popups.
    const fallbackCodes = ['auth/popup-blocked', 'auth/popup-timeout', 'auth/unauthorized-domain', 'auth/operation-not-allowed'];
    if (fallbackCodes.includes(code)) {
      console.warn('Popup sign-in failed; redirect fallback is disabled.');
      const e = new Error('Popup blocked or timed out and redirect fallback is disabled');
      e.code = code || 'auth/popup-blocked-no-redirect';
      throw e;
    }

    // For user-closed popup or cancelled popup, propagate the error so UI can show the message and not redirect
    throw err;
  }
};

export const signInWithEmail = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const createUserWithEmail = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logOut = async () => {
  return signOut(auth);
};