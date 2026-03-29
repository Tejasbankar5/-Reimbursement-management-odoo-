import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FadeIn, SpotlightCard, ShimmerButton, TextGenerateEffect } from '../components/ui';

const features = [
  { icon: '📤', title: 'Submit Expenses', desc: 'Submit claims with receipts, OCR auto-extraction, and multi-currency support.' },
  { icon: '✅', title: 'Manager Review',  desc: 'Team managers approve or reject with comments. Instant notifications.' },
  { icon: '🎯', title: 'Director Sign-off', desc: 'All approved claims escalate to the Director for final authorisation.' },
  { icon: '📊', title: 'Live Dashboard',  desc: 'Real-time stats, visual approval timelines, and full audit history.' },
  { icon: '🌍', title: 'Multi-Currency',  desc: 'Auto-converts to company base currency via live exchange rates.' },
  { icon: '🔒', title: 'Role-Based Access', desc: 'Strict hierarchy: Employee → Manager → Director. Zero shortcuts.' },
];

const steps = [
  { num: '1', label: 'Employee Submits', desc: 'Files claim with amount, category & receipt' },
  { num: '2', label: 'Manager Reviews',  desc: 'Approves or rejects with comments' },
  { num: '3', label: 'Director Approves', desc: 'Admin gives final authorisation' },
  { num: '4', label: 'Reimbursed',       desc: '✅ Employee sees Approved status' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* ── Animated Navbar ── */}
      <motion.nav
        className="landing-nav"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            style={{ width: 34, height: 34, background: 'var(--primary)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span style={{ color: 'white', fontWeight: 900, fontSize: '0.85rem' }}>R</span>
          </motion.div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>ReimburseIQ</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <ShimmerButton variant="outline" onClick={() => navigate('/login/user')} style={{ padding: '0.5rem 1.15rem' }}>
            Employee / Manager Login
          </ShimmerButton>
          <ShimmerButton variant="primary" onClick={() => navigate('/login/admin')} style={{ padding: '0.5rem 1.15rem' }}>
            Admin Portal →
          </ShimmerButton>
        </div>
      </motion.nav>

      {/* ── Hero Section ── */}
      <section className="landing-hero" style={{ overflow: 'hidden', position: 'relative' }}>
        {/* Animated floating blobs */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -100, right: -80, pointerEvents: 'none' }}
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{ position: 'absolute', width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -60, left: 80, pointerEvents: 'none' }}
        />

        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: '0.35rem 1rem', fontSize: '0.78rem', fontWeight: 700, marginBottom: '1.75rem', letterSpacing: '0.06em', backdropFilter: 'blur(8px)' }}
          >
            🚀 ENTERPRISE REIMBURSEMENT MANAGEMENT
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            style={{ fontSize: '3.75rem', fontWeight: 800, lineHeight: 1.12, marginBottom: '1.5rem', letterSpacing: '-0.025em' }}
          >
            <TextGenerateEffect words="Expense Claims," className="generate-text-hero" />
            <br />
            <motion.span
              initial={{ backgroundSize: '0% 3px' }}
              animate={{ backgroundSize: '100% 3px' }}
              transition={{ duration: 0.8, delay: 0.7 }}
              style={{
                backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4))',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '0 95%',
                paddingBottom: '2px'
              }}
            >
              Simplified & Structured
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ fontSize: '1.1rem', lineHeight: 1.75, marginBottom: '3rem', maxWidth: 540, margin: '0 auto 3rem' }}
          >
            A professional two-step approval system — from submission to reimbursement, every step tracked, transparent, and auditable.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <ShimmerButton variant="white" onClick={() => navigate('/login/user')} style={{ padding: '0.9rem 2.5rem', fontSize: '1rem', borderRadius: 10, fontWeight: 700 }}>
              Employee / Manager Login
            </ShimmerButton>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/login/admin')}
              style={{ padding: '0.9rem 2.5rem', borderRadius: 10, border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', backdropFilter: 'blur(8px)', fontFamily: 'Inter, sans-serif' }}
            >
              Admin Portal →
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ background: 'var(--bg-main)', padding: '5rem 5rem 2rem' }}>
        <FadeIn>
          <h2 style={{ textAlign: 'center', fontSize: '2.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>How It Works</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '3.5rem', fontSize: '1rem' }}>
            A clear, auditable 4-step reimbursement process
          </p>
        </FadeIn>
        <div style={{ display: 'flex', maxWidth: 900, margin: '0 auto', position: 'relative' }}>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              style={{ flex: 1, textAlign: 'center', padding: '0 1rem', position: 'relative' }}
            >
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.12 + 0.3 }}
                  style={{ position: 'absolute', top: 22, left: '55%', width: '90%', height: 2, background: 'var(--primary-mid)', transformOrigin: 'left' }}
                />
              )}
              <motion.div
                whileHover={{ scale: 1.15 }}
                style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', margin: '0 auto 1rem', position: 'relative', zIndex: 1, boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}
              >
                {step.num}
              </motion.div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>{step.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ paddingBottom: '2rem' }}>
        <FadeIn>
          <h2 style={{ textAlign: 'center', fontSize: '2.1rem', fontWeight: 700, marginBottom: '0.75rem', paddingTop: '4rem' }}>Everything You Need</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '0', fontSize: '1rem' }}>Built for real organisations with real approval structures</p>
        </FadeIn>
        <div className="feature-grid">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <SpotlightCard>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 + 0.15 }}
                  style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}
                >
                  {f.icon}
                </motion.div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '1rem', color: 'var(--text-main)', textAlign: 'center' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65, textAlign: 'center' }}>{f.desc}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Portal CTA Cards ── */}
      <section style={{ background: 'var(--bg-main)', padding: '2rem 5rem 5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <motion.div
            initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(37,99,235,0.12)' }}
            style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2.25rem', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}
          >
            <div style={{ fontSize: '2.75rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.6rem' }}>Employee & Manager</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.75rem', lineHeight: 1.65 }}>Submit expenses, track approval status, and manage your team's reimbursement requests.</p>
            <ShimmerButton variant="primary" onClick={() => navigate('/login/user')} style={{ width: '100%' }}>
              Login as Employee / Manager
            </ShimmerButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(37,99,235,0.3)' }}
            style={{ background: 'linear-gradient(135deg, #1e40af, #3730a3)', borderRadius: 16, padding: '2.25rem', textAlign: 'center', color: 'white', boxShadow: '0 8px 24px rgba(37,99,235,0.25)' }}
          >
            <div style={{ fontSize: '2.75rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.6rem' }}>Director / Admin</h3>
            <p style={{ opacity: 0.85, fontSize: '0.85rem', marginBottom: '1.75rem', lineHeight: 1.65 }}>Final approval authority, user management, and full analytics dashboard.</p>
            <ShimmerButton variant="white" onClick={() => navigate('/login/admin')} style={{ width: '100%' }}>
              Admin Portal →
            </ShimmerButton>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <motion.footer
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        style={{ borderTop: '1px solid var(--border)', padding: '1.75rem 5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 26, height: 26, background: 'var(--primary)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: '0.75rem' }}>R</span>
          </div>
          <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>ReimburseIQ</span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>© 2025 ReimburseIQ · Enterprise Expense Management</span>
      </motion.footer>
    </div>
  );
}
