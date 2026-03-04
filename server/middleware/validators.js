/**
 * TES Property System - Request Validators
 * 
 * Purpose: Validate incoming request data before processing
 * Uses: Joi validation library
 * 
 * Install: npm install joi
 * 
 * Usage in routes:
 *   const { propertySchema, inquirySchema, validate } = require('../middleware/validators');
 *   router.post('/properties', validate(propertySchema), async (req, res) => { ... });
 */

const Joi = require('joi');

// ============================================================
// PROPERTY VALIDATION SCHEMA
// ============================================================

const propertySchema = Joi.object({
  title: Joi.string()
    .min(10)
    .max(255)
    .required()
    .messages({
      'string.min': 'Property title must be at least 10 characters',
      'string.max': 'Property title cannot exceed 255 characters',
      'any.required': 'Property title is required'
    }),
  
  type: Joi.string()
    .valid('House', 'Condo', 'Lot', 'Commercial')
    .required()
    .messages({
      'any.only': 'Property type must be one of: House, Condo, Lot, Commercial',
      'any.required': 'Property type is required'
    }),
  
  price: Joi.number()
    .min(100000)
    .max(1000000000)
    .required()
    .messages({
      'number.min': 'Price must be at least ₱100,000',
      'number.max': 'Price cannot exceed ₱1,000,000,000',
      'any.required': 'Price is required'
    }),
  
  location: Joi.string()
    .min(5)
    .max(255)
    .required()
    .messages({
      'string.min': 'Location must be at least 5 characters',
      'string.max': 'Location cannot exceed 255 characters',
      'any.required': 'Location is required'
    }),
  
  bedrooms: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .required()
    .messages({
      'number.min': 'Bedrooms cannot be negative',
      'number.max': 'Bedrooms cannot exceed 10',
      'any.required': 'Number of bedrooms is required'
    }),
  
  bathrooms: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .required()
    .messages({
      'number.min': 'Must have at least 1 bathroom',
      'number.max': 'Bathrooms cannot exceed 10',
      'any.required': 'Number of bathrooms is required'
    }),
  
  area: Joi.number()
    .min(10)
    .max(10000)
    .required()
    .messages({
      'number.min': 'Area must be at least 10 sqm',
      'number.max': 'Area cannot exceed 10,000 sqm',
      'any.required': 'Area is required'
    }),
  
  description: Joi.string()
    .max(5000)
    .allow('', null)
    .messages({
      'string.max': 'Description cannot exceed 5000 characters'
    }),
  
  status: Joi.string()
    .valid('available', 'sold', 'reserved', 'draft')
    .default('available')
    .messages({
      'any.only': 'Status must be one of: available, sold, reserved, draft'
    }),
  
  imageUrl: Joi.string()
    .uri()
    .allow('', null)
    .messages({
      'string.uri': 'Image URL must be a valid URL'
    }),
  
  images: Joi.array()
    .items(Joi.string().uri())
    .max(10)
    .messages({
      'array.max': 'Cannot upload more than 10 images'
    }),
  
  features: Joi.array()
    .items(Joi.string().max(100))
    .max(20)
    .default([])
    .messages({
      'array.max': 'Cannot have more than 20 features'
    })
});

// ============================================================
// INQUIRY VALIDATION SCHEMA
// ============================================================

const inquirySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 255 characters',
      'any.required': 'Name is required'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  phone: Joi.string()
    .pattern(/^(09|\+639)\d{9}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid Philippine phone number (e.g., 09171234567)'
    }),
  
  message: Joi.string()
    .min(20)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Message must be at least 20 characters',
      'string.max': 'Message cannot exceed 5000 characters',
      'any.required': 'Message is required'
    }),
  
  propertyId: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.uuid': 'Invalid property ID format'
    }),
  
  propertyTitle: Joi.string()
    .max(255)
    .allow('', null),
  
  propertyPrice: Joi.number()
    .allow(null),
  
  propertyLocation: Joi.string()
    .max(255)
    .allow('', null)
});

// ============================================================
// USER/AGENT VALIDATION SCHEMA
// ============================================================

const agentSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character',
      'any.required': 'Password is required'
    }),
  
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 255 characters',
      'any.required': 'Name is required'
    }),
  
  phone: Joi.string()
    .pattern(/^(09|\+639)\d{9}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid Philippine phone number'
    })
});

// ============================================================
// CALENDAR EVENT VALIDATION SCHEMA
// ============================================================

const calendarEventSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.min': 'Event title must be at least 3 characters',
      'string.max': 'Event title cannot exceed 255 characters',
      'any.required': 'Event title is required'
    }),
  
  description: Joi.string()
    .max(5000)
    .allow('', null)
    .messages({
      'string.max': 'Description cannot exceed 5000 characters'
    }),
  
  type: Joi.string()
    .valid('meeting', 'viewing', 'call', 'other')
    .default('meeting')
    .messages({
      'any.only': 'Event type must be one of: meeting, viewing, call, other'
    }),
  
  start: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Start time must be a valid date',
      'any.required': 'Start time is required'
    }),
  
  end: Joi.date()
    .iso()
    .greater(Joi.ref('start'))
    .required()
    .messages({
      'date.base': 'End time must be a valid date',
      'date.greater': 'End time must be after start time',
      'any.required': 'End time is required'
    }),
  
  agentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Invalid agent ID format',
      'any.required': 'Agent ID is required'
    })
});

// ============================================================
// UPDATE SCHEMAS (for PATCH/PUT requests)
// ============================================================

// Allow partial updates - all fields optional
const propertyUpdateSchema = propertySchema.fork(
  ['title', 'type', 'price', 'location', 'bedrooms', 'bathrooms', 'area'],
  (schema) => schema.optional()
);

const inquiryUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('new', 'in_progress', 'successful', 'closed', 'cancelled')
    .messages({
      'any.only': 'Invalid status value'
    }),
  
  notes: Joi.array()
    .items(Joi.object({
      text: Joi.string().required(),
      timestamp: Joi.date().iso()
    })),
  
  lastFollowUpAt: Joi.date().iso(),
  nextFollowUpAt: Joi.date().iso()
});

// ============================================================
// VALIDATION MIDDLEWARE
// ============================================================

/**
 * Validate request body against a Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just first
      stripUnknown: true // Remove unknown fields
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Validate query parameters
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({ 
        error: 'Invalid query parameters',
        details: errors
      });
    }
    
    req.query = value;
    next();
  };
};

/**
 * Common query parameter schema for pagination
 */
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
});

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Schemas
  propertySchema,
  propertyUpdateSchema,
  inquirySchema,
  inquiryUpdateSchema,
  agentSchema,
  calendarEventSchema,
  paginationSchema,
  
  // Middleware
  validate,
  validateQuery
};
