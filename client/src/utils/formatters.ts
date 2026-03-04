/**
 * Format price with Philippine Peso symbol and thousand separators
 * @param {number|string} price - The price to format
 * @returns {string} Formatted price (e.g., ₱3,200,000.00)
 */
export const formatPrice = (price: number | string): string => {
  if (!price && price !== 0) return '₱0.00';
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  return '₱' + numPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Format number with thousand separators
 * @param {number|string} value - The number to format
 * @returns {string} Formatted number (e.g., 3,200,000)
 */
export const formatNumber = (value: number | string): string => {
  if (!value && value !== 0) return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  return num.toLocaleString('en-US');
};

/**
 * Get placeholder image based on property type with real house photos
 * @param {string} propertyType - Type of property (house, condo, lot, commercial)
 * @returns {string} Placeholder image URL from Unsplash
 */
export const getPropertyPlaceholder = (propertyType?: string): string => {
  const type = propertyType?.toLowerCase() || 'house';
  
  // Using Unsplash for real property images
  const placeholders: Record<string, string> = {
    house: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
    condo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
    lot: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
    commercial: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop'
  };
  
  return placeholders[type] || placeholders.house;
};

/**
 * Get property image with fallback to placeholder
 * @param {string} imagePath - Image path from database
 * @param {string} propertyType - Type of property
 * @returns {string} Image URL or placeholder
 */
export const getPropertyImage = (imagePath?: string, propertyType?: string): string => {
  if (!imagePath) {
    return getPropertyPlaceholder(propertyType);
  }
  
  // If image path starts with http/https, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Check if it's a sample image path
  if (imagePath.includes('/uploads/properties/sample')) {
    return getPropertyPlaceholder(propertyType);
  }
  
  // Otherwise, construct the full URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseURL = API_URL.replace('/api', '');
  
  return `${baseURL}${imagePath}`;
};
