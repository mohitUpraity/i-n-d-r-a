import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  MapPin, 
  Navigation, 
  Loader, 
  AlertTriangle,
  Clock,
  Shield,
  Search,
  CheckCircle, 
  ThumbsUp, 
  HelpCircle, 
  Activity 
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { reverseGeocode, getNearbyReports, getReportsByState, getReportsByCity, voteOnReport } from '../../lib/reports';
import { getIndianStates } from '../../lib/locations';
import { useNavigate } from 'react-router-dom';

export default function NearbyReports() {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState('gps'); // 'gps', 'city', 'state'
  const [radius, setRadius] = useState(5);
  const [filterConfidence, setFilterConfidence] = useState('all'); // 'all', 'high', 'medium', 'low'
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [hiddenCount, setHiddenCount] = useState(0);
  
  // UNIFIED SCAN FUNCTION (Simplified to 3 modes)
  // Handles: GPS, My State (auto-detected), My City (auto-detected)
  const handleScan = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);
    setHiddenCount(0);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        
        // Debug logging
        console.log('📍 GPS Location:', { latitude, longitude, accuracy });
        
        // Warn if accuracy is poor (might be IP-based location)
        if (accuracy > 1000) {
          console.warn('⚠️ Low GPS accuracy detected. This might be IP-based location, not actual GPS.');
        }
        
        setGpsCoords({ lat: latitude, lng: longitude });

        // For city mode, perform reverse geocoding first
        if (filterMode === 'city') {
          setGeocoding(true);
          const location = await reverseGeocode(latitude, longitude);
          
          // Debug logging
          console.log('🗺️ Reverse Geocoded:', location);
          
          // Map detected state name to ISO code used in DB
          let stateCode = null;
          if (location.state) {
            const states = getIndianStates();
            const matchingState = states.find(s => 
              s.name.toLowerCase() === location.state.toLowerCase() || 
              location.state.toLowerCase().includes(s.name.toLowerCase()) ||
              s.name.toLowerCase().includes(location.state.toLowerCase())
            );
            if (matchingState) {
              stateCode = matchingState.isoCode;
            }
          }

          // Create a search location object with the correct DB codes
          const searchLocation = {
            ...location,
            state: stateCode || location.state // Use code if found, else fallback to name
          };

          console.log('🗺️ Mapped Location:', searchLocation);
          setDetectedLocation(location); // Show full user-friendly name in UI
          setGeocoding(false);

          // Check if city detection was successful
          if (!searchLocation.city) {
            setError('Could not detect your city. Please try GPS mode.');
            setLoading(false);
            return;
          }

          await fetchReports(latitude, longitude, searchLocation);
        } else {
          // GPS mode - no geocoding needed
          await fetchReports(latitude, longitude, null);
        }
      },
      (err) => {
        console.error("Error getting location", err);
        setLoading(false);
        let msg = 'Could not access location.';
        switch(err.code) {
          case 1: msg = 'Location permission denied. Please enable it in browser settings.'; break;
          case 2: msg = 'Location unavailable. Check GPS signal.'; break;
          case 3: msg = 'Location request timed out. Please retry.'; break;
          default: msg = 'Unknown location error.';
        }
        setError(msg);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 30000, // Increased to 30 seconds
        maximumAge: 0 // Force fresh GPS reading, don't use cached
      }
    );
  };

  // FETCH REPORTS BASED ON FILTER MODE (Simplified)
  const fetchReports = async (lat, lng, location) => {
    try {
      let docs = [];

      // Execute the appropriate query based on filter mode
      switch (filterMode) {
        case 'gps':
          docs = await getNearbyReports(lat, lng, radius);
          break;
        
        case 'state':
          docs = await getReportsByState(location.state, lat, lng);
          break;
        
        case 'city':
          docs = await getReportsByCity(location.city, location.state, lat, lng);
          break;
        
        default:
          throw new Error('Invalid filter mode');
      }

      // Filter out reports created by the current user
      const ownUid = auth.currentUser?.uid;
      let filteredDocs = docs.filter(doc => doc.citizenId !== ownUid);
      
      // Apply confidence filter
      if (filterConfidence !== 'all') {
        filteredDocs = filteredDocs.filter(doc => 
          (doc.confidenceLevel || 'low') === filterConfidence
        );
      }
      
      setHiddenCount(docs.length - filteredDocs.length);
      setReports(filteredDocs);
    } catch (err) {
      console.error("Failed to fetch reports", err);
      setError(err.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  // Re-scan when radius changes (GPS mode only)
  useEffect(() => {
    if (gpsCoords && filterMode === 'gps') {
      handleScan();
    }
  }, [radius]);

  // Helper function to get filter mode display name
  const getFilterModeLabel = () => {
    switch (filterMode) {
      case 'gps': return 'GPS Radius';
      case 'state': return 'My State';
      case 'city': return 'My City';
      default: return 'Unknown';
    }
  };

  // Helper to get confidence badge
  const getConfidenceBadge = (level) => {
    switch(level) {
      case 'high': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">High</span>;
      case 'medium': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Medium</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Low</span>;
    }
  };

  const handleVote = async (e, reportId, voteType) => {
    e.stopPropagation(); // Prevent card click
    
    // Find report
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    // Check if already voted (Client side check for immediate feedback)
    const uid = auth.currentUser.uid;
    if (report.voters && report.voters[uid]) {
      alert("You have already voted on this report.");
      return;
    }

    try {
      const result = await voteOnReport(reportId, voteType);
      
      // Optimistic update
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            yesCount: result.yesCount,
            noCount: result.noCount,
            confidenceLevel: result.confidenceLevel,
            voters: { ...r.voters, [uid]: voteType }
          };
        }
        return r;
      }));
    } catch (err) {
      console.error("Failed to vote", err);
      alert("Vote failed: " + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'submitted') return 'Unverified';
    if (status === 'reviewed') return 'Verified';
    return status;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header - Made non-sticky and more compact */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-2 rounded-lg shadow-sm">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Nearby Activity</h1>
                <p className="text-xs text-gray-500">Community-verified reports</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/citizen/home')}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Ethical Note - More compact */}
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 text-xs text-blue-800">
           <Shield className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
           <p>
             <strong>Note:</strong> Your verifications help authorities prioritize resources. In immediate danger, always call 112.
           </p>
        </div>

        {/* Filter Mode Selector - Simplified and more compact */}
        <div className="mb-4 bg-white border-2 border-indigo-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-gray-900">Filter Mode</span>
            </div>
            {geocoding && (
              <div className="flex items-center gap-1 text-xs text-indigo-600">
                <Loader className="w-3 h-3 animate-spin" />
                <span>Detecting...</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFilterMode('gps')}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                filterMode === 'gps'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-indigo-50 border border-gray-200'
              }`}
            >
              <div className="text-base mb-1">📍</div>
              <div>GPS Radius</div>
            </button>
            
            <button
              onClick={() => setFilterMode('city')}
              className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                filterMode === 'city'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-indigo-50 border border-gray-200'
              }`}
            >
              <div className="text-base mb-1">🏙️</div>
              <div>My City</div>
            </button>
          </div>

          {/* Show detected location - More compact */}
          {detectedLocation && (filterMode === 'state' || filterMode === 'city') && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-2 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-green-600 shrink-0" />
                <div>
                  <span className="font-semibold text-gray-900">
                    {filterMode === 'city' && detectedLocation.city && `${detectedLocation.city}, `}
                    {detectedLocation.state || 'Unknown'}
                  </span>
                  <span className="text-gray-500 ml-1">(auto-detected)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confidence Filter - Inline with scan button */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">Confidence:</label>
            <select
              value={filterConfidence}
              onChange={(e) => setFilterConfidence(e.target.value)}
              className="flex-1 px-2 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="low">Low Only</option>
            </select>
          </div>

          {/* Radius selector - only show for GPS mode */}
          {filterMode === 'gps' && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[1, 5, 10, 25].map((km) => (
                <button
                  key={km}
                  onClick={() => setRadius(km)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    radius === km 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {km}km
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scan Button - Full width */}
        <button
          onClick={handleScan}
          disabled={loading || geocoding}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all mb-6"
        >
          {loading || geocoding ? (
            <Loader className="w-5 h-5 animate-spin" /> 
          ) : (
            <Navigation className="w-5 h-5" /> 
          )}
          {loading ? 'Scanning...' : geocoding ? 'Detecting Location...' : 'Scan My Area'}
        </button>
        
        {/* How Verification Works - Guide */}
        {!loading && reports.length === 0 && !error && (
          <div className="mb-6 bg-linear-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-600" />
              How Community Verification Works
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <ThumbsUp className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Confirm</h4>
                <p className="text-sm text-gray-600">Click if you can verify this incident is real. Your confirmation increases confidence.</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-orange-100">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <HelpCircle className="w-6 h-6 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Uncertain</h4>
                <p className="text-sm text-gray-600">Click if you're not sure or can't verify. Helps filter false alarms.</p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Confidence Level</h4>
                <p className="text-sm text-gray-600">More confirmations = Higher confidence = Faster response from authorities.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
              <p className="text-sm text-gray-700 text-center">
                <strong className="text-blue-600">💡 Your Role:</strong> Help emergency responders prioritize real incidents by verifying reports near you. Every verification counts!
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 shrink-0" />
             <div>
               <p className="font-bold">Error Loading Reports</p>
               <p className="text-sm">{error}</p>
             </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No reports found nearby</h3>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto mb-4">
              We couldn't find any incidents within {radius}km of your location.
            </p>
            {hiddenCount > 0 && (
                <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm inline-block">
                    Note: {hiddenCount} reports were hidden because you created them.
                    <br/>
                    (You can view your own reports in your Profile)
                </div>
            )}
          </div>
        )}

        {/* Results Grid */}
        <div className="grid gap-4">
          {reports.map((report) => {
             const uid = auth.currentUser?.uid;
             const hasVoted = report.voters && report.voters[uid];
             
             return (
            <div 
              key={report.id} 
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
              onClick={() => navigate(`/reports/${report.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                      {report.status === 'reviewed' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {report.status === 'submitted' && <Clock className="w-3 h-3 mr-1" />}
                      {getStatusLabel(report.status)}
                    </span>
                    {getConfidenceBadge(report.confidenceLevel)}
                </div>
                <span className="text-xs text-gray-500">
                  {report.distanceInKm < 1 
                    ? `${(report.distanceInKm * 1000).toFixed(0)}m away` 
                    : `${report.distanceInKm.toFixed(1)}km away`}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {report.title}
              </h3>
              
              {/* Location Info */}
              {(report.city || report.locationText) && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-2">
                  <MapPin className="w-3 h-3" />
                  <div className="truncate">
                    {report.state && report.city && (
                      <span className="font-semibold text-gray-900">{report.city}, {report.state}</span>
                    )}
                    {report.locationText && report.state && report.city && <span className="text-gray-400 mx-1">•</span>}
                    {report.locationText && (
                      <span className="text-gray-500">{report.locationText}</span>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {report.description}
              </p>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t gap-2">
                 <div className="flex items-center gap-2 flex-wrap">
                    {/* Confirm Button */}
                    <button 
                      onClick={(e) => handleVote(e, report.id, 'yes')}
                      disabled={hasVoted}
                      className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors border ${
                        hasVoted 
                         ? 'text-gray-400 border-transparent cursor-not-allowed' 
                         : 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Confirm
                      {report.yesCount > 0 && <span className="ml-1 text-xs bg-green-200 px-1 rounded-full text-green-800">{report.yesCount}</span>}
                    </button>

                    {/* Uncertain Button */}
                    <button 
                      onClick={(e) => handleVote(e, report.id, 'no')}
                      disabled={hasVoted}
                      className={`flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors border ${
                        hasVoted 
                         ? 'text-gray-400 border-transparent cursor-not-allowed' 
                         : 'text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4" />
                      Uncertain
                       {report.noCount > 0 && <span className="ml-1 text-xs bg-orange-200 px-1 rounded-full text-orange-800">{report.noCount}</span>}
                    </button>
                    
                    {/* View on Map Button */}
                    {report.lat && report.lng && (
                      <a
                        href={`https://www.google.com/maps?q=${report.lat},${report.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors border text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100"
                      >
                        <MapPin className="w-4 h-4" />
                        Map
                      </a>
                    )}
                    
                    {hasVoted && (
                       <span className="text-xs text-gray-400 italic">Thanks for voting</span>
                    )}
                 </div>

                 <span className="text-blue-600 text-xs font-medium shrink-0">View &rarr;</span>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}
