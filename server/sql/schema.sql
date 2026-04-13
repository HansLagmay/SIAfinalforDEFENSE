-- TES Property System - MySQL Schema
-- Database: TESdb

CREATE DATABASE IF NOT EXISTS TESdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE TESdb;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id                   VARCHAR(36)  PRIMARY KEY,
  email                VARCHAR(255) NOT NULL UNIQUE,
  password             VARCHAR(255) NOT NULL,
  name                 VARCHAR(255) NOT NULL DEFAULT '',
  role                 VARCHAR(50)  NOT NULL DEFAULT 'agent',
  phone                VARCHAR(50)  DEFAULT '',
  license_number       VARCHAR(120) DEFAULT NULL,
  license_type         VARCHAR(80)  DEFAULT NULL,
  license_issued_date  DATE         DEFAULT NULL,
  license_expiry_date  DATE         DEFAULT NULL,
  license_verified     TINYINT(1)   NOT NULL DEFAULT 0,
  broker_id            VARCHAR(120) DEFAULT NULL,
  license_status       VARCHAR(32)  NOT NULL DEFAULT 'pending',
  license_file_path    VARCHAR(512) DEFAULT NULL,
  archived_at          DATETIME     DEFAULT NULL,
  archived_by          VARCHAR(36)  DEFAULT NULL,
  archive_reason       VARCHAR(255) DEFAULT NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_archived_at (archived_at),
  INDEX idx_users_license_status (license_status)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id                        VARCHAR(36)  PRIMARY KEY,
  email                     VARCHAR(255) NOT NULL UNIQUE,
  password_hash             VARCHAR(255) NOT NULL,
  name                      VARCHAR(255) NOT NULL DEFAULT '',
  phone                     VARCHAR(50)  DEFAULT NULL,
  email_verified            TINYINT(1)   NOT NULL DEFAULT 0,
  phone_verified            TINYINT(1)   NOT NULL DEFAULT 0,
  verification_token        VARCHAR(255) DEFAULT NULL,
  verification_token_expires DATETIME    DEFAULT NULL,
  phone_verification_token   VARCHAR(255) DEFAULT NULL,
  phone_verification_expires DATETIME    DEFAULT NULL,
  is_blocked                 TINYINT(1)  NOT NULL DEFAULT 0,
  blocked_at                 DATETIME    DEFAULT NULL,
  blocked_by                 VARCHAR(36) DEFAULT NULL,
  blocked_reason             VARCHAR(255) DEFAULT NULL,
  archived_at                DATETIME    DEFAULT NULL,
  archived_by                VARCHAR(36) DEFAULT NULL,
  archive_reason             VARCHAR(255) DEFAULT NULL,
  created_at                 DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                 DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customers_email (email),
  INDEX idx_customers_phone (phone),
  INDEX idx_customers_blocked (is_blocked, blocked_at),
  INDEX idx_customers_archived_at (archived_at)
);

