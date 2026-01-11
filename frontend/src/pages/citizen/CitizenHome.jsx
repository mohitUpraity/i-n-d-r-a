import { Link } from 'react-router-dom';
import { logOut } from '../../lib/auth';
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { subscribeToCitizenReports, getNearbyReports } from '../../lib/reports';
import { Shield, PlusCircle, FileText, User, Phone, AlertTriangle, MapPin } from 'lucide-react';

export default function CitizenHome() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingNav, setLoadingNav] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

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

      // Subscribe to this citizen's reports for live status updates
      const unsubscribe = subscribeToCitizenReports(
        u.uid,
        (snap) => {
          const items = [];
          snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
          setRecentReports(items);
          setLoadingReports(false);
        },
        (err) => {
          console.warn('Could not sync recent citizen reports', err);
          setLoadingReports(false);
        },
      );

      return () => unsubscribe();
    } else {
      setLoadingReports(false);
    }
  }, []);

  const navigate = (to) => {
    setLoadingNav(true);
    // small delay to show loading state and avoid flashing
    setTimeout(() => {
      window.location.href = to;
    }, 220);
  };

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

  const handleFindNearby = () => {
    navigate('/nearby');
  };

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'there');

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
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-br from-green-600 to-green-700 p-2 rounded-lg shadow-sm">
                <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-white" aria-hidden />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">INDRA</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Incident Reporting & Alert System</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="tel:112"
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
                aria-label="Call emergency services"
              >
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden />
                <span className="hidden sm:inline">Emergency</span>
                <span className="sm:hidden">112</span>
              </a>

              <Link
                to="/profile"
                className="hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                Profile
              </Link>

              <button
                onClick={handleSignOut}
                className={`inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${signOutLoading ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                aria-label="Sign out"
                disabled={signOutLoading}
              >
                {signOutLoading ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome */}
        <section className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hello, {firstName}</h1>
          <p className="text-base text-gray-600 mt-2">Stay safe and informed. Report incidents or verify alerts in your area.</p>

          {/* Profile saving banner */}
          {user && !profile && (
            <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>We're saving your profile. Some features may be limited — we'll retry in the background.</div>
            </div>
          )}
        </section>

        {/* First-Time User Guide */}
        <section className="mb-8">
          <div className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome to INDRA!</h2>
                <p className="text-sm text-gray-700">Your community-powered disaster response platform</p>
              </div>
            </div>

            {/* How It Works - Visual Flow */}
            <div className="bg-white rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-center">How It Works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <PlusCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="font-semibold text-sm text-gray-900 mb-1">1. Report</div>
                  <div className="text-xs text-gray-600">Spot a hazard or emergency</div>
                </div>

                <div className="hidden sm:flex items-center justify-center">
                  <div className="text-blue-400 text-2xl">→</div>
                </div>

                {/* Step 2 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <MapPin className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="font-semibold text-sm text-gray-900 mb-1">2. Verify</div>
                  <div className="text-xs text-gray-600">Community confirms reports</div>
                </div>

                <div className="hidden sm:flex items-center justify-center">
                  <div className="text-blue-400 text-2xl">→</div>
                </div>

                {/* Step 3 */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="font-semibold text-sm text-gray-900 mb-1">3. Respond</div>
                  <div className="text-xs text-gray-600">Authorities take action</div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-start gap-2">
                  <div className="text-green-600 font-bold text-lg">💡</div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Report Incidents</div>
                    <div className="text-xs text-gray-600">Use GPS location for accurate reporting</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 font-bold text-lg">🔍</div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Verify Nearby</div>
                    <div className="text-xs text-gray-600">Help prioritize real emergencies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Actions - Hero Section */}
        <section className="mb-8">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Report Incident - Primary CTA */}
            <div className="lg:row-span-2">
              <button
                onClick={() => navigate('/report')}
                className={`group w-full h-full min-h-[160px] flex flex-col justify-between p-6 rounded-2xl text-white font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-green-500/50 ${loadingNav ? 'bg-green-500' : 'bg-linear-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'}`}
                aria-label="Report an incident"
              >
                <div className="flex items-start justify-between">
                  <div className="bg-white/20 p-3 rounded-xl group-hover:bg-white/30 transition-colors">
                    <PlusCircle className="w-8 h-8" aria-hidden />
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                    Primary Action
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold mb-2">{loadingNav ? 'Loading…' : 'Report an Incident'}</h3>
                  <p className="text-green-100 text-sm">Quickly report hazards, emergencies, or safety concerns in your area</p>
                </div>
              </button>
            </div>

            {/* Verify Alerts */}
            <div>
              <button
                onClick={handleFindNearby}
                className="group relative w-full h-full min-h-[160px] overflow-hidden rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 p-6 shadow-lg hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/50"
              >
                <div className="relative h-full flex flex-col justify-between text-left">
                  <div className="bg-white/20 p-3 rounded-xl w-fit group-hover:bg-white/30 transition-colors">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Verify Alerts Near You</h3>
                    <p className="text-blue-100 text-sm">Help authorities prioritize incidents</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Secondary Actions Grid */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/reports')}
                className="group h-full min-h-[120px] flex flex-col justify-between p-5 rounded-xl border-2 border-gray-200 text-gray-800 font-semibold bg-white hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-4 focus:ring-gray-300/50"
                aria-label="My reports"
              >
                <FileText className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors" aria-hidden />
                <div className="text-left">
                  <div className="font-bold text-base">My Reports</div>
                  <div className="text-xs text-gray-500 mt-1">Track status</div>
                </div>
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="group h-full min-h-[120px] flex flex-col justify-between p-5 rounded-xl bg-white border-2 border-gray-200 text-gray-800 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-4 focus:ring-gray-300/50"
                aria-label="Profile"
              >
                <User className="w-6 h-6 text-gray-600 group-hover:text-gray-800 transition-colors" aria-hidden />
                <div className="text-left">
                  <div className="font-bold text-base">Profile</div>
                  <div className="text-xs text-gray-500 mt-1">Settings</div>
                </div>
              </button>
            </div>
          </div>
        </section>


        {/* Recent Reports (live, for this citizen) */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Reports</h2>
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              View all →
            </button>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6">
            {loadingReports ? (
              <div className="text-center py-8 text-gray-500">Loading your reports…</div>
            ) : !recentReports || recentReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No recent reports to show.</p>
                <button 
                  onClick={() => navigate('/report')} 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" /> Create your first report
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentReports.slice(0, 3).map((r) => {
                  const status = formatStatus(r.status);
                  const lastUpdated = r.updatedAt || r.createdAt;
                  return (
                    <article 
                      key={r.id} 
                      className="group border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => navigate(`/reports/${r.id}`)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              {r.category || 'General'}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${statusBadgeClass(status)}`}
                            >
                              {status}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                            {r.title || 'Untitled report'}
                          </h3>
                          
                          {/* Location Info */}
                          {(r.city || r.locationText) && (
                            <div className="flex items-start gap-1.5 text-xs text-gray-600 mb-1">
                              <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                {r.state && r.city && (
                                  <div className="font-semibold text-gray-900 truncate">{r.city}, {r.state}</div>
                                )}
                                {r.locationText && (
                                  <div className="text-xs text-gray-500 truncate">{r.locationText}</div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-gray-500">
                            Updated {formatDate(lastUpdated)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end shrink-0">
                          {r.lat && r.lng && (
                            <a
                              href={`https://www.google.com/maps?q=${r.lat},${r.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium hover:underline"
                            >
                              <MapPin className="w-3 h-3" />
                              Map
                            </a>
                          )}
                          <button
                            type="button"
                            className="text-blue-600 group-hover:text-blue-700 text-sm font-medium"
                          >
                            View →
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Safety Info */}
        <section className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-6" aria-labelledby="safety-heading">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h2 id="safety-heading" className="text-lg font-bold text-gray-900 mb-1">Safety Guidelines</h2>
              <p className="text-sm text-gray-600">Important information for your safety</p>
            </div>
          </div>
          <ul className="space-y-2.5 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold shrink-0">•</span>
              <span>Stay informed by following official local alerts and emergency broadcasts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold shrink-0">•</span>
              <span>If you feel unsafe, move to higher ground or a designated safe area immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold shrink-0">•</span>
              <span>Provide clear, factual details when reporting (exact location, incident type, photos if safe)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold shrink-0">•</span>
              <span><strong>Call 112 immediately</strong> for life-threatening emergencies</span>
            </li>
          </ul>
        </section>

        {/* Footer / Disclaimer */}
        <footer className="border-t pt-6 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm">
            <p className="text-gray-600">
              <strong>Disclaimer:</strong> Information is advisory. Always follow official instructions from authorities.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-gray-500">
              <a href="#" className="hover:text-gray-700 hover:underline">Language</a>
              <a href="#" className="hover:text-gray-700 hover:underline">Report Abuse</a>
              <a href="#" className="hover:text-gray-700 hover:underline">Privacy</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}