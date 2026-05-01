const { query, transaction } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class AuthService {
  // Register new user
  async register(userData) {
    const { email, password, firstName, lastName, phone, department, studentId, staffId } = userData;

    return await transaction(async (connection) => {
      // Check if email already exists
      const existingUsers = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers[0].length > 0) {
        throw new Error('Email already registered');
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate verification token
      const verificationToken = uuidv4();

      // Insert user
      const result = await connection.execute(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, department, student_id, staff_id, verification_token)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [email, passwordHash, firstName, lastName, phone, department, studentId, staffId, verificationToken]
      );

      const userId = result[0].insertId;

      // Assign default role (STUDENT or STAFF based on studentId/staffId)
      let roleName = 'STUDENT';
      if (staffId) {
        roleName = 'STAFF';
      }

      const roles = await connection.execute(
        'SELECT id FROM roles WHERE name = ?',
        [roleName]
      );

      if (roles[0].length > 0) {
        await connection.execute(
          'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
          [userId, roles[0][0].id]
        );
      }

      // Log audit
      await connection.execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
         VALUES (?, 'USER_REGISTERED', 'users', ?, NULL)`,
        [userId, userId]
      );

      return {
        userId,
        verificationToken,
        message: 'Registration successful. Please verify your email.'
      };
    });
  }

  // Login user
  async login(email, password) {
    // Find user
    const users = await query(
      'SELECT id, email, password_hash, first_name, last_name, is_active, email_verified FROM users WHERE email = ?',
      [email]
    );

    if (!users || users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated. Please contact administrator.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Get user roles
    const roles = await query(
      `SELECT r.name FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [user.id]
    );

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      roles: roles.map(r => r.name)
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '24h'
    });

    // Generate refresh token
    const refreshToken = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
       VALUES (?, 'USER_LOGIN', 'users', ?, NULL)`,
      [user.id, user.id]
    );

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: roles.map(r => r.name),
        emailVerified: user.email_verified
      }
    };
  }

  // Logout user (could add token blacklist logic here)
  async logout(userId) {
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'USER_LOGOUT', 'users', ?)`,
      [userId, userId]
    );

    return { message: 'Logout successful' };
  }

  // Forgot password - generate reset token
  async forgotPassword(email) {
    const users = await query(
      'SELECT id, email, first_name FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (!users || users.length === 0) {
      // Don't reveal if email exists for security
      return { message: 'If the email exists, a reset link will be sent.' };
    }

    const user = users[0];
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, user.id]
    );

    // In production, send email with reset token
    // For now, return the token (should only be done in development)
    return {
      message: 'Password reset token generated.',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    };
  }

  // Reset password
  async resetPassword(resetToken, newPassword) {
    const users = await query(
      'SELECT id FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
      [resetToken]
    );

    if (!users || users.length === 0) {
      throw new Error('Invalid or expired reset token');
    }

    const userId = users[0].id;

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [passwordHash, userId]
    );

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'PASSWORD_RESET', 'users', ?)`,
      [userId, userId]
    );

    return { message: 'Password reset successful' };
  }

  // Change password (for logged-in users)
  async changePassword(userId, currentPassword, newPassword) {
    const users = await query(
      'SELECT password_hash FROM users WHERE id = ?',
      [userId]
    );

    if (!users || users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'PASSWORD_CHANGED', 'users', ?)`,
      [userId, userId]
    );

    return { message: 'Password changed successfully' };
  }

  // Get current user profile
  async getProfile(userId) {
    const users = await query(
      `SELECT id, email, first_name, last_name, phone, department, student_id, staff_id, 
              is_active, email_verified, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!users || users.length === 0) {
      throw new Error('User not found');
    }

    const user = users[0];

    // Get roles
    const roles = await query(
      `SELECT r.id, r.name, r.description
       FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );

    // Get permissions
    const permissions = await query(
      `SELECT DISTINCT p.name, p.module
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      department: user.department,
      studentId: user.student_id,
      staffId: user.staff_id,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      createdAt: user.created_at,
      roles: roles,
      permissions: permissions
    };
  }

  // Verify email
  async verifyEmail(token) {
    const users = await query(
      'SELECT id FROM users WHERE verification_token = ? AND email_verified = FALSE',
      [token]
    );

    if (!users || users.length === 0) {
      throw new Error('Invalid or expired verification token');
    }

    const userId = users[0].id;

    await query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = ?',
      [userId]
    );

    return { message: 'Email verified successfully' };
  }
}

module.exports = new AuthService();
