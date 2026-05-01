import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { FiTrendingUp, FiUsers, FiGate, FiAlertTriangle, FiActivity } from 'react-icons/fi';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        apiService.gate.getTodayStats(),
        apiService.gate.getRecentActivity(5)
      ]);
      
      setStats(statsRes.data.data);
      setRecentActivity(activityRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Entries Today',
      value: stats?.total_entries || 0,
      icon: FiTrendingUp,
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)'
    },
    {
      title: 'Entries',
      value: stats?.entries || 0,
      icon: FiGate,
      color: '#2196f3',
      bgColor: 'rgba(33, 150, 243, 0.1)'
    },
    {
      title: 'Exits',
      value: stats?.exits || 0,
      icon: FiActivity,
      color: '#ff9800',
      bgColor: 'rgba(255, 152, 0, 0.1)'
    },
    {
      title: 'Visitors',
      value: stats?.visitors || 0,
      icon: FiUsers,
      color: '#9c27b0',
      bgColor: 'rgba(156, 39, 176, 0.1)'
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome to the University Gate Control System</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {statCards.map((stat, index) => (
          <div key={index} className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {stat.title}
                </p>
                <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                  {stat.value}
                </p>
              </div>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: stat.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <stat.icon size={28} color={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Activity</h2>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
            {recentActivity.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>
                No recent activity
              </p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: activity.entry_type === 'ENTRY' 
                      ? 'rgba(76, 175, 80, 0.1)' 
                      : 'rgba(255, 152, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiGate 
                      size={20} 
                      color={activity.entry_type === 'ENTRY' ? '#4caf50' : '#ff9800'} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                      {activity.person_name || 'Unknown'}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {activity.entry_type} at Gate {activity.gate_number}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(activity.log_time).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quick Actions</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a href="/gate-control" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
              <FiGate size={20} />
              Record Entry/Exit
            </a>
            <a href="/gate-logs" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              <FiActivity size={20} />
              View All Logs
            </a>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>
              <FiAlertTriangle size={20} />
              Report Incident
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
