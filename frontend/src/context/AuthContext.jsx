import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setFirebaseUser(user);
        try {
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref);
          setProfile(snap.exists() ? snap.data() : null);
        } catch (err) {
          console.error('Failed to load user profile', err);
          setProfile(null);
        }
      } else {
        setFirebaseUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Centralized navigation: only act after we've finished loading and we have a profile
  useEffect(() => {
    if (loading || !profile) return;

    // if (profile.userType === 'citizen') {
    //   navigate('/citizen/home');
    //   return;
    // }

    if (profile.userType === 'operator') {
      if (profile.status === 'approved') navigate('/operator/dashboard');
      else navigate('/operator/pending');
    }
  }, [loading, profile, navigate]);

  return (
    <AuthContext.Provider value={{ firebaseUser, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);