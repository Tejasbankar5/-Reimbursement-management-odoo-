import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X } from 'lucide-react';
import { StaggerList, StaggerItem, ShimmerButton } from '../components/ui';

const API = 'http://localhost:5000';

export default function ManagerDash({ view = 'approvals' }: { view?: 'approvals' | 'team' }) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
    if (view === 'team') fetchTeam();
  }, [view]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/expenses`);
      setExpenses(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchTeam = async () => {
    try {
      const res = await axios.get(`${API}/api/users/team`);
      setTeam(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleReview = async (approvalId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await axios.post(`${API}/api/approvals/${approvalId}/review`, { status });
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to review');
    }
  };

  // ── TEAM VIEW ──────────────────────────────────────────────────────────────
  if (view === 'team') {
    return (
      <div>
        <h1 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 700 }}>My Team</h1>
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Team Members</h3>
          <StaggerList>
          {team.map(member => (
            <StaggerItem key={member.id}>
            <div className="expense-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white' }}>
                  {member.name?.charAt(0)}
                </div>
                <div>
                  <strong>{member.name}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.email}</div>
                </div>
              </div>
              <span className="badge pending" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{member.role}</span>
            </div>
            </StaggerItem>
          ))}
          </StaggerList>
          {team.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No team members found.</p>}
        </div>
      </div>
    );
  }

  // Split expenses into categories using current user's approval records
  const pendingExpenses = expenses.filter(exp =>
    exp.approvals?.some((a: any) => a.status === 'PENDING')
  );

  // Expenses this manager has already decided on (approved or rejected by them)
  const myApprovedExpenses = expenses.filter(exp =>
    exp.approvals?.some((a: any) => a.status === 'APPROVED' && a.approver)
  );
  const myRejectedExpenses = expenses.filter(exp =>
    exp.status === 'REJECTED' && exp.approvals?.some((a: any) => a.status === 'REJECTED' && a.approver)
  );

  // ── APPROVALS VIEW ─────────────────────────────────────────────────────────
  return (
    <div>
      <h1 style={{ marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 700 }}>Team Approvals</h1>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Loading...</p> : (
        <>
          {/* Pending approvals */}
          <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: 'var(--primary)', borderRadius: '50%', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                {pendingExpenses.length}
              </span>
              Pending Approvals
            </h3>

            <StaggerList>
            {pendingExpenses.map(exp => {
              const pendingApproval = exp.approvals?.find((a: any) => a.status === 'PENDING');
              return (
                <StaggerItem key={exp.id}>
                <div className="expense-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                        {exp.originalCurrency} {parseFloat(exp.amount).toFixed(2)}
                        {exp.convertedAmount && parseFloat(exp.convertedAmount).toFixed(2) !== parseFloat(exp.amount).toFixed(2) && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', marginLeft: '0.75rem', background: 'rgba(139,92,246,0.15)', padding: '2px 8px', borderRadius: '12px' }}>
                            ≈ {parseFloat(exp.convertedAmount).toFixed(2)} (company currency)
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        📁 {exp.category} &nbsp;|&nbsp; 📅 {new Date(exp.date).toLocaleDateString()}
                      </div>
                      {exp.description && <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{exp.description}</div>}
                    </div>
                    <span className="badge pending">PENDING</span>
                  </div>
                  {pendingApproval && (
                    <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                      <ShimmerButton variant="success" style={{ maxWidth: 140, padding: '0.45rem' }}
                        onClick={() => handleReview(pendingApproval.id, 'APPROVED')}>
                        <Check size={16} /> Approve
                      </ShimmerButton>
                      <ShimmerButton variant="danger" style={{ maxWidth: 140, padding: '0.45rem' }}
                        onClick={() => handleReview(pendingApproval.id, 'REJECTED')}>
                        <X size={16} /> Reject
                      </ShimmerButton>
                    </div>
                  )}
                </div>
                </StaggerItem>
              );
            })}
            </StaggerList>
            {pendingExpenses.length === 0 && <p style={{ color: 'var(--text-muted)' }}>🎉 No pending approvals!</p>}
          </div>

          {/* My Approval History */}
          <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>✅ Approvals I Gave ({myApprovedExpenses.length})</h3>
            <StaggerList>
            {myApprovedExpenses.map(exp => {
              const approvedRecord = exp.approvals?.find((a: any) => a.status === 'APPROVED');
              return (
                <StaggerItem key={exp.id}>
                <div className="expense-card">
                  <div>
                    <strong>{exp.originalCurrency} {parseFloat(exp.amount).toFixed(2)}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                      {exp.category} — {new Date(exp.date).toLocaleDateString()}
                    </span>
                    {approvedRecord?.comments && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        💬 "{approvedRecord.comments}"
                      </div>
                    )}
                  </div>
                  <span className="badge approved">APPROVED</span>
                </div>
                </StaggerItem>
              );
            })}
            </StaggerList>
            {myApprovedExpenses.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No approvals given yet.</p>}
          </div>

          {/* My Rejection History */}
          <div className="glass-panel">
            <h3 style={{ marginBottom: '1rem' }}>❌ Rejections I Gave ({myRejectedExpenses.length})</h3>
            <StaggerList>
            {myRejectedExpenses.map(exp => {
              const rejectedRecord = exp.approvals?.find((a: any) => a.status === 'REJECTED');
              return (
                <StaggerItem key={exp.id}>
                <div className="expense-card">
                  <div>
                    <strong>{exp.originalCurrency} {parseFloat(exp.amount).toFixed(2)}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                      {exp.category} — {new Date(exp.date).toLocaleDateString()}
                    </span>
                    {rejectedRecord?.comments && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        💬 "{rejectedRecord.comments}"
                      </div>
                    )}
                  </div>
                  <span className="badge rejected">REJECTED</span>
                </div>
                </StaggerItem>
              );
            })}
            </StaggerList>
            {myRejectedExpenses.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No rejections given yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}
