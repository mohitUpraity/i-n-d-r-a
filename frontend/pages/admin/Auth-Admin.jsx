import { useState } from 'react';
import { Shield, Mail, Lock, AlertCircle, User } from 'lucide-react';
import { DEV_HARDCODED_ADMIN_EMAIL, DEV_HARDCODED_ADMIN_PASSWORD } from '../../lib/config';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmail, createUserWithEmail } from '../../lib/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AuthAdmin() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = isLogin ? validateLogin() : validateSignup();

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        if (isLogin) {
          // LOGIN FLOW
          const res = await signInWithEmail(formData.email, formData.password);
          const user = res.user;
          
          // Check if profile exists
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref);
          
          if (!snap.exists()) {
            console.error('Profile not found for admin:', user.uid);
            setErrors({ general: 'Admin account not found. Please register first.' });
            setLoading(false);
            return;
          }
          
          const profile = snap.data();
          console.log('Admin profile loaded:', profile);
          
          // Check if user is admin and approved
          if (profile.userType === 'admin' && profile.status === 'approved') {
            console.log('Admin approved, navigating to dashboard');
            navigate('/admin');
          } else if (profile.userType === 'admin' && profile.status === 'pending') {
            console.log('Admin pending approval');
            navigate('/operator/pending'); // Reuse pending page
          } else {
            console.error('Not an admin account:', profile);
            setErrors({ general: 'This account is not registered as an admin.' });
            setLoading(false);
          }
        } else {
          // REGISTRATION FLOW
          const res = await createUserWithEmail(formData.email, formData.password);
          const user = res.user;
          
          // Create admin profile with pending status
          const profileData = {
            uid: user.uid,
            email: user.email,
            fullName: formData.fullName,
            userType: 'admin',
            role: 'admin',
            status: 'pending', // Needs approval
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const ref = doc(db, 'users', user.uid);
          await setDoc(ref, profileData);
          
          console.log('Admin registered with pending status');
          // Navigate to pending page
          navigate('/operator/pending');
        }
      } catch (err) {
        console.error(err);
        if (err.code === 'auth/user-not-found') {
          setErrors({ general: 'Account not found. Please register first.' });
        } else if (err.code === 'auth/wrong-password') {
          setErrors({ general: 'Invalid credentials' });
        } else if (err.code === 'auth/email-already-in-use') {
          setErrors({ general: 'This email is already registered. Please sign in instead.' });
        } else {
          setErrors({ general: err.message || 'Authentication error' });
        }
      } finally {
        setLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-red-100 to-orange-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/">
            <div className="flex items-center justify-center gap-2 mb-4 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-red-900 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-red-900">INDRA</span>
            </div>
          </Link>
          <h1 className="text-4xl font-black text-red-900 mb-2">
            {isLogin ? 'Admin Login' : 'Admin Registration'}
          </h1>
          <p className="text-gray-700 font-medium">
            {isLogin ? 'Restricted access for system administrators' : 'Request admin access (requires approval)'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-red-900">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name - Only for Signup */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                      errors.fullName
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 focus:border-red-900'
                    }`}
                  />
                </div>
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
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@indra.local"
                  className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.email
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-red-900'
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
                  placeholder={isLogin ? 'Enter admin password' : 'At least 8 characters'}
                  className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.password
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-red-900'
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
                        : 'border-gray-200 focus:border-red-900'
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
              type="submit"
              disabled={loading}
              className="w-full bg-linear-to-r from-red-900 to-red-800 text-white font-bold py-3 rounded-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 hover:scale-105"
            >
              {loading ? (isLogin ? 'Authenticating...' : 'Creating Account...') : (isLogin ? 'Admin Sign In' : 'Request Admin Access')}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="text-center mt-6 text-gray-600">
            {isLogin ? (
              <>
                Need admin access?{' '}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setErrors({});
                  }}
                  className="text-red-900 font-black hover:underline"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have admin access?{' '}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setErrors({});
                  }}
                  className="text-red-900 font-black hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>

          {/* Back to Operator Login */}
          <div className="text-center mt-4 pt-4 border-t border-gray-200 text-gray-600">
            Not an admin?{' '}
            <Link
              to="/auth/operator"
              className="text-red-900 font-black hover:underline"
            >
              Operator Login
            </Link>
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
