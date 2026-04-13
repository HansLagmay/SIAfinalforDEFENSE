import { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerNavbar from '../components/customer/CustomerNavbar';
import { customerAuthAPI } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface Inquiry {
  id: string;
  property_title: string;
  property_location: string;
  property_price: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
  agent_name: string;
  agent_email: string;
  agent_phone: string;
}

interface Appointment {
  id: string;
  inquiry_id?: string;
  title: string;
  description: string;
  type: string;
  start: string;
  end: string;
  property_title: string;
  property_location: string;
  property_price: number;
  inquiry_status: string;
  agent_name: string;
  agent_email: string;
  agent_phone: string;
  feedback_rating?: number | null;
  feedback_comment?: string | null;
  feedback_created_at?: string | null;
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

const statusLabel: Record<string, string> = {
  'new': 'Inquiry Submitted',
  'claimed': 'Agent Assigned',
  'assigned': 'Agent Assigned',
  'contacted': 'Agent Contacted You',
  'in-progress': 'In Progress',
  'negotiating': 'In Negotiation',
  'viewing-scheduled': 'Viewing Scheduled',
  'viewed-interested': 'Interested',
  'viewed-not-interested': 'Not Interested',
  'deal-successful': 'Deal Successful',
  'deal-cancelled': 'Deal Cancelled',
  'no-response': 'No Response',
  'closed': 'Closed',
};

const statusBadge: Record<string, string> = {
  'new': 'bg-blue-100 text-blue-800',
  'claimed': 'bg-cyan-100 text-cyan-800',
  'assigned': 'bg-cyan-100 text-cyan-800',
  'contacted': 'bg-purple-100 text-purple-800',
  'in-progress': 'bg-yellow-100 text-yellow-800',
  'negotiating': 'bg-orange-100 text-orange-800',
  'viewing-scheduled': 'bg-indigo-100 text-indigo-800',
  'viewed-interested': 'bg-green-100 text-green-800',
  'viewed-not-interested': 'bg-gray-300 text-gray-800',
  'deal-successful': 'bg-green-600 text-white',
  'deal-cancelled': 'bg-red-600 text-white',
  'no-response': 'bg-gray-400 text-white',
  'closed': 'bg-gray-100 text-gray-800',
};

const CustomerAppointments = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackAppointment, setFeedbackAppointment] = useState<Appointment | null>(null);
  const [editingFeedbackAppointmentId, setEditingFeedbackAppointmentId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);
  const [cancellingInquiryId, setCancellingInquiryId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'scheduled' | 'done' | 'cancelled'>('all');

  useEffect(() => {
    loadData();
    const refresh = window.setInterval(() => {
      loadData(false);
    }, 30000);

    const onFocus = () => loadData(false);
    window.addEventListener('focus', onFocus);

    return () => {
      window.clearInterval(refresh);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const loadData = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const token = localStorage.getItem('customer_token');
      if (!token) {
        setError('Please login to view your inquiries');
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [inquiriesRes, appointmentsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/customers/inquiries`, { headers }),
        axios.get(`${API_URL}/customers/appointments`, { headers }),
      ]);

      const loadedInquiries = inquiriesRes.status === 'fulfilled' ? (inquiriesRes.value.data.data || []) : [];
      const loadedAppointments = appointmentsRes.status === 'fulfilled' ? (appointmentsRes.value.data.data || []) : [];

      if (inquiriesRes.status === 'fulfilled') {
        setInquiries(loadedInquiries);
      }
      if (appointmentsRes.status === 'fulfilled') {
        setAppointments(loadedAppointments);
      } else {
        console.error('Failed to load appointments:', appointmentsRes.reason);
        setError('Unable to load appointments right now. Please refresh and try again.');
      }

      const promptedRaw = localStorage.getItem('customer_feedback_prompted_appointments');
      const promptedIds: string[] = promptedRaw ? JSON.parse(promptedRaw) : [];
      const nextForFeedback = loadedAppointments.find((apt: Appointment) =>
        (apt.type === 'viewing-completed' || apt.inquiry_status === 'viewed-interested' || apt.inquiry_status === 'viewed-not-interested' || apt.inquiry_status === 'deal-successful')
        && !promptedIds.includes(apt.id)
      );
      setFeedbackAppointment(nextForFeedback || null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const getBadge = (status: string) => statusBadge[status] || 'bg-gray-100 text-gray-800';
  const getLabel = (status: string) =>
    statusLabel[status] ||
    status?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const appointmentByInquiryId = appointments.reduce<Record<string, Appointment>>((acc, apt) => {
    if (apt.inquiry_id) {
      acc[apt.inquiry_id] = apt;
    }
    return acc;
  }, {});

  const isDoneAppointment = (apt: Appointment) =>
    apt.type === 'viewing-completed' ||
    apt.inquiry_status === 'viewed-interested' ||
    apt.inquiry_status === 'viewed-not-interested' ||
    apt.inquiry_status === 'deal-successful';

  const isCancelledAppointment = (apt: Appointment) =>
    apt.type === 'viewing-cancelled' || apt.inquiry_status === 'deal-cancelled';

  const sentInquiries = inquiries.filter((inq) => !appointmentByInquiryId[inq.id]);
  const scheduledAppointments = appointments.filter((apt) => !isDoneAppointment(apt) && !isCancelledAppointment(apt));
  const doneAppointments = appointments.filter(isDoneAppointment);
  const cancelledAppointments = appointments.filter(isCancelledAppointment);

  const filteredAppointments =
    statusFilter === 'scheduled' ? scheduledAppointments :
    statusFilter === 'done' ? doneAppointments :
    statusFilter === 'cancelled' ? cancelledAppointments :
    appointments;

  const isEmpty = inquiries.length === 0 && appointments.length === 0;

  const dismissFeedbackPrompt = () => {
    if (!feedbackAppointment) return;
    const promptedRaw = localStorage.getItem('customer_feedback_prompted_appointments');
    const promptedIds: string[] = promptedRaw ? JSON.parse(promptedRaw) : [];
    const nextIds = Array.from(new Set([...promptedIds, feedbackAppointment.id]));
    localStorage.setItem('customer_feedback_prompted_appointments', JSON.stringify(nextIds));
    setFeedbackAppointment(null);
  };

  const openFeedbackEditor = (appointment: Appointment) => {
    setEditingFeedbackAppointmentId(appointment.id);
    setFeedbackRating(appointment.feedback_rating || 5);
    setFeedbackComment(appointment.feedback_comment || '');
  };

  const submitFeedback = async (appointment: Appointment) => {
    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        setError('Please login to continue');
        return;
      }

      setSubmittingFeedback(appointment.id);
      await customerAuthAPI.submitAppointmentFeedback(token, appointment.id, {
        rating: feedbackRating,
        comment: feedbackComment.trim() || undefined
      });

      alert('Thanks! Your feedback has been submitted.');
      setEditingFeedbackAppointmentId(null);
      dismissFeedbackPrompt();
      await loadData(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmittingFeedback(null);
    }
  };

  const cancelInquiry = async (inquiry: Inquiry) => {
    const confirmation = window.prompt('Type CANCEL to confirm inquiry cancellation. Optional: add a reason after CANCEL, e.g. CANCEL changed plans.');
    if (!confirmation) return;

    if (!confirmation.toUpperCase().startsWith('CANCEL')) {
      alert('Cancellation aborted. Please type CANCEL to confirm.');
      return;
    }

    const reason = confirmation.length > 6 ? confirmation.slice(6).trim() : '';

    try {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        setError('Please login to continue');
        return;
      }

      setCancellingInquiryId(inquiry.id);
      await customerAuthAPI.cancelInquiry(token, inquiry.id, reason || undefined);
      alert('Inquiry cancelled successfully.');
      await loadData(false);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel inquiry');
    } finally {
      setCancellingInquiryId(null);
    }
  };

  if (loading) {
    return (
      <>
        <CustomerNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading your inquiries...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <CustomerNavbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomerNavbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">

          <div className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">My Appointments</h1>
                <p className="text-gray-600">Track your inquiry progress and viewing schedules in one place</p>
              </div>
              <button
                onClick={() => loadData(false)}
                className="px-4 py-2 bg-secondary-700 text-white rounded-lg hover:bg-secondary-800 transition"
              >
                Refresh
              </button>
            </div>
          </div>

          {feedbackAppointment && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-amber-900">How was your property viewing experience?</h3>
                  <p className="text-sm text-amber-800">Please leave feedback for {feedbackAppointment.property_title}.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openFeedbackEditor(feedbackAppointment)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                  >
                    Leave Feedback
                  </button>
                  <button
                    onClick={dismissFeedbackPrompt}
                    className="px-4 py-2 border border-amber-400 text-amber-800 rounded-lg hover:bg-amber-100 transition"
                  >
                    Remind Me Later
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 flex flex-wrap gap-2">
            {[
              { key: 'all', label: `All (${appointments.length})` },
              { key: 'sent', label: `Sent (${sentInquiries.length})` },
              { key: 'scheduled', label: `Scheduled (${scheduledAppointments.length})` },
              { key: 'done', label: `Done (${doneAppointments.length})` },
              { key: 'cancelled', label: `Cancelled (${cancelledAppointments.length})` },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setStatusFilter(item.key as 'all' | 'sent' | 'scheduled' | 'done' | 'cancelled')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  statusFilter === item.key
                    ? 'bg-secondary-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {isEmpty ? (
            /* ── Empty State ── */
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-8">
                <div className="w-40 h-40 bg-blue-50 rounded-full flex items-center justify-center">
                  <svg className="w-20 h-20 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center border-4 border-white">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">No Inquiries Made Yet</h2>
              <p className="text-gray-500 text-center max-w-md mb-2 text-lg">
                You haven't submitted any property inquiries yet.
              </p>
              <p className="text-gray-400 text-center max-w-md mb-8 text-sm">
                Once you inquire about a property, your agent will schedule a viewing which will appear here.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-2xl w-full">
                {[
                  { step: '1', title: 'Browse Properties', desc: "Find a property you're interested in" },
                  { step: '2', title: 'Submit an Inquiry', desc: 'Click "Inquire Now" on any property' },
                  { step: '3', title: 'Get Scheduled', desc: 'Your agent will set up a viewing' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold text-sm">{step}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">{title}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                ))}
              </div>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-lg shadow-md hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Browse Properties
              </a>
            </div>
          ) : (
            <>
              {(statusFilter === 'all' || statusFilter === 'scheduled' || statusFilter === 'done' || statusFilter === 'cancelled') && filteredAppointments.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📅</span> {statusFilter === 'done' ? 'Done Viewings' : statusFilter === 'cancelled' ? 'Cancelled Viewings' : 'Scheduled Viewings'}
                  </h2>
                  <div className="space-y-4">
                    {filteredAppointments.map((apt) => (
                      <div key={apt.id} className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 border-l-4 border-indigo-500">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">{apt.property_title}</h3>
                            <p className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {apt.property_location}
                            </p>
                            <p className="text-blue-600 font-semibold">₱{apt.property_price?.toLocaleString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getBadge(apt.inquiry_status)}`}>
                            {getLabel(apt.inquiry_status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">📅 Date & Time</p>
                            <p className="font-semibold text-gray-900 text-sm">
                              {parseApiDateTime(apt.start).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-xs text-gray-600">
                              {parseApiDateTime(apt.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – {parseApiDateTime(apt.end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-xs text-gray-500 mb-1">👤 Your Agent</p>
                            <p className="font-semibold text-gray-900 text-sm">{apt.agent_name}</p>
                            <p className="text-xs text-gray-600">{apt.agent_email}</p>
                            {apt.agent_phone && <p className="text-xs text-gray-600">📱 {apt.agent_phone}</p>}
                          </div>
                        </div>
                        {apt.description && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">📝 Notes</p>
                            <p className="text-sm text-gray-700">{apt.description}</p>
                          </div>
                        )}
                        {isDoneAppointment(apt) && (
                          <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50">
                            {apt.feedback_rating ? (
                              <div>
                                <p className="text-sm font-semibold text-amber-900">
                                  Your Feedback: {'★'.repeat(apt.feedback_rating)}{'☆'.repeat(5 - apt.feedback_rating)} ({apt.feedback_rating}/5)
                                </p>
                                {apt.feedback_comment && <p className="text-sm text-amber-800 mt-1">{apt.feedback_comment}</p>}
                                <button
                                  onClick={() => openFeedbackEditor(apt)}
                                  className="mt-2 text-sm text-amber-700 underline"
                                >
                                  Edit Feedback
                                </button>
                              </div>
                            ) : (
                              <div>
                                <p className="text-sm text-amber-900 mb-2">Rate your agent after this completed viewing.</p>
                                <button
                                  onClick={() => openFeedbackEditor(apt)}
                                  className="px-3 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition"
                                >
                                  Leave Feedback
                                </button>
                              </div>
                            )}

                            {editingFeedbackAppointmentId === apt.id && (
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setFeedbackRating(star)}
                                      className={`text-2xl ${feedbackRating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  value={feedbackComment}
                                  onChange={(e) => setFeedbackComment(e.target.value)}
                                  placeholder="Optional comments about your viewing experience"
                                  rows={3}
                                  className="w-full border border-amber-300 rounded-lg p-2 text-sm"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => submitFeedback(apt)}
                                    disabled={submittingFeedback === apt.id}
                                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-60"
                                  >
                                    {submittingFeedback === apt.id ? 'Submitting...' : 'Submit Feedback'}
                                  </button>
                                  <button
                                    onClick={() => setEditingFeedbackAppointmentId(null)}
                                    className="px-3 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(statusFilter === 'all' || statusFilter === 'sent') && sentInquiries.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span>📋</span> Sent Inquiries (Waiting for Schedule)
                    <span className="ml-2 bg-blue-100 text-blue-700 text-sm font-semibold px-2.5 py-0.5 rounded-full">
                      {sentInquiries.length}
                    </span>
                  </h2>
                  <div className="space-y-4">
                    {sentInquiries.map((inq) => {
                      const linkedAppointment = appointmentByInquiryId[inq.id];
                      return (
                      <div key={inq.id} className="bg-white rounded-xl shadow hover:shadow-md transition p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-1">{inq.property_title}</h3>
                            <p className="text-gray-500 text-sm flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {inq.property_location}
                            </p>
                            {inq.property_price > 0 && (
                              <p className="text-blue-600 font-semibold text-sm mt-1">₱{inq.property_price?.toLocaleString()}</p>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${getBadge(inq.status)}`}>
                            {getLabel(inq.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-100 pt-3">
                          <span>
                            📅 Submitted: {new Date(inq.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          {inq.agent_name ? (
                            <span className="flex items-center gap-1">
                              👤 Agent: <span className="font-medium text-gray-700">{inq.agent_name}</span>
                            </span>
                          ) : (
                            <span className="text-yellow-600 text-xs flex items-center gap-1">
                              ⏳ Waiting for agent assignment
                            </span>
                          )}
                        </div>
                        {inq.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                            <span className="font-medium">Your message:</span> {inq.notes}
                          </div>
                        )}
                        <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                          {linkedAppointment ? (
                            <p className="text-slate-700">
                              Viewing scheduled for {parseApiDateTime(linkedAppointment.start).toLocaleString()}.
                            </p>
                          ) : (
                            <p className="text-slate-600">
                              Inquiry sent. Waiting for agent to coordinate your viewing schedule.
                            </p>
                          )}
                        </div>
                        {!['deal-successful', 'deal-cancelled', 'no-response'].includes(inq.status) && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => cancelInquiry(inq)}
                              disabled={cancellingInquiryId === inq.id}
                              className="px-3 py-2 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60"
                            >
                              {cancellingInquiryId === inq.id ? 'Cancelling...' : 'Cancel Inquiry'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                    })}
                  </div>
                </div>
              )}

              {(statusFilter !== 'all' && statusFilter !== 'sent' && filteredAppointments.length === 0) && (
                <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">
                  No appointments found for the selected filter.
                </div>
              )}

              {(statusFilter === 'sent' && sentInquiries.length === 0) && (
                <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">
                  No sent inquiries waiting for scheduling.
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
};

export default CustomerAppointments;
