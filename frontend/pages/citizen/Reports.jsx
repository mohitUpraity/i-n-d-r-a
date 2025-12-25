import React, { useState } from 'react';
import { MapPin, AlertTriangle, Check, Loader } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CitizenReport() {
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
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

  const getLocation = () => {
    setLoading(true);
    setError('');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          });
          setLoading(false);
        },
        (error) => {
          setError('Could not get your location. Please try again.');
          setLoading(false);
        }
      );
    } else {
      setError('Location not available on this device.');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!incidentType) {
      setError('Please select what happened');
      return;
    }
    if (!location) {
      setError('Please get your location first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        type: incidentType,
        description: description || '',
        location: location || null,
        createdBy: auth?.currentUser?.uid || null,
        status: 'Submitted',
        createdAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, 'reports'), payload);
      setLoading(false);
      setSubmitted(true);
      setCreatedId(ref.id);
    } catch (err) {
      console.error('Failed to submit report', err);
      setError('Failed to submit. Please try again later.');
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIncidentType('');
    setDescription('');
    setLocation(null);
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

          {/* Location */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Where are you?
            </label>
            {!location ? (
              <button
                onClick={getLocation}
                disabled={loading}
                className="w-full p-4 border-2 border-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                      <span className="font-medium text-blue-900">Getting your location...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Get My Location</span>
                    </>
                  )}
                </div>
              </button>
            ) : (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 mb-1">Location Found</p>
                    <p className="text-sm text-green-700 font-mono">
                      {location.lat}, {location.lng}
                    </p>
                  </div>
                  <button
                    onClick={getLocation}
                    className="text-sm text-green-700 hover:text-green-800 font-medium"
                  >
                    Update
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description (Optional) */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-lg font-semibold text-gray-900 mb-2">
              More details (optional)
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Add any extra information that can help
            </p>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Example: Two people trapped, near the park entrance..."
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base"
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
            For life-threatening emergencies, call 911
          </p>
        </div>
      </div>
    </div>
  );
}