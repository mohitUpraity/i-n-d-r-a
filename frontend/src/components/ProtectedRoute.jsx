import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import Loader from './Loader';
import { DEV_HARDCODED_ADMIN_UID } from '../../lib/config';

export default function ProtectedRoute({ children, redirectTo = '/', requiredRole = null }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Grace period to avoid flashing the login during quick auth state transitions
    const GRACE_MS = 700;
    let graceTimer = null;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!mounted) return;

      // If user is null, start a short grace period before deciding to redirect
      if (!u) {
        setUser(null);
        setAuthorized(false);
        // keep loading true during grace period to avoid flash
        if (graceTimer) clearTimeout(graceTimer);
        graceTimer = setTimeout(() => {
          // After grace, if still no user, stop loading and allow redirect
          setLoading(false);
        }, GRACE_MS);
        return;
      }

      // If we have a user, cancel any grace timers and proceed
      if (graceTimer) {
        clearTimeout(graceTimer);
        graceTimer = null;
      }

      setUser(u);

      // check token claims as well as Firestore profile for roles
      let tokenClaims = {};
      try {
        const tokenResult = await u.getIdTokenResult();
        tokenClaims = tokenResult && tokenResult.claims ? tokenResult.claims : {};
      } catch (err) {
        console.warn('Failed to read ID token claims', err);
      }

      if (requiredRole) {
        try {
          const ref = doc(db, 'users', u.uid);
          const snap = await getDoc(ref);
          const data = snap.exists() ? snap.data() : null;

          const hasClaim = tokenClaims[requiredRole] === true || tokenClaims.admin === true;
          const hasProfileRole = data && (data.role === requiredRole || data.userType === requiredRole);

          // DEV override: allow the hardcoded admin UID to act as admin during development
          const isDevAdmin = u && u.uid === DEV_HARDCODED_ADMIN_UID && requiredRole === 'admin';

          setAuthorized(hasClaim || !!hasProfileRole || isDevAdmin);
        } catch (err) {
          console.warn('ProtectedRoute role check failed', err);
          setAuthorized(false);
        }
      } else {
        setAuthorized(true);
      }

      setLoading(false);
    });

    return () => { mounted = false; if (graceTimer) clearTimeout(graceTimer); unsub(); };
  }, [requiredRole]);

  if (loading) return <div className="p-8 text-center"><Loader /></div>;
  if (!user) return <Navigate to={redirectTo} replace />;
  if (requiredRole && !authorized) return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold mb-4">Unauthorized</h2>
      <p className="text-gray-600 mb-6">Your account does not have the required permissions to view this page.</p>
      <button onClick={() => auth.signOut()} className="px-4 py-2 bg-red-600 text-white rounded">Sign out</button>
    </div>
  );

  return children;
}