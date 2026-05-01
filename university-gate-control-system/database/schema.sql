-- University Gate Control System Database Schema
-- Production-ready normalized schema with proper indexing and relationships

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS incident_reports;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS gate_logs;
DROP TABLE IF EXISTS visitor_passes;
DROP TABLE IF EXISTS visitors;
DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    student_id VARCHAR(50) UNIQUE,
    staff_id VARCHAR(50) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_student_id (student_id),
    INDEX idx_staff_id (staff_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roles table
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table
CREATE TABLE permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User-Roles junction table
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_by INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Role-Permissions junction table
CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    granted_by INT,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- GATE CONTROL MODULE
-- ============================================

-- Gate logs table (entry/exit records)
CREATE TABLE gate_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    visitor_id INT,
    entry_type ENUM('ENTRY', 'EXIT') NOT NULL,
    gate_number VARCHAR(20) NOT NULL,
    logged_by INT NOT NULL,
    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    purpose TEXT,
    vehicle_number VARCHAR(20),
    inspection_status ENUM('PENDING', 'APPROVED', 'DENIED', 'INSPECTED') DEFAULT 'PENDING',
    inspection_notes TEXT,
    qr_code VARCHAR(255),
    photo_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE SET NULL,
    FOREIGN KEY (logged_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_log_time (log_time),
    INDEX idx_entry_type (entry_type),
    INDEX idx_gate_number (gate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VISITORS MODULE
-- ============================================

-- Visitors table
CREATE TABLE visitors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(100),
    organization VARCHAR(200),
    visiting_purpose TEXT,
    host_user_id INT,
    expected_arrival DATETIME,
    expected_departure DATETIME,
    actual_arrival DATETIME,
    actual_departure DATETIME,
    status ENUM('REGISTERED', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED', 'BLACKLISTED') DEFAULT 'REGISTERED',
    blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    registered_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_host_user_id (host_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Visitor passes table
CREATE TABLE visitor_passes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    visitor_id INT NOT NULL,
    pass_code VARCHAR(100) UNIQUE NOT NULL,
    qr_code_data TEXT,
    valid_from DATETIME NOT NULL,
    valid_until DATETIME NOT NULL,
    max_entries INT DEFAULT 1,
    entries_used INT DEFAULT 0,
    status ENUM('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
    issued_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_pass_code (pass_code),
    INDEX idx_visitor_id (visitor_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- MATERIALS TRACKING MODULE
-- ============================================

-- Materials table
CREATE TABLE materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gate_log_id INT NOT NULL,
    material_name VARCHAR(200) NOT NULL,
    material_type ENUM('EQUIPMENT', 'DOCUMENT', 'PERSONAL', 'OFFICE_SUPPLIES', 'OTHER') NOT NULL,
    quantity INT DEFAULT 1,
    serial_number VARCHAR(100),
    value DECIMAL(10, 2),
    direction ENUM('IN', 'OUT') NOT NULL,
    description TEXT,
    approval_required BOOLEAN DEFAULT FALSE,
    approved_by INT,
    approval_status ENUM('PENDING', 'APPROVED', 'DENIED') DEFAULT 'PENDING',
    recorded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gate_log_id) REFERENCES gate_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_gate_log_id (gate_log_id),
    INDEX idx_material_type (material_type),
    INDEX idx_direction (direction),
    INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INCIDENT SYSTEM MODULE
-- ============================================

-- Incident reports table
CREATE TABLE incident_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    incident_type ENUM('SECURITY_BREACH', 'UNAUTHORIZED_ENTRY', 'MATERIAL_VIOLATION', 'VISITOR_ISSUE', 'EQUIPMENT_DAMAGE', 'OTHER') NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(200),
    gate_number VARCHAR(20),
    related_user_id INT,
    related_visitor_id INT,
    related_gate_log_id INT,
    reported_by INT NOT NULL,
    assigned_to INT,
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
    resolution_notes TEXT,
    resolved_by INT,
    resolved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (related_visitor_id) REFERENCES visitors(id) ON DELETE SET NULL,
    FOREIGN KEY (related_gate_log_id) REFERENCES gate_logs(id) ON DELETE SET NULL,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_incident_type (incident_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_assigned_to (assigned_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- AUDIT LOGS MODULE
-- ============================================

-- Audit logs table
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('MAIN_ADMIN', 'Full system control and configuration'),
('ADMIN', 'Administrative access with user and log management'),
('GATE_OFFICER', 'Gate control operations including scan and entry management'),
('STUDENT', 'Student access with view-only permissions'),
('STAFF', 'Staff access with equipment permissions'),
('VISITOR_OFFICER', 'Visitor registration and pass management');

-- Insert default permissions
INSERT INTO permissions (name, description, module) VALUES
-- Gate Control Permissions
('gate_scan', 'Scan ID/QR codes', 'GATE_CONTROL'),
('gate_entry_allow', 'Allow entry', 'GATE_CONTROL'),
('gate_entry_deny', 'Deny entry', 'GATE_CONTROL'),
('gate_exit_record', 'Record exit', 'GATE_CONTROL'),
('gate_log_view', 'View gate logs', 'GATE_CONTROL'),
('gate_inspection', 'Perform inspections', 'GATE_CONTROL'),

-- User Management Permissions
('user_create', 'Create new users', 'USER_MANAGEMENT'),
('user_read', 'View user details', 'USER_MANAGEMENT'),
('user_update', 'Update user information', 'USER_MANAGEMENT'),
('user_delete', 'Delete users', 'USER_MANAGEMENT'),
('user_role_assign', 'Assign roles to users', 'USER_MANAGEMENT'),

-- Visitor Management Permissions
('visitor_register', 'Register new visitors', 'VISITOR_MANAGEMENT'),
('visitor_read', 'View visitor details', 'VISITOR_MANAGEMENT'),
('visitor_update', 'Update visitor information', 'VISITOR_MANAGEMENT'),
('visitor_pass_generate', 'Generate visitor passes', 'VISITOR_MANAGEMENT'),
('visitor_blacklist', 'Blacklist visitors', 'VISITOR_MANAGEMENT'),

-- Materials Tracking Permissions
('material_record', 'Record materials', 'MATERIALS_TRACKING'),
('material_view', 'View material logs', 'MATERIALS_TRACKING'),
('material_approve', 'Approve material requests', 'MATERIALS_TRACKING'),

-- Incident System Permissions
('incident_report', 'Report incidents', 'INCIDENT_SYSTEM'),
('incident_view', 'View incidents', 'INCIDENT_SYSTEM'),
('incident_update', 'Update incident status', 'INCIDENT_SYSTEM'),
('incident_resolve', 'Resolve incidents', 'INCIDENT_SYSTEM'),

-- Reports & Analytics Permissions
('report_view', 'View reports', 'REPORTS_ANALYTICS'),
('report_export', 'Export reports', 'REPORTS_ANALYTICS'),
('analytics_view', 'View analytics dashboard', 'REPORTS_ANALYTICS'),

-- System Administration Permissions
('system_config', 'Configure system settings', 'SYSTEM_ADMIN'),
('audit_log_view', 'View audit logs', 'SYSTEM_ADMIN'),
('permission_manage', 'Manage permissions', 'SYSTEM_ADMIN');

-- Assign permissions to MAIN_ADMIN role (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'MAIN_ADMIN';

-- Assign permissions to ADMIN role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'ADMIN' AND p.module IN ('USER_MANAGEMENT', 'GATE_CONTROL', 'VISITOR_MANAGEMENT', 'MATERIALS_TRACKING', 'INCIDENT_SYSTEM', 'REPORTS_ANALYTICS');

-- Assign permissions to GATE_OFFICER role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'GATE_OFFICER' AND p.name IN ('gate_scan', 'gate_entry_allow', 'gate_entry_deny', 'gate_exit_record', 'gate_log_view', 'gate_inspection', 'incident_report', 'material_record');

-- Assign permissions to STUDENT role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'STUDENT' AND p.name IN ('gate_log_view');

-- Assign permissions to STAFF role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'STAFF' AND p.name IN ('gate_log_view', 'material_record', 'material_view');

-- Assign permissions to VISITOR_OFFICER role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p 
WHERE r.name = 'VISITOR_OFFICER' AND p.name IN ('visitor_register', 'visitor_read', 'visitor_update', 'visitor_pass_generate', 'visitor_blacklist', 'gate_log_view');

-- Insert default Main Admin user
-- Password: Admin@123 (hashed with bcrypt)
INSERT INTO users (email, password_hash, first_name, last_name, phone, department, is_active, email_verified) VALUES
('admin@university.edu', '$2b$10$rQZ9vXJxL5K5J5K5J5K5JeYhQGYhQGYhQGYhQGYhQGYhQGYhQGYhQ', 'System', 'Administrator', '+1234567890', 'Administration', TRUE, TRUE);

-- Assign MAIN_ADMIN role to the default admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email = 'admin@university.edu' AND r.name = 'MAIN_ADMIN';
