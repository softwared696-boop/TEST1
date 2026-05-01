import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { FiSearch, FiFilter, FiEye } from 'react-icons/fi';

const GateLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
  const [filters, setFilters] = useState({
    entryType: '',
    gateNumber: '',
    startDate: '',
    endDate: '',
    inspectionStatus: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, [pagination.currentPage, filters]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: 10,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const response = await apiService.gate.getLogs(params);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const getInspectionBadgeClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'badge-success';
      case 'DENIED': return 'badge-danger';
      case 'INSPECTED': return 'badge-info';
      default: return 'badge-warning';
    }
  };

  const getEntryTypeColor = (type) => {
    return type === 'ENTRY' ? '#4caf50' : '#ff9800';
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Gate Logs
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>View and manage all gate entry/exit records</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label">Entry Type</label>
            <select name="entryType" value={filters.entryType} onChange={handleFilterChange} className="form-input">
              <option value="">All Types</option>
              <option value="ENTRY">Entry</option>
              <option value="EXIT">Exit</option>
            </select>
          </div>

          <div>
            <label className="form-label">Gate Number</label>
            <select name="gateNumber" value={filters.gateNumber} onChange={handleFilterChange} className="form-input">
              <option value="">All Gates</option>
              <option value="Gate A">Gate A</option>
              <option value="Gate B">Gate B</option>
              <option value="Gate C">Gate C</option>
              <option value="Gate D">Gate D</option>
            </select>
          </div>

          <div>
            <label className="form-label">Start Date</label>
            <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="form-input" />
          </div>

          <div>
            <label className="form-label">End Date</label>
            <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="form-input" />
          </div>

          <div>
            <label className="form-label">Inspection Status</label>
            <select name="inspectionStatus" value={filters.inspectionStatus} onChange={handleFilterChange} className="form-input">
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DENIED">Denied</option>
              <option value="INSPECTED">Inspected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Person</th>
                <th>Gate</th>
                <th>Purpose</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="spinner"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.id}</td>
                    <td>
                      <span style={{ 
                        color: getEntryTypeColor(log.entry_type),
                        fontWeight: '600',
                        fontSize: '13px'
                      }}>
                        {log.entry_type}
                      </span>
                    </td>
                    <td>
                      {log.user_first_name || log.visitor_first_name 
                        ? `${log.user_first_name || log.visitor_first_name} ${log.user_last_name || log.visitor_last_name}`
                        : 'Unknown'}
                    </td>
                    <td>{log.gate_number}</td>
                    <td>{log.purpose || '-'}</td>
                    <td>{new Date(log.log_time).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${getInspectionBadgeClass(log.inspection_status)}`}>
                        {log.inspection_status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" title="View Details">
                        <FiEye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && logs.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of {pagination.totalRecords} entries
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage - 1 })}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setPagination({ ...pagination, currentPage: pagination.currentPage + 1 })}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GateLogs;
