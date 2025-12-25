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
    console.warn('Popup sign-in failed or timed out, falling back to redirect:', err?.code || err?.message || err);
    // Redirect will navigate away; caller should not expect a return value
    await signInWithGoogleRedirect();
    return null;
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