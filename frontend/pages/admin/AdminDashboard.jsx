import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import Loader from '../../src/components/Loader';
import { DEV_HARDCODED_ADMIN_UID } from '../../lib/config';

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const currentUid = auth.currentUser ? auth.currentUser.uid : null;
  const isDevAdmin = currentUid && currentUid === DEV_HARDCODED_ADMIN_UID;

  useEffect(() => {
    // list pending operator requests
    const q = query(collection(db, 'users'), where('userType', '==', 'operator'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setRequests(arr);
      setLoading(false);
    }, (err) => {
      console.error('Failed to fetch pending requests', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  async function approve(uid) {
    setBusy(uid);
    try {
      const ref = doc(db, 'users', uid);
      await updateDoc(ref, { status: 'approved', role: 'operator' });
      // Note: in production, this should be done server-side to set Auth claims too.
    } catch (err) {
      console.error('Approve failed', err);
      alert('Approve failed: ' + (err.message || err));
    } finally {
      setBusy(null);
    }
  }

  async function reject(uid) {
    setBusy(uid);
    try {
      const ref = doc(db, 'users', uid);
      await updateDoc(ref, { status: 'rejected' });
    } catch (err) {
      console.error('Reject failed', err);
      alert('Reject failed: ' + (err.message || err));
    } finally {
      setBusy(null);
    }
  }

  if (!isDevAdmin) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Admin access required</h2>
        <p className="text-gray-600 mb-4">This page is reserved for a development admin. Set <code>DEV_HARDCODED_ADMIN_UID</code> in <code>frontend/lib/config.js</code> to your UID to enable the UI.</p>
        <p className="text-sm text-gray-500">Current UID: {currentUid || 'not signed in'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Operator Requests (dev admin)</h1>
      {loading ? <div className="p-8 text-center"><Loader /></div> : (
        <div className="space-y-4">
          {requests.length === 0 && <p className="text-gray-600">No pending requests.</p>}
          {requests.map(r => (
            <div key={r.id} className="p-4 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">{r.displayName || r.email || r.id}</div>
                <div className="text-sm text-gray-600">Requested: {new Date((r.createdAt && r.createdAt.seconds ? r.createdAt.seconds * 1000 : Date.now())).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={busy === r.id}
                  onClick={() => approve(r.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >{busy === r.id ? 'Working…' : 'Approve'}</button>
                <button
                  disabled={busy === r.id}
                  onClick={() => reject(r.id)}
                  className="px-3 py-1 bg-gray-200 rounded"
                >{busy === r.id ? 'Working…' : 'Reject'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
