import { useState, useEffect, useRef } from 'react';
import { Shield, Mail, Lock, Chrome, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogleWithFallback, signInWithEmail, createUserWithEmail, initAuthPersistence } from '../lib/auth';
import { ensureUserProfile } from '../lib/userProfile';
import { auth } from '../lib/firebase';

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

  // Listen for auth state changes (popup-only sign-in)
  const loginHandledRef = useRef(false);
  const backgroundRepairRef = useRef({});

  // Try a background profile repair (non-blocking) so users can continue using the app
  const attemptBackgroundProfileRepair = async (user, maxAttempts = 3) => {
    if (!user || !user.uid) return;
    if (backgroundRepairRef.current[user.uid]) return;
    backgroundRepairRef.current[user.uid] = true;

    console.log('Starting background profile repair for', user.uid);
    for (let i = 1; i <= maxAttempts; i++) {
      try {
        const res = await ensureUserProfile(user, { userType: 'citizen', fullName: user.displayName || '' }, { maxRetries: 2, retryDelayMs: 500 });
        if (res?.success) {
          console.info('Background profile repair succeeded for', user.uid);
          setErrors(prev => ({ ...prev, general: '' }));
          backgroundRepairRef.current[user.uid] = false;
          return true;
        }
      } catch (err) {
        console.warn('Background profile repair attempt', i, 'failed for', user.uid, err?.code || err?.message || err);
      }
      // wait before next attempt
      await new Promise(r => setTimeout(r, 800 * i));
    }

    console.error('Background profile repair failed for', user.uid);
    setErrors({ general: 'Signed in but we could not create your profile yet. We will keep retrying in the background.' });
    backgroundRepairRef.current[user.uid] = false;
    return false;
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      // Listen for auth state changes (we no longer use redirect-based sign-in)
      const { onAuthStateChanged } = await import('firebase/auth');
      const unsubscribe = onAuthStateChanged(auth, async (u) => {
        if (u && !loginHandledRef.current && window.location.pathname === '/auth/citizen') {
          loginHandledRef.current = true;
          console.log('onAuthStateChanged fired for user:', u.uid, u.email);
          try {
            const profileRes = await ensureUserProfile(u, { userType: 'citizen', fullName: u.displayName || '' });
            if (!profileRes?.success) {
              console.error('Failed to create/update profile after auth change', profileRes?.error);
              // Schedule background repair and let the user proceed
              attemptBackgroundProfileRepair(u);
              navigate('/citizen/home');
              return;
            }
            navigate('/citizen/home');
          } catch (err) {
            console.error('Error ensuring profile after auth state change', err);
            // Schedule background repair and allow user to continue
            attemptBackgroundProfileRepair(u);
            navigate('/citizen/home');
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
          const profileRes = await ensureUserProfile(user, { userType: 'citizen', fullName: formData.fullName });
          if (!profileRes?.success) {
            console.error('Failed to create/update profile after email sign-in', profileRes?.error);
            // Schedule background repair and allow the user to continue
            attemptBackgroundProfileRepair(user);
            navigate('/citizen/home');
            return;
          }
          navigate('/citizen/home');
        } else {
          const res = await createUserWithEmail(formData.email, formData.password);
          const user = res.user;
          const profileRes = await ensureUserProfile(user, { userType: 'citizen', fullName: formData.fullName });
          if (!profileRes?.success) {
            console.error('Failed to create/update profile after account creation', profileRes?.error);
            // Schedule background repair and allow the user to continue
            attemptBackgroundProfileRepair(user);
            navigate('/citizen/home');
            return;
          }
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

    // Claim handling early to avoid duplicate flows (cleared after timeout or on error)
    loginHandledRef.current = true;
    let clearClaimTimer = setTimeout(() => {
      console.warn('Clearing loginHandledRef due to timeout');
      loginHandledRef.current = false;
    }, 15000);

    try {
      console.log('Starting Google sign-in (popup with redirect fallback, 5s timeout)');
      let user;

      // If already signed in, reuse the current user
      if (auth.currentUser) {
        user = auth.currentUser;
        clearTimeout(clearClaimTimer);
      } else {
        const res = await signInWithGoogleWithFallback(5000);
        // If fallback used redirect, function returns null and the page will navigate away
        if (res === null) {
          // redirect initiated; stop further handling
          console.log('Redirect flow initiated after popup fallback');
          return;
        }
        console.log('Popup sign-in result:', res?.user?.uid, res?.user?.email);
        user = res?.user;
        if (!user) throw new Error('No user returned from Google sign-in');
      }

      // At this point we have a user; keep claimed state and clear the timer
      clearTimeout(clearClaimTimer);

      const profileRes = await ensureUserProfile(user, { userType: 'citizen', fullName: user.displayName || '' });
      if (!profileRes?.success) {
        console.error('Failed to create/update profile after Google sign-in', profileRes?.error);
        // Schedule background repair and let the user proceed
        attemptBackgroundProfileRepair(user);
        // release claim so the auth listener can proceed if needed
        loginHandledRef.current = false;
        navigate('/citizen/home');
        return;
      }

      navigate('/citizen/home');
    } catch (err) {
      console.error('Google sign-in error:', err?.code || err?.message || err);
      // Release claim to allow retry attempts
      loginHandledRef.current = false;
      const msg = ['auth/popup-blocked', 'auth/popup-timeout', 'auth/popup-blocked-no-redirect'].includes(err?.code) ? 'Popup blocked or timed out. Please allow popups and try again.' : (err.message || 'Google sign-in failed');
      setErrors({ general: msg });
    } finally {
      setLoading(false);
      try { clearTimeout(clearClaimTimer); } catch(e){}
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
          <div className="text-center mt-2 text-sm text-gray-500">If the Google popup is blocked, please allow popups in your browser and try again.</div>

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

        {/* Optional debug info (enable by adding ?debug=auth to URL) */}
        {new URLSearchParams(window.location.search).get('debug') === 'auth' && (
          <div className="mt-4 p-3 bg-gray-50 border rounded text-xs text-gray-700">
            <div><strong>Firebase Project:</strong> {auth?.app?.options?.projectId || 'unknown'}</div>
            <div><strong>Auth currentUser:</strong> {auth?.currentUser?.uid ? auth.currentUser.uid : 'none'}</div>
            <div className="mt-2 text-xxs text-gray-500">Use this for quick verification of the deployed config and auth state.</div>
          </div>
        )}
      </div>
    </div>
  );
}
