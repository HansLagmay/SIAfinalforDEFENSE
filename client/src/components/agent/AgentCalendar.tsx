import { useMemo, useState, useEffect } from 'react';
import { calendarAPI } from '../../services/api';
import { inquiriesAPI } from '../../services/api';
import type { CalendarEvent, Inquiry, User } from '../../types';
import ScheduleViewingModal from './ScheduleViewingModal';
import { getUser } from '../../utils/session';

interface AgentCalendarProps {
  user: User | null;
}

const parseApiDateTime = (value: string | undefined | null) => {
  if (!value) return new Date('');
  const normalized = String(value).trim();
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, y, m, d, hh, mm, ss] = match;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss || '0'));
  }
  return new Date(normalized);
};

const AgentCalendar = ({ user }: AgentCalendarProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [effectiveUser, setEffectiveUser] = useState<User | null>(null);
  const [inquiryMap, setInquiryMap] = useState<Record<string, Inquiry>>({});
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [statusUpdatingInquiryId, setStatusUpdatingInquiryId] = useState<string | null>(null);

  useEffect(() => {
    const u = user || getUser('agent');
    setEffectiveUser(u);
  }, [user]);

  useEffect(() => {
    if (effectiveUser) {
      loadEvents();
      loadAgentInquiries(effectiveUser);
    } else {
      setLoading(false);
    }
  }, [effectiveUser]);

  const loadEvents = async () => {
    try {
      const response = await calendarAPI.getAll({ shared: true });
      if (Array.isArray(response.data)) {
        setEvents(response.data);
      } else {
        setEvents([]);
        setError('Failed to load calendar events. Please try again later.');
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      setError('Failed to load calendar events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadAgentInquiries = async (u: User) => {
    try {
      const res = await inquiriesAPI.getAll();
      if (!Array.isArray(res.data)) {
        console.warn('Inquiries response is not an array:', res.data);
        setInquiryMap({});
        return;
      }
      
      const mine = res.data.filter((i: Inquiry) =>
        (i.assignedTo === u.id || i.claimedBy === u.id)
      );
      
      console.log('Calendar: Total inquiries:', res.data.length, 'My tickets:', mine.length);
      
      const map: Record<string, Inquiry> = {};
      mine.forEach((i: Inquiry) => { map[i.id] = i; });
      setInquiryMap(map);
    } catch (err) {
      console.error('Failed to load inquiries for calendar details:', err);
      setInquiryMap({});
    }
  };

  const statusLabel: Record<Inquiry['status'], string> = {
    new: 'New',
    claimed: 'Claimed',
    assigned: 'Assigned',
    contacted: 'Contacted',
    'in-progress': 'In Progress',
    'viewing-scheduled': 'Viewing Scheduled',
    negotiating: 'Negotiating',
    'viewed-interested': 'Viewed - Interested',
    'viewed-not-interested': 'Viewed - Not Interested',
    'deal-successful': 'Deal Successful',
    'deal-cancelled': 'Deal Cancelled',
    'no-response': 'No Response'
  };

  const statusBadgeClass: Record<Inquiry['status'], string> = {
    new: 'bg-purple-100 text-purple-800',
    claimed: 'bg-cyan-100 text-cyan-800',
    assigned: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    'viewing-scheduled': 'bg-indigo-100 text-indigo-800',
    negotiating: 'bg-orange-100 text-orange-800',
    'viewed-interested': 'bg-green-100 text-green-800',
    'viewed-not-interested': 'bg-gray-100 text-gray-800',
    'deal-successful': 'bg-green-600 text-white',
    'deal-cancelled': 'bg-red-600 text-white',
    'no-response': 'bg-gray-500 text-white'
  };

  const terminalStatuses = new Set<Inquiry['status']>(['deal-successful', 'deal-cancelled', 'no-response']);

  const handleSetInquiryStatus = async (inquiry: Inquiry, newStatus: Inquiry['status']) => {
    if (inquiry.status === newStatus) return;

    if (!confirm(`Change ticket status from "${statusLabel[inquiry.status]}" to "${statusLabel[newStatus]}"?`)) {
      return;
    }

    setStatusUpdatingInquiryId(inquiry.id);
    try {
      await inquiriesAPI.update(inquiry.id, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      await loadAgentInquiries(effectiveUser as User);
    } catch (statusError: any) {
      console.error('Failed to update inquiry status from calendar:', statusError);
      alert(statusError?.response?.data?.error || 'Failed to update inquiry status');
    } finally {
      setStatusUpdatingInquiryId(null);
    }
  };

  const handleMarkAsDone = async (event: CalendarEvent) => {
    if (!effectiveUser) return;

    if (!confirm('Mark this viewing as done?')) {
      return;
    }

    // Ask user for outcome
    const outcome = window.prompt(
      'Mark viewing as done. Was the customer interested?\nType "interested" or "not interested":'
    );
    
    if (!outcome) return; // User cancelled
    
    const interested = outcome.toLowerCase().includes('interested') && !outcome.toLowerCase().includes('not');
    const newStatus = interested ? 'viewed-interested' : 'viewed-not-interested';

    if (!confirm(`Confirm completion outcome: ${interested ? 'Interested' : 'Not Interested'}?`)) {
      return;
    }
    
    try {
      // Mark calendar event as completed
      await calendarAPI.markAsDone(event.id, newStatus);
      
      alert(`Viewing marked as done! Status: ${interested ? 'Interested ✓' : 'Not Interested ✗'}`);
      await loadEvents();
      if (effectiveUser) await loadAgentInquiries(effectiveUser);
    } catch (error: any) {
      console.error('Failed to mark viewing as done:', error);
      alert(error.response?.data?.error || 'Failed to mark viewing as done');
    }
  };

  const handleCancelEvent = async (event: CalendarEvent) => {
    if (!effectiveUser) return;

    if (!confirm('Are you sure you want to cancel this viewing?')) return;

    const reason = window.prompt('Cancel this viewing? Please provide a reason:');
    if (!reason) return; // User cancelled
    
    try {
      await calendarAPI.delete(event.id);
      alert('Viewing cancelled successfully');
      await loadEvents();
    } catch (error: any) {
      console.error('Failed to cancel viewing:', error);
      alert(error.response?.data?.error || 'Failed to cancel viewing');
    }
  };

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startDay = startOfMonth.getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const calendarDays = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const dayNumber = i - startDay + 1;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
      const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      return { date, inMonth };
    });
  }, [currentMonth, startDay, daysInMonth]);
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const eventsForSelectedDate = Array.isArray(events)
    ? events.filter((event) => isSameDay(parseApiDateTime(event.start), selectedDate))
    : [];
  const dateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const eventCountByDate = useMemo(() => {
    if (!Array.isArray(events)) return {};
    return events.reduce<Record<string, number>>((acc, event) => {
      const key = dateKey(parseApiDateTime(event.start));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [events]);
  const formatDateInput = (date: Date) => {
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const selectedDateInput = formatDateInput(selectedDate);

  if (loading) {
    return <div className="p-8">Loading calendar...</div>;
  }

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Calendar</h1>
        <button
          onClick={() => { setEditingEvent(null); setShowScheduleModal(true); }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          + Schedule Viewing
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-gray-900 font-semibold">{monthLabel}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
            >
              ‹
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
            >
              ›
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-sm text-gray-500 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="text-center py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(({ date, inMonth }, index) => {
            const isSelected = isSameDay(date, selectedDate);
            const key = dateKey(date);
            const count = eventCountByDate[key] || 0;
            return (
              <button
                key={`${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${index}`}
                onClick={() => { setSelectedDate(date); setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }}
                className={`h-12 w-full rounded-lg text-base relative ${isSelected ? 'bg-blue-600 text-white' : inMonth ? 'text-gray-800 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <span>{date.getDate()}</span>
                {count > 0 && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs rounded-full ${isSelected ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="text-gray-900 font-semibold">{selectedLabel}</div>
          <div className="text-sm text-gray-500">
            {eventsForSelectedDate.length} event{eventsForSelectedDate.length === 1 ? '' : 's'}
          </div>
        </div>
        {eventsForSelectedDate.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
            No scheduled events on this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Ticket</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Property</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {eventsForSelectedDate.map((event) => {
                  const linkedInquiry = event.inquiryId ? inquiryMap[event.inquiryId] : undefined;
                  const customerLine = event.description?.split('\n').find(l => l.startsWith('Customer: '));
                  const ticketLine = event.description?.split('\n').find(l => l.startsWith('Ticket: '));
                  const startTime = parseApiDateTime(event.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  const endTime = parseApiDateTime(event.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  const isCompleted = event.type === 'viewing-completed';
                  const isCancelled = event.type === 'viewing-cancelled';
                  
                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{startTime}</div>
                        <div className="text-xs text-gray-500">to {endTime}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {linkedInquiry?.name || (customerLine ? customerLine.replace('Customer: ', '') : '—')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {linkedInquiry?.ticketNumber || (ticketLine ? ticketLine.replace('Ticket: ', '') : '—')}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {linkedInquiry?.propertyTitle || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          event.type === 'viewing' ? 'bg-blue-100 text-blue-800' :
                          event.type === 'viewing-completed' ? 'bg-green-100 text-green-800' :
                          event.type === 'viewing-cancelled' ? 'bg-red-100 text-red-800' :
                          event.type === 'meeting' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.type === 'viewing-completed' ? 'done' : event.type === 'viewing-cancelled' ? 'cancelled' : event.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {effectiveUser && event.agentId === effectiveUser.id && (
                          <div className="space-y-2">
                            <div className="flex gap-2 justify-end flex-wrap">
                              {!isCompleted && !isCancelled && (
                                <>
                                  <button
                                    onClick={() => handleMarkAsDone(event)}
                                    className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 font-medium"
                                    title="Mark viewing as done"
                                  >
                                    ✓ Done
                                  </button>
                                  <button
                                    onClick={() => handleCancelEvent(event)}
                                    className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 font-medium"
                                    title="Cancel viewing"
                                  >
                                    ✗ Cancel
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  if (!confirm('Reschedule this viewing?')) return;
                                  setEditingEvent(event);
                                  setShowScheduleModal(true);
                                }}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-medium"
                                title="Reschedule viewing"
                              >
                                📅 Reschedule
                              </button>
                            </div>

                            {linkedInquiry && (
                              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-left">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Ticket Status</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadgeClass[linkedInquiry.status]}`}>
                                    {statusLabel[linkedInquiry.status]}
                                  </span>
                                </div>

                                {!terminalStatuses.has(linkedInquiry.status) ? (
                                  <>
                                    <div className="mb-2 flex gap-1 flex-wrap justify-end">
                                      {(['contacted', 'in-progress', 'negotiating'] as Inquiry['status'][]).map((status) => (
                                        <button
                                          key={status}
                                          onClick={() => handleSetInquiryStatus(linkedInquiry, status)}
                                          disabled={statusUpdatingInquiryId === linkedInquiry.id || linkedInquiry.status === status}
                                          className="px-2 py-1 text-[11px] rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {statusLabel[status]}
                                        </button>
                                      ))}
                                    </div>

                                    <div className="flex gap-1 flex-wrap justify-end">
                                      {(['deal-successful', 'deal-cancelled', 'no-response'] as Inquiry['status'][]).map((status) => (
                                        <button
                                          key={status}
                                          onClick={() => handleSetInquiryStatus(linkedInquiry, status)}
                                          disabled={statusUpdatingInquiryId === linkedInquiry.id || linkedInquiry.status === status}
                                          className={`px-2 py-1 text-[11px] rounded border disabled:opacity-50 disabled:cursor-not-allowed ${
                                            status === 'deal-successful'
                                              ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                                              : status === 'deal-cancelled'
                                                ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-100'
                                          }`}
                                        >
                                          {statusLabel[status]}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-[11px] text-gray-500 text-right">Final status reached</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 p-6 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Click a date to view events. Use the + button to schedule a viewing.
        </p>
      </div>

      {showScheduleModal && effectiveUser && (
        <ScheduleViewingModal
          user={effectiveUser}
          event={editingEvent || undefined}
          initialDate={editingEvent ? undefined : selectedDateInput}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            if (effectiveUser) {
              loadEvents();
            }
          }}
        />
      )}
    </div>
  );
};

export default AgentCalendar;
