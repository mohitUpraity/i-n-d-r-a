import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Navigation, AlertTriangle, Shield, CheckCircle, Clock, ThumbsUp, ThumbsDown, HelpCircle, Activity } from 'lucide-react';
import { getNearbyReports, voteOnReport } from '../../lib/reports';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function NearbyReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [permissionError, setPermissionError] = useState(false);
  const [radius, setRadius] = useState(5); // Default 5km
  const [gpsCoords, setGpsCoords] = useState(null);

  // Auto-scan on mount if we have permission, otherwise wait for user click
  useEffect(() => {
    // Optional: Auto-scan could go here, but manual is better for privacy feeling
  }, []);

  const handleScan = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setPermissionError(false);
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });

        try {
          const docs = await getNearbyReports(latitude, longitude, radius);
          // Filter out reports created by the current user
          const filteredDocs = docs.filter(doc => doc.citizenId !== auth.currentUser?.uid);
          setReports(filteredDocs);
        } catch (err) {
          console.error("Failed to fetch nearby reports", err);
          // If permission error persists
          if (err.code === 'permission-denied') {
             setPermissionError(true);
          }
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error getting location", err);
        setLoading(false);
        let msg = 'Could not access location.';
        switch(err.code) {
          case 1: msg = 'Location permission denied. Please enable it in browser settings.'; setPermissionError(true); break;
          case 2: msg = 'Location unavailable. Check GPS signal.'; break;
          case 3: msg = 'Location request timed out. Please retry.'; break;
          default: msg = 'Unknown location error.';
        }
        if (err.code !== 1) alert(msg); 
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Re-scan when radius changes if we already have coords
  useEffect(() => {
    if (gpsCoords) {
      handleScan();
    }
  }, [radius]);

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

  const getConfidenceBadge = (level) => {
    switch(level) {
      case 'high': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">High Confidence</span>;
      case 'medium': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Medium Confidence</span>;
      default: return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Low Confidence</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-full">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Nearby Activity</h1>
                <p className="text-xs text-gray-500">Real-time reports around you</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate('/citizen/home')}
              className="text-sm text-gray-600 font-medium hover:text-gray-900"
            >
              Close
            </button>
          </div>

          <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 text-sm text-blue-800">
             <Shield className="w-5 h-5 shrink-0 text-blue-600" />
             <p>
               <strong>Ethical Note:</strong> Your verifications help authorities prioritize resources. This tool does not replace official emergency services. In immediate danger, always call 112.
             </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
             <button
               onClick={handleScan}
               disabled={loading}
               className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-70"
             >
               {loading ? (
                 <span className="animate-spin">⌛</span> 
               ) : (
                 <Navigation className="w-4 h-4" /> 
               )}
               {loading ? 'Scanning Area...' : 'Scan My Area'}
             </button>

             <div className="flex bg-gray-100 rounded-lg p-1">
               {[1, 5, 10, 25].map((km) => (
                 <button
                   key={km}
                   onClick={() => setRadius(km)}
                   className={`flex-1 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                     radius === km 
                       ? 'bg-white text-gray-900 shadow-sm' 
                       : 'text-gray-500 hover:text-gray-700'
                   }`}
                 >
                   {km}km
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        
        {permissionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 shrink-0" />
             <div>
               <p className="font-bold">Access Denied</p>
               <p className="text-sm">We couldn't load the reports. This is usually a temporary security setting. Please try again in 1 minute.</p>
             </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && !permissionError && (
          <div className="text-center py-12">
            <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No reports found nearby</h3>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
              We couldn't find any incidents within {radius}km of your location.
            </p>
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
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {report.description}
              </p>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t">
                 <div className="flex items-center gap-2">
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
                    
                    {hasVoted && (
                       <span className="text-xs text-gray-400 italic ml-2">Thanks for voting</span>
                    )}
                 </div>

                 <span className="text-blue-600 text-xs font-medium">View &rarr;</span>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}
