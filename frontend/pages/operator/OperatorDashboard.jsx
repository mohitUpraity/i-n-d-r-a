import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Shield, MapPin, Clock, ChevronDown, Filter, Menu, X, User } from 'lucide-react';
import { logOut } from '../../lib/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CommandDashboard() {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
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

  const regions = [
    { id: 'all', name: 'All Regions' },
    { id: 'north', name: 'Northern District' },
    { id: 'south', name: 'Southern District' },
    { id: 'east', name: 'Eastern District' },
    { id: 'west', name: 'Western District' },
    { id: 'central', name: 'Central District' }
  ];

  const incidents = [
    {
      id: 'INC-2024-1247',
      type: 'Structural Fire',
      location: 'Northern District, Zone 4A',
      region: 'north',
      severity: 'critical',
      status: 'active',
      time: '14 minutes ago',
      responders: 8
    },
    {
      id: 'INC-2024-1246',
      type: 'Flooding',
      location: 'Eastern District, Riverside Area',
      region: 'east',
      severity: 'high',
      status: 'active',
      time: '32 minutes ago',
      responders: 12
    },
    {
      id: 'INC-2024-1245',
      type: 'Road Blockage',
      location: 'Central District, Highway 7',
      region: 'central',
      severity: 'medium',
      status: 'responding',
      time: '1 hour ago',
      responders: 4
    },
    {
      id: 'INC-2024-1244',
      type: 'Power Outage',
      location: 'Western District, Sector 9',
      region: 'west',
      severity: 'medium',
      status: 'responding',
      time: '1 hour ago',
      responders: 6
    },
    {
      id: 'INC-2024-1243',
      type: 'Medical Emergency',
      location: 'Southern District, Commerce St',
      region: 'south',
      severity: 'high',
      status: 'resolved',
      time: '2 hours ago',
      responders: 3
    },
    {
      id: 'INC-2024-1242',
      type: 'Building Damage',
      location: 'Northern District, Industrial Park',
      region: 'north',
      severity: 'low',
      status: 'resolved',
      time: '3 hours ago',
      responders: 5
    }
  ];

  const stats = [
    { label: 'Active Incidents', value: '14', color: 'text-red-600' },
    { label: 'Responding', value: '23', color: 'text-yellow-600' },
    { label: 'Resolved Today', value: '47', color: 'text-green-600' },
    { label: 'Total Responders', value: '156', color: 'text-blue-600' }
  ];

  const riskZones = [
    { name: 'Northern District', risk: 'critical', level: 4 },
    { name: 'Eastern District', risk: 'high', level: 3 },
    { name: 'Central District', risk: 'medium', level: 2 },
    { name: 'Western District', risk: 'medium', level: 2 },
    { name: 'Southern District', risk: 'low', level: 1 }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-50 border-red-200';
      case 'responding': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'resolved': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const regionMatch = selectedRegion === 'all' || incident.region === selectedRegion;
    const severityMatch = selectedSeverity === 'all' || incident.severity === selectedSeverity;
    return regionMatch && severityMatch;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-white truncate">Emergency Operations Center</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">National Disaster Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                to="/operator/profile" 
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700"
              >
                <User className="w-4 h-4" /> Profile
              </Link>

              <button
                onClick={handleSignOut}
                className={`px-3 py-2 rounded text-sm ${signOutLoading ? 'bg-gray-600 text-gray-300' : 'bg-red-600 text-white hover:bg-red-700'}`}
                disabled={signOutLoading}
              >
                {signOutLoading ? 'Signing out...' : 'Sign out'}
              </button>

              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-800 border-b border-gray-700 px-4 py-3">
          <div className="flex flex-col gap-2">
            <Link 
              to="/operator/profile" 
              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-600"
            >
              <User className="w-4 h-4" /> Profile
            </Link>
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white border border-gray-200 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-xl sm:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Risk Heatmap */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Regional Risk Assessment</h2>
              </div>
              <div className="p-4 sm:p-6">
                {/* Heatmap Visualization */}
                <div className="space-y-2 sm:space-y-3">
                  {riskZones.map((zone, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="w-full sm:w-32 lg:w-40 text-xs sm:text-sm font-medium text-gray-700">
                        {zone.name}
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 h-6 sm:h-8 relative overflow-hidden">
                          <div
                            className={`h-full ${getRiskColor(zone.risk)}`}
                            style={{ width: `${zone.level * 25}%` }}
                          />
                        </div>
                        <div className={`px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold uppercase ${getSeverityColor(zone.risk)}`}>
                          {zone.risk}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend */}
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-2">RISK LEVELS</p>
                  <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-600 shrink-0" />
                      <span className="text-xs text-gray-700">Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 shrink-0" />
                      <span className="text-xs text-gray-700">High</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 shrink-0" />
                      <span className="text-xs text-gray-700">Medium</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 shrink-0" />
                      <span className="text-xs text-gray-700">Low</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200">
              <div className="border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-3 sm:p-4 space-y-2">
                <button className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-900 text-white text-xs sm:text-sm font-medium hover:bg-gray-800">
                  Deploy Resources
                </button>
                <button className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-900 text-xs sm:text-sm font-medium hover:bg-gray-50">
                  Issue Alert
                </button>
                <button className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-900 text-xs sm:text-sm font-medium hover:bg-gray-50">
                  Generate Report
                </button>
                <button className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 text-gray-900 text-xs sm:text-sm font-medium hover:bg-gray-50">
                  Contact Agencies
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Incidents List */}
        <div className="mt-4 sm:mt-6 bg-white border border-gray-200">
          <div className="border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Active Incidents</h2>
              <div className="flex items-center gap-2 sm:gap-3">
                <Filter className="w-4 h-4 text-gray-500 shrink-0" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="flex-1 sm:flex-none px-2 sm:px-3 py-1.5 border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredIncidents.map((incident) => (
              <div key={incident.id} className="p-3 sm:p-4 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs sm:text-sm font-mono text-gray-600">{incident.id}</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold uppercase ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-medium uppercase border ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{incident.type}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="truncate">{incident.location}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        {incident.time}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">Responders</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{incident.responders}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredIncidents.length === 0 && (
            <div className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
              No incidents match the selected filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}