-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id                   VARCHAR(36)   PRIMARY KEY,
  title                VARCHAR(255)  NOT NULL DEFAULT '',
  type                 VARCHAR(100)  NOT NULL DEFAULT 'House',
  price                DECIMAL(15,2) NOT NULL DEFAULT 0,
  location             VARCHAR(255)  NOT NULL DEFAULT '',
  bedrooms             INT           NOT NULL DEFAULT 0,
  bathrooms            INT           NOT NULL DEFAULT 0,
  area                 DECIMAL(10,2) NOT NULL DEFAULT 0,
  description          TEXT,
  status               VARCHAR(50)   NOT NULL DEFAULT 'available',
  image_url            VARCHAR(512)  DEFAULT '',
  visible_to_customers BOOLEAN       NOT NULL DEFAULT TRUE,
  features             JSON,
  status_history       JSON         DEFAULT NULL,
  view_count           INT          NOT NULL DEFAULT 0,
  view_history         JSON         DEFAULT NULL,
  last_viewed_at       DATETIME     DEFAULT NULL,
  sold_by              VARCHAR(255) DEFAULT NULL,
  sold_by_agent_id     VARCHAR(36)  DEFAULT NULL,
  sold_at              DATETIME     DEFAULT NULL,
  sale_price           DECIMAL(15,2) DEFAULT NULL,
  commission           JSON         DEFAULT NULL,
  commission_rate      DECIMAL(5,2) DEFAULT NULL,
  commission_paid_at   DATETIME     DEFAULT NULL,
  commission_paid_by   VARCHAR(36)  DEFAULT NULL,
  reserved_by          VARCHAR(255) DEFAULT NULL,
  reserved_at          DATETIME     DEFAULT NULL,
  reserved_until       DATETIME     DEFAULT NULL,
  primary_agent_id     VARCHAR(36)  DEFAULT NULL,
  assigned_to_agent_at DATETIME     DEFAULT NULL,
  assigned_by_admin_id VARCHAR(36)  DEFAULT NULL,
  assignment_reason    VARCHAR(255) DEFAULT NULL,
  created_by           VARCHAR(255) DEFAULT '',
  created_by_user_id   VARCHAR(36)  DEFAULT NULL,
  archived_at          DATETIME     DEFAULT NULL,
  archived_by          VARCHAR(36)  DEFAULT NULL,
  archive_reason       VARCHAR(255) DEFAULT NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_properties_status (status),
  INDEX idx_properties_created_by (created_by),
  INDEX idx_properties_created_by_user_id (created_by_user_id),
  INDEX idx_properties_primary_agent (primary_agent_id),
  INDEX idx_properties_archived_at (archived_at),
  INDEX idx_properties_visible_to_customers (visible_to_customers),
  INDEX idx_properties_sold_agent (sold_by_agent_id, sold_at)
);

