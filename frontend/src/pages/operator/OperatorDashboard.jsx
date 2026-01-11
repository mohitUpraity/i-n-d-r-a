import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, User, MapPin, Navigation } from 'lucide-react';
import { logOut } from '../../lib/auth';
import { auth } from '../../lib/firebase';
import { subscribeToAllReports, updateReportStatus, getNextStatus } from '../../lib/reports';
import { getIndianStates, getCitiesByState } from '../../lib/locations';
import * as geofire from 'geofire-common';

// Operator dashboard: real-time view of all citizen reports.
export default function OperatorDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');
  
  // Operator location and filtering state
  const [operatorLocation, setOperatorLocation] = useState(null); 
  const [locationLoading, setLocationLoading] = useState(false);
  const [filterState, setFilterState] = useState('all');
  const [filterCity, setFilterCity] = useState('all');

  // Load operator location on mount
  useEffect(() => {
    requestOperatorLocation();
  }, []);

  // ... (location request logic remains same)
  const requestOperatorLocation = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setOperatorLocation({ lat: latitude, lng: longitude, city: null, state: null });
        setLocationLoading(false);
      },
      (err) => {
        // console.error('Failed to get operator location', err); // Reduce noise
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    const unsubscribe = subscribeToAllReports(
      (snap) => {
        const items = [];
        snap.forEach((doc) => {
          const data = doc.data();
          let distanceInKm = null;
          
          if (operatorLocation && data.lat && data.lng) {
            distanceInKm = geofire.distanceBetween(
              [data.lat, data.lng],
              [operatorLocation.lat, operatorLocation.lng]
            );
          }
          
          items.push({ id: doc.id, ...data, distanceInKm });
        });
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
  }, [operatorLocation]);

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
      case 'reviewed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'working': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const currentUserEmail = auth.currentUser?.email || '';

  // Derived stats
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

  const categories = Array.from(new Set(reports.map((r) => r.category).filter(Boolean)));

  // --- LOCATION LOGIC ---
  // 1. Get standardized states list
  const statesList = getIndianStates(); // [{name, isoCode}, ...]
  
  // 2. Get cities based on selected state
  // We handle 'all' and potential mismatch by finding the isoCode if name was passed previously
  let currentCities = [];
  if (filterState !== 'all') {
     currentCities = getCitiesByState(filterState);
  } else {
     // If all states, optionally show all cities present in reports (unique list)
     // But strictly speaking, it's better to force state selection for city list
     // For now, let's just collect all unique cities from the reports if state is 'all'
     currentCities = Array.from(new Set(reports.map(r => r.city).filter(Boolean))).sort().map(name => ({ name }));
  }

  const filteredReports = reports.filter((r) => {
    const status = r.status || 'submitted';
    const category = r.category || 'uncategorized';
    const confidence = r.confidenceLevel || 'low';
    
    // Normalize state/city check because we might have old reports with "Uttar Pradesh" and new ones with "UP"
    const rState = r.state || '';
    const rCity = r.city || '';

    const statusOk = filterStatus === 'all' || status === filterStatus;
    const categoryOk = filterCategory === 'all' || category === filterCategory;
    const confidenceOk = filterConfidence === 'all' || confidence === filterConfidence;
    
    // State Filter Logic
    let stateOk = true;
    if (filterState !== 'all') {
       // Filter matches if: 
       // 1. Exact match (ISO code 'UP' == 'UP')
       // 2. Name match (ISO code 'UP' matches State Name 'Uttar Pradesh' if found in dictionary)
       const stateObj = statesList.find(s => s.isoCode === filterState);
       const stateName = stateObj ? stateObj.name.toLowerCase() : '';
       const filterCode = filterState.toLowerCase();
       const reportState = rState.toLowerCase();

       stateOk = reportState === filterCode || reportState === stateName || reportState.includes(stateName);
    }

    const cityOk = filterCity === 'all' || rCity.toLowerCase() === filterCity.toLowerCase();
    
    return statusOk && categoryOk && confidenceOk && stateOk && cityOk;
  });

  // Helper function to get distance badge color
  const getDistanceBadgeClass = (distanceInKm) => {
    if (distanceInKm === null) return 'bg-gray-100 text-gray-600';
    if (distanceInKm < 5) return 'bg-green-100 text-green-700';
    if (distanceInKm < 15) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

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
            {/* Operator Location Status */}
            {operatorLocation && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-900 rounded-lg text-xs text-green-100">
                <MapPin className="w-3 h-3" />
                <span>Location Active</span>
              </div>
            )}
            
            {!operatorLocation && !locationLoading && (
              <button
                onClick={requestOperatorLocation}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-yellow-900 hover:bg-yellow-800 rounded-lg text-xs text-yellow-100 transition-colors"
              >
                <Navigation className="w-3 h-3" />
                <span>Enable Location</span>
              </button>
            )}
            
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
            
            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">State</label>
              <select
                value={filterState}
                onChange={(e) => {
                  setFilterState(e.target.value);
                  setFilterCity('all'); // Reset city when state changes
                }}
                className="text-xs sm:text-sm border rounded px-2 py-1 bg-white max-w-[140px]"
              >
                <option value="all">All States</option>
                {statesList.map((state) => (
                  <option key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-gray-600 mb-1">City</label>
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                disabled={filterState === 'all' && currentCities.length > 50} // Disable if too many (optional UX choice, usually ok to leave enabled if list is reasonable)
                className="text-xs sm:text-sm border rounded px-2 py-1 bg-white max-w-[140px] disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="all">All Cities</option>
                {currentCities.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
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
                  <th className="px-4 py-3">Distance</th>
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
                        {r.distanceInKm !== null ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getDistanceBadgeClass(r.distanceInKm)}`}>
                            <MapPin className="w-3 h-3 mr-1" />
                            {r.distanceInKm < 1 
                              ? `${(r.distanceInKm * 1000).toFixed(0)}m`
                              : `${r.distanceInKm.toFixed(1)}km`
                            }
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
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
