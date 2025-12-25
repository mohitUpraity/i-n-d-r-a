import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, FileText } from 'lucide-react';
import Loader from '../../src/components/Loader';

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

    const col = collection(db, 'reports');
    const q = query(col, where('createdBy', '==', u.uid), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const items = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setReports(items);
      setLastSync(new Date());
      setLoading(false);
    }, (err) => {
      console.warn('Could not sync reports', err);
      setLoading(false);
    });

    return () => unsub();
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
            <button onClick={() => navigate('/report')} className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
              <AlertTriangle className="w-4 h-4" /> New report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Your recent reports</h2>
          <div className="text-xs text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> {lastSync ? `Last updated ${lastSync.toLocaleTimeString()}` : 'Not synced yet'}</div>
        </div>

        <div>
          {loading ? (
            <div className="p-6 bg-white rounded-lg border text-center"><Loader /></div>
          ) : reports.length === 0 ? (
            <div className="p-6 bg-white rounded-lg border text-gray-700">
              <div className="mb-3">No reports yet.</div>
              <button onClick={() => navigate('/report')} className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                <AlertTriangle className="w-4 h-4" /> Report an incident
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <article key={r.id} className="p-4 bg-white rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-500">{r.type || 'Report'}</div>
                      <div className="text-lg font-semibold text-gray-900">{r.title || (r.description ? r.description.slice(0, 60) : 'No description')}</div>
                      <div className="text-xs text-gray-500 mt-1">{formatDate(r.createdAt)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-700">{r.status || 'Submitted'}</div>
                      <button onClick={() => navigate(`/reports/${r.id}`)} className="mt-3 text-sm text-green-600 hover:underline">View</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
