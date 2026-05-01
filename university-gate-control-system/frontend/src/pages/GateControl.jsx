import React, { useState } from 'react';
import { apiService } from '../services/api';
import { FiGate, FiCheck, FiX } from 'react-icons/fi';

const GateControl = () => {
  const [formData, setFormData] = useState({
    entryType: 'ENTRY',
    gateNumber: 'Gate A',
    studentId: '',
    staffId: '',
    visitorId: '',
    purpose: '',
    vehicleNumber: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await apiService.gate.recordLog(formData);
      setMessage({ 
        type: 'success', 
        text: `${formData.entryType} recorded successfully!` 
      });
      
      // Reset form
      setFormData({
        entryType: 'ENTRY',
        gateNumber: 'Gate A',
        studentId: '',
        staffId: '',
        visitorId: '',
        purpose: '',
        vehicleNumber: ''
      });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to record entry/exit' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Gate Control
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Record and manage entry/exit at university gates</p>
      </div>

      {message.text && (
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          backgroundColor: message.type === 'success' 
            ? 'rgba(76, 175, 80, 0.1)' 
            : 'rgba(244, 67, 54, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}`,
          color: message.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {message.type === 'success' ? <FiCheck size={20} /> : <FiX size={20} />}
          {message.text}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {/* Entry/Exit Form */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Record Entry/Exit</h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Entry Type Toggle */}
            <div className="form-group">
              <label className="form-label">Entry Type</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, entryType: 'ENTRY' })}
                  className={`btn ${formData.entryType === 'ENTRY' ? 'btn-success' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  <FiCheck size={18} />
                  Entry
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, entryType: 'EXIT' })}
                  className={`btn ${formData.entryType === 'EXIT' ? 'btn-warning' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  <FiX size={18} />
                  Exit
                </button>
              </div>
            </div>

            {/* Gate Number */}
            <div className="form-group">
              <label className="form-label">Gate Number</label>
              <select
                name="gateNumber"
                value={formData.gateNumber}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="Gate A">Gate A - Main Entrance</option>
                <option value="Gate B">Gate B - North Side</option>
                <option value="Gate C">Gate C - South Side</option>
                <option value="Gate D">Gate D - Parking</option>
              </select>
            </div>

            {/* ID Input */}
            <div className="form-group">
              <label className="form-label">Student ID / Staff ID</label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter Student or Staff ID"
              />
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Or use Visitor section below for visitors
              </p>
            </div>

            {/* Purpose */}
            <div className="form-group">
              <label className="form-label">Purpose of Visit</label>
              <input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Attending class, Meeting, etc."
              />
            </div>

            {/* Vehicle Number */}
            <div className="form-group">
              <label className="form-label">Vehicle Number (Optional)</label>
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., ABC-1234"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Record ${formData.entryType}`}
            </button>
          </form>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Today's Summary</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Entries</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>--</span>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Entries In</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3' }}>--</span>
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(255, 152, 0, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Entries Out</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>--</span>
            </div>
          </div>

          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Quick Tips
            </h3>
            <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Verify ID before recording entry</li>
              <li>Check inspection status for materials</li>
              <li>Report any suspicious activity immediately</li>
              <li>Ensure all visitors are registered</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GateControl;
