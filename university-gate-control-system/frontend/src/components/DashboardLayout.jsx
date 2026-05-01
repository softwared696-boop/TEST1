import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Icons
import { 
  FiHome, FiGate, FiList, FiUsers, FiUser, FiSettings, 
  FiLogOut, FiMenu, FiX, FiSun, FiMoon, FiShield, FiAlertTriangle 
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user, hasRole } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome, roles: null },
    { path: '/gate-control', label: 'Gate Control', icon: FiGate, roles: ['GATE_OFFICER', 'ADMIN', 'MAIN_ADMIN'] },
    { path: '/gate-logs', label: 'Gate Logs', icon: FiList, roles: null },
    { path: '/users', label: 'Users', icon: FiUsers, roles: ['ADMIN', 'MAIN_ADMIN'] },
    { path: '/visitors', label: 'Visitors', icon: FiUser, roles: ['VISITOR_OFFICER', 'ADMIN', 'MAIN_ADMIN'] },
    { path: '/incidents', label: 'Incidents', icon: FiAlertTriangle, roles: ['GATE_OFFICER', 'ADMIN', 'MAIN_ADMIN'] },
    { path: '/reports', label: 'Reports', icon: FiShield, roles: ['ADMIN', 'MAIN_ADMIN'] },
    { path: '/settings', label: 'Settings', icon: FiSettings, roles: ['MAIN_ADMIN'] }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => hasRole(role));
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        position: 'fixed',
        left: isOpen ? 0 : '-260px',
        top: 0,
        width: '260px',
        height: '100vh',
        backgroundColor: 'var(--bg-primary)',
        borderRight: '1px solid var(--border-color)',
        transition: 'left 0.3s ease',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FiGate size={28} color="var(--primary-color)" />
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Gate Control
              </h2>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>University System</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <FiX size={20} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <item.icon size={20} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {user?.roles?.[0] || 'User'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={onMenuClick}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '8px'
          }}
        >
          <FiMenu size={24} color="var(--text-primary)" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
          University Gate Control
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
        </button>

        {/* Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FiLogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <Header onMenuClick={() => setSidebarOpen(true)} />
      
      <main style={{
        marginLeft: '0',
        marginTop: '64px',
        padding: '24px',
        transition: 'margin-left 0.3s ease',
        minHeight: 'calc(100vh - 64px)'
      }}>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
