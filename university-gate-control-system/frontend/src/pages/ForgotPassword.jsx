import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { FiMail, FiCheck, FiAlertCircle } from 'react-icons/fi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await apiService.auth.forgotPassword(email);
      setMessage(response.data.message);
      
      // In development, show reset token
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
        setShowResetForm(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await apiService.auth.resetPassword(resetToken, newPassword);
      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            borderRadius: '16px',
            backgroundColor: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FiMail size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Forgot Password?
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            No worries, we'll send you reset instructions
          </p>
        </div>

        {message && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid var(--success-color)',
            borderRadius: '6px',
            color: 'var(--success-color)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FiCheck size={18} />
            {message}
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid var(--danger-color)',
            borderRadius: '6px',
            color: 'var(--danger-color)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FiAlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Request Reset Form */}
        {!showResetForm ? (
          <form onSubmit={handleRequestReset}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          /* Reset Password Form (shown in development with token) */
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">Reset Token</label>
              <input
                type="text"
                value={resetToken}
                readOnly
                className="form-input"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                placeholder="New password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          Remember your password?{' '}
          <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '500' }}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
