import { Link } from 'react-router-dom';
import { logOut } from '../lib/auth';
import { useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CitizenHome() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const u = auth.currentUser;
    setUser(u);
    if (u) {
      (async () => {
        try {
          const ref = doc(db, 'users', u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) setProfile(snap.data());
        } catch (err) {
          console.warn('Could not fetch user profile', err);
        }
      })();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-2">Citizen Home</h1>
        <p className="text-gray-700 mb-4">You are signed in{user ? ` as ${user.displayName || user.email}` : ''}.</p>

        {profile && (
          <div className="mb-4 p-4 bg-gray-50 rounded">
            <h2 className="font-medium">Profile</h2>
            <p className="text-sm">Role: {profile.role || profile.userType}</p>
            {profile.fullName && <p className="text-sm">Name: {profile.fullName}</p>}
            {profile.organization && <p className="text-sm">Org: {profile.organization}</p>}
          </div>
        )}

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={() => logOut()}>Sign out</button>
          <Link to="/" className="px-4 py-2 border rounded">Back to Landing</Link>
        </div>
      </div>
    </div>
  );
}