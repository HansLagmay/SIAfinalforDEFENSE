import { useState } from 'react';
import { usersAPI } from '../../services/api';

const AgentSettings = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!currentPassword || !newPassword) {
      setMessage('Current and new password are required.');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await usersAPI.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password changed successfully.');
    } catch (error: any) {
      setMessage(error?.response?.data?.error || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Agent Settings</h1>
      <p className="text-gray-600 mb-6">Manage your account security settings.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
        </div>

        {message && <p className="text-sm text-blue-700">{message}</p>}

        <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
};

export default AgentSettings;
