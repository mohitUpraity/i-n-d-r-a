import { useState, useEffect, useRef } from 'react';
import { Shield, Mail, Lock, Chrome, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogleWithFallback, signInWithEmail, createUserWithEmail, signInWithGoogleRedirect, initAuthPersistence } from '../lib/auth';
import { ensureUserProfile } from '../lib/userProfile';
import { auth } from '../lib/firebase';
import { getRedirectResult } from 'firebase/auth';

export default function AuthCitizen() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
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
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const navigate = useNavigate();

  // Handle redirect result (for signInWithRedirect fallback) and auth state
  const loginHandledRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Check redirect result first (if a redirect was used)
        const result = await getRedirectResult(auth);
        if (!mounted) return;
        if (result && result.user && !loginHandledRef.current) {
          loginHandledRef.current = true;
          const user = result.user;
          await ensureUserProfile(user, { userType: 'citizen', fullName: user.displayName || '' });
          navigate('/citizen/home');
          return;
        }
      } catch (err) {
        // Not critical if no redirect result exists
        console.warn('Redirect result check:', err?.code || err?.message);
      }

      // Fallback: listen for auth state changes in case the user signed in by other means
      const { onAuthStateChanged } = await import('firebase/auth');
      const unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (u && !loginHandledRef.current && window.location.pathname === '/auth/citizen') {
          loginHandledRef.current = true;
          try {
            await ensureUserProfile(u, { userType: 'citizen', fullName: u.displayName || '' });
            navigate('/citizen/home');
          } catch (err) {
            console.error('Error ensuring profile after auth state change', err);
          }
        }
      });

      return () => unsubscribe();
    })();

    return () => { mounted = false; };
  }, [navigate]);

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
          await ensureUserProfile(user, { userType: 'citizen', fullName: formData.fullName });
          navigate('/citizen/home');
        } else {
          const res = await createUserWithEmail(formData.email, formData.password);
          const user = res.user;
          await ensureUserProfile(user, { userType: 'citizen', fullName: formData.fullName });
          navigate('/citizen/home');
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

  const handleGoogleAuth = async () => {
    if (loading) return;
    setLoading(true);
    setErrors({});

    try {
      let user;

      // If already signed in, reuse the current user
      if (auth.currentUser) {
        user = auth.currentUser;
      } else {
        const res = await signInWithGoogleWithFallback(6000);
        // If fallback used redirect, function returns null and the page will navigate away
        if (res === null) {
          // redirect initiated; stop further handling
          return;
        }
        user = res?.user;
        if (!user) throw new Error('No user returned from Google sign-in');
      }

      await ensureUserProfile(user, { userType: 'citizen', fullName: user.displayName || '' });
      navigate('/citizen/home');
    } catch (err) {
      console.error(err);
      const msg = err?.code === 'auth/popup-blocked' || err?.code === 'auth/popup-timeout' ? 'Popup blocked or timed out. Redirect flow may be used.' : (err.message || 'Google sign-in failed');
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-20 right-10 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/">
            <div className="flex items-center justify-center gap-2 mb-4 hover:opacity-80 transition-opacity">
              <div className="p-2 bg-green-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">INDRA</span>
            </div>
          </Link>
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            {isLogin ? 'Citizen Access' : 'Join INDRA'}
          </h1>
          <p className="text-gray-600 font-medium">
            {isLogin ? 'Report incidents and stay informed' : 'Be part of disaster safety network'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-green-600">
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
                      : 'border-gray-200 focus:border-green-500'
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
                  placeholder="you@example.com"
                  className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.email
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-green-500'
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
                  placeholder={isLogin ? 'Enter your password' : 'At least 8 characters'}
                  className={`w-full pl-11 pr-4 py-3 rounded-lg border-2 transition-colors focus:outline-none ${
                    errors.password
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-green-500'
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
                        : 'border-gray-200 focus:border-green-500'
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
              className="w-full bg-linear-to-r from-green-600 to-emerald-600 text-white font-bold py-3 rounded-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 hover:scale-105"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 hover:shadow-md transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Chrome className="w-5 h-5" />
            {loading ? 'Working...' : 'Google'}
          </button>
          <div className="text-center mt-2">
            <button
              type="button"
              disabled={loading}
              onClick={async () => { setLoading(true); try { await signInWithGoogleRedirect(); } catch (err) { setErrors({ general: err.message || 'Redirect failed' }); setLoading(false); } }}
              className="text-sm text-gray-600 hover:underline"
            >
              Use redirect sign-in if popup does not open
            </button>
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
                  className="text-green-600 font-black hover:underline"
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
                  className="text-green-600 font-black hover:underline"
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
