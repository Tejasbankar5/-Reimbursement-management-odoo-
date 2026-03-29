import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { UserPlus } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/signup', { 
        name, email, password, companyName, country 
      });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <h1 className="auth-title">Create Workspace</h1>
        <p className="auth-subtitle">Get started with a new company account</p>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleSignup}>
          <input type="text" placeholder="Your Name" className="glass-input" value={name} onChange={e => setName(e.target.value)} required />
          <input type="email" placeholder="Email Address" className="glass-input" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="glass-input" value={password} onChange={e => setPassword(e.target.value)} required />
          <input type="text" placeholder="Company Name" className="glass-input" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
          <input type="text" placeholder="Country (e.g. United States)" className="glass-input" value={country} onChange={e => setCountry(e.target.value)} required />
          
          <button type="submit" className="glass-button">
            <UserPlus size={20} />
            Create Workspace
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
