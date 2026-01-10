import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Shield, Bell, Save, ArrowLeft } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function CitizenProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    notifyByEmail: true,
    notifyBySMS: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/auth/citizen');
        return;
      }

      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setFormData({
            fullName: data.fullName || user.displayName || '',
            phone: data.phone || '',
            address: data.address || '',
            emergencyContact: data.emergencyContact || '',
            emergencyPhone: data.emergencyPhone || '',
            notifyByEmail: data.notifyByEmail !== false,
            notifyBySMS: data.notifyBySMS || false,
          });
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      const docRef = doc(db, 'users', user.uid);
      
      await updateDoc(docRef, {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        notifyByEmail: formData.notifyByEmail,
        notifyBySMS: formData.notifyBySMS,
        updatedAt: new Date(),
      });

      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to save profile', err);
      alert('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-br from-purple-600 to-purple-700 p-2 rounded-lg shadow-sm">
                <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">My Profile</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Manage your account and preferences</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/citizen/home')}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to Home</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Account Info */}
        <section className="mb-6 bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Account Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded-lg text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{auth.currentUser?.email}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
              <div className="px-4 py-2 bg-gray-50 border rounded-lg text-gray-600">
                <span className="capitalize">{profile?.userType || 'Citizen'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Personal Information */}
        <section className="mb-6 bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Enter your address"
              />
            </div>
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="mb-6 bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Phone className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Emergency Contact</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Emergency contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section className="mb-6 bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Notification Preferences</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyByEmail}
                onChange={(e) => setFormData({ ...formData, notifyByEmail: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Email Notifications</div>
                <div className="text-xs text-gray-500">Receive updates about your reports via email</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifyBySMS}
                onChange={(e) => setFormData({ ...formData, notifyBySMS: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">SMS Notifications</div>
                <div className="text-xs text-gray-500">Receive critical alerts via SMS (requires phone number)</div>
              </div>
            </label>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate('/citizen/home')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </main>
    </div>
  );
}
