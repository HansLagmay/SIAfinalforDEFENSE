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
const PROPERTY_PLACEHOLDERS: Record<string, string[]> = {
  house: [
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&h=600&fit=crop'
  ],
  condo: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop'
  ],
  lot: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&h=600&fit=crop'
  ],
  commercial: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop'
  ]
};

const hashSeed = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getPropertyPlaceholder = (propertyType?: string, seedKey?: string): string => {
  const type = propertyType?.toLowerCase() || 'house';
  const bucket = PROPERTY_PLACEHOLDERS[type] || PROPERTY_PLACEHOLDERS.house;
  const index = seedKey ? hashSeed(seedKey) % bucket.length : 0;
  return bucket[index];
};

/**
 * Get property image with fallback to placeholder
 * @param {string} imagePath - Image path from database
 * @param {string} propertyType - Type of property
 * @returns {string} Image URL or placeholder
 */
export const getPropertyImage = (imagePath?: string, propertyType?: string, seedKey?: string): string => {
  if (!imagePath) {
    return getPropertyPlaceholder(propertyType, seedKey);
  }
  
  // If image path starts with http/https, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Check if it's a sample image path
  if (imagePath.includes('/uploads/properties/sample')) {
    return getPropertyPlaceholder(propertyType, seedKey);
  }
  
  // Otherwise, construct the full URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const baseURL = API_URL.replace('/api', '');
  
  return `${baseURL}${imagePath}`;
};

export const getPropertyShowcaseImages = (
  imagePaths: string[] | undefined,
  propertyType?: string,
  seedKey?: string,
  minCount = 4
): string[] => {
  const normalized = Array.isArray(imagePaths) ? imagePaths.filter(Boolean) : [];
  const actual = normalized.map((img, idx) => getPropertyImage(img, propertyType, `${seedKey || ''}-${idx}`));

  const unique = Array.from(new Set(actual));
  const targetCount = Math.max(1, minCount);

  let i = 0;
  while (unique.length < targetCount) {
    const fallback = getPropertyPlaceholder(propertyType, `${seedKey || propertyType || 'property'}-fallback-${i}`);
    if (!unique.includes(fallback)) {
      unique.push(fallback);
    }
    i += 1;
    if (i > 12) break;
  }

  return unique;
};
