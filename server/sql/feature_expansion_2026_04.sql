-- Feature Expansion Migration (April 2026)
-- Safe to run multiple times on MySQL 8+

USE TESdb;

CREATE TABLE IF NOT EXISTS customer_favorites (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  property_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_property_favorite (customer_id, property_id),
  INDEX idx_customer_favorites_customer (customer_id),
  INDEX idx_customer_favorites_property (property_id),
  CONSTRAINT fk_customer_favorites_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_customer_favorites_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_preferences (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  preferred_locations JSON DEFAULT NULL,
  property_types JSON DEFAULT NULL,
  min_price DECIMAL(15,2) DEFAULT NULL,
  max_price DECIMAL(15,2) DEFAULT NULL,
  min_area DECIMAL(10,2) DEFAULT NULL,
  max_area DECIMAL(10,2) DEFAULT NULL,
  preferred_bedrooms INT DEFAULT NULL,
  preferred_bathrooms INT DEFAULT NULL,
  amenities JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_preferences_customer (customer_id),
  CONSTRAINT fk_customer_preferences_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS property_amenities (
  id VARCHAR(36) PRIMARY KEY,
  property_id VARCHAR(36) NOT NULL,
  amenity_name VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_property_amenity_name (property_id, amenity_name),
  INDEX idx_property_amenity_name (amenity_name),
  CONSTRAINT fk_property_amenities_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  user_role VARCHAR(32) NOT NULL,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id VARCHAR(36) DEFAULT NULL,
  related_type VARCHAR(80) DEFAULT NULL,
  read_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user (user_id, user_role, created_at),
  INDEX idx_notifications_unread (user_id, user_role, read_at)
);

CREATE TABLE IF NOT EXISTS property_documents (
  id VARCHAR(36) PRIMARY KEY,
  property_id VARCHAR(36) NOT NULL,
  document_type VARCHAR(80) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_by VARCHAR(36) DEFAULT NULL,
  uploaded_by_name VARCHAR(255) DEFAULT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME DEFAULT NULL,
  INDEX idx_property_documents_property (property_id, uploaded_at),
  CONSTRAINT fk_property_documents_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commission_settings (
  id VARCHAR(36) PRIMARY KEY,
  default_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  updated_by VARCHAR(36) DEFAULT NULL,
  updated_by_name VARCHAR(255) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_licenses_history (
  id VARCHAR(36) PRIMARY KEY,
  agent_id VARCHAR(36) NOT NULL,
  license_number VARCHAR(120) NOT NULL,
  license_type VARCHAR(80) DEFAULT NULL,
  issued_date DATE DEFAULT NULL,
  expiry_date DATE DEFAULT NULL,
  status VARCHAR(32) NOT NULL,
  verified_by VARCHAR(36) DEFAULT NULL,
  verified_at DATETIME DEFAULT NULL,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_agent_license_history_agent (agent_id, created_at)
);

INSERT INTO commission_settings (id, default_rate, updated_at)
SELECT 'default-commission-setting', 5.00, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM commission_settings WHERE id = 'default-commission-setting'
);
