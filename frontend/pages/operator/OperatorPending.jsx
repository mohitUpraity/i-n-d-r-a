import React, { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function OperatorPending() {
  const [userType, setUserType] = useState('operator');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserType = async () => {
      if (auth.currentUser) {
        const ref = doc(db, 'users', auth.currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserType(snap.data().userType || 'operator');
        }
      }
      setLoading(false);
    };
    fetchUserType();
  }, []);

  if (loading) {
    return <div className="max-w-xl mx-auto p-8 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">Account Pending Approval</h1>
      <p className="text-gray-600 mb-6">
        Your {userType} account has been received and is awaiting approval by an administrator. 
        You will be notified once your account is approved.
      </p>
      <div className="flex justify-center gap-4">
        <button onClick={() => auth.signOut()} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Sign out</button>
      </div>
    </div>
  );
}
