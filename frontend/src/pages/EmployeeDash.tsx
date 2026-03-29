import { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Plus, RefreshCw } from 'lucide-react';
import { StaggerList, StaggerItem, ShimmerButton } from '../components/ui';

const API = 'http://localhost:5000';

function getExpenseTimeline(exp: any) {
  const approvals = exp.approvals || [];
  
  // Group approvals by stepIndex
  const groupedApprovals = approvals.reduce((acc: any, curr: any) => {
    if (!acc[curr.stepIndex]) acc[curr.stepIndex] = [];
    acc[curr.stepIndex].push(curr);
    return acc;
  }, {});

  const steps = [
    { label: 'Submitted', sublabel: 'Expense submitted by you', status: 'done', icon: '📤' }
  ];

  Object.keys(groupedApprovals).forEach((stepIndex) => {
    const stepApprovals = groupedApprovals[stepIndex];
    const isApproved = stepApprovals.some((a: any) => a.status === 'APPROVED');
    const isRejected = stepApprovals.some((a: any) => a.status === 'REJECTED');
    
    let sublabel = stepApprovals.map((a:any) => `${a.approver?.name || 'Approver'} (${a.status})`).join(', ');
    if (isApproved) sublabel = 'Approved by step members';
    if (isRejected) sublabel = 'Rejected at this step';

    steps.push({
      label: `Approval Step ${parseInt(stepIndex) + 1}`,
      sublabel,
      status: isApproved ? 'done' : isRejected ? 'rejected' : 'pending',
      icon: isApproved ? '✅' : isRejected ? '❌' : '⏳'
    });
  });

  steps.push({
    label: exp.status === 'APPROVED' ? 'Fully Approved' : exp.status === 'REJECTED' ? 'Rejected' : 'Final Decision',
    sublabel: exp.explanation || (exp.status === 'APPROVED' ? '🎉 Expense reimbursement approved!' : exp.status === 'REJECTED' ? 'Expense was rejected' : 'Awaiting all approvals'),
    status: exp.status === 'APPROVED' ? 'done' : exp.status === 'REJECTED' ? 'rejected' : 'idle',
    icon: exp.status === 'APPROVED' ? '🎉' : exp.status === 'REJECTED' ? '❌' : '⏸️',
  });

  return steps;
}

