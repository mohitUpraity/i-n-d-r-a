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
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-7 h-7 text-gray-700" aria-hidden />
            <div>
              <div className="text-lg font-bold text-gray-900">My Reports</div>
              <div className="text-sm text-gray-600">Reports you submitted</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/report')}
              className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
            >
              <AlertTriangle className="w-4 h-4" /> New report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
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
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">
                          {r.category || 'report'}
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {r.title || 'Untitled report'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
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
                          className="text-sm text-green-600 hover:underline"
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
