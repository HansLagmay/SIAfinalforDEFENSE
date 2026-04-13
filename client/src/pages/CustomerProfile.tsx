import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../components/customer/CustomerNavbar';
import { PhoneVerificationModal } from '../components/customer/PhoneVerificationModal';
import { customerAuthAPI } from '../services/api';
import { validatePhoneNumber, formatPhoneNumber } from '../utils/validation';

interface CustomerUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
}

const CustomerProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await customerAuthAPI.getProfile(token);
      const raw = response.data;
      const userData: CustomerUser = {
        id: raw.id,
        email: raw.email,
        name: raw.name,
        phone: raw.phone,
        phoneVerified: raw.phoneVerified ?? raw.phone_verified ?? false,
        emailVerified: raw.emailVerified ?? raw.email_verified ?? false,
        createdAt: raw.createdAt ?? raw.created_at
      };
      
      setUser(userData);
      setFormData({
        name: userData.name || '',
        phone: userData.phone || ''
      });
      
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile data');
      
      // If unauthorized, redirect to home
      if (err.response?.status === 401) {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_user');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Validation
      if (!formData.name || formData.name.trim().length < 2) {
        setError('Name must be at least 2 characters');
        setSaving(false);
        return;
      }

      // If phone is provided, validate format
      if (formData.phone && formData.phone.trim() !== '') {
        const phoneValidation = validatePhoneNumber(formData.phone);
        if (!phoneValidation.isValid) {
          setError(phoneValidation.message || 'Invalid phone number');
          setSaving(false);
          return;
        }
      }

      const token = localStorage.getItem('customer_token');
      if (!token) {
        navigate('/');
        return;
      }

      // Format phone number before sending
      const formattedPhone = formData.phone ? formatPhoneNumber(formData.phone) : '';

      // Update profile
      const response = await customerAuthAPI.updateProfile(token, {
        name: formData.name,
        phone: formattedPhone
      });

      // Update local storage
      const updatedUser = response.data.user;
      localStorage.setItem('customer_user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Use backend truth to decide if re-verification is needed
      const phoneChanged = Boolean(response.data.requiresPhoneVerification);
      
      if (phoneChanged) {
        // Phone was added or changed, trigger verification
        setSuccess('Profile updated! Please verify your phone number.');
        
        // Show verification modal after a brief delay
        setTimeout(() => {
          setShowPhoneVerification(true);
        }, 1500);
      } else {
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }

    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneVerified = () => {
    // Update user state
    if (user) {
      const updatedUser = { ...user, role: 'customer', phoneVerified: true };
      setUser(updatedUser);
      localStorage.setItem('customer_user', JSON.stringify(updatedUser));
    }
    setShowPhoneVerification(false);
    setSuccess('Phone number verified successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleTriggerVerification = () => {
    if (user?.phone && !user.phoneVerified) {
      setShowPhoneVerification(true);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('customer_token');
    if (!token) {
      navigate('/');
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setError('Current and new password are required.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      await customerAuthAPI.changePassword(token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password changed successfully.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <input
              type="password"
              placeholder="Current Password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
            <input
              type="password"
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account information</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* Phone not verified banner */}
          {user?.phone && !user.phoneVerified && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-300 rounded-xl flex items-start gap-3">
              <svg className="w-6 h-6 text-orange-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-orange-800">Phone number not verified</p>
                <p className="text-sm text-orange-700 mt-0.5">Your phone <span className="font-medium">{user.phone}</span> has not been verified yet. Verify it to submit property inquiries.</p>
              </div>
              <button
                type="button"
                onClick={handleTriggerVerification}
                className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                Verify Now
              </button>
            </div>
          )}

          {/* No phone provided banner */}
          {!user?.phone && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-xl flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-yellow-800">No phone number on file</p>
                <p className="text-sm text-yellow-700 mt-0.5">Add and verify a phone number below to be able to submit property inquiries.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <span className="absolute right-3 top-3 text-sm text-gray-400">
                  Cannot be changed
                </span>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                minLength={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="09171234567 or +639171234567"
              />
              <p className="mt-2 text-sm text-gray-500">
                📱 Philippine mobile number. Required for submitting property inquiries.
              </p>
              
              {/* Phone Verification Status */}
              {user?.phone && (
                <div className="mt-3">
                  {user.phoneVerified ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-orange-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Not Verified</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleTriggerVerification}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        Verify Now
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="border-t pt-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Created:</span>
                  <span className="font-medium text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email Status:</span>
                  <span className="font-medium text-gray-900">
                    {user?.emailVerified ? '✅ Verified' : '⚠️ Not Verified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone Status:</span>
                  <span className="font-medium text-gray-900">
                    {user?.phone ? (
                      user.phoneVerified ? '✅ Verified' : '⚠️ Not Verified'
                    ) : '❌ Not Provided'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📌 Important Notes</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Email address cannot be changed for security reasons</li>
            <li>• Phone number is required to submit property inquiries</li>
            <li>• Changing your phone number requires re-verification via SMS</li>
            <li>• Keep your contact information up-to-date for agent communication</li>
          </ul>
        </div>
      </div>

      {/* Phone Verification Modal */}
      {showPhoneVerification && user?.phone && (
        <PhoneVerificationModal
          isOpen={showPhoneVerification}
          onClose={() => setShowPhoneVerification(false)}
          onVerified={handlePhoneVerified}
          phone={user.phone}
        />
      )}
    </div>
  );
};

export default CustomerProfile;
