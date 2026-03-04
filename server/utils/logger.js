/**
 * TES Property System - Logging Utility
 * 
 * Purpose: Replace console.log statements with proper logging
 * that can be disabled in production
 * 
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('User logged in', { userId: user.id });
 *   logger.error('Database connection failed', error);
 * 
 * Features:
 *   - Automatically disabled in production (except errors)
 *   - Timestamp added to all logs
 *   - Color-coded output in development
 *   - Structured logging support
 */

const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

/**
 * Format timestamp for logs
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

/**
 * Format log message with color and timestamp
 */
const formatLog = (level, color, ...args) => {
  const timestamp = getTimestamp();
  const prefix = isDev 
    ? `${colors.gray}[${timestamp}]${colors.reset} ${color}[${level}]${colors.reset}`
    : `[${timestamp}] [${level}]`;
  
  return [prefix, ...args];
};

/**
 * Logger object with different log levels
 */
const logger = {
  /**
   * Info level - general information
   * Disabled in production
   */
  info: (...args) => {
    if (isDev && !isTest) {
      console.log(...formatLog('INFO', colors.blue, ...args));
    }
  },

  /**
   * Success level - operations completed successfully
   * Disabled in production
   */
  success: (...args) => {
    if (isDev && !isTest) {
      console.log(...formatLog('SUCCESS', colors.green, ...args));
    }
  },

  /**
   * Warning level - potential issues
   * Disabled in production
   */
  warn: (...args) => {
    if (isDev && !isTest) {
      console.warn(...formatLog('WARN', colors.yellow, ...args));
    }
  },

  /**
   * Error level - errors that need attention
   * ALWAYS enabled (including production)
   */
  error: (...args) => {
    if (!isTest) {
      console.error(...formatLog('ERROR', colors.red, ...args));
    }
  },

  /**
   * Debug level - detailed debugging information
   * Only in development
   */
  debug: (...args) => {
    if (isDev && !isTest) {
      console.log(...formatLog('DEBUG', colors.magenta, ...args));
    }
  },

  /**
   * HTTP level - HTTP request/response logging
   * Disabled in production
   */
  http: (method, path, statusCode, duration) => {
    if (isDev && !isTest) {
      const statusColor = statusCode < 400 ? colors.green : colors.red;
      console.log(
        ...formatLog(
          'HTTP',
          colors.cyan,
          `${colors.bright}${method}${colors.reset}`,
          path,
          `${statusColor}${statusCode}${colors.reset}`,
          `${colors.gray}(${duration}ms)${colors.reset}`
        )
      );
    }
  },

  /**
   * Database level - database query logging
   * Disabled in production
   */
  db: (operation, table, duration) => {
    if (isDev && !isTest) {
      console.log(
        ...formatLog(
          'DB',
          colors.magenta,
          operation,
          `${colors.bright}${table}${colors.reset}`,
          `${colors.gray}(${duration}ms)${colors.reset}`
        )
      );
    }
  },

  /**
   * Security level - security-related events
   * ALWAYS enabled (including production)
   */
  security: (...args) => {
    if (!isTest) {
      console.log(...formatLog('SECURITY', colors.red, ...args));
    }
  }
};

/**
 * Express middleware for HTTP request logging
 * Replace the console.log in server/index.js with this
 */
logger.middleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(req.method, req.path, res.statusCode, duration);
  });
  
  next();
};

module.exports = logger;