function StatusTimeline({ exp }: { exp: any }) {
  const steps = getExpenseTimeline(exp);

  const colors: Record<string, string> = {
    done:     '#10b981',
    pending:  '#f59e0b',
    rejected: '#ef4444',
    idle:     '#6b7280',
  };
  const bgColors: Record<string, string> = {
    done:     'rgba(16,185,129,0.12)',
    pending:  'rgba(245,158,11,0.12)',
    rejected: 'rgba(239,68,68,0.12)',
    idle:     'rgba(107,114,128,0.08)',
  };

  return (
    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {/* connector line */}
            {i < steps.length - 1 && (
              <div style={{
                position: 'absolute', top: 16, left: '50%', width: '100%', height: 2,
                background: step.status === 'done' ? colors.done : 'rgba(255,255,255,0.1)',
                zIndex: 0
              }} />
            )}
            {/* dot */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: bgColors[step.status],
              border: `2px solid ${colors[step.status]}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', zIndex: 1, flexShrink: 0,
              boxShadow: step.status === 'pending' ? `0 0 10px ${colors.pending}66` : 'none',
            }}>
              {step.icon}
            </div>
            {/* text */}
            <div style={{ marginTop: '0.5rem', textAlign: 'center', padding: '0 4px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: colors[step.status] }}>
                {step.label}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.3 }}>
                {step.sublabel}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmployeeDash() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [amount, setAmount] = useState('');
  const [originalCurrency, setOriginalCurrency] = useState('INR');
  const [category, setCategory] = useState('Travel');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [confidence, setConfidence] = useState({ amount: 0, category: 0, date: 0 });
  const [riskData, setRiskData] = useState<{riskScore: string, riskReasoning: string, fraudWarning: boolean} | null>(null);

  useEffect(() => { fetchExpenses(); }, []);

  useEffect(() => {
    if (amount) {
      const timer = setTimeout(async () => {
        try {
          // Assume token is handled by the globally injected axios interceptor
          const res = await axios.post(`${API}/api/expenses/analyze`, { amount, originalCurrency, category, date }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
          setRiskData(res.data);
        } catch (e) {}
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setRiskData(null);
    }
  }, [amount, originalCurrency, category, date]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/expenses`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setExpenses(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleOcrUpload = async () => {
    if (!file) return;
    setOcrLoading(true);
    const formData = new FormData();
    formData.append('receipt', file);
    try {
      const res = await axios.post(`${API}/api/expenses/ocr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.suggestedAmount) {
        setAmount(res.data.suggestedAmount.value.toString());
        setConfidence(prev => ({ ...prev, amount: res.data.suggestedAmount.confidence }));
      }
      if (res.data.suggestedCategory) {
        setCategory(res.data.suggestedCategory.value);
        setConfidence(prev => ({ ...prev, category: res.data.suggestedCategory.confidence }));
      }
      if (res.data.suggestedDate) {
        setDate(res.data.suggestedDate.value);
        setConfidence(prev => ({ ...prev, date: res.data.suggestedDate.confidence }));
      }
      setDescription('Auto-extracted from receipt scan');
    } catch (err: any) {
      alert('OCR Failed: ' + (err.response?.data?.error || err.message));
    } finally { setOcrLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) { alert('Please enter a valid amount'); return; }
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/expenses`, { amount: parseFloat(amount), originalCurrency, category, description, date }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setAmount(''); setCategory('Travel'); setDate(new Date().toISOString().split('T')[0]);
      setDescription(''); setFile(null); setConfidence({ amount: 0, category: 0, date: 0 }); setRiskData(null);
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Expenses</h1>
        <ShimmerButton variant="outline" onClick={fetchExpenses} style={{ maxWidth: 120, padding: '0.45rem 1rem' }}>
          <RefreshCw size={14} /> Refresh
        </ShimmerButton>
      </div>

      {/* Submit Form */}
      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Submit New Expense</h3>
        <div style={{ padding: '1rem', background: 'rgba(139,92,246,0.1)', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.3)', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>📸 Upload receipt to auto-extract details</p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept="image/*,application/pdf"
              style={{ flex: 1, minWidth: 200, color: 'var(--text-muted)', fontSize: '0.85rem' }} />
            <ShimmerButton variant="outline" onClick={handleOcrUpload} disabled={ocrLoading || !file}
              style={{ maxWidth: 160, padding: '0.6rem 1rem', opacity: (!file || ocrLoading) ? 0.5 : 1 }}>
              <Upload size={16} /> {ocrLoading ? 'Scanning...' : 'Scan Receipt'}
            </ShimmerButton>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ position: 'relative' }}>
              <input type="number" step="0.01" className="glass-input" placeholder="Amount *" value={amount} onChange={e => { setAmount(e.target.value); setConfidence(p => ({...p, amount: 0}))}} required style={{ paddingRight: '60px' }} />
              {confidence.amount > 0 && <span style={{ position: 'absolute', right: 10, top: 10, fontSize: '0.75rem', color: confidence.amount < 70 ? 'var(--danger)' : 'var(--success)' }}>{confidence.amount}% conf</span>}
            </div>
            
            <select className="glass-input" value={originalCurrency} onChange={e => setOriginalCurrency(e.target.value)}>
              <option value="INR">🇮🇳 INR</option>
              <option value="USD">🇺🇸 USD</option>
              <option value="EUR">🇪🇺 EUR</option>
              <option value="GBP">🇬🇧 GBP</option>
              <option value="JPY">🇯🇵 JPY</option>
              <option value="AUD">🇦🇺 AUD</option>
            </select>
            
            <div style={{ position: 'relative' }}>
              <select className="glass-input" value={category} onChange={e => { setCategory(e.target.value); setConfidence(p => ({...p, category: 0}))}}>
                <option value="Travel">✈️ Travel</option>
                <option value="Meals">🍽️ Meals</option>
                <option value="Transport">🚗 Transport</option>
                <option value="Accommodation">🏨 Accommodation</option>
                <option value="Software">💻 Software</option>
                <option value="Other">📦 Other</option>
              </select>
              {confidence.category > 0 && <span style={{ position: 'absolute', right: 30, top: 10, fontSize: '0.75rem', color: confidence.category < 70 ? 'var(--danger)' : 'var(--success)', pointerEvents: 'none' }}>{confidence.category}% conf</span>}
            </div>

            <div style={{ position: 'relative' }}>
              <input type="date" className="glass-input" value={date} onChange={e => { setDate(e.target.value); setConfidence(p => ({...p, date: 0}))}} required />
              {confidence.date > 0 && <span style={{ position: 'absolute', right: 30, top: 10, fontSize: '0.75rem', color: confidence.date < 70 ? 'var(--danger)' : 'var(--success)', pointerEvents: 'none' }}>{confidence.date}% conf</span>}
            </div>
          </div>
          <input type="text" className="glass-input" placeholder="Description (optional)" value={description}
            onChange={e => setDescription(e.target.value)} style={{ marginTop: '0.75rem' }} />

          {riskData && (
            <div style={{ padding: '0.75rem', marginTop: '1rem', borderRadius: '6px', background: riskData.fraudWarning ? 'rgba(239,68,68,0.1)' : riskData.riskScore === 'HIGH' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${riskData.fraudWarning ? 'var(--danger)' : riskData.riskScore === 'HIGH' ? '#f59e0b' : 'var(--success)'}` }}>
               <div style={{ fontSize: '0.85rem', fontWeight: 600, color: riskData.fraudWarning ? 'var(--danger)' : riskData.riskScore === 'HIGH' ? '#d97706' : 'var(--success)' }}>
                  {riskData.fraudWarning ? '🚨 Fraud Warning' : `📊 Risk Level: ${riskData.riskScore}`}
               </div>
               <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{riskData.riskReasoning}</div>
            </div>
          )}

          <ShimmerButton variant="primary" onClick={undefined} style={{ marginTop: '1rem', maxWidth: 240 }} disabled={submitting}>
            <Plus size={18} /> {submitting ? 'Submitting...' : 'Submit for Approval'}
          </ShimmerButton>
        </form>
      </div>

      {/* Expense History with Status Timeline */}
      <div className="glass-panel">
        <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Expense History</h3>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : expenses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No expenses yet. Submit your first expense above!</p>
        ) : (
          <StaggerList>
          {expenses.map(exp => (
            <StaggerItem key={exp.id}>
              <div className="expense-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0', padding: '1.25rem' }}>
                {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                    {exp.originalCurrency} {parseFloat(exp.amount).toFixed(2)}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem', fontSize: '0.88rem' }}>— {exp.category}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {exp.description && `${exp.description} · `}{new Date(exp.date).toLocaleDateString()}
                  </div>
                </div>
                {/* Overall status badge */}
                <span className={`badge ${exp.status?.toLowerCase()}`} style={{ fontSize: '0.72rem' }}>
                  {exp.status === 'APPROVED' ? '✅ APPROVED'
                   : exp.status === 'REJECTED' ? '❌ REJECTED'
                   : '⏳ IN PROGRESS'}
                </span>
              </div>

              {/* Approval Status Timeline */}
              <StatusTimeline exp={exp} />
            </div>
            </StaggerItem>
          ))}
          </StaggerList>
        )}
      </div>
    </div>
  );
}
