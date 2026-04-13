import { useState, useEffect } from 'react';
import { inquiriesAPI } from '../../services/api';
import type { Inquiry, User } from '../../types';

interface AgentInquiriesProps {
  user: User | null;
}

const AgentInquiries = ({ user }: AgentInquiriesProps) => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadInquiries();
  }, [user]);

  const loadInquiries = async () => {
    try {
      const response = await inquiriesAPI.getAll();
      
      if (!user) {
        setInquiries([]);
        return;
      }
      
      // Show all non-terminal tickets so agents can see team context, but gate actions by ownership.
      const myInquiries = response.data.filter((inquiry: any) => {
        const terminalStatuses = new Set(['deal-successful', 'deal-cancelled', 'no-response']);

        return !terminalStatuses.has(inquiry.status);
      });
      
      setInquiries(myInquiries);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTicket = async (inquiry: Inquiry) => {
    if (!user) return;
    
    if (!confirm('Claim this ticket? It will be assigned to you.')) return;
    
    setClaimingId(inquiry.id);
    try {
      await inquiriesAPI.claim(inquiry.id);
      alert('Ticket claimed successfully!');
      await loadInquiries();
    } catch (error: any) {
      console.error('Failed to claim ticket:', error);
      alert(error.response?.data?.error || 'Failed to claim ticket. It may have been claimed by another agent.');
    } finally {
      setClaimingId(null);
    }
  };

  const openCalendar = () => {
    window.location.href = '/agent/calendar';
  };

  const handleReleaseTicket = async (inquiry: Inquiry) => {
    if (!confirm('Release this ticket so other agents can claim it?')) return;

    setReleasingId(inquiry.id);
    try {
      await inquiriesAPI.unclaim(inquiry.id);
      alert('Ticket released. It is now claimable by other agents.');
      await loadInquiries();
    } catch (error: any) {
      console.error('Failed to release ticket:', error);
      alert(error.response?.data?.error || 'Failed to release ticket');
    } finally {
      setReleasingId(null);
    }
  };

  const handleReportCustomer = async (inquiry: Inquiry) => {
    const reason = prompt('Report reason (e.g., bogus inquiry, fake identity, scam attempt):');
    if (!reason || !reason.trim()) return;

    const details = prompt('Optional details/evidence:') || '';

    setReportingId(inquiry.id);
    try {
      await inquiriesAPI.reportCustomer(inquiry.id, { reason: reason.trim(), details: details.trim() });
      alert('Customer report submitted to admin moderation queue.');
    } catch (error: any) {
      console.error('Failed to report customer:', error);
      alert(error.response?.data?.error || 'Failed to report customer');
    } finally {
      setReportingId(null);
    }
  };

  // Separate inquiries into owned, available, and team read-only buckets.
  const assignedInquiries = inquiries.filter(i => i.assignedTo === user?.id);
  const availableInquiries = inquiries.filter(i => !i.assignedTo);
  const teamInquiries = inquiries.filter(i => i.assignedTo && i.assignedTo !== user?.id);
  
  const filteredAssignedInquiries = filter === 'all' 
    ? assignedInquiries 
    : assignedInquiries.filter(i => i.status === filter);

  const getStatusBadgeClass = (status: string) => {
    return status === 'claimed' ? 'bg-cyan-100 text-cyan-800' :
      status === 'assigned' ? 'bg-blue-100 text-blue-800' :
      status === 'contacted' ? 'bg-purple-100 text-purple-800' :
      status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
      status === 'negotiating' ? 'bg-orange-100 text-orange-800' :
      status === 'viewing-scheduled' ? 'bg-indigo-100 text-indigo-800' :
      status === 'viewed-interested' ? 'bg-green-100 text-green-800' :
      status === 'viewed-not-interested' ? 'bg-gray-100 text-gray-800' :
      status === 'deal-successful' ? 'bg-green-600 text-white' :
      status === 'deal-cancelled' ? 'bg-red-600 text-white' :
      status === 'no-response' ? 'bg-gray-400 text-white' :
      'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return status === 'deal-successful' ? '✓ Deal' :
      status === 'deal-cancelled' ? '✗ Cancelled' :
      status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return <div className="p-8">Loading inquiries...</div>;
  }

  return (
    <div className="p-8">
      {/* Available Tickets Section */}
      {availableInquiries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🆕 Available Tickets (Unassigned)</h2>
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {availableInquiries.map((inquiry) => {
                const isExpanded = expandedId === `available-${inquiry.id}`;
                return (
                  <div key={inquiry.id} className="border-l-4 border-green-500">
                    {/* Compact View */}
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                      onClick={() => setExpandedId(isExpanded ? null : `available-${inquiry.id}`)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <svg className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900">{inquiry.name}</h3>
                            <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                              {inquiry.ticketNumber || 'No Ticket'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate mt-0.5">🏠 {inquiry.propertyTitle}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 whitespace-nowrap">
                        ✋ Available
                      </span>
                    </div>

                    {/* Expanded View */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <p>📧 <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">{inquiry.email}</a></p>
                          <p>📱 {inquiry.phone ? <a href={`tel:${inquiry.phone}`} className="text-blue-600 hover:underline">{inquiry.phone}</a> : 'Not provided'}</p>
                          <p>🏠 <strong>Property:</strong> {inquiry.propertyTitle}</p>
                          <p>
                            <strong>Current Status:</strong>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(inquiry.status)}`}>
                              {getStatusLabel(inquiry.status)}
                            </span>
                          </p>
                          {inquiry.message && <p>💬 <strong>Message:</strong> {inquiry.message}</p>}
                          <p className="text-xs text-gray-500">
                            📅 Created: {new Date(inquiry.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleClaimTicket(inquiry)}
                          disabled={claimingId === inquiry.id}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-green-300"
                        >
                          {claimingId === inquiry.id ? '⏳ Claiming...' : '✋ Claim This Ticket'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* My Assigned Tickets Section */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Assigned Tickets</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('claimed')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'claimed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Claimed
          </button>
          <button
            onClick={() => setFilter('contacted')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'contacted' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Contacted
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'in-progress' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('negotiating')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'negotiating' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Negotiating
          </button>
          <button
            onClick={() => setFilter('deal-successful')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'deal-successful' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            ✓ Deal Successful
          </button>
          <button
            onClick={() => setFilter('deal-cancelled')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'deal-cancelled' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            ✗ Deal Cancelled
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {filteredAssignedInquiries.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            {assignedInquiries.length === 0 
              ? "No tickets assigned to you yet. Check available tickets above to claim one!"
              : "No inquiries match the selected filter."}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAssignedInquiries.map((inquiry) => {
              const isExpanded = expandedId === inquiry.id;
              return (
                <div key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                  {/* Compact View */}
                  <div 
                    className="p-4 cursor-pointer flex items-center justify-between gap-4"
                    onClick={() => setExpandedId(isExpanded ? null : inquiry.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <svg className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900">{inquiry.name}</h3>
                          <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {inquiry.ticketNumber || 'No Ticket'}
                          </span>
                          {inquiry.claimedBy === user?.id && (
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700">
                              Self-Claimed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 truncate mt-0.5">🏠 {inquiry.propertyTitle}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeClass(inquiry.status)}`}>
                      {getStatusLabel(inquiry.status)}
                    </span>
                  </div>

                  {/* Expanded View */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p>📧 <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">{inquiry.email}</a></p>
                        <p>📱 {inquiry.phone ? <a href={`tel:${inquiry.phone}`} className="text-blue-600 hover:underline">{inquiry.phone}</a> : 'Not provided'}</p>
                        <p>🏠 <strong>Property:</strong> {inquiry.propertyTitle}</p>
                        <p>
                          <strong>Current Status:</strong>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(inquiry.status)}`}>
                            {getStatusLabel(inquiry.status)}
                          </span>
                        </p>
                        {inquiry.message && <p>💬 <strong>Message:</strong> {inquiry.message}</p>}
                        <p className="text-xs text-gray-500">
                          📅 Created: {new Date(inquiry.createdAt).toLocaleString()}
                        </p>
                        {inquiry.claimedAt && (
                          <p className="text-xs text-gray-500">
                            ✋ Claimed: {new Date(inquiry.claimedAt).toLocaleString()}
                          </p>
                        )}
                        {inquiry.assignedAt && (
                          <p className="text-xs text-gray-500">
                            ✅ Assigned: {new Date(inquiry.assignedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap items-center">
                        <div className="px-3 py-2 text-xs rounded-lg border border-blue-200 bg-blue-50 text-blue-800">
                          Manage lifecycle status in Calendar actions
                        </div>
                        <button
                          onClick={openCalendar}
                          className="px-3 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium bg-white hover:bg-blue-50"
                        >
                          Open Calendar
                        </button>
                        <button
                          onClick={() => handleReleaseTicket(inquiry)}
                          disabled={releasingId === inquiry.id || ['deal-successful', 'deal-cancelled', 'no-response'].includes(inquiry.status)}
                          className="px-3 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {releasingId === inquiry.id ? 'Releasing...' : 'Release Ticket'}
                        </button>
                        <button
                          onClick={() => handleReportCustomer(inquiry)}
                          disabled={reportingId === inquiry.id}
                          className="px-3 py-2 border border-amber-300 text-amber-800 rounded-lg text-sm font-medium bg-white hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {reportingId === inquiry.id ? 'Reporting...' : 'Report Customer'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team Tickets (Read-Only) */}
      {teamInquiries.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 Team Tickets (Read-Only)</h2>
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {teamInquiries.map((inquiry) => {
                const isExpanded = expandedId === `team-${inquiry.id}`;
                return (
                  <div key={inquiry.id} className="border-l-4 border-gray-300">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
                      onClick={() => setExpandedId(isExpanded ? null : `team-${inquiry.id}`)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <svg className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900">{inquiry.name}</h3>
                            <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                              {inquiry.ticketNumber || 'No Ticket'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate mt-0.5">🏠 {inquiry.propertyTitle || 'Property not specified'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 whitespace-nowrap">
                          Read-Only
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeClass(inquiry.status)}`}>
                          {getStatusLabel(inquiry.status)}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-2 text-sm text-gray-600 mb-3">
                          <p>🏠 <strong>Property:</strong> {inquiry.propertyTitle || 'Property not specified'}</p>
                          <p>📧 {inquiry.email}</p>
                          <p>📱 {inquiry.phone || 'Not provided'}</p>
                          <p>
                            <strong>Current Status:</strong>
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(inquiry.status)}`}>
                              {getStatusLabel(inquiry.status)}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">📅 Created: {new Date(inquiry.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="px-3 py-2 text-xs rounded-lg border border-gray-300 bg-gray-100 text-gray-700 inline-block">
                          This ticket is assigned to another agent. Actions are disabled.
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentInquiries;
