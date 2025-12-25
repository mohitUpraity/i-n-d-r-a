// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8zG5nt-j0dU2WEUC_qcDqGnIhiRX7dMc",
  authDomain: "i-n-d-r-a.firebaseapp.com",
  projectId: "i-n-d-r-a",
  storageBucket: "i-n-d-r-a.firebasestorage.app",
  messagingSenderId: "965126795212",
  appId: "1:965126795212:web:31ae1b5db3d4ea35347769",
  measurementId: "G-QCB4NF85E6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);