import { useEffect, useMemo, useState } from 'react';
import { calendarAPI, inquiriesAPI } from '../../services/api';
import type { CalendarEvent, Inquiry, User } from '../../types';

interface ScheduleViewingModalProps {
  user: User;
  inquiry?: Inquiry;
  event?: CalendarEvent;
  initialDate?: string;
  onClose: () => void;
  onSuccess: () => void;
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

const getTodayLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ScheduleViewingModal = ({ user, inquiry, event, initialDate, onClose, onSuccess }: ScheduleViewingModalProps) => {
  const isEdit = Boolean(event);
  const initialStart = event ? parseApiDateTime(event.start) : null;
  const initialEnd = event ? parseApiDateTime(event.end) : null;
  
  // Format time properly for editing
  const getLocalDateString = (date: Date | null) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const getLocalTimeString = (date: Date | null) => {
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDateTimeForApi = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  
  const [formData, setFormData] = useState({
    date: initialStart ? getLocalDateString(initialStart) : (initialDate || ''),
    time: initialStart ? getLocalTimeString(initialStart) : '',
    duration: initialStart && initialEnd ? Math.round((initialEnd.getTime() - initialStart.getTime()) / 60000).toString() : '60',
    notes: event?.description?.split('\n').slice(1).join('\n') || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>(inquiry?.id || event?.inquiryId || '');
  const selectedInquiry = useMemo(() => inquiries.find(i => i.id === selectedInquiryId) || inquiry, [inquiries, selectedInquiryId, inquiry]);
  const [manualCustomer, setManualCustomer] = useState({
    name: '',
    propertyTitle: ''
  });

  // Update form data when event changes (for editing)
  useEffect(() => {
    if (event) {
      const start = parseApiDateTime(event.start);
      const end = parseApiDateTime(event.end);
      setFormData({
        date: getLocalDateString(start),
        time: getLocalTimeString(start),
        duration: Math.round((end.getTime() - start.getTime()) / 60000).toString(),
        notes: event.description?.split('\n').slice(1).join('\n') || ''
      });
      if (event.inquiryId) {
        setSelectedInquiryId(event.inquiryId);
      }
    }
  }, [event]);

  useEffect(() => {
    if (!isEdit && initialDate) {
      setFormData((prev) => ({ ...prev, date: initialDate }));
    }
  }, [initialDate, isEdit]);

  useEffect(() => {
    const loadInquiries = async () => {
      try {
        const res = await inquiriesAPI.getAll();
        if (!Array.isArray(res.data)) {
          console.warn('Inquiries response is not an array:', res.data);
          setInquiries([]);
          return;
        }
        
        // Filter for inquiries assigned to or claimed by this agent
        // Include more statuses to show all relevant tickets
        const mine = res.data.filter((i: Inquiry) => {
          const isMyTicket = (i.assignedTo === user.id || i.claimedBy === user.id);
          const validStatus = i.status !== 'deal-cancelled' && i.status !== 'deal-successful';
          return isMyTicket && validStatus;
        });
        
        console.log('Total inquiries:', res.data.length, 'My tickets:', mine.length);
        
        // Sort: newest first
        setInquiries(mine.sort((a: Inquiry, b: Inquiry) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err) {
        console.error('Failed to load inquiries for scheduling:', err);
        setInquiries([]);
      }
    };
    loadInquiries();
  }, [user.id]);

  const validateSchedule = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.time) {
      newErrors.time = 'Time is required';
    }
    
    if (formData.date && formData.time) {
      const scheduleDateTime = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      
      // Cannot schedule in past
      if (scheduleDateTime < now) {
        newErrors.date = 'Cannot schedule in the past';
      }
      
      // Business hours check (8 AM - 6 PM)
      const hour = scheduleDateTime.getHours();
      if (hour < 8 || hour >= 18) {
        newErrors.time = 'Viewings must be between 8 AM and 6 PM';
      }
    }
    
    // Require either an inquiry selection or manual details
    if (!selectedInquiry && (!manualCustomer.name || !manualCustomer.propertyTitle)) {
      newErrors.customer = 'Select a ticket or provide customer and property details';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSchedule()) return;

    const targetCustomer = selectedInquiry?.name || manualCustomer.name || 'N/A';
    const targetProperty = selectedInquiry?.propertyTitle || manualCustomer.propertyTitle || 'N/A';
    const confirmationMessage = isEdit
      ? `Confirm update for this viewing?\n\nCustomer: ${targetCustomer}\nProperty: ${targetProperty}\nDate: ${formData.date}\nTime: ${formData.time}`
      : `Confirm schedule viewing?\n\nCustomer: ${targetCustomer}\nProperty: ${targetProperty}\nDate: ${formData.date}\nTime: ${formData.time}`;

    if (!confirm(confirmationMessage)) {
      return;
    }
    
    setSubmitting(true);
    try {
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(formData.duration) * 60000);
      
      // Build event payload
      const customerName = selectedInquiry?.name || manualCustomer.name;
      const propTitle = selectedInquiry?.propertyTitle || manualCustomer.propertyTitle || 'Property';
      const eventData: Partial<CalendarEvent> = {
        title: `Property Viewing - ${propTitle}`,
        description: `Customer: ${customerName}${selectedInquiry?.ticketNumber ? `\nTicket: ${selectedInquiry.ticketNumber}` : ''}${formData.notes ? `\n${formData.notes}` : ''}`,
        start: formatDateTimeForApi(startDateTime),
        end: formatDateTimeForApi(endDateTime),
        agentId: user.id,
        inquiryId: selectedInquiry?.id || undefined,
        type: 'viewing' as const
      };
      
      if (isEdit && event) {
        await calendarAPI.update(event.id, eventData);
      } else {
        await calendarAPI.create(eventData);
      }
      
      // Update inquiry status if linked
      if (selectedInquiry) {
        await inquiriesAPI.update(selectedInquiry.id, {
          status: 'viewing-scheduled',
          notes: [
            ...(selectedInquiry.notes || []),
            {
              id: Date.now().toString(),
              agentId: user.id,
              agentName: user.name,
              note: `Viewing scheduled for ${formData.date} at ${formData.time}`,
              createdAt: new Date().toISOString()
            }
          ]
        });
        
        // Note: Property availability stays independent from assignment so other buyers can still inquire
        // Property should only change to 'pending' when an offer is accepted
        // and 'under-contract' when contracts are signed by both parties
      }
      
      alert(isEdit ? 'Viewing updated successfully!' : 'Viewing scheduled successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to schedule viewing:', error);
      
      if (error.response?.status === 409) {
        const conflictData = error.response?.data;
        let message = 'Schedule Conflict: You have another event within 30 minutes of this time.';
        
        if (conflictData?.conflictingEvents && conflictData.conflictingEvents.length > 0) {
          const conflicts = conflictData.conflictingEvents
            .map((e: any) => `\n• ${e.title} (${parseApiDateTime(e.start).toLocaleTimeString()} - ${parseApiDateTime(e.end).toLocaleTimeString()})`)
            .join('');
          message += '\n\nConflicting events:' + conflicts;
        }
        
        alert(message);
      } else {
        const errorMsg = error.response?.data?.error || (isEdit ? 'Failed to update viewing' : 'Failed to schedule viewing');
        alert(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Schedule Property Viewing</h2>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-1">Link to Ticket</label>
          <select
            value={selectedInquiryId}
            onChange={(e) => setSelectedInquiryId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Select from assigned or claimed tickets —</option>
            {inquiries.map((i) => (
              <option key={i.id} value={i.id}>
                {i.ticketNumber} · {i.name} · {i.propertyTitle} · {i.status}
              </option>
            ))}
          </select>
          {!selectedInquiry && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={manualCustomer.name}
                  onChange={(e) => setManualCustomer({ ...manualCustomer, name: e.target.value })}
                  placeholder="Customer Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Title</label>
                <input
                  type="text"
                  value={manualCustomer.propertyTitle}
                  onChange={(e) => setManualCustomer({ ...manualCustomer, propertyTitle: e.target.value })}
                  placeholder="Property Title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
          {errors.customer && <p className="text-red-600 text-sm mt-2">{errors.customer}</p>}
          {selectedInquiry && (
            <div className="mt-4 text-sm text-gray-600">
              <p>Selected Ticket: <span className="font-semibold">{selectedInquiry.ticketNumber}</span></p>
              <p>Customer: <span className="font-semibold">{selectedInquiry.name}</span></p>
              <p>Property: <span className="font-semibold">{selectedInquiry.propertyTitle}</span></p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={getTodayLocalDateString()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              min="08:00"
              max="18:00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {errors.time && <p className="text-red-600 text-sm mt-1">{errors.time}</p>}
            <p className="text-xs text-gray-500 mt-1">Business hours: 8:00 AM - 6:00 PM</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
              <option value="180">3 hours</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Meeting location, special instructions, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? (isEdit ? 'Updating...' : 'Scheduling...') : (isEdit ? 'Update Viewing' : 'Schedule Viewing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleViewingModal;
