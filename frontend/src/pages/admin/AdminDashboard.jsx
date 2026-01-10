import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import Loader from '../../components/Loader';

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);
  const [approvedOps, setApprovedOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const currentUid = auth.currentUser ? auth.currentUser.uid : null;

  useEffect(() => {
    // Check if current user is admin
    const checkAdminStatus = async () => {
      if (!currentUid) {
        setIsAdmin(false);
        setCheckingAuth(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const adminCheck = userData.userType === 'admin' && userData.status === 'approved';
          setIsAdmin(adminCheck);
          console.log('Admin check:', { userType: userData.userType, status: userData.status, isAdmin: adminCheck });
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Failed to check admin status', err);
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAdminStatus();
  }, [currentUid]);

  useEffect(() => {
    if (!isAdmin) return;

    console.log('Setting up real-time listeners...');

    // list pending operator requests
    const q = query(collection(db, 'users'), where('userType', '==', 'operator'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      console.log('Pending operator requests updated:', arr.length, arr);
      setRequests(arr);
      setLoading(false);
    }, (err) => {
      console.error('Failed to fetch pending operator requests', err);
      setLoading(false);
    });

    // Also list approved operators for debugging
    const qApproved = query(collection(db, 'users'), where('userType', '==', 'operator'), where('status', '==', 'approved'));
    const unsubApproved = onSnapshot(qApproved, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      console.log('Approved operators updated:', arr.length, arr);
      setApprovedOps(arr);
    }, (err) => {
      console.error('Failed to fetch approved operators', err);
    });

    // List pending admin requests
    const qAdminPending = query(collection(db, 'users'), where('userType', '==', 'admin'), where('status', '==', 'pending'));
    const unsubAdminPending = onSnapshot(qAdminPending, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      console.log('Pending admin requests updated:', arr.length, arr);
      setAdminRequests(arr);
    }, (err) => {
      console.error('Failed to fetch pending admin requests', err);
    });

    return () => { unsub(); unsubApproved(); unsubAdminPending(); };
  }, [isAdmin]);

  async function approve(uid) {
    setBusy(uid);
    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      
      if (snap.exists()) {
        const userData = snap.data();
        // Preserve the user's role when approving
        const updateData = { 
          status: 'approved',
          role: userData.role || userData.userType || 'operator'
        };
        await updateDoc(ref, updateData);
        console.log('Approved user:', uid, updateData);
      }
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

  if (checkingAuth) {
    return <div className="p-8 text-center"><Loader /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
        <p className="text-gray-600 mb-4">
          This page is only accessible to approved administrators.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {currentUid ? 'Your account does not have admin privileges or is pending approval.' : 'Please sign in as an admin.'}
        </p>
        <div className="flex justify-center gap-4">
          {currentUid ? (
            <button 
              onClick={() => auth.signOut()} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign out
            </button>
          ) : (
            <a 
              href="/auth/admin" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Admin Login
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">Admin Dashboard</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Review pending operator/admin requests and manage approved operators.
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden sm:inline text-xs sm:text-sm text-gray-600 break-all max-w-[180px]">
              {auth.currentUser?.email}
            </span>
            <button
              onClick={() => auth.signOut()}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center"><Loader /></div>
        ) : (
          <>
            {/* Pending Requests Section */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-orange-600">Pending Operator Requests</h2>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs sm:text-sm font-semibold">
                  {requests.length}
                </span>
              </div>
              <div className="space-y-4">
                {requests.length === 0 && <p className="text-sm text-gray-600">No pending requests.</p>}
                {requests.map(r => (
                  <div key={r.id} className="p-4 border rounded-lg bg-orange-50/40">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base sm:text-lg break-words">
                          {r.fullName || r.displayName || r.email || r.id}
                        </div>
                        <div className="mt-1 text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
                          <div><strong>Email:</strong> <span className="break-all">{r.email}</span></div>
                          <div><strong>Organization:</strong> {r.organization || 'N/A'}</div>
                          <div><strong>Designation:</strong> {r.designation || 'N/A'}</div>
                          <div><strong>Role:</strong> {r.role || 'N/A'}</div>
                          <div>
                            <strong>Requested:</strong>{' '}
                            {new Date((r.createdAt && r.createdAt.seconds ? r.createdAt.seconds * 1000 : Date.now())).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2">
                        <button
                          disabled={busy === r.id}
                          onClick={() => approve(r.id)}
                          className="px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {busy === r.id ? 'Working…' : 'Approve'}
                        </button>
                        <button
                          disabled={busy === r.id}
                          onClick={() => reject(r.id)}
                          className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          {busy === r.id ? 'Working…' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Approved Operators Section */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-green-600">Approved Operators</h2>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
                  {approvedOps.length}
                </span>
              </div>
              <div className="space-y-4">
                {approvedOps.length === 0 && <p className="text-sm text-gray-600">No approved operators yet.</p>}
                {approvedOps.map(r => (
                  <div key={r.id} className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="font-medium text-base sm:text-lg break-words">
                      {r.fullName || r.displayName || r.email || r.id}
                    </div>
                    <div className="mt-1 text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
                      <div><strong>Email:</strong> <span className="break-all">{r.email}</span></div>
                      <div><strong>Organization:</strong> {r.organization || 'N/A'}</div>
                      <div><strong>Designation:</strong> {r.designation || 'N/A'}</div>
                      <div><strong>Role:</strong> {r.role || 'N/A'}</div>
                      <div>
                        <strong>Status:</strong>{' '}
                        <span className="text-green-600 font-semibold">{r.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Admin Requests Section */}
            <div className="mb-2 sm:mb-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-purple-600">Pending Admin Requests</h2>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm font-semibold">
                  {adminRequests.length}
                </span>
              </div>
              <div className="space-y-4">
                {adminRequests.length === 0 && <p className="text-sm text-gray-600">No pending admin requests.</p>}
                {adminRequests.map(r => (
                  <div key={r.id} className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base sm:text-lg break-words">
                          {r.fullName || r.displayName || r.email || r.id}
                        </div>
                        <div className="mt-1 text-xs sm:text-sm text-gray-600 space-y-0.5 sm:space-y-1">
                          <div><strong>Email:</strong> <span className="break-all">{r.email}</span></div>
                          <div><strong>Role:</strong> Admin</div>
                          <div>
                            <strong>Requested:</strong>{' '}
                            {new Date((r.createdAt && r.createdAt.seconds ? r.createdAt.seconds * 1000 : Date.now())).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2">
                        <button
                          disabled={busy === r.id}
                          onClick={() => approve(r.id)}
                          className="px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {busy === r.id ? 'Working…' : 'Approve'}
                        </button>
                        <button
                          disabled={busy === r.id}
                          onClick={() => reject(r.id)}
                          className="px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          {busy === r.id ? 'Working…' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
