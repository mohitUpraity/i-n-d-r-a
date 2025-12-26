import { Link } from 'react-router-dom';
import { logOut } from '../../lib/auth';
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Shield, PlusCircle, FileText, User, Phone, AlertTriangle } from 'lucide-react';

export default function CitizenHome() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingNav, setLoadingNav] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

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

  const firstName = user?.displayName ? user.displayName.split(' ')[0] : (user?.email ? user.email.split('@')[0] : 'there');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-700" aria-hidden />
            <div>
              <div className="text-lg font-bold text-gray-900">INDRA</div>
              <div className="text-sm text-gray-600">Safety information for your area</div>
            </div>
          </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
          <a
            href="tel:112"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 w-full sm:w-auto"
            aria-label="Call emergency services"
          >
            <Phone className="w-4 h-4" aria-hidden /> Emergency
          </a>

          <Link
            to="/profile"
            className="hidden sm:inline text-sm text-gray-700 hover:underline"
          >
            Profile
          </Link>

          <button
            onClick={handleSignOut}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 rounded text-sm ${signOutLoading ? 'bg-gray-200 text-gray-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
            aria-label="Sign out"
          >
            {signOutLoading ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome */}
        <section className="mb-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Hello, {firstName}</h1>
          <p className="text-sm sm:text-base text-gray-700 mt-2">Report incidents, view your reports, and update your profile.</p>

          {/* Profile saving banner */}
          {user && !profile && (
            <div className="mt-3 p-3 rounded bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <div>We're saving your profile. Some features may be limited — we'll retry in the background.</div>
            </div>
          )}
        </section>

        {/* Quick Status */}
        <section className="mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <div className="shrink-0 px-4 py-3 bg-white rounded-lg shadow-sm border w-44">
              <div className="text-xs text-gray-500">Open reports</div>
              <div className="text-xl font-semibold text-gray-900">—</div>
            </div>
            <div className="shrink-0 px-4 py-3 bg-white rounded-lg shadow-sm border w-44">
              <div className="text-xs text-gray-500">Nearby alerts</div>
              <div className="text-xl font-semibold text-gray-900">—</div>
            </div>
            <div className="shrink-0 px-4 py-3 bg-white rounded-lg shadow-sm border w-44">
              <div className="text-xs text-gray-500">Last sync</div>
              <div className="text-xl font-semibold text-gray-900">—</div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="mb-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <button
                onClick={() => navigate('/report')}
                className={`w-full h-20 flex items-center gap-3 px-4 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${loadingNav ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
                aria-label="Report an incident"
              >
                <PlusCircle className="w-6 h-6" aria-hidden />
                <span className="text-lg">{loadingNav ? 'Loading…' : 'Report an Incident'}</span>
              </button>
              <p className="text-xs text-gray-500 mt-2">Quickly report hazards or emergencies</p>
            </div>

            <div className="">
              <button
                onClick={() => navigate('/reports')}
                className="w-full h-20 flex items-center gap-3 px-4 rounded-lg border border-gray-300 text-gray-800 font-semibold bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                aria-label="My reports"
              >
                <FileText className="w-5 h-5" aria-hidden />
                <div className="text-left">
                  <div>My Reports</div>
                  <div className="text-xs text-gray-500">Track status (Coming soon)</div>
                </div>
              </button>
            </div>

            <div className="">
              <button
                onClick={() => navigate('/profile')}
                className="w-full h-20 flex items-center gap-3 px-4 rounded-lg bg-white border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                aria-label="Profile"
              >
                <User className="w-5 h-5" aria-hidden />
                <div className="text-left">Profile<div className="text-xs text-gray-500">Update contact & safety preferences</div></div>
              </button>
            </div>
          </div>
        </section>

        {/* Recent Reports */}
        <section className="mb-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">Recent reports</h2>
          <div className="mt-3 p-4 bg-white rounded-lg border text-gray-700">
            <div className="text-sm">No recent reports to show. Use "Report an Incident" to create a new report.</div>
            <div className="mt-3">
              <button onClick={() => navigate('/report')} className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
                <PlusCircle className="w-4 h-4" /> Report now
              </button>
            </div>
          </div>
        </section>

        {/* Safety Info */}
        <section className="mb-6" aria-labelledby="safety-heading">
          <h2 id="safety-heading" className="text-base sm:text-lg font-medium text-gray-900">Safety information</h2>
          <ul className="mt-3 list-disc pl-5 text-gray-700 space-y-2">
            <li>Stay informed: follow official local alerts.</li>
            <li>If you feel unsafe, move to higher ground or a safe area.</li>
            <li>Share clear, factual details when reporting (location, type, photos).</li>
            <li>Only call emergency services for immediate danger.</li>
          </ul>
        </section>

        {/* Footer / Disclaimer */}
        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
          <p>Information is advisory. Follow official instructions from authorities.</p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <a href="#" className="hover:underline">Language</a>
            <a href="#" className="hover:underline">Report abuse</a>
          </div>
        </footer>
      </main>
    </div>
  );
}