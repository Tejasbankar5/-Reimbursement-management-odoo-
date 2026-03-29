import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Shared login logic component
function LoginForm({ isAdmin }: { isAdmin: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const user = res.data.user;
      // Role guard
      if (isAdmin && user.role !== 'ADMIN') {
        setError('This portal is for Admins only. Use the Employee/Manager login instead.');
        setLoading(false); return;
      }
      if (!isAdmin && user.role === 'ADMIN') {
        setError('Admins must use the Admin Portal. Use the link below.');
        setLoading(false); return;
      }
      login(res.data.token, user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleLogin}>
      {error && (
        <div style={{
          background: 'var(--danger-light)', color: 'var(--danger)',
          padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.25rem',
          fontSize: '0.875rem', fontWeight: 500
        }}>
          {error}
        </div>
      )}
      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
        Email Address
      </label>
      <input type="email" placeholder="you@company.com" className="glass-input"
        value={email} onChange={e => setEmail(e.target.value)} required />

      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
        Password
      </label>
      <input type="password" placeholder="••••••••" className="glass-input"
        value={password} onChange={e => setPassword(e.target.value)} required />

      <button type="submit" disabled={loading} className="glass-button" style={{
        marginTop: '0.5rem',
        background: isAdmin ? 'linear-gradient(135deg, #1e40af, #3730a3)' : 'var(--primary)'
      }}>
        {loading ? 'Signing in...' : `Sign In${isAdmin ? ' as Admin' : ''}`}
      </button>
    </form>
  );
}

// ── Admin Login Page ──────────────────────────────────────────────────────────
export function AdminLogin() {
  const navigate = useNavigate();
  return (
    <div className="auth-container">
      {/* Left panel */}
      <div className="auth-left" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #1e40af 100%)' }}>
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '3rem' }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>R</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>ReimburseIQ</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
            Director &<br />Admin Portal
          </h2>
          <p style={{ opacity: 0.8, lineHeight: 1.7, fontSize: '0.95rem' }}>
            Manage your organisation's expense approvals, configure workflows, and oversee the full reimbursement pipeline.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {['Final approval authority over all claims', 'Full analytics and audit trail', 'User & role management', 'Workflow configuration'].map(f => (
            <div key={f} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.88rem' }}>
              <div style={{ width: 20, height: 20, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0 }}>✓</div>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-box">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.08)', padding: '0.3rem 0.8rem', borderRadius: 999, marginBottom: '1rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>ADMIN PORTAL</span>
            </div>
            <h1 className="auth-title">Welcome back, Director</h1>
            <p className="auth-subtitle">Sign in with your administrator credentials</p>
          </div>
          <LoginForm isAdmin={true} />
          <p style={{ textAlign: 'center', marginTop: '1.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Not an admin?{' '}
            <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login/user')}>
              Employee / Manager Login →
            </span>
          </p>
          <p style={{ textAlign: 'center', marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('/')}>
              ← Back to Home
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── User (Employee / Manager) Login Page ──────────────────────────────────────
export function UserLogin() {
  const navigate = useNavigate();
  return (
    <div className="auth-container">
      {/* Left panel */}
      <div className="auth-left" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #0369a1 100%)' }}>
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '3rem' }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>R</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>ReimburseIQ</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
            Employee &<br />Manager Portal
          </h2>
          <p style={{ opacity: 0.8, lineHeight: 1.7, fontSize: '0.95rem' }}>
            Submit your expense claims, track approval status in real time, and manage your team's reimbursement requests.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {['Submit expense claims in any currency', 'Visual approval timeline per expense', 'Manager approval dashboard', 'Real-time status updates'].map(f => (
            <div key={f} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.88rem' }}>
              <div style={{ width: 20, height: 20, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0 }}>✓</div>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-box">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.08)', padding: '0.3rem 0.8rem', borderRadius: 999, marginBottom: '1rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0369a1' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', letterSpacing: '0.05em' }}>EMPLOYEE / MANAGER PORTAL</span>
            </div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to manage your expense claims</p>
          </div>
          <LoginForm isAdmin={false} />
          <p style={{ textAlign: 'center', marginTop: '1.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Are you an Admin?{' '}
            <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login/admin')}>
              Admin Portal →
            </span>
          </p>
          <p style={{ textAlign: 'center', marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('/')}>
              ← Back to Home
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
