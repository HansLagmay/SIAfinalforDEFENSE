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
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] -top-48 -left-48 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-[600px] h-[600px] -bottom-48 -right-48 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="glass rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 animate-scale-in border border-white/30">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-xl mb-4 transform hover:scale-105 transition-transform">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">TES Property</h1>
          <p className="text-gray-600 font-semibold text-lg">{roleParam ? `${roleLabel} Login` : 'Welcome Back'}</p>
        </div>

        {sessionExpired && (
          <div className="bg-white border-l-4 border-warning-600 text-gray-900 px-4 py-3 rounded-lg mb-4 flex items-center gap-3 shadow-soft">
            <svg className="w-5 h-5 text-warning-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Your session has expired. Please login again.</span>
          </div>
        )}

        <div className="flex gap-3 mb-6 p-1.5 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => navigate('/login/admin')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
              roleParam === 'admin'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg transform scale-105'
                : 'bg-transparent text-gray-600 hover:bg-white/50'
            }`}
          >
            👑 Admin
          </button>
          <button
            type="button"
            onClick={() => navigate('/login/agent')}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
              roleParam === 'agent'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg transform scale-105'
                : 'bg-transparent text-gray-600 hover:bg-white/50'
            }`}
          >
            👤 Agent
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-white border-l-4 border-danger-600 text-gray-900 px-4 py-3 rounded-lg flex items-center gap-3 shadow-soft">
              <svg className="w-5 h-5 text-danger-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
              📧 Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input w-full bg-white border-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2">
              🔒 Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input w-full bg-white border-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                {roleParam ? `Login as ${roleLabel}` : 'Login'}
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
          <p className="text-sm text-gray-800 font-bold mb-3 flex items-center gap-2">
            <span className="text-xl">⚡</span>
            Quick Demo Login:
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => { setEmail('admin@tesproperty.com'); setPassword('admin123'); }}
              className="w-full text-left px-4 py-3 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 border-2 border-blue-300 hover:border-blue-500 rounded-xl text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👑</span>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Admin Account</div>
                    <div className="text-gray-600 text-xs">admin@tesproperty.com</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('maria@tesproperty.com'); setPassword('agent123'); }}
              className="w-full text-left px-4 py-3 bg-white hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 border-2 border-green-300 hover:border-green-500 rounded-xl text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👩‍💼</span>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Maria Santos</div>
                    <div className="text-gray-600 text-xs">Agent Account</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('juan@tesproperty.com'); setPassword('agent123'); }}
              className="w-full text-left px-4 py-3 bg-white hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 border-2 border-green-300 hover:border-green-500 rounded-xl text-sm transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👨‍💼</span>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Juan Dela Cruz</div>
                    <div className="text-gray-600 text-xs">Agent Account</div>
                  </div>
                </div>
                <svg className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-700 hover:text-gray-900 font-bold transition-all inline-flex items-center gap-2 group px-4 py-2 bg-white/50 hover:bg-white/80 rounded-lg backdrop-blur-sm"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Customer Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
