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

const PROPERTY_TYPES = ['House', 'Condominium', 'Villa', 'Apartment', 'Condo', 'Lot', 'Commercial'];
const PROPERTY_STATUSES = ['draft', 'available', 'reserved', 'under-contract', 'sold', 'withdrawn', 'off-market'];
const INQUIRY_STATUSES = [
  'new',
  'claimed',
  'assigned',
  'contacted',
  'in-progress',
  'viewing-scheduled',
  'negotiating',
  'viewed-interested',
  'viewed-not-interested',
  'deal-successful',
  'deal-cancelled',
  'no-response'
];

const normalizePhoneNumber = (value, helpers) => {
  if (value === null || value === undefined || value === '') {
    return value;
  }

  if (typeof value !== 'string') {
    return helpers.error('string.base');
  }

  const cleanPhone = value.replace(/[\s\-()]/g, '');
  if (!/^(09|\+639)\d{9}$/.test(cleanPhone)) {
    return helpers.error('string.pattern.base');
  }

  return cleanPhone;
};

const imagePathSchema = Joi.string()
  .max(500)
  .pattern(/^(https?:\/\/|\/uploads\/|$)/)
  .allow('', null)
  .messages({
    'string.max': 'Image path cannot exceed 500 characters',
    'string.pattern.base': 'Image must be a valid URL or uploaded file path'
  });

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
    .valid(...PROPERTY_TYPES)
    .required()
    .messages({
      'any.only': `Property type must be one of: ${PROPERTY_TYPES.join(', ')}`,
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
    .min(20)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Description must be at least 20 characters',
      'string.max': 'Description cannot exceed 5000 characters'
    }),
  
  status: Joi.string()
    .valid(...PROPERTY_STATUSES)
    .default('available')
    .messages({
      'any.only': `Status must be one of: ${PROPERTY_STATUSES.join(', ')}`
    }),
  
  imageUrl: imagePathSchema,
  
  images: Joi.array()
    .items(imagePathSchema)
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

const propertyDraftSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.min': 'Property title must be at least 3 characters',
      'string.max': 'Property title cannot exceed 255 characters',
      'any.required': 'Property title is required'
    }),

  type: Joi.string()
    .valid(...PROPERTY_TYPES)
    .default('House')
    .messages({
      'any.only': `Property type must be one of: ${PROPERTY_TYPES.join(', ')}`
    }),

  price: Joi.number()
    .min(0)
    .max(1000000000)
    .default(0)
    .messages({
      'number.min': 'Price cannot be negative',
      'number.max': 'Price cannot exceed ₱1,000,000,000'
    }),

  location: Joi.string()
    .max(255)
    .allow('', null)
    .messages({
      'string.max': 'Location cannot exceed 255 characters'
    }),

  bedrooms: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .default(0)
    .messages({
      'number.min': 'Bedrooms cannot be negative',
      'number.max': 'Bedrooms cannot exceed 10'
    }),

  bathrooms: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .default(0)
    .messages({
      'number.min': 'Bathrooms cannot be negative',
      'number.max': 'Bathrooms cannot exceed 10'
    }),

  area: Joi.number()
    .min(0)
    .max(10000)
    .default(0)
    .messages({
      'number.min': 'Area cannot be negative',
      'number.max': 'Area cannot exceed 10,000 sqm'
    }),

  description: Joi.string()
    .max(5000)
    .allow('', null)
    .messages({
      'string.max': 'Description cannot exceed 5000 characters'
    }),

  status: Joi.string()
    .valid('draft', 'available')
    .default('draft')
    .messages({
      'any.only': 'Draft status must be draft or available'
    }),

  imageUrl: imagePathSchema,

  images: Joi.array()
    .items(imagePathSchema)
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
    .custom(normalizePhoneNumber, 'Philippine phone normalization')
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid Philippine phone number (e.g., 09171234567)',
      'any.required': 'Phone number is required'
    }),
  
  message: Joi.string()
    .min(20)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Message must be at least 20 characters',
      'string.max': 'Message cannot exceed 2000 characters',
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
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
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
    .custom(normalizePhoneNumber, 'Philippine phone normalization')
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid Philippine phone number'
    }),

  licenseNumber: Joi.string().max(120).allow('', null),
  licenseType: Joi.string().max(80).allow('', null),
  licenseIssuedDate: Joi.date().iso().allow(null),
  licenseExpiryDate: Joi.date().iso().allow(null),
  licenseVerified: Joi.boolean().default(false),
  brokerId: Joi.string().max(120).allow('', null),
  specialization: Joi.string().max(120).allow('', null)
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
const propertyUpdateSchema = propertySchema
  .fork(
    ['title', 'type', 'price', 'location', 'bedrooms', 'bathrooms', 'area', 'description'],
    (schema) => schema.optional()
  )
  .keys({
    status: Joi.string().valid(...PROPERTY_STATUSES),
    imageUrl: imagePathSchema.optional(),
    images: Joi.array()
      .items(imagePathSchema)
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot upload more than 10 images'
      }),
    features: Joi.array()
      .items(Joi.string().max(100))
      .max(20)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 20 features'
      }),
    statusHistory: Joi.array().items(
      Joi.object({
        status: Joi.string().valid(...PROPERTY_STATUSES).required(),
        changedBy: Joi.string().required(),
        changedByName: Joi.string().required(),
        changedAt: Joi.date().iso().required(),
        reason: Joi.string().max(500).allow('', null)
      })
    ),
    soldBy: Joi.string().max(255).allow('', null),
    soldByAgentId: Joi.string().uuid().allow('', null),
    soldAt: Joi.date().iso().allow(null),
    salePrice: Joi.number().min(100000).max(1000000000),
    reservedBy: Joi.string().max(255).allow('', null),
    reservedAt: Joi.date().iso().allow(null),
    reservedUntil: Joi.date().iso().allow(null),
    visibleToCustomers: Joi.boolean(),
    visible_to_customers: Joi.boolean(),
    updatedAt: Joi.date().iso(),
    commission: Joi.object({
      rate: Joi.number().min(0).max(100).required(),
      amount: Joi.number().min(0).required(),
      status: Joi.string().valid('pending', 'paid').required(),
      paidAt: Joi.date().iso().allow(null),
      paidBy: Joi.string().allow('', null)
    }).allow(null)
  })
  .prefs({ noDefaults: true });

const inquiryUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255),

  email: Joi.string()
    .email()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),

  phone: Joi.string()
    .custom(normalizePhoneNumber, 'Philippine phone normalization')
    .allow('', null)
    .messages({
      'string.pattern.base': 'Please provide a valid Philippine phone number'
    }),

  message: Joi.string()
    .min(20)
    .max(2000),

  status: Joi.string()
    .valid(...INQUIRY_STATUSES)
    .messages({
      'any.only': 'Invalid status value'
    }),

  propertyId: Joi.string().uuid(),
  propertyTitle: Joi.string().max(255).allow('', null),
  propertyPrice: Joi.number().allow(null),
  propertyLocation: Joi.string().max(255).allow('', null),
  
  notes: Joi.array()
    .items(Joi.object({
      id: Joi.string().required(),
      agentId: Joi.string().required(),
      agentName: Joi.string().required(),
      note: Joi.string().min(1).max(5000).required(),
      createdAt: Joi.date().iso().required()
    })),
  
  lastFollowUpAt: Joi.date().iso().allow(null),
  nextFollowUpAt: Joi.date().iso().allow(null)
});

const inquiryAssignmentSchema = Joi.object({
  agentId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Invalid agent ID format',
      'any.required': 'Agent ID is required'
    }),
  agentName: Joi.string().max(255).allow('', null)
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
    .max(1000)
    .default(20)
});

const uuidParamSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Invalid ID format',
      'any.required': 'ID is required'
    })
});

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Invalid route parameters',
        details: errors
      });
    }

    req.params = value;
    next();
  };
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Schemas
  propertySchema,
  propertyDraftSchema,
  propertyUpdateSchema,
  inquirySchema,
  inquiryUpdateSchema,
  inquiryAssignmentSchema,
  agentSchema,
  calendarEventSchema,
  paginationSchema,
  uuidParamSchema,
  
  // Middleware
  validate,
  validateQuery,
  validateParams
};
