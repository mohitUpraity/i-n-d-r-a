import React, { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Shield, Clock, CheckCircle, AlertCircle, LogOut, User } from 'lucide-react';
import { DEV_HARDCODED_ADMIN_EMAIL, DEV_HARDCODED_ADMIN_PASSWORD } from '../../lib/config';
import { Link } from 'react-router-dom';

export default function OperatorPending() {
  const [userType, setUserType] = useState('operator');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserType = async () => {
      if (auth.currentUser) {
        const ref = doc(db, 'users', auth.currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setUserType(data.userType || 'operator');
          setProfile(data);
        }
      }
      setLoading(false);
    };
    fetchUserType();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-3xl mx-auto pt-8 pb-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">INDRA</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-yellow-500">
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-yellow-100 rounded-full">
              <Clock className="w-12 h-12 text-yellow-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-900 mb-3">
            Account Pending Approval
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Your {userType} account has been created and is awaiting admin approval.
          </p>

          {/* User Info */}
          {profile && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Your Account Details</h3>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Name:</strong> {profile.fullName || 'N/A'}</p>
                <p><strong>Email:</strong> {auth.currentUser?.email}</p>
                <p><strong>Organization:</strong> {profile.organization || 'N/A'}</p>
                <p><strong>Role:</strong> {profile.role || 'N/A'}</p>
                <p><strong>Status:</strong> <span className="text-yellow-600 font-semibold">Pending</span></p>
              </div>
            </div>
          )}

          {/* Approval Flow Instructions */}
          <div className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              How to Test the Operator Approval Flow
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              This is a <strong>prototype demonstration</strong> of the admin-operator approval workflow. Follow these steps to test it:
            </p>
            <div className="space-y-4 text-sm text-blue-900">
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Sign Out of This Operator Account</p>
                  <p className="text-blue-800">Click the "Sign Out" button below to log out of your pending operator account.</p>
                </div>
              </div>
              
              <div className="ml-4 border-l-2 border-blue-300 h-4"></div>
              
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Log In as Admin</p>
                  <p className="text-blue-800 mb-2">Go to <Link to="/auth/admin" className="font-semibold underline hover:text-blue-600">Admin Login</Link> and use these credentials:</p>
                  <div className="p-3 bg-white border-2 border-yellow-300 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs flex-1"><strong>Email:</strong> {DEV_HARDCODED_ADMIN_EMAIL}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(DEV_HARDCODED_ADMIN_EMAIL);
                          alert('Email copied!');
                        }}
                        className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-semibold transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs flex-1"><strong>Password:</strong> {DEV_HARDCODED_ADMIN_PASSWORD}</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(DEV_HARDCODED_ADMIN_PASSWORD);
                          alert('Password copied!');
                        }}
                        className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-semibold transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="ml-4 border-l-2 border-blue-300 h-4"></div>
              
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Approve Your Operator Account</p>
                  <p className="text-blue-800">In the Admin Dashboard, find your pending operator request in the "Pending Operator Requests" section and click <strong>"Approve"</strong>.</p>
                </div>
              </div>
              
              <div className="ml-4 border-l-2 border-blue-300 h-4"></div>
              
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">✓</div>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Sign Back In as Operator</p>
                  <p className="text-blue-800">Return to <Link to="/auth/operator" className="font-semibold underline hover:text-blue-600">Operator Login</Link> and log in with your operator credentials - you'll now have full access to the Operator Dashboard!</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
              <p className="text-xs text-yellow-800">
                💡 <strong>Note:</strong> In a production system, admins would receive email notifications about new operator requests and approve them through a dedicated admin portal. This simplified flow is for prototype demonstration purposes.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Quick Links</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  await auth.signOut();
                  window.location.href = '/auth/admin';
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                <Shield className="w-4 h-4" />
                Go to Admin Login (Sign Out First)
              </button>
              <Link 
                to="/" 
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Back to Home
              </Link>
            </div>
          </div>

          {/* Sign Out Button */}
          <button 
            onClick={() => auth.signOut().then(() => window.location.href = '/')} 
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          💡 <strong>Note:</strong> In production, admins would approve accounts through email notifications. This is a simplified flow for prototype testing.
        </p>
      </div>
    </div>
  );
}
