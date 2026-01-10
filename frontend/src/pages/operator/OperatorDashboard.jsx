import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, User } from 'lucide-react';
import { logOut } from '../../lib/auth';
import { auth } from '../../lib/firebase';
import { subscribeToAllReports, updateReportStatus, getNextStatus } from '../../lib/reports';

// Operator dashboard: real-time view of all citizen reports.
// This intentionally keeps Firestore access simple and declarative so that it
// can be moved into Cloud Functions later without rewriting the UI.
export default function OperatorDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');

  useEffect(() => {
    // Subscribe to *all* reports. Operators need a full picture to triage and
    // coordinate the response. Firestore security rules (not query filters)
    // should ensure that only operator/admin accounts can read this feed.
    const unsubscribe = subscribeToAllReports(
      (snap) => {
        const items = [];
        snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
        setReports(items);
        setLoading(false);
      },
      (err) => {
        console.warn('Failed to subscribe to reports', err);
        setError('Could not load reports.');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await logOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Sign out failed', err);
      setSignOutLoading(false);
    }
  };

  const handleAdvanceStatus = async (reportId, currentStatus) => {
    try {
      await updateReportStatus(reportId, currentStatus);
    } catch (err) {
      console.error('Failed to update status', err);
      // We keep UX simple here for the hackathon; in production we might show a toast.
    }
  };

  const formatDate = (ts) => {
    try {
      if (!ts) return '—';
      if (ts.toDate) return ts.toDate().toLocaleString();
      return new Date(ts).toLocaleString();
    } catch (e) {
      return '—';
    }
  };

  const statusBadgeClass = (status) => {
    switch (status) {
      case 'reviewed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'working':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const currentUserEmail = auth.currentUser?.email || '';

  // Derived stats for dashboard cards (using live report data)
  const totalReports = reports.length;
  const activeReports = reports.filter((r) => (r.status || 'submitted') !== 'resolved').length;
  const workingReports = reports.filter((r) => (r.status || 'submitted') === 'working').length;
  const resolvedToday = reports.filter((r) => {
    const ts = r.updatedAt || r.createdAt;
    if (!ts) return false;
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate() &&
      (r.status || 'submitted') === 'resolved'
    );
  }).length;

  const categories = Array.from(
    new Set(
      reports
        .map((r) => r.category)
        .filter(Boolean),
    ),
  );

  const filteredReports = reports.filter((r) => {
    const status = r.status || 'submitted';
    const category = r.category || 'uncategorized';
    const confidence = r.confidenceLevel || 'low';
    
    const statusOk = filterStatus === 'all' || status === filterStatus;
    const categoryOk = filterCategory === 'all' || category === filterCategory;
    const confidenceOk = filterConfidence === 'all' || confidence === filterConfidence;
    
    return statusOk && categoryOk && confidenceOk;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-white truncate">Operator Console</h1>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                Live citizen reports (read-only for citizens, actionable for operators)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center text-xs text-gray-300">
              <User className="w-4 h-4 mr-1" />
              {currentUserEmail}
            </div>
            <button
              onClick={handleSignOut}
              className={`px-3 py-2 rounded text-sm ${
                signOutLoading ? 'bg-gray-600 text-gray-300' : 'bg-red-600 text-white hover:bg-red-700'
              }`}
              disabled={signOutLoading}
            >
              {signOutLoading ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Emergency Operations Dashboard</h2>
            <p className="text-xs text-gray-600">
              Live incident feed with high-level stats, filters, and status controls.
            </p>
          </div>
          <Link
            to="/operator/pending"
            className="text-xs text-gray-600 underline hover:text-gray-800 self-start sm:self-auto"
          >
            View my approval status
          </Link>
        </div>

        {/* Summary cards (similar to old dashboard but using real data) */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border rounded-lg p-3 sm:p-4">
            <div className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wide">Active incidents</div>
            <div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">{activeReports}</div>
          </div>
          <div className="bg-white border rounded-lg p-3 sm:p-4">
            <div className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wide">Working</div>
            <div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">{workingReports}</div>
          </div>
          <div className="bg-white border rounded-lg p-3 sm:p-4">
            <div className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wide">Resolved today</div>
            <div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">{resolvedToday}</div>
          </div>
          <div className="bg-white border rounded-lg p-3 sm:p-4">
            <div className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wide">Total reports</div>
            <div className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900">{totalReports}</div>
          </div>
        </section>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Filters & controls */}
        <section className="bg-white border rounded-lg p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs sm:text-sm border rounded px-2 py-1 bg-white"
              >
                <option value="all">All</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="working">Working</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-xs sm:text-sm border rounded px-2 py-1 bg-white max-w-[180px]"
              >
                <option value="all">All</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">Confidence</label>
              <select
                value={filterConfidence}
                onChange={(e) => setFilterConfidence(e.target.value)}
                className="text-xs sm:text-sm border rounded px-2 py-1 bg-white"
              >
                <option value="all">All</option>
                <option value="high">High Confidence</option>
                <option value="medium">Medium Confidence</option>
                <option value="low">Low/Unverified</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] sm:text-xs text-gray-500">
            Showing <span className="font-semibold">{filteredReports.length}</span> of{' '}
            <span className="font-semibold">{totalReports}</span> reports
          </div>
        </section>

        {/* Main incidents table */}
        {loading ? (
          <div className="p-6 bg-white rounded border text-center text-sm text-gray-600">
            Loading reports…
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-6 bg-white rounded border text-center text-sm text-gray-600">
            No reports match the current filters.
          </div>
        ) : (
          <div className="bg-white border rounded shadow-sm overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Citizen</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Community Check</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last updated</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r) => {
                  const nextStatus = getNextStatus(r.status || 'submitted');
                  return (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 align-top text-xs text-gray-700">
                        <div className="font-medium">{r.citizenEmail || '—'}</div>
                        <div className="text-[10px] text-gray-400">{r.citizenId}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-gray-900 font-medium">
                        {r.title || 'Untitled'}
                        <div className="text-xs text-gray-500 font-normal mt-0.5">{r.category}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-gray-700 max-w-xs">
                        {r.state && r.city ? (
                          <div className="font-semibold text-gray-900 mb-0.5">{r.city}, {r.state}</div>
                        ) : null}
                        <div className="truncate text-gray-500">{r.locationText || '—'}</div>
                        {r.lat && r.lng && (
                          <a 
                            href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline mt-1 inline-block"
                          >
                            View on Map
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col gap-1 items-start">
                           {/* Badge */}
                           {(() => {
                             switch(r.confidenceLevel) {
                               case 'high': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">High Confidence</span>;
                               case 'medium': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">Medium</span>;
                               default: return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">Low/Unverified</span>;
                             }
                           })()}
                           
                           <div className="flex text-xs gap-2 mt-1">
                             <span className="text-green-700 font-medium">Yes: {r.yesCount||0}</span>
                             <span className="text-gray-400">|</span>
                             <span className="text-orange-700 font-medium">Uncertain: {r.noCount||0}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${statusBadgeClass(
                            r.status || 'submitted',
                          )}`}
                        >
                          {r.status || 'submitted'}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-gray-700">
                        {formatDate(r.updatedAt || r.createdAt)}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        {nextStatus ? (
                          <button
                            onClick={() => handleAdvanceStatus(r.id, r.status || 'submitted')}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded bg-gray-900 text-white hover:bg-black"
                          >
                            Mark as {nextStatus}
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400">Resolved</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
