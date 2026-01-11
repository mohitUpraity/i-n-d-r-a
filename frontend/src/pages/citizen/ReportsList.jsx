import { useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';
import { subscribeToCitizenReports } from '../../lib/reports';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, FileText } from 'lucide-react';
import Loader from '../../components/Loader';

export default function ReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) {
      setReports([]);
      setLoading(false);
      return;
    }

    // Real-time listener so citizens immediately see status changes performed
    // by operators. This simulates backend-driven events (e.g. Cloud Functions
    // writing updates) even though, in this prototype, everything still happens
    // client-side.
    const unsubscribe = subscribeToCitizenReports(
      u.uid,
      (snap) => {
        const items = [];
        snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
        setReports(items);
        setLastSync(new Date());
        setLoading(false);
      },
      (err) => {
        console.warn('Could not sync reports', err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const formatDate = (ts) => {
    try {
      if (!ts) return '—';
      if (ts.toDate) return ts.toDate().toLocaleString();
      return new Date(ts).toLocaleString();
    } catch (e) {
      return '—';
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'submitted';
    return status;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-linear-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg shadow-sm">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">My Reports</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Track your submitted incidents</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/citizen/home')}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Back to Home
              </button>
              <button
                onClick={() => navigate('/report')}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
              >
                <AlertTriangle className="w-4 h-4" /> <span className="hidden sm:inline">New Report</span><span className="sm:hidden">New</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Status Guide */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Understanding Report Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white rounded p-2 border border-gray-200">
              <div className="font-semibold text-gray-700 mb-1">Submitted</div>
              <div className="text-gray-600">Report received, awaiting review</div>
            </div>
            <div className="bg-white rounded p-2 border border-blue-200">
              <div className="font-semibold text-blue-700 mb-1">Reviewed</div>
              <div className="text-gray-600">Verified by authorities</div>
            </div>
            <div className="bg-white rounded p-2 border border-yellow-200">
              <div className="font-semibold text-yellow-700 mb-1">Working</div>
              <div className="text-gray-600">Response team is on it</div>
            </div>
            <div className="bg-white rounded p-2 border border-green-200">
              <div className="font-semibold text-green-700 mb-1">Resolved</div>
              <div className="text-gray-600">Issue has been fixed</div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Your recent reports</h2>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {lastSync ? `Last updated ${lastSync.toLocaleTimeString()}` : 'Waiting for updates…'}
          </div>
        </div>

        <div>
          {loading ? (
            <div className="p-6 bg-white rounded-lg border text-center">
              <Loader />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-6 bg-white rounded-lg border text-gray-700">
              <div className="mb-3">No reports yet.</div>
              <button
                onClick={() => navigate('/report')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                <AlertTriangle className="w-4 h-4" /> Report an incident
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => {
                const status = formatStatus(r.status);
                const lastUpdated = r.updatedAt || r.createdAt;
                return (
                  <article key={r.id} className="p-4 bg-white rounded-lg border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-0.5">
                          {r.category || 'report'}
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {r.title || 'Untitled report'}
                        </div>
                        
                        {/* Location Info */}
                        {(r.city || r.locationText) && (
                          <div className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                            <span className="text-gray-500">📍</span>
                            <div>
                              {r.state && r.city && (
                                <div className="font-semibold text-gray-900">{r.city}, {r.state}</div>
                              )}
                              {r.locationText && (
                                <div className="text-xs text-gray-600">{r.locationText}</div>
                              )}
                              {r.lat && r.lng && (
                                <a 
                                  href={`https://www.google.com/maps?q=${r.lat},${r.lng}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                                >
                                  View on Map →
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500 mt-2">
                          Last updated {formatDate(lastUpdated)}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${statusBadgeClass(status)}`}
                        >
                          {status}
                        </span>
                        <button
                          onClick={() => navigate(`/reports/${r.id}`)}
                          className="text-sm text-green-600 hover:underline font-medium"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
