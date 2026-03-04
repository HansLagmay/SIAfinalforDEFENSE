import { useState } from 'react';
import type { Property } from '../../types';
import { inquiriesAPI } from '../../services/api';
import ImageGallery from './ImageGallery';
import { getPropertyImage } from '../../utils/formatters';

interface InquiryModalProps {
  property: Property;
  onClose: () => void;
}

const InquiryModal = ({ property, onClose }: InquiryModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    contactMethods: {
      email: true,
      phone: false,
      sms: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');

  const validateInquiry = (data: typeof formData) => {
    const errors: string[] = [];
    
    // Phone format validation: 0917-XXX-XXXX or 09171234567 or +639171234567
    const phoneRegex = /^(09|\+639)\d{9}$/;
    const cleanPhone = data.phone.replace(/[-\s]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Invalid Philippine phone number format (e.g., 0917-123-4567 or +639171234567)');
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email address');
    }
    
    // Message minimum length
    if (!data.message || data.message.trim().length < 20) {
      errors.push('Message must be at least 20 characters');
    }
    
    return errors;
  };

  const checkDuplicateInquiry = async (email: string, propertyId: string) => {
    try {
      const response = await inquiriesAPI.getAll();
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      const existingInquiry = response.data.find((inq: any) => 
        inq.email.toLowerCase() === email.toLowerCase() && 
        inq.propertyId === propertyId &&
        new Date(inq.createdAt).getTime() > sevenDaysAgo &&
        inq.status !== 'closed' && 
        inq.status !== 'cancelled'
      );
      
      if (existingInquiry) {
        return {
          isDuplicate: true,
          message: `You already have an active inquiry for this property (Ticket #${existingInquiry.ticketNumber}).`,
          existingTicket: existingInquiry
        };
      }
      
      return { isDuplicate: false };
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return { isDuplicate: false }; // Allow submission if check fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      const validationErrors = validateInquiry(formData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. '));
        setLoading(false);
        return;
      }

      // Check for duplicate inquiry
      const duplicateCheck = await checkDuplicateInquiry(formData.email, property.id);
      if (duplicateCheck.isDuplicate && duplicateCheck.message) {
        setError(duplicateCheck.message);
        setLoading(false);
        return;
      }

      const preferred = [
        formData.contactMethods.email ? 'Email' : null,
        formData.contactMethods.phone ? 'Phone' : null,
        formData.contactMethods.sms ? 'SMS' : null,
      ].filter(Boolean).join(', ');
      const messageWithPreferences = preferred
        ? `${formData.message}\n\nPreferred contact methods: ${preferred}`
        : formData.message;

      // Submit inquiry with complete data structure
      const response = await inquiriesAPI.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: messageWithPreferences,
        propertyId: property.id,
        propertyTitle: property.title,
        propertyPrice: property.price,
        propertyLocation: property.location
      });
      
      // Extract ticket number from response
      if (response.data && response.data.ticketNumber) {
        setTicketNumber(response.data.ticketNumber);
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-glow animate-scale-in">
          <div className="w-20 h-20 bg-gradient-to-br from-success-100 to-success-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <svg className="w-10 h-10 text-success-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">Inquiry Sent!</h3>
          {ticketNumber && (
            <p className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
              Ticket #{ticketNumber}
            </p>
          )}
          <p className="text-gray-600">We'll get back to you soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-glow animate-scale-in">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
          <h2 className="text-2xl font-bold text-gray-900">Send Inquiry</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white/50 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Property Image Gallery */}
          <div className="mb-6">
            <ImageGallery 
              images={property.images && property.images.length > 0 
                ? property.images.map(img => getPropertyImage(img, property.type))
                : [getPropertyImage(property.imageUrl, property.type)]}
              title={property.title}
            />
          </div>

          <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-200">
            <p className="text-sm text-gray-600 font-medium">Property:</p>
            <p className="font-bold text-gray-900 text-lg">{property.title}</p>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {property.location}
            </p>
          </div>

          <div className="bg-primary-50 border-l-4 border-primary-500 rounded-r-lg p-4 mb-6">
            <p className="text-sm text-primary-900 flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Please fill out this form to inquire about this property. Our agents will contact you within 24 hours via your preferred method.</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger-50 border-l-4 border-danger-500 text-danger-800 px-4 py-3 rounded-r-lg flex items-start gap-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="input w-full"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="input w-full"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="input w-full"
                placeholder="+63 912 345 6789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Methods *
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.contactMethods.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactMethods: { ...formData.contactMethods, email: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="group-hover:text-primary-600 transition-colors flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Email
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.contactMethods.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactMethods: { ...formData.contactMethods, phone: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="group-hover:text-primary-600 transition-colors flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Phone
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.contactMethods.sms}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactMethods: { ...formData.contactMethods, sms: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="group-hover:text-primary-600 transition-colors flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    SMS
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (minimum 20 characters) *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                minLength={20}
                rows={4}
                className="input w-full resize-none"
                placeholder="I'm interested in this property... (Please provide at least 20 characters)"
              />
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {formData.message.length}/5000 characters (minimum 20)
              </p>
            </div>

            <div className="bg-gray-50 border-l-4 border-success-500 p-3 text-sm text-gray-700 rounded-r-lg">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Your information is secure and will not be shared with third parties.
              </span>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline flex-1 py-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 py-3 shadow-elevated hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Inquiry'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InquiryModal;
