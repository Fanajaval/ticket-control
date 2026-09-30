CREATE TABLE IF NOT EXISTS ticket_lists (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  prefix VARCHAR(20) NOT NULL,
  start_number BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_ticket_lists_prefix (prefix)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tickets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  ticket_list_id INT UNSIGNED NOT NULL,
  ticket_number VARCHAR(40) NOT NULL,
  numeric_number BIGINT UNSIGNED NOT NULL,
  status ENUM('PENDING', 'VALIDATED') NOT NULL DEFAULT 'PENDING',
  validated_at TIMESTAMP NULL DEFAULT NULL,
  validated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tickets_ticket_number (ticket_number),
  INDEX idx_tickets_ticket_list_id (ticket_list_id),
  INDEX idx_tickets_status (status),
  INDEX idx_tickets_numeric_number (numeric_number),
  CONSTRAINT fk_tickets_ticket_list
    FOREIGN KEY (ticket_list_id) REFERENCES ticket_lists (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;