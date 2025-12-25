// Usage: node scripts/setAdmin.js <UID>
const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json'); // add your service account json here

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function setAdmin(uid) {
  try {
    await admin.firestore().doc(`users/${uid}`).set({ role: 'admin' }, { merge: true });
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log('Set admin for', uid);
  } catch (err) {
    console.error('Failed to set admin', err);
  }
}

setAdmin(process.argv[2]).catch(console.error);