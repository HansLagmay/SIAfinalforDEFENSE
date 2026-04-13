import { useState, useEffect } from 'react';
import LoginSignupModal from './LoginSignupModal';
import { PhoneVerificationModal } from './PhoneVerificationModal';
import { customerFeaturesAPI, notificationsAPI } from '../../services/api';

interface CustomerUser {
  id: string;
  email: string;
  name: string;
  role: string;
  phoneVerified?: boolean;
}

interface CustomerNavbarProps {
  onLoginSuccess?: (user: CustomerUser) => void;
}

const CustomerNavbar = ({ onLoginSuccess }: CustomerNavbarProps) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationPhone, setVerificationPhone] = useState('');
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('customer_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data');
        localStorage.removeItem('customer_user');
        localStorage.removeItem('customer_token');
      }
    }
  }, []);

  useEffect(() => {
    const loadBadges = async () => {
      const token = localStorage.getItem('customer_token');
      if (!token || !user) {
        setFavoriteCount(0);
        setUnreadNotifications(0);
        return;
      }

      try {
        const [favoritesRes, notificationsRes] = await Promise.all([
          customerFeaturesAPI.getFavorites(token),
          notificationsAPI.getAllWithToken(token)
        ]);

        setFavoriteCount((favoritesRes.data?.data || []).length);
        setUnreadNotifications(Number(notificationsRes.data?.unreadCount || 0));
      } catch (error) {
        console.error('Failed to load navbar badges:', error);
      }
    };

    loadBadges();

    const intervalId = window.setInterval(loadBadges, 30000);
    return () => window.clearInterval(intervalId);
  }, [user]);

  const handleLoginSuccess = (userData: CustomerUser, _token: string, requiresPhoneVerification?: boolean, phone?: string) => {
    setUser(userData);
    setShowLoginModal(false);
    
    // If phone verification is required (signup with phone)
    if (requiresPhoneVerification && phone) {
      setVerificationPhone(phone);
      setShowPhoneVerification(true);
    }
    
    if (onLoginSuccess) {
      onLoginSuccess(userData);
    }
  };

  const handlePhoneVerified = () => {
    // Update user state to reflect verified phone
    if (user) {
      const updatedUser = { ...user, role: 'customer', phoneVerified: true };
      setUser(updatedUser);
      localStorage.setItem('customer_user', JSON.stringify(updatedUser));
    }
    setShowPhoneVerification(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    setUser(null);
    setShowDropdown(false);
    window.location.href = '/';
  };

  const isHomePage = typeof window !== 'undefined' && window.location.pathname === '/';
  const sectionHref = (sectionId: string) => (isHomePage ? `#${sectionId}` : `/#${sectionId}`);

  return (
    <>
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-blue-600">TES Property</a>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href={sectionHref('how-to-inquire')} className="text-gray-700 hover:text-blue-600 transition">
                How to Inquire
              </a>
              <a href={sectionHref('properties')} className="text-gray-700 hover:text-blue-600 transition">
                Properties
              </a>
              <a href={sectionHref('services')} className="text-gray-700 hover:text-blue-600 transition">
                Services
              </a>
              <a href={sectionHref('testimonials')} className="text-gray-700 hover:text-blue-600 transition">
                Testimonials
              </a>
              <a href={sectionHref('faq')} className="text-gray-700 hover:text-blue-600 transition">
                FAQ
              </a>
              <a href={sectionHref('about')} className="text-gray-700 hover:text-blue-600 transition">
                About
              </a>
              <a href={sectionHref('contact')} className="text-gray-700 hover:text-blue-600 transition">
                Contact
              </a>

              {user ? (
                <>
                  <a 
                    href="/appointments" 
                    className="text-gray-700 hover:text-blue-600 transition font-semibold flex items-center bg-blue-50 px-3 py-1.5 rounded-lg"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    My Appointments
                  </a>
                  <a 
                    href="/notifications" 
                    className="relative text-gray-700 hover:text-blue-600 transition flex items-center"
                    title="Notifications"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0018 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadNotifications > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    )}
                  </a>
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition"
                    >
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{user.name}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                        <div className="px-4 py-2 border-b border-gray-200">
                          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <a
                          href="/appointments"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center"
                        >
                          <span className="mr-2">📅</span>
                          My Appointments
                        </a>
                        <a
                          href="/favorites"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center justify-between"
                        >
                          <span><span className="mr-2">❤</span>Favorites</span>
                          {favoriteCount > 0 ? <span className="text-xs text-blue-600 font-semibold">{favoriteCount}</span> : null}
                        </a>
                        <a
                          href="/preferences"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center"
                        >
                          <span className="mr-2">⚙️</span>
                          Preferences
                        </a>
                        <a
                          href="/notifications"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center justify-between"
                          title="Notifications"
                        >
                          <span><span className="mr-2">🔔</span>Notifications</span>
                          {unreadNotifications > 0 ? <span className="text-xs text-blue-600 font-semibold">{unreadNotifications}</span> : null}
                        </a>
                        <a
                          href="/profile"
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition flex items-center border-t border-gray-100 mt-1 pt-2"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile Settings
                        </a>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showLoginModal && (
        <LoginSignupModal 
          onClose={() => setShowLoginModal(false)} 
          onSuccess={handleLoginSuccess}
        />
      )}

      {showPhoneVerification && (
        <PhoneVerificationModal
          isOpen={showPhoneVerification}
          onClose={() => setShowPhoneVerification(false)}
          onVerified={handlePhoneVerified}
          phone={verificationPhone}
        />
      )}
    </>
  );
};

export default CustomerNavbar;
