import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Settings, Check, X, ShieldAlert, BarChart3 } from 'lucide-react';
import { StatCard, ShimmerButton, StaggerList, StaggerItem } from '../components/ui';

const API = 'http://localhost:5000';

type View = 'overview' | 'users' | 'workflows' | 'claims';

export default function AdminDash({ view = 'overview' }: { view?: View }) {
  const [users, setUsers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0 });
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [directorQueue, setDirectorQueue] = useState<any[]>([]);

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('EMPLOYEE');
  const [password, setPassword] = useState('');
  const [managerId, setManagerId] = useState('');

  const [workflowName, setWorkflowName] = useState('Manager → Director Approval');
  const [managerApproverSelected, setManagerApproverSelected] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchClaims();
    fetchDirectorQueue();
  }, [view]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/users/team`);
      const allUsers = (res as any).data || [];
      setUsers(allUsers);
      setManagers(allUsers.filter((u: any) => u.role === 'MANAGER'));
    } catch (err) { console.error(err); }
  };

  const fetchClaims = async () => {
    try {
      setLoadingClaims(true);
      const res = await axios.get(`${API}/api/admin/expenses`);
      setExpenses(res.data.expenses || []);
      setStats(res.data.stats || { total: 0, approved: 0, rejected: 0, pending: 0 });
    } catch (err) { console.error(err); }
    finally { setLoadingClaims(false); }
  };

  const fetchDirectorQueue = async () => {
    try {
      const res = await axios.get(`${API}/api/expenses`);
      const allExpenses: any[] = res.data || [];
      const queue = allExpenses.filter(exp =>
        exp.approvals?.some((a: any) => a.stepIndex === 1 && a.status === 'PENDING')
      );
      setDirectorQueue(queue);
    } catch (err) { console.error(err); }
  };

  const handleDirectorReview = async (approvalId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await axios.post(`${API}/api/approvals/${approvalId}/review`, {
        status,
        comments: status === 'APPROVED' ? 'Approved by Director' : 'Rejected by Director'
      });
      fetchDirectorQueue();
      fetchClaims();
    } catch (err: any) { alert(err.response?.data?.error || 'Review failed'); }
  };

  const handleOverride = async (expenseId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!window.confirm(`Force ${status} this expense?`)) return;
    try {
      await axios.post(`${API}/api/admin/expenses/${expenseId}/override`, {
        status, comments: `Admin override — ${status.toLowerCase()} manually`
      });
      fetchClaims();
    } catch (err: any) { alert(err.response?.data?.error || 'Override failed'); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) { alert('Password must be at least 6 characters'); return; }
    try {
      await axios.post(`${API}/api/admin/users`, {
        email, name, role, password,
        managerId: (role === 'EMPLOYEE' && managerId) ? managerId : undefined
      });
      alert(`✅ User "${name}" created!\nLogin: ${email} / ${password}`);
      setEmail(''); setName(''); setPassword(''); setManagerId('');
      fetchUsers();
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const steps: any[] = [];
      if (managerApproverSelected) {
        steps.push({ sequenceIndex: 0, ruleType: 'SEQUENCE', approverRole: 'MANAGER' });
        steps.push({ sequenceIndex: 1, ruleType: 'SEQUENCE', approverRole: 'ADMIN' });
      }
      await axios.post(`${API}/api/admin/workflows`, { name: workflowName, steps });
      alert('✅ Workflow saved! (Manager → Director chain)');
    } catch (err: any) { alert(err.response?.data?.error || 'Failed'); }
  };

  // Reusable expense badge
  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { bg: string; color: string }> = {
      PENDING:  { bg: '#fef3c7', color: '#d97706' },
      APPROVED: { bg: '#d1fae5', color: '#059669' },
      REJECTED: { bg: '#fee2e2', color: '#dc2626' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
    return (
      <span style={{ padding: '0.25rem 0.7rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
        {status}
      </span>
    );
  };

  // ── CLAIMS VIEW ───────────────────────────────────────────────────────────
  if (view === 'claims') {
    return (
      <div>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 700 }}>All Expense Claims</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Total"    value={stats.total}    icon="📋" color="var(--primary)" delay={0} />
          <StatCard label="Pending"  value={stats.pending}  icon="⏳" color="#d97706"        delay={0.1} />
          <StatCard label="Approved" value={stats.approved} icon="✅" color="var(--success)" delay={0.2} />
          <StatCard label="Rejected" value={stats.rejected} icon="❌" color="var(--danger)"  delay={0.3} />
        </div>

        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.5rem' }}>All Requests</h3>
          {loadingClaims ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
          ) : expenses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No expense claims yet.</p>
          ) : (
            <StaggerList>
              {expenses.map((exp: any) => (
                <StaggerItem key={exp.id}>
                  <div className="expense-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                          {exp.originalCurrency} {parseFloat(exp.amount).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          📁 {exp.category} · 📅 {new Date(exp.date).toLocaleDateString()}
                          {exp.description && ` · ${exp.description}`}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '0.15rem' }}>
                          👤 Submitted by: {exp.User?.name || 'Unknown'} ({exp.User?.email})
                        </div>
                        {exp.approvals && exp.approvals.filter((a: any) => a.status !== 'PENDING').length > 0 && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {exp.approvals.filter((a: any) => a.status !== 'PENDING').map((a: any) => (
                              <div key={a.id} style={{
                                fontSize: '0.78rem', padding: '3px 8px', borderRadius: '8px',
                                display: 'inline-flex', alignItems: 'center', gap: '0.35rem', alignSelf: 'flex-start',
                                background: a.status === 'APPROVED' ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
                                color: a.status === 'APPROVED' ? 'var(--success)' : 'var(--danger)',
                              }}>
                                {a.status === 'APPROVED' ? '✅' : '❌'}
                                {a.stepIndex === 999
                                  ? `Admin Override by ${a.approver?.name || 'Admin'}`
                                  : `${a.status === 'APPROVED' ? 'Approved' : 'Rejected'} by ${a.approver?.name || 'Unknown'} (${a.approver?.role})`
                                }
                                {a.comments && ` — "${a.comments}"`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <StatusBadge status={exp.status} />
                    </div>
                    {exp.status === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <ShimmerButton variant="success" onClick={() => handleOverride(exp.id, 'APPROVED')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          <Check size={14} /> Force Approve
                        </ShimmerButton>
                        <ShimmerButton variant="danger" onClick={() => handleOverride(exp.id, 'REJECTED')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                          <X size={14} /> Force Reject
                        </ShimmerButton>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '0.5rem' }}>
                          <ShieldAlert size={12} style={{ display: 'inline' }} /> Admin Override
                        </span>
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </div>
      </div>
    );
  }

  // ── USERS VIEW ────────────────────────────────────────────────────────────
  if (view === 'users') {
    return (
      <div>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 700 }}>User Management</h1>
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.25rem' }}>Create New User</h3>
          <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
            <input type="text" className="glass-input" placeholder="Full Name *" value={name} onChange={e => setName(e.target.value)} required />
            <input type="email" className="glass-input" placeholder="Email Address *" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" className="glass-input" placeholder="Set Password (min 6 chars) *" value={password} onChange={e => setPassword(e.target.value)} required />
            <select className="glass-input" value={role} onChange={e => { setRole(e.target.value); setManagerId(''); }}>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            {role === 'EMPLOYEE' && (
              <div style={{ gridColumn: 'span 2' }}>
                <select className="glass-input" value={managerId} onChange={e => setManagerId(e.target.value)}>
                  <option value="">-- Assign Manager (recommended) --</option>
                  {managers.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                  ))}
                </select>
                {managers.length === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '0.5rem' }}>
                    ⚠️ No managers found. Create a Manager first.
                  </p>
                )}
              </div>
            )}
            <ShimmerButton variant="primary" style={{ gridColumn: 'span 2' as any }}>
              <UserPlus size={18} />Create User
            </ShimmerButton>
          </form>

          <h3 style={{ marginBottom: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>Team Members</h3>
          <StaggerList>
            {users.map(u => (
              <StaggerItem key={u.id}>
                <div className="expense-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: u.role === 'MANAGER' ? 'var(--success)' : u.role === 'ADMIN' ? '#7c3aed' : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{u.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                  </div>
                  <span style={{
                    padding: '0.25rem 0.7rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700,
                    background: u.role === 'MANAGER' ? 'var(--success-light)' : u.role === 'ADMIN' ? 'rgba(124,58,237,0.1)' : 'var(--primary-light)',
                    color: u.role === 'MANAGER' ? 'var(--success)' : u.role === 'ADMIN' ? '#7c3aed' : 'var(--primary)'
                  }}>{u.role}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
          {users.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No team members yet.</p>}
        </div>
      </div>
    );
  }

  // ── WORKFLOWS VIEW ────────────────────────────────────────────────────────
  if (view === 'workflows') {
    return (
      <div>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 700 }}>Approval Workflows</h1>
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.25rem' }}>Configure Approval Chain</h3>
          <form onSubmit={handleCreateWorkflow}>
            <input type="text" className="glass-input" placeholder="Workflow Name *" value={workflowName} onChange={e => setWorkflowName(e.target.value)} required style={{ marginBottom: '1rem' }} />
            <label style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '1rem 0', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={managerApproverSelected} onChange={e => setManagerApproverSelected(e.target.checked)} style={{ width: 16, height: 16 }} />
              <span>Enable <strong>Manager → Director</strong> two-step approval chain</span>
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Step 1: Employee's Manager approves → Step 2: Director (Admin) gives final approval.
            </p>
            <ShimmerButton variant="primary" style={{ maxWidth: 240 }}>
              <Settings size={18} />Save & Activate Workflow
            </ShimmerButton>
          </form>
        </div>
      </div>
    );
  }

  // ── OVERVIEW ──────────────────────────────────────────────────────────────
  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 700 }}>Admin Overview</h1>

      {/* Animated Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Claims" value={stats.total}    icon="📋" color="var(--primary)" delay={0} />
        <StatCard label="Pending"      value={stats.pending}  icon="⏳" color="#d97706"        delay={0.1} />
        <StatCard label="Approved"     value={stats.approved} icon="✅" color="var(--success)" delay={0.2} />
        <StatCard label="Rejected"     value={stats.rejected} icon="❌" color="var(--danger)"  delay={0.3} />
      </div>

      {/* Director Approval Queue */}
      <div className="glass-panel" style={{ marginBottom: '1.5rem', border: '1px solid rgba(217,119,6,0.35)', background: 'rgba(254,243,199,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🎯</span>
          <h3 style={{ margin: 0, color: '#92400e' }}>
            Awaiting Your Approval (Director)
            <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>
              — {directorQueue.length} pending
            </span>
          </h3>
        </div>

        {directorQueue.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>✅ No expenses awaiting your director approval right now.</p>
        ) : (
          <StaggerList>
            {directorQueue.map(exp => {
              const step1Approval = exp.approvals?.find((a: any) => a.stepIndex === 1 && a.status === 'PENDING');
              const managerApproval = exp.approvals?.find((a: any) => a.stepIndex === 0);
              return (
                <StaggerItem key={exp.id}>
                  <div className="expense-card" style={{ flexDirection: 'column', gap: '0.75rem', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                          {exp.originalCurrency} {parseFloat(exp.amount).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          📁 {exp.category} · 📅 {new Date(exp.date).toLocaleDateString()}
                          {exp.description && ` · ${exp.description}`}
                        </div>
                        {managerApproval?.approver && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '0.2rem' }}>
                            ✅ Manager approved: {managerApproval.approver.name}
                          </div>
                        )}
                      </div>
                      <span style={{ padding: '0.25rem 0.7rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, background: '#fef3c7', color: '#d97706' }}>AWAITING DIRECTOR</span>
                    </div>
                    {step1Approval && (
                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <ShimmerButton variant="success" onClick={() => handleDirectorReview(step1Approval.id, 'APPROVED')} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                          <Check size={14} />Approve
                        </ShimmerButton>
                        <ShimmerButton variant="danger" onClick={() => handleDirectorReview(step1Approval.id, 'REJECTED')} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                          <X size={14} />Reject
                        </ShimmerButton>
                      </div>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerList>
        )}
      </div>

      {/* Summary */}
      <div className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <BarChart3 size={20} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Quick Summary</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>
          You have <strong style={{ color: 'var(--text-main)' }}>{stats.total} total expense claims</strong> across your company.
          {stats.pending > 0 && <> <strong style={{ color: '#d97706' }}>{stats.pending} pending</strong> in the pipeline.</>}
          {stats.approved > 0 && <> <strong style={{ color: 'var(--success)' }}>{stats.approved}</strong> fully approved.</>}
          {stats.rejected > 0 && <> <strong style={{ color: 'var(--danger)' }}>{stats.rejected}</strong> rejected.</>}
        </p>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '0.85rem' }}>
          Use <strong>All Claims</strong> in the sidebar for the full list with override controls.
        </p>
      </div>
    </div>
  );
}
