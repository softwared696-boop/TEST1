const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const users = await query(
      'SELECT id, email, first_name, last_name, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.id]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive.'
      });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      firstName: users[0].first_name,
      lastName: users[0].last_name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

// Check if user has specific permission
exports.hasPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const permissions = await query(
        `SELECT DISTINCT p.name 
         FROM permissions p
         INNER JOIN role_permissions rp ON p.id = rp.permission_id
         INNER JOIN user_roles ur ON rp.role_id = ur.role_id
         WHERE ur.user_id = ?`,
        [req.user.id]
      );

      const userPermissions = permissions.map(p => p.name);
      
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required: ${permission}`
        });
      }

      req.permission = permission;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions.'
      });
    }
  };
};

// Check if user has any of the specified roles
exports.hasRole = (roles) => {
  return async (req, res, next) => {
    try {
      const userRoles = await query(
        `SELECT r.name 
         FROM roles r
         INNER JOIN user_roles ur ON r.id = ur.role_id
         WHERE ur.user_id = ?`,
        [req.user.id]
      );

      const roleNames = userRoles.map(r => r.name);
      
      const hasRequiredRole = roles.some(role => roleNames.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${roles.join(', ')}`
        });
      }

      req.userRoles = roleNames;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking roles.'
      });
    }
  };
};

// Get all user permissions
exports.getUserPermissions = async (userId) => {
  try {
    const permissions = await query(
      `SELECT DISTINCT p.name, p.module
       FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return permissions;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
};

// Get all user roles
exports.getUserRoles = async (userId) => {
  try {
    const roles = await query(
      `SELECT r.id, r.name, r.description
       FROM roles r
       INNER JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return roles;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
};
