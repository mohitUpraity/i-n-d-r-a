import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  signInWithRedirect
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

export const signInWithGoogleRedirect = async () => {
  console.log('Initiating redirect sign-in (this will navigate away)');
  return signInWithRedirect(auth, provider);
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

    // Only fallback to redirect for popup blocked / timeout / unauthorized-domain / operation-not-allowed
    const fallbackCodes = ['auth/popup-blocked', 'auth/popup-timeout', 'auth/unauthorized-domain', 'auth/operation-not-allowed'];
    if (fallbackCodes.includes(code)) {
      console.warn('Falling back to redirect sign-in due to:', code);
      await signInWithGoogleRedirect();
      return null;
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