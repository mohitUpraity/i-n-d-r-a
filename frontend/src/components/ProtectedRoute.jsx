import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, redirectTo = '/auth/citizen' }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <Navigate to={redirectTo} replace />;

  return children;
}