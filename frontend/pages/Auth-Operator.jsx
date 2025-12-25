import { useState } from 'react';
import { Shield, Mail, Lock, Chrome, AlertCircle, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmail, createUserWithEmail } from '../lib/auth';
import { ensureUserProfile } from '../lib/userProfile';

export default function AuthOperator() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organization: '',
    designation: ''
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
          const profileRes = await ensureUserProfile(user, { userType: 'operator', fullName: formData.fullName, organization: formData.organization, designation: formData.designation });
          if (!profileRes?.success) {
            console.error('Failed to create/update operator profile after sign-in', profileRes?.error);
            setErrors({ general: 'Signed in but failed to create your operator profile. Please contact support.' });
            return;
          }
          navigate('/operator/dashboard');
        } else {
          const res = await createUserWithEmail(formData.email, formData.password);
          const user = res.user;
          const profileRes = await ensureUserProfile(user, { userType: 'operator', fullName: formData.fullName, organization: formData.organization, designation: formData.designation });
          if (!profileRes?.success) {
            console.error('Failed to create/update operator profile after account creation', profileRes?.error);
            setErrors({ general: 'Account created but we could not finish creating your profile. Please contact support.' });
            return;
          }
          navigate('/operator/dashboard');
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
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    placeholder="e.g., Fire Department, Police, Disaster Management"
                    className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                      errors.organization
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 focus:border-blue-900'
                    }`}
                  />
                </div>
                {errors.organization && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.organization}
                  </p>
                )}
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