-- Property images (multiple images per property)
CREATE TABLE IF NOT EXISTS property_images (
  id           VARCHAR(36)  PRIMARY KEY,
  property_id  VARCHAR(36)  NOT NULL,
  image_url    VARCHAR(512) NOT NULL,
  is_primary   BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Property documents
CREATE TABLE IF NOT EXISTS property_documents (
  id               VARCHAR(36)  PRIMARY KEY,
  property_id      VARCHAR(36)  NOT NULL,
  document_type    VARCHAR(80)  NOT NULL,
  file_name        VARCHAR(255) NOT NULL,
  file_path        VARCHAR(512) NOT NULL,
  file_size        BIGINT       NOT NULL,
  uploaded_by      VARCHAR(36)  DEFAULT NULL,
  uploaded_by_name VARCHAR(255) DEFAULT NULL,
  uploaded_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at       DATETIME     DEFAULT NULL,
  INDEX idx_property_documents_property (property_id, uploaded_at),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Property amenities
CREATE TABLE IF NOT EXISTS property_amenities (
  id            VARCHAR(36)  PRIMARY KEY,
  property_id   VARCHAR(36)  NOT NULL,
  amenity_name  VARCHAR(120) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_property_amenity_name (property_id, amenity_name),
  INDEX idx_property_amenity_name (amenity_name),
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id                VARCHAR(36)   PRIMARY KEY,
  customer_id       VARCHAR(36)   DEFAULT NULL,
  ticket_number     VARCHAR(50)   NOT NULL UNIQUE,
  name              VARCHAR(255)  NOT NULL DEFAULT '',
  email             VARCHAR(255)  NOT NULL,
  phone             VARCHAR(50)   DEFAULT '',
  message           TEXT,
  property_id       VARCHAR(36)   DEFAULT NULL,
  property_title    VARCHAR(255)  DEFAULT NULL,
  property_price    DECIMAL(15,2) DEFAULT NULL,
  property_location VARCHAR(255)  DEFAULT NULL,
  status            VARCHAR(50)   NOT NULL DEFAULT 'new',
  assigned_to       VARCHAR(36)   DEFAULT NULL,
  claimed_by        VARCHAR(36)   DEFAULT NULL,
  assigned_by       VARCHAR(36)   DEFAULT NULL,
  claimed_at        DATETIME      DEFAULT NULL,
  assigned_at       DATETIME      DEFAULT NULL,
  notes             JSON,
  last_follow_up_at DATETIME      DEFAULT NULL,
  next_follow_up_at DATETIME      DEFAULT NULL,
  archived_at       DATETIME      DEFAULT NULL,
  archived_by       VARCHAR(36)   DEFAULT NULL,
  archive_reason    VARCHAR(255)  DEFAULT NULL,
  created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at         DATETIME      DEFAULT NULL,
  INDEX idx_inquiries_customer (customer_id),
  INDEX idx_inquiries_assigned_to (assigned_to),
  INDEX idx_inquiries_claimed_by (claimed_by),
  INDEX idx_inquiries_status (status),
  INDEX idx_inquiries_archived_at (archived_at),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id           VARCHAR(36)  PRIMARY KEY,
  title        VARCHAR(255) NOT NULL DEFAULT '',
  description  TEXT,
  type         VARCHAR(100) DEFAULT 'meeting',
  start_time   DATETIME     NOT NULL,
  end_time     DATETIME     NOT NULL,
  agent_id     VARCHAR(36)  DEFAULT NULL,
  inquiry_id   VARCHAR(36)  DEFAULT NULL,
  property_id  VARCHAR(36)  DEFAULT NULL,
  created_by   VARCHAR(255) DEFAULT '',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_calendar_inquiry (inquiry_id),
  INDEX idx_calendar_property (property_id),
  INDEX idx_calendar_agent (agent_id)
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id           VARCHAR(36)  PRIMARY KEY,
  action       VARCHAR(255) NOT NULL,
  description  TEXT,
  performed_by VARCHAR(255) DEFAULT '',
  timestamp    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_timestamp (timestamp),
  INDEX idx_activity_action (action)
);

-- Customer favorites
CREATE TABLE IF NOT EXISTS customer_favorites (
  id           VARCHAR(36)  PRIMARY KEY,
  customer_id  VARCHAR(36)  NOT NULL,
  property_id  VARCHAR(36)  NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_property_favorite (customer_id, property_id),
  INDEX idx_customer_favorites_customer (customer_id),
  INDEX idx_customer_favorites_property (property_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Customer preferences
CREATE TABLE IF NOT EXISTS customer_preferences (
  id                   VARCHAR(36) PRIMARY KEY,
  customer_id          VARCHAR(36) NOT NULL,
  preferred_locations  JSON DEFAULT NULL,
  property_types       JSON DEFAULT NULL,
  min_price            DECIMAL(15,2) DEFAULT NULL,
  max_price            DECIMAL(15,2) DEFAULT NULL,
  min_area             DECIMAL(10,2) DEFAULT NULL,
  max_area             DECIMAL(10,2) DEFAULT NULL,
  preferred_bedrooms   INT DEFAULT NULL,
  preferred_bathrooms  INT DEFAULT NULL,
  amenities            JSON DEFAULT NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_preferences_customer (customer_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id           VARCHAR(36)  PRIMARY KEY,
  user_id      VARCHAR(36)  NOT NULL,
  user_role    VARCHAR(32)  NOT NULL,
  type         VARCHAR(80)  NOT NULL,
  title        VARCHAR(255) NOT NULL,
  message      TEXT         NOT NULL,
  related_id   VARCHAR(36)  DEFAULT NULL,
  related_type VARCHAR(80)  DEFAULT NULL,
  read_at      DATETIME     DEFAULT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user (user_id, user_role, created_at),
  INDEX idx_notifications_unread (user_id, user_role, read_at)
);

-- Commission settings
CREATE TABLE IF NOT EXISTS commission_settings (
  id              VARCHAR(36)  PRIMARY KEY,
  default_rate    DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  updated_by      VARCHAR(36)  DEFAULT NULL,
  updated_by_name VARCHAR(255) DEFAULT NULL,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Agent license history
CREATE TABLE IF NOT EXISTS agent_licenses_history (
  id             VARCHAR(36)  PRIMARY KEY,
  agent_id       VARCHAR(36)  NOT NULL,
  license_number VARCHAR(120) NOT NULL,
  license_type   VARCHAR(80)  DEFAULT NULL,
  issued_date    DATE         DEFAULT NULL,
  expiry_date    DATE         DEFAULT NULL,
  status         VARCHAR(32)  NOT NULL,
  verified_by    VARCHAR(36)  DEFAULT NULL,
  verified_at    DATETIME     DEFAULT NULL,
  notes          TEXT,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_agent_license_history_agent (agent_id, created_at)
);

-- Appointment feedback
CREATE TABLE IF NOT EXISTS appointment_feedback (
  id              VARCHAR(36) PRIMARY KEY,
  appointment_id  VARCHAR(36) NOT NULL,
  inquiry_id      VARCHAR(36) DEFAULT NULL,
  customer_id     VARCHAR(36) NOT NULL,
  agent_id        VARCHAR(36) DEFAULT NULL,
  rating          TINYINT NOT NULL,
  comment         TEXT,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_appointment_feedback_rating CHECK (rating BETWEEN 1 AND 5),
  UNIQUE KEY uq_appointment_feedback_appointment_customer (appointment_id, customer_id),
  INDEX idx_appointment_feedback_agent (agent_id),
  INDEX idx_appointment_feedback_customer (customer_id),
  INDEX idx_appointment_feedback_inquiry (inquiry_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE SET NULL
);

-- Phone verification attempts
CREATE TABLE IF NOT EXISTS phone_verification_attempts (
  id              VARCHAR(36) PRIMARY KEY,
  customer_id     VARCHAR(36) NOT NULL,
  phone           VARCHAR(50) NOT NULL,
  attempt_count   INT DEFAULT 1,
  last_attempt_at DATETIME NOT NULL,
  reset_at        DATETIME NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone_verification_attempts_customer (customer_id),
  INDEX idx_phone_verification_attempts_phone (phone),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Phone verification log
CREATE TABLE IF NOT EXISTS phone_verification_log (
  id          VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  phone       VARCHAR(50) NOT NULL,
  otp_sent    VARCHAR(10) NOT NULL,
  sent_at     DATETIME NOT NULL,
  verified_at DATETIME DEFAULT NULL,
  expires_at  DATETIME NOT NULL,
  status      ENUM('pending', 'verified', 'expired', 'failed') DEFAULT 'pending',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone_verification_log_customer (customer_id),
  INDEX idx_phone_verification_log_status (status),
  INDEX idx_phone_verification_log_phone (phone),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Customer moderation flags
CREATE TABLE IF NOT EXISTS customer_flags (
  id                      VARCHAR(36) PRIMARY KEY,
  inquiry_id              VARCHAR(36) NOT NULL,
  customer_id             VARCHAR(36) NULL,
  customer_name           VARCHAR(255) NOT NULL,
  customer_email          VARCHAR(255) NOT NULL,
  customer_phone          VARCHAR(50) NULL,
  reported_by_agent_id    VARCHAR(36) NOT NULL,
  reported_by_agent_name  VARCHAR(255) NOT NULL,
  reason                  VARCHAR(255) NOT NULL,
  details                 TEXT NULL,
  status                  VARCHAR(32) NOT NULL DEFAULT 'pending',
  reviewed_by             VARCHAR(36) NULL,
  reviewed_at             DATETIME NULL,
  review_notes            TEXT NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_flags_status (status, created_at),
  INDEX idx_customer_flags_customer (customer_id, created_at),
  INDEX idx_customer_flags_inquiry (inquiry_id),
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);