import { useState, useEffect } from 'react';
import { inquiriesAPI } from '../../services/api';
import type { Inquiry } from '../../types';
import AssignAgentModal from './AssignAgentModal';

const AdminInquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      const response = await inquiriesAPI.getAll();
      setInquiries(response.data);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this inquiry?')) return;

    try {
      await inquiriesAPI.delete(id);
      await loadInquiries();
    } catch (error) {
      console.error('Failed to delete inquiry:', error);
      alert('Failed to archive inquiry');
    }
  };

  const openAssignModal = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowAssignModal(true);
  };

  const handleAssignComplete = () => {
    loadInquiries(); // Refresh list after assignment
  };

  const filteredInquiries = filter === 'all'
    ? inquiries
    : filter === 'terminal'
      ? inquiries.filter((i) => ['deal-successful', 'deal-cancelled', 'no-response'].includes(i.status))
      : inquiries.filter((i) => i.status === filter);

  const getStatusBadgeClass = (status: string) => {
    return status === 'new' ? 'bg-purple-100 text-purple-800' :
      status === 'claimed' ? 'bg-cyan-100 text-cyan-800' :
      status === 'assigned' ? 'bg-blue-100 text-blue-800' :
      status === 'contacted' ? 'bg-purple-100 text-purple-800' :
      status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
      status === 'negotiating' ? 'bg-orange-100 text-orange-800' :
      status === 'viewing-scheduled' ? 'bg-indigo-100 text-indigo-800' :
      status === 'viewed-interested' ? 'bg-green-100 text-green-800' :
      status === 'viewed-not-interested' ? 'bg-gray-300 text-gray-800' :
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Inquiries</h1>
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
            onClick={() => setFilter('new')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            New
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'assigned' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Assigned
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
            onClick={() => setFilter('viewing-scheduled')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'viewing-scheduled' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Viewing Scheduled
          </button>
          <button
            onClick={() => setFilter('deal-successful')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'deal-successful' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Deal Successful
          </button>
          <button
            onClick={() => setFilter('terminal')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'terminal' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Terminal / Closed
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {filteredInquiries.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No inquiries found.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredInquiries.map((inquiry) => {
              const isExpanded = expandedId === inquiry.id;
              return (
                <div key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                  {/* Compact View - Always Visible */}
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
                        </div>
                        <p className="text-xs text-gray-600 truncate mt-0.5">🏠 {inquiry.propertyTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {inquiry.assignedTo && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                          👤 Assigned
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeClass(inquiry.status)}`}>
                        {getStatusLabel(inquiry.status)}
                      </span>
                    </div>
                  </div>

                  {/* Expanded View - Details & Actions */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p>📧 <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">{inquiry.email}</a></p>
                        <p>📱 {inquiry.phone ? <a href={`tel:${inquiry.phone}`} className="text-blue-600 hover:underline">{inquiry.phone}</a> : 'Not provided'}</p>
                        <p>🏠 <strong>Property:</strong> {inquiry.propertyTitle}</p>
                        {inquiry.assignedTo && (
                          <p>👤 <strong>Assigned to:</strong> Agent ID {inquiry.assignedTo}</p>
                        )}
                        {inquiry.message && (
                          <p>💬 <strong>Message:</strong> {inquiry.message}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          📅 Created: {new Date(inquiry.createdAt).toLocaleString()}
                        </p>
                        {inquiry.assignedAt && (
                          <p className="text-xs text-gray-500">
                            ✅ Assigned: {new Date(inquiry.assignedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => openAssignModal(inquiry)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            inquiry.assignedTo 
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {inquiry.assignedTo ? '🔄 Reassign' : '➕ Assign Agent'}
                        </button>
                        <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700">
                          Current Status:
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(inquiry.status)}`}>
                            {getStatusLabel(inquiry.status)}
                          </span>
                        </div>
                        <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
                          Status updates are managed by the assigned agent
                        </div>
                        <button
                          onClick={() => handleDelete(inquiry.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium px-3"
                        >
                          🗑️ Delete
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

      {/* Assign Agent Modal */}
      {showAssignModal && selectedInquiry && (
        <AssignAgentModal
          inquiry={selectedInquiry}
          onAssign={handleAssignComplete}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedInquiry(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminInquiries;
