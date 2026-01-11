import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Clock, FileText, MapPin } from 'lucide-react';
import Loader from '../../components/Loader';

export default function ReportView() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Live subscription so status and other fields update in real time
    const ref = doc(db, 'reports', id);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setReport({ id: snap.id, ...snap.data() });
        } else {
          setReport(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Could not subscribe to report', err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [id]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-700 hover:underline mb-4"
        >
          {'<- Back'}
        </button>

        {loading ? (
          <div className="p-6 bg-white rounded-lg border text-center">
            <Loader />
          </div>
        ) : !report ? (
          <div className="p-6 bg-white rounded-lg border text-gray-700">Report not found.</div>
        ) : (
          <article className="bg-white p-6 rounded-lg border">
            <header className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <FileText className="w-4 h-4" />
                  <span>{report.category || 'report'}</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {report.title || 'Report details'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <Clock className="w-4 h-4" />
                  <span>Created {formatDate(report.createdAt)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-1 text-xs rounded-full border bg-gray-50 text-gray-700">
                  {formatStatus(report.status)}
                </span>
              </div>
            </header>

            <section className="mt-4 text-gray-700 space-y-4">
              <div>
                <p className="mb-1 text-sm font-semibold">Description</p>
                <p className="whitespace-pre-wrap text-sm">
                  {report.description || 'No additional details provided.'}
                </p>
              </div>

              {report.locationText && (
                <div className="p-3 bg-gray-50 border rounded">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">Location</div>
                      <div className="text-xs text-gray-700 mb-2">{report.locationText}</div>
                      {report.lat && report.lng && (
                        <a 
                          href={`https://www.google.com/maps?q=${report.lat},${report.lng}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                        >
                          <MapPin className="w-4 h-4" />
                          View on Google Maps →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </article>
        )}
      </div>
    </div>
  );
}
