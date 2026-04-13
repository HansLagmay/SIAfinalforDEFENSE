import { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { setSession } from '../utils/session';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useParams();
  const roleParam = role === 'admin' || role === 'agent' ? role : null;
  const roleLabel = roleParam === 'admin' ? 'Admin' : roleParam === 'agent' ? 'Agent' : 'Account';

  // Check if session expired
  const sessionExpired = new URLSearchParams(location.search).get('session_expired');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ email, password });
      const { user, token } = response.data;
      
      if (roleParam && user.role !== roleParam) {
        setError(`This login is for ${roleLabel} accounts.`);
        return;
      }

      // Store session with JWT token
      setSession(user, token);

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'agent') {
        navigate('/agent/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAgNGgtMnYyaDJ2LTJ6bS0yIDBoLTJ2Mmgydi0yem0yLTZoLTJ2Mmgydi0yem0wIDBoMnYtMmgtMnYyem0yLTJoMnYtMmgtMnYyem0wLTJoMnYtMmgtMnYyem0yLTJ2LTJoLTJ2MmgyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
      
      {/* Two-column layout: horizontal on desktop, vertical on mobile */}
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 relative z-10">
        
        {/* Left Side - Branding & Info (Hidden on mobile, shown on desktop) */}
        <div className="hidden lg:flex flex-col justify-center px-12 xl:px-20 bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
          <div className="max-w-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl mb-8">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            
            <h1 className="text-5xl font-bold mb-4">TES Property</h1>
            <p className="text-xl text-blue-100 mb-8">Professional Property Management Platform</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Streamlined Operations</h3>
                  <p className="text-blue-100 text-sm">Manage properties, inquiries, and appointments in one place</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Real-Time Updates</h3>
                  <p className="text-blue-100 text-sm">Stay connected with instant notifications and updates</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Secure & Reliable</h3>
                  <p className="text-blue-100 text-sm">Enterprise-grade security for your business data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            
            {/* Mobile Logo (shown only on mobile) */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg mb-4">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">TES Property</h1>
              <p className="text-gray-600 text-base">{roleParam ? `${roleLabel} Portal` : 'Welcome Back'}</p>
            </div>

            {/* Desktop Title (shown only on desktop) */}
            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {roleParam ? `${roleLabel} Portal` : 'Welcome Back'}
              </h2>
              <p className="text-gray-600">Sign in to access your dashboard</p>
            </div>

            {sessionExpired && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-900">Session Expired</p>
                  <p className="text-sm text-yellow-800 mt-0.5">Please log in again to continue.</p>
                </div>
              </div>
            )}

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
              {/* Role Selection Tabs */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => navigate('/login/admin')}
                  className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    roleParam === 'admin'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login/agent')}
                  className={`flex-1 py-2.5 px-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    roleParam === 'agent'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  👤 Agent
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-900">Login Failed</p>
                      <p className="text-sm text-red-800 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                    placeholder="name@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Demo Accounts */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-900">Quick Demo Access</h3>
              </div>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@tesproperty.com'); setPassword('admin123'); }}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">👑</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">Admin Account</div>
                      <div className="text-xs text-gray-600">admin@tesproperty.com</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => { setEmail('maria@tesproperty.com'); setPassword('agent123'); }}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">👩‍💼</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">Maria Santos</div>
                      <div className="text-xs text-gray-600">Agent Account</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => { setEmail('juan@tesproperty.com'); setPassword('agent123'); }}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">👨‍💼</span>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-gray-900">Juan Dela Cruz</div>
                      <div className="text-xs text-gray-600">Agent Account</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Back to Customer Portal */}
            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-white/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Customer Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
