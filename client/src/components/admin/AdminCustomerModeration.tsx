import { useEffect, useState } from 'react';
import { customerModerationAPI } from '../../services/api';

interface CustomerFlag {
  id: string;
  inquiry_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  reported_by_agent_name: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'blocked' | 'dismissed';
  created_at: string;
  is_blocked?: number;
  blocked_reason?: string;
}

const AdminCustomerModeration = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'pending' | 'reviewed' | 'blocked' | 'dismissed' | 'all'>('pending');
  const [flags, setFlags] = useState<CustomerFlag[]>([]);

  const loadFlags = async () => {
    setLoading(true);
    try {
      const response = await customerModerationAPI.getFlags(status);
      setFlags(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load customer flags:', error);
      alert('Failed to load customer reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, [status]);

  const handleReview = async (id: string, nextStatus: 'reviewed' | 'dismissed') => {
    const notes = prompt('Review notes (optional):') || '';
    try {
      await customerModerationAPI.reviewFlag(id, { status: nextStatus, reviewNotes: notes });
      await loadFlags();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update report');
    }
  };

  const handleBlock = async (flag: CustomerFlag) => {
    const reason = prompt('Block reason:', flag.reason) || flag.reason;
    if (!confirm(`Block customer ${flag.customer_name}?`)) return;

    try {
      await customerModerationAPI.blockFromFlag(flag.id, { blockReason: reason });
      await loadFlags();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to block customer');
    }
  };

  const handleRemove = async (flag: CustomerFlag) => {
    if (!flag.customer_id) {
      alert('Customer account not linked for this report.');
      return;
    }

    if (!confirm(`Archive/remove customer account for ${flag.customer_name}?`)) return;

    try {
      await customerModerationAPI.removeCustomer(flag.customer_id);
      await loadFlags();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove customer account');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Customer Moderation</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="blocked">Blocked</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <div>Loading reports...</div>
      ) : flags.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-gray-600">No customer reports found.</div>
      ) : (
        <div className="space-y-4">
          {flags.map((flag) => (
            <div key={flag.id} className="bg-white rounded-lg shadow p-5 border border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{flag.customer_name}</div>
                  <div className="text-sm text-gray-600">{flag.customer_email} {flag.customer_phone ? `• ${flag.customer_phone}` : ''}</div>
                  <div className="text-xs text-gray-500 mt-1">Reported by {flag.reported_by_agent_name} on {new Date(flag.created_at).toLocaleString()}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  flag.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  flag.status === 'blocked' ? 'bg-red-100 text-red-700' :
                  flag.status === 'dismissed' ? 'bg-gray-200 text-gray-700' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {flag.status}
                </span>
              </div>

              <div className="mt-3 text-sm text-gray-700">
                <div><span className="font-semibold">Reason:</span> {flag.reason}</div>
                {flag.details && <div className="mt-1"><span className="font-semibold">Details:</span> {flag.details}</div>}
                {flag.is_blocked ? <div className="mt-1 text-red-700"><span className="font-semibold">Blocked:</span> {flag.blocked_reason || 'Yes'}</div> : null}
              </div>

              <div className="mt-4 flex gap-2 flex-wrap">
                <button
                  onClick={() => handleReview(flag.id, 'reviewed')}
                  className="px-3 py-2 rounded border border-blue-300 text-blue-700 hover:bg-blue-50 text-sm"
                >
                  Mark Reviewed
                </button>
                <button
                  onClick={() => handleReview(flag.id, 'dismissed')}
                  className="px-3 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleBlock(flag)}
                  className="px-3 py-2 rounded border border-red-300 text-red-700 hover:bg-red-50 text-sm"
                >
                  Block Customer
                </button>
                <button
                  onClick={() => handleRemove(flag)}
                  className="px-3 py-2 rounded border border-red-500 bg-red-600 text-white hover:bg-red-700 text-sm"
                >
                  Remove Account
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCustomerModeration;
