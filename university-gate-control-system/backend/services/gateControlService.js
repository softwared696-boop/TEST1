const { query, transaction } = require('../config/database');

class GateControlService {
  // Record entry/exit
  async recordGateLog(logData, userId) {
    const {
      entryType,
      gateNumber,
      purpose,
      vehicleNumber,
      inspectionStatus,
      inspectionNotes,
      qrCode,
      photoUrl,
      studentId,
      staffId,
      visitorId
    } = logData;

    return await transaction(async (connection) => {
      let actualUserId = null;
      let actualVisitorId = visitorId || null;

      // Find user by studentId or staffId if provided
      if (studentId || staffId) {
        const users = await connection.execute(
          'SELECT id FROM users WHERE (student_id = ? OR staff_id = ?) AND is_active = TRUE',
          [studentId || null, staffId || null]
        );
        if (users[0].length > 0) {
          actualUserId = users[0][0].id;
        }
      }

      // Insert gate log
      const result = await connection.execute(
        `INSERT INTO gate_logs 
         (user_id, visitor_id, entry_type, gate_number, logged_by, purpose, vehicle_number, 
          inspection_status, inspection_notes, qr_code, photo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [actualUserId, actualVisitorId, entryType, gateNumber, userId, purpose, vehicleNumber,
         inspectionStatus || 'PENDING', inspectionNotes, qrCode, photoUrl]
      );

      const logId = result[0].insertId;

      // If this is a visitor check-in, update visitor status
      if (actualVisitorId && entryType === 'ENTRY') {
        await connection.execute(
          'UPDATE visitors SET status = ?, actual_arrival = NOW() WHERE id = ?',
          ['CHECKED_IN', actualVisitorId]
        );
      }

      // If this is a visitor check-out, update visitor status
      if (actualVisitorId && entryType === 'EXIT') {
        await connection.execute(
          'UPDATE visitors SET status = ?, actual_departure = NOW() WHERE id = ?',
          ['CHECKED_OUT', actualVisitorId]
        );
      }

      // Log audit
      await connection.execute(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address)
         VALUES (?, 'GATE_LOG_CREATED', 'gate_logs', ?, NULL)`,
        [userId, logId]
      );

      return {
        logId,
        message: `${entryType} recorded successfully`
      };
    });
  }

  // Get gate logs with filters
  async getGateLogs(filters = {}, page = 1, limit = 20) {
    const {
      entryType,
      gateNumber,
      startDate,
      endDate,
      inspectionStatus,
      userId,
      visitorId
    } = filters;

    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (entryType) {
      whereClause += ' AND gl.entry_type = ?';
      params.push(entryType);
    }

    if (gateNumber) {
      whereClause += ' AND gl.gate_number = ?';
      params.push(gateNumber);
    }

    if (startDate) {
      whereClause += ' AND gl.log_time >= ?';
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND gl.log_time <= ?';
      params.push(endDate);
    }

    if (inspectionStatus) {
      whereClause += ' AND gl.inspection_status = ?';
      params.push(inspectionStatus);
    }

    if (userId) {
      whereClause += ' AND gl.user_id = ?';
      params.push(userId);
    }

    if (visitorId) {
      whereClause += ' AND gl.visitor_id = ?';
      params.push(visitorId);
    }

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM gate_logs gl ${whereClause}`,
      params
    );

    const total = countResult[0].total;

    // Get logs with related data
    const logs = await query(
      `SELECT gl.id, gl.entry_type, gl.gate_number, gl.log_time, gl.purpose,
              gl.vehicle_number, gl.inspection_status, gl.inspection_notes,
              gl.qr_code, gl.photo_url,
              u.first_name as user_first_name, u.last_name as user_last_name,
              u.student_id, u.staff_id,
              v.first_name as visitor_first_name, v.last_name as visitor_last_name,
              v.phone as visitor_phone,
              lu.first_name as logged_by_first_name, lu.last_name as logged_by_last_name
       FROM gate_logs gl
       LEFT JOIN users u ON gl.user_id = u.id
       LEFT JOIN visitors v ON gl.visitor_id = v.id
       LEFT JOIN users lu ON gl.logged_by = lu.id
       ${whereClause}
       ORDER BY gl.log_time DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit
      }
    };
  }

  // Get single gate log
  async getGateLogById(logId) {
    const logs = await query(
      `SELECT gl.*, 
              u.first_name as user_first_name, u.last_name as user_last_name,
              u.student_id, u.staff_id, u.email as user_email,
              v.first_name as visitor_first_name, v.last_name as visitor_last_name,
              v.phone as visitor_phone, v.email as visitor_email,
              lu.first_name as logged_by_first_name, lu.last_name as logged_by_last_name
       FROM gate_logs gl
       LEFT JOIN users u ON gl.user_id = u.id
       LEFT JOIN visitors v ON gl.visitor_id = v.id
       LEFT JOIN users lu ON gl.logged_by = lu.id
       WHERE gl.id = ?`,
      [logId]
    );

    if (!logs || logs.length === 0) {
      throw new Error('Gate log not found');
    }

    // Get associated materials
    const materials = await query(
      'SELECT * FROM materials WHERE gate_log_id = ?',
      [logId]
    );

    return {
      ...logs[0],
      materials
    };
  }

  // Update inspection status
  async updateInspectionStatus(logId, status, notes, userId) {
    const validStatuses = ['PENDING', 'APPROVED', 'DENIED', 'INSPECTED'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid inspection status');
    }

    await query(
      'UPDATE gate_logs SET inspection_status = ?, inspection_notes = ? WHERE id = ?',
      [status, notes, logId]
    );

    // Log audit
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id)
       VALUES (?, 'INSPECTION_STATUS_UPDATED', 'gate_logs', ?)`,
      [userId, logId]
    );

    return { message: 'Inspection status updated successfully' };
  }

  // Get today's statistics
  async getTodayStats(gateNumber = null) {
    let whereClause = 'WHERE DATE(log_time) = CURDATE()';
    const params = [];

    if (gateNumber) {
      whereClause += ' AND gate_number = ?';
      params.push(gateNumber);
    }

    const stats = await query(
      `SELECT 
         COUNT(*) as total_entries,
         SUM(CASE WHEN entry_type = 'ENTRY' THEN 1 ELSE 0 END) as entries,
         SUM(CASE WHEN entry_type = 'EXIT' THEN 1 ELSE 0 END) as exits,
         SUM(CASE WHEN inspection_status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
         SUM(CASE WHEN inspection_status = 'DENIED' THEN 1 ELSE 0 END) as denied,
         SUM(CASE WHEN visitor_id IS NOT NULL THEN 1 ELSE 0 END) as visitors
       FROM gate_logs ${whereClause}`,
      params
    );

    return stats[0];
  }

  // Get recent activity
  async getRecentActivity(limit = 10) {
    const activities = await query(
      `SELECT gl.id, gl.entry_type, gl.gate_number, gl.log_time, gl.inspection_status,
              COALESCE(CONCAT(u.first_name, ' ', u.last_name), 
                       CONCAT(v.first_name, ' ', v.last_name)) as person_name,
              gl.purpose
       FROM gate_logs gl
       LEFT JOIN users u ON gl.user_id = u.id
       LEFT JOIN visitors v ON gl.visitor_id = v.id
       ORDER BY gl.log_time DESC
       LIMIT ?`,
      [limit]
    );

    return activities;
  }
}

module.exports = new GateControlService();
