import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Check, Loader, Navigation } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getIndianStates, getCitiesByState, getLocalities } from '../../lib/locations';
import { createCitizenReport } from '../../lib/reports';

export default function CitizenReport() {
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  
  // Location State
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [localities, setLocalities] = useState([]);
  
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('');
  
  // GPS & Status
  const [gpsLocation, setGpsLocation] = useState(null); // { lat, lng }
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [error, setError] = useState('');

  const incidentTypes = [
    { value: 'fire', label: 'Fire', icon: '🔥' },
    { value: 'flood', label: 'Flood or Water', icon: '💧' },
    { value: 'injury', label: 'Person Injured', icon: '🚑' },
    { value: 'blocked', label: 'Road Blocked', icon: '🚧' },
    { value: 'power', label: 'No Power', icon: '⚡' },
    { value: 'building', label: 'Building Damage', icon: '🏚️' },
    { value: 'other', label: 'Other Emergency', icon: '⚠️' }
  ];

  // Load States on Mount
  useEffect(() => {
    setStates(getIndianStates());
  }, []);

  // When State changes, load Cities
  useEffect(() => {
    if (selectedState) {
      setCities(getCitiesByState(selectedState));
      setSelectedCity('');
      setLocalities([]);
      setSelectedLocality('');
    }
  }, [selectedState]);

  // When City changes, load Localities
  useEffect(() => {
    if (selectedCity) {
      setLocalities(getLocalities(selectedState, selectedCity));
      setSelectedLocality('');
    }
  }, [selectedCity]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setDetectingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setDetectingLocation(false);
      },
      (err) => {
        console.error("Error detecting location", err);
        let msg = 'Unable to retrieve location.';
        switch(err.code) {
          case 1: msg = 'Location permission denied. Please enable it in browser settings.'; break;
          case 2: msg = 'Location unavailable. Check your GPS signal.'; break;
          case 3: msg = 'Location request timed out. Please try again.'; break;
          default: msg = 'Unknown location error.';
        }
        setError(msg);
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!incidentType) {
      setError('Please select what happened');
      return;
    }

    // Validation: Require State & City (Mandatory)
    if (!selectedState || !selectedCity) {
      setError('Please select your State and City');
      return;
    }

    // Validation: Require GPS (Mandatory)
    if (!gpsLocation) {
      setError('Please click "Use My Current Location" to attach GPS coordinates');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Construct location text for display
      let locationText = '';
      const stateName = states.find(s => s.isoCode === selectedState)?.name || selectedState;
      
      // If locality is selected, use it for better readability, otherwise fallback to City + GPS
      if (selectedLocality) {
        const localityName = localities.find(l => l.id === selectedLocality)?.name || selectedLocality;
        locationText = `${localityName}, ${selectedCity}`;
      } else {
         // GPS used
         locationText = `${selectedCity}, GPS: ${gpsLocation.lat.toFixed(4)},${gpsLocation.lng.toFixed(4)}`;
      }

      const docRef = await createCitizenReport({
        title: incidentTypes.find(t => t.value === incidentType)?.label || 'Emergency',
        description,
        category: incidentType,
        locationText,
        lat: gpsLocation.lat, // Mandatory now
        lng: gpsLocation.lng, // Mandatory now
        state: selectedState, 
        city: selectedCity
      });

      setLoading(false);
      setSubmitted(true);
      setCreatedId(docRef.id);
    } catch (err) {
      console.error('Failed to submit report', err);
      setError('Failed to submit. ' + err.message);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIncidentType('');
    setDescription('');
    setGpsLocation(null);
    setSelectedState('');
    setSelectedCity('');
    setSelectedLocality('');
    setSubmitted(false);
    setError('');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Sent!</h2>
          <p className="text-gray-600 mb-6">
            Thank you. Help is on the way. Someone will contact you soon.
          </p>
          {createdId && (
            <p className="text-sm text-gray-500 mb-4">Reference: <span className="font-mono">{createdId}</span></p>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700"
            >
              Report Another Issue
            </button>

            {createdId && (
              <button
                onClick={() => window.location.href = `/reports/${createdId}`}
                className="bg-white border border-gray-300 px-6 py-3 rounded-lg text-lg font-medium hover:bg-gray-50"
              >
                View Report
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-600 rounded-full mb-3">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Report Emergency
          </h1>
          <p className="text-base text-gray-600">
            Tell us what happened and where you are
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}

          {/* Incident Type */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              What happened?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {incidentTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => {
                    setIncidentType(type.value);
                    setError('');
                  }}
                  className={`p-4 border-2 rounded-lg text-left ${
                    incidentType === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="font-medium text-gray-900">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Location Selection */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Where are you?
            </label>

            {/* Region Selection (MANDATORY) */}
            <div className="space-y-3 mb-4">
              <p className="text-sm text-gray-600 font-medium">1. Select Region <span className="text-red-500">*</span></p>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select State</option>
                {states.map((s) => (
                  <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                ))}
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedState}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select City</option>
                {cities.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="border-t border-gray-200 my-4"></div>

            {/* Precise Location (GPS MANDATORY) */}
            <p className="text-sm text-gray-600 font-medium mb-2">2. Attach GPS Location <span className="text-red-500">*</span></p>
            
            {/* GPS Button */}
            <button
              onClick={handleDetectLocation}
              disabled={detectingLocation || gpsLocation}
              className={`w-full mb-3 p-3 border-2 rounded-lg flex items-center justify-center gap-2 ${
                gpsLocation
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              {detectingLocation ? (
                 <Loader className="w-5 h-5 animate-spin" />
              ) : gpsLocation ? (
                 <Check className="w-5 h-5" />
              ) : (
                 <Navigation className="w-5 h-5" />
              )}
              <span className="font-medium">
                {detectingLocation ? 'Detecting...' : gpsLocation ? 'Location Detected (GPS)' : 'Use My Current Location'}
              </span>
            </button>

            {gpsLocation && (
               <div className="text-xs text-center text-gray-500 mb-4 -mt-2">
                 Lat: {gpsLocation.lat.toFixed(5)}, Lng: {gpsLocation.lng.toFixed(5)}
               </div>
            )}

             {/* Locality (OPTIONAL) */}
             <p className="text-sm text-gray-500 font-medium mb-1 mt-4">Locality / Area <span className="text-gray-400 font-normal">(Optional for now)</span></p>
             <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                disabled={!selectedCity || localities.length === 0}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Locality (Optional)</option>
                {/* Fallback if no localities found for city */}
                {localities.length === 0 && selectedCity && (
                   <option value="custom">Other / Type Manually</option>
                )}
                {localities.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
          </div>

          {/* Description (Optional) */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-lg font-semibold text-gray-900 mb-2">
              More details (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Near the park entrance..."
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 rounded-lg text-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-5 h-5 animate-spin" />
                Sending...
              </span>
            ) : (
              'Send Report'
            )}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            For life-threatening emergencies, call 112
          </p>
        </div>
      </div>
    </div>
  );
}
