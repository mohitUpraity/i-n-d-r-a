import { useState } from 'react';
import { Shield, Mail, Lock, Chrome, AlertCircle, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmail, createUserWithEmail } from '../../lib/auth';
import { ensureUserProfile } from '../../lib/userProfile';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AuthOperator() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organization: '',
    organizationOther: '',
    designation: '',
    role: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const validateSignup = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.organization) newErrors.organization = 'Organization is required';
    if (formData.organization === 'Other' && !formData.organizationOther) newErrors.organizationOther = 'Please specify organization';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.designation) newErrors.designation = 'Designation is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = isLogin ? validateLogin() : validateSignup();

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        if (isLogin) {
          const res = await signInWithEmail(formData.email, formData.password);
          const user = res.user;
          
          // Check if profile exists - don't overwrite on login
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref);
          
          if (!snap.exists()) {
            // Profile doesn't exist - this shouldn't happen for login, but handle it
            console.error('Profile not found for user:', user.uid);
            setErrors({ general: 'Account not found. Please register first.' });
            setLoading(false);
            return;
          }
          
          const profile = snap.data();
          console.log('User profile loaded:', profile);
          
          // Navigate based on approval status and role
          if (profile.status === 'approved' && (profile.role === 'operator' || profile.userType === 'operator')) {
            console.log('Navigating to operator dashboard');
            navigate('/operator/dashboard');
          } else if (profile.status === 'pending') {
            console.log('Navigating to pending page');
            navigate('/operator/pending');
          } else if (profile.role === 'admin' || profile.userType === 'admin') {
            // If admin logs in here, redirect to admin dashboard
            console.log('Admin detected, redirecting to admin dashboard');
            navigate('/admin');
          } else {
            console.error('Unexpected status:', profile.status);
            setErrors({ general: 'Your account status is ' + profile.status + '. Please contact support.' });
            setLoading(false);
          }
        } else {
          console.log('Creating new operator account...');
          const res = await createUserWithEmail(formData.email, formData.password);
          const user = res.user;
          console.log('Firebase Auth user created:', user.uid);
          
          const orgToSave = formData.organization === 'Other' ? formData.organizationOther : formData.organization;
          const profileData = { 
            userType: 'operator', 
            fullName: formData.fullName, 
            organization: orgToSave, 
            designation: formData.designation, 
            role: formData.role || null 
          };
          console.log('Creating operator profile with data:', profileData);
          
          const profileRes = await ensureUserProfile(user, profileData);
          if (!profileRes?.success) {
            console.error('Failed to create/update operator profile after account creation', profileRes?.error);
            setErrors({ general: 'Account created but we could not finish creating your profile. Please contact support.' });
            return;
          }
          console.log('Operator profile created successfully. Navigating to pending page...');
          // New operators are pending by default
          navigate('/operator/pending');
        }
      } catch (err) {
        console.error(err);
        setErrors({ general: err.message || 'Authentication error' });
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors);
    }

  };



  return (
    <div className="min-h-screen bg-linear-to-br from-blue-100 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/">
            <div className="flex items-center justify-center gap-2 mb-4 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-blue-900 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-blue-900">INDRA</span>
            </div>
          </Link>
          <h1 className="text-4xl font-black text-blue-900 mb-2">
            {isLogin ? 'Operator Access' : 'Operator Registration'}
          </h1>
          <p className="text-gray-700 font-medium">
            {isLogin ? 'Manage disaster response operations' : 'Join the response coordination team'}
          </p>
        </div>

        {/* How It Works - Flow Diagram */}
        <div className="bg-linear-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            How the Operator System Works
          </h3>
          
          {/* Flow Diagram */}
          <div className="bg-white rounded-lg p-4 mb-4 border-2 border-blue-200">
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3 items-start">
                <div className="shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 mb-1">Register as Operator</h4>
                  <p className="text-sm text-gray-700">Fill out the registration form with your organization details, role, and designation.</p>
                </div>
              </div>
              
              <div className="ml-5 border-l-2 border-blue-300 h-6"></div>
              
              {/* Step 2 */}
              <div className="flex gap-3 items-start">
                <div className="shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div className="flex-1">
                  <h4 className="font-bold text-purple-900 mb-1">Account Pending</h4>
                  <p className="text-sm text-gray-700">Your account is created with "pending" status. You'll see a waiting page with instructions.</p>
                </div>
              </div>
              
              <div className="ml-5 border-l-2 border-blue-300 h-6"></div>
              
              {/* Step 3 */}
              <div className="flex gap-3 items-start">
                <div className="shrink-0 w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div className="flex-1">
                  <h4 className="font-bold text-red-900 mb-1">Admin Approval Required</h4>
                  <p className="text-sm text-gray-700">An admin must log in and approve your request from the Admin Dashboard.</p>
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs">
                    <strong>For Testing:</strong> Go to <Link to="/auth/admin" className="text-blue-600 underline font-semibold">Admin Login</Link> to approve requests
                  </div>
                </div>
              </div>
              
              <div className="ml-5 border-l-2 border-blue-300 h-6"></div>
              
              {/* Step 4 */}
              <div className="flex gap-3 items-start">
                <div className="shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">✓</div>
                <div className="flex-1">
                  <h4 className="font-bold text-green-900 mb-1">Access Granted!</h4>
                  <p className="text-sm text-gray-700">Once approved, log back in here to access the full Operator Dashboard with all reports and management tools.</p>
                </div>
              </div>
            </div>
          </div>

          {/* What Operators Can Do */}
          <div className="bg-blue-100 rounded-lg p-4 border border-blue-300">
            <h4 className="font-semibold text-blue-900 mb-2">What Operators Can Do:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ View & manage all citizen disaster reports in real-time</li>
              <li>✓ Update incident status (Submitted → Reviewed → Working → Resolved)</li>
              <li>✓ Filter reports by status, category, and confidence level</li>
              <li>✓ Access location data and community verification scores</li>
              <li>✓ Coordinate emergency response operations</li>
            </ul>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-blue-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name - Only for Signup */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.fullName
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-blue-900'
                  }`}
                />
                {errors.fullName && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.fullName}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@organization.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.email
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-blue-900'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Organization - Only for Signup */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                  <select
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                      errors.organization
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 focus:border-blue-900'
                    }`}
                  >
                    <option value="">Select organization</option>
                    <option value="Fire Department">Fire Department</option>
                    <option value="Police">Police</option>
                    <option value="Disaster Management">Disaster Management</option>
                    <option value="NGO">NGO</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {formData.organization === 'Other' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      name="organizationOther"
                      value={formData.organizationOther}
                      onChange={handleInputChange}
                      placeholder="Please specify organization"
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                        errors.organizationOther
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 focus:border-blue-900'
                      }`}
                    />
                    {errors.organizationOther && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.organizationOther}
                      </p>
                    )}
                  </div>
                )}

                {errors.organization && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.organization}
                  </p>
                )}

                {/* Role - Only for Signup */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                      errors.role ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-blue-900'
                    }`}
                  >
                    <option value="">Select role</option>
                    <option value="Responder">Responder</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Manager">Manager</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.role}
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* Designation - Only for Signup */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="e.g., Officer, Manager, Coordinator"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.designation
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-blue-900'
                  }`}
                />
                {errors.designation && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.designation}
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={isLogin ? 'Enter your password' : 'At least 8 characters'}
                  className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.password
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-blue-900'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password - Only for Signup */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                      errors.confirmPassword
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 focus:border-blue-900'
                    }`}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {errors.general && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.general}
              </p>
            )}

            {/* Submit Button */}
            <button
            onClick={handleSubmit}
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-900 to-blue-800 text-white font-bold py-3 rounded-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 hover:scale-105"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Divider - Removed Google Auth */}

          {/* Test operator credentials (for testing) */}
          <div className="mt-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
            <strong className="text-green-900">✅ Test Operator Credentials (Already Approved):</strong>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between gap-2 bg-white p-2 rounded border border-green-200">
                <p className="font-mono text-xs flex-1">
                  <strong>Email:</strong> operator@indra.com
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('operator@indra.com');
                    alert('Email copied!');
                  }}
                  className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs font-semibold transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 bg-white p-2 rounded border border-green-200">
                <p className="font-mono text-xs flex-1">
                  <strong>Password:</strong> indra123
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('indra123');
                    alert('Password copied!');
                  }}
                  className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-800 rounded text-xs font-semibold transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="text-xs text-green-800 mt-2">💡 Use these credentials to instantly access the operator dashboard without waiting for approval.</p>
          </div>

          {/* Toggle Login/Signup */}
          <div className="text-center mt-6 text-gray-600">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setErrors({});
                  }}
                  className="text-blue-900 font-black hover:underline"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setErrors({});
                  }}
                  className="text-blue-900 font-black hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {/* Admin Login Link */}
          <div className="text-center mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              System Administrator?{' '}
              <Link
                to="/auth/admin"
                className="text-red-900 font-black hover:underline"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-4">
          <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}