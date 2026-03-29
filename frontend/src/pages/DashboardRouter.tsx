import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, FileText, Settings, LogOut, ClipboardList, Receipt } from 'lucide-react';

import AdminDash from './AdminDash';
import ManagerDash from './ManagerDash';
import EmployeeDash from './EmployeeDash';

export default function DashboardRouter() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavItems = () => {
    if (user?.role === 'ADMIN') {
      return [
        { name: 'Overview',     path: '/dashboard',          icon: LayoutDashboard },
        { name: 'Users & Roles', path: '/dashboard/users',   icon: Users },
        { name: 'Workflows',    path: '/dashboard/workflows', icon: Settings },
        { name: 'All Claims',   path: '/dashboard/claims',   icon: ClipboardList },
      ];
    } else if (user?.role === 'MANAGER') {
      return [
        { name: 'My Approvals',  path: '/dashboard',              icon: FileText },
        { name: 'My Expenses',   path: '/dashboard/my-expenses',  icon: Receipt },
        { name: 'Team',          path: '/dashboard/team',         icon: Users },
      ];
    }
    return [
      { name: 'My Expenses', path: '/dashboard', icon: Receipt },
    ];
  };

  const roleLabel = user?.role === 'ADMIN' ? 'Director / Admin' 
                  : user?.role === 'MANAGER' ? 'Manager' : 'Employee';
  const roleColor = user?.role === 'ADMIN' ? '#7c3aed' 
                  : user?.role === 'MANAGER' ? 'var(--success)' : 'var(--primary)';

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)', letterSpacing: '-0.02em', fontSize: '1.25rem' }}>
          <div style={{ padding: '0.4rem', background: 'linear-gradient(135deg, var(--primary) 0%, #2563eb 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          Reimburse<span style={{ color: 'var(--primary)' }}>IQ</span>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1 }}>
          {getNavItems().map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={17} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ padding: '0.75rem 1rem', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>{user?.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: roleColor }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{roleLabel}</span>
            </div>
          </div>
          <div
            className="nav-item"
            style={{ cursor: 'pointer', color: 'var(--danger)' }}
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Sign Out
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          {user?.role === 'ADMIN' && (
            <>
              <Route path="/"          element={<AdminDash />} />
              <Route path="/users"     element={<AdminDash view="users" />} />
              <Route path="/workflows" element={<AdminDash view="workflows" />} />
              <Route path="/claims"    element={<AdminDash view="claims" />} />
            </>
          )}
          {user?.role === 'MANAGER' && (
            <>
              <Route path="/"            element={<ManagerDash view="approvals" />} />
              <Route path="/my-expenses" element={<EmployeeDash />} />
              <Route path="/team"        element={<ManagerDash view="team" />} />
            </>
          )}
          {user?.role === 'EMPLOYEE' && (
            <Route path="/" element={<EmployeeDash />} />
          )}
        </Routes>
      </main>
    </div>
  );
}
