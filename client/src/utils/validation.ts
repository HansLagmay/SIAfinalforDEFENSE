import type { PropertyValidationData, InquiryValidationData, ValidationErrors } from '../types/api';

const PROPERTY_TYPES = ['House', 'Condominium', 'Villa', 'Apartment', 'Condo', 'Lot', 'Commercial'];

export const validateProperty = (property: PropertyValidationData): ValidationErrors => {
  const errors: Record<string, string> = {};
  const title = property.title?.trim() || '';
  const location = property.location?.trim() || '';
  const description = property.description?.trim() || '';
  
  if (!title || title.length < 10) {
    errors.title = 'Title must be at least 10 characters';
  }

  if (!property.type || !PROPERTY_TYPES.includes(property.type)) {
    errors.type = 'Select a valid property type';
  }
  
  if (!property.price || property.price < 100000 || property.price > 1000000000) {
    errors.price = 'Price must be between ₱100,000 and ₱1,000,000,000';
  }

  if (!location || location.length < 5) {
    errors.location = 'Location must be at least 5 characters';
  }
  
  if (property.bedrooms !== undefined && (property.bedrooms < 0 || property.bedrooms > 10)) {
    errors.bedrooms = 'Bedrooms must be between 0 and 10';
  }
  
  if (!property.bathrooms || property.bathrooms < 1 || property.bathrooms > 10) {
    errors.bathrooms = 'Bathrooms must be between 1 and 10';
  }
  
  if (!property.area || property.area < 10 || property.area > 10000) {
    errors.area = 'Area must be between 10 and 10,000 sqm';
  }

  if (!description || description.length < 20) {
    errors.description = 'Description must be at least 20 characters';
  }
  
  return errors;
};

export const validateInquiry = (inquiry: InquiryValidationData): ValidationErrors => {
  const errors: Record<string, string> = {};
  const name = inquiry.name?.trim() || '';
  const message = inquiry.message?.trim() || '';
  
  const phoneRegex = /^(09|\+639)\d{9}$/;
  if (inquiry.phone && !phoneRegex.test(inquiry.phone.replace(/[\s\-()]/g, ''))) {
    errors.phone = 'Invalid Philippine phone number';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (inquiry.email && !emailRegex.test(inquiry.email)) {
    errors.email = 'Invalid email address';
  }

  if (!name || name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  if (!message || message.length < 20) {
    errors.message = 'Message must be at least 20 characters';
  } else if (message.length > 2000) {
    errors.message = 'Message cannot exceed 2000 characters';
  }
  
  return errors;
};

export const validateImageCount = (count: number): string | null => {
  if (count > 10) {
    return 'Cannot upload more than 10 images';
  }

  return null;
};

export const validateReservationHours = (hours: number): string | null => {
  if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
    return 'Reservation duration must be between 1 and 720 hours';
  }

  return null;
};

export const validateSalePrice = (price: number): string | null => {
  if (!Number.isFinite(price) || price < 100000 || price > 1000000000) {
    return 'Sale price must be between ₱100,000 and ₱1,000,000,000';
  }

  return null;
};

/**
 * Validate Philippine phone number format
 * Accepts: 09171234567, +639171234567, 0917-123-4567, +63-917-123-4567
 * @param phone - Phone number to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export const validatePhoneNumber = (phone: string): { isValid: boolean; message?: string } => {
  if (!phone || phone.trim() === '') {
    return { isValid: false, message: 'Phone number is required' };
  }

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  // Philippine phone number regex: 09 or +639 followed by 9 digits
  const phoneRegex = /^(09|\+639)\d{9}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return { 
      isValid: false, 
      message: 'Invalid Philippine phone number. Use format: 09171234567 or +639171234567' 
    };
  }
  
  return { isValid: true };
};

/**
 * Format phone number to +639 format for storage
 * Converts 09171234567 → +639171234567
 * @param phone - Phone number to format
 * @returns Formatted phone number or original if invalid
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  // If starts with 09, convert to +639
  if (cleanPhone.startsWith('09')) {
    return '+63' + cleanPhone.substring(1);
  }
  
  // If starts with +639, return as is
  if (cleanPhone.startsWith('+639')) {
    return cleanPhone;
  }
  
  // Return original if format is unknown
  return phone;
};
