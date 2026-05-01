import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { FiUser, FiMail, FiPhone, FiBuilding, FiShield, FiKey } from 'react-icons/fi';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await apiService.auth.getProfile();
      setProfile(response.data.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      await apiService.auth.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const infoItems = [
    { icon: FiUser, label: 'Full Name', value: `${profile?.firstName} ${profile?.lastName}` },
    { icon: FiMail, label: 'Email', value: profile?.email },
    { icon: FiPhone, label: 'Phone', value: profile?.phone || 'Not provided' },
    { icon: FiBuilding, label: 'Department', value: profile?.department || 'Not assigned' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
          My Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>View and manage your account information</p>
      </div>

      {message.text && (
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          backgroundColor: message.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}`,
          color: message.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'
        }}>
          {message.text}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {/* Profile Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Profile Information</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold'
            }}>
              {profile?.firstName?.[0]}{profile?.lastName?.[0]}
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {profile?.firstName} {profile?.lastName}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {profile?.roles?.map(r => r.name).join(', ') || 'User'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {infoItems.map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px'
              }}>
                <item.icon size={20} color="var(--text-secondary)" />
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</p>
                  <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Account Status
            </h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span className={`badge ${profile?.isActive ? 'badge-success' : 'badge-danger'}`}>
                {profile?.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className={`badge ${profile?.emailVerified ? 'badge-success' : 'badge-warning'}`}>
                {profile?.emailVerified ? 'Email Verified' : 'Email Not Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Roles & Permissions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Roles & Permissions</h2>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiShield size={18} />
              Your Roles
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile?.roles?.map((role, index) => (
                <span key={index} className="badge badge-info">
                  {role.name}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiKey size={18} />
              Permissions ({profile?.permissions?.length || 0})
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile?.permissions?.slice(0, 10).map((perm, index) => (
                <span key={index} className="badge badge-success">
                  {perm.name}
                </span>
              ))}
              {(profile?.permissions?.length || 0) > 10 && (
                <span className="badge badge-secondary">+{profile.permissions.length - 10} more</span>
              )}
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h2 className="card-title">Security</h2>
            <button 
              className="btn btn-sm btn-outline"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordChange && (
            <form onSubmit={handlePasswordChange} style={{ maxWidth: '500px' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="form-input"
                    minLength={8}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
