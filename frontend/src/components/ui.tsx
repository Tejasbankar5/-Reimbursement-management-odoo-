/**
 * Aceternity-inspired animated components for ReimburseIQ
 * Uses framer-motion for smooth, professional animations
 */

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';

// ── Fade + Slide In ────────────────────────────────────────────────────────
export const FadeIn = ({ children, delay = 0, y = 16 }: { children: ReactNode; delay?: number; y?: number }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] }}
  >
    {children}
  </motion.div>
);

// ── Staggered list container ───────────────────────────────────────────────
export const StaggerList = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children }: { children: ReactNode }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
    transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
  >
    {children}
  </motion.div>
);

// ── Hover Lift Card ────────────────────────────────────────────────────────
export const HoverCard = ({
  children,
  style = {},
  className = "",
  onClick,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}) => (
  <motion.div
    className={className}
    style={style}
    whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(37,99,235,0.12)' }}
    transition={{ duration: 0.22, ease: 'easeOut' }}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

// ── Shine / Shimmer Button ─────────────────────────────────────────────────
export const ShimmerButton = ({
  children,
  onClick,
  style = {},
  disabled = false,
  variant = 'primary',
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'danger' | 'success' | 'white';
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--primary)', color: 'white' },
    outline: { background: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--primary)' },
    danger:  { background: 'var(--danger)',  color: 'white' },
    success: { background: 'var(--success)', color: 'white' },
    white:   { background: 'white', color: 'var(--primary)' },
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.025, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      transition={{ duration: 0.16 }}
      style={{
        position: 'relative',
        overflow: 'hidden',
        border: 'none',
        padding: '0.7rem 1.5rem',
        borderRadius: 8,
        fontWeight: 600,
        fontSize: '0.88rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter, sans-serif',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        opacity: disabled ? 0.55 : 1,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {/* Shimmer overlay */}
      <motion.span
        initial={{ x: '-100%' }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
      {children}
    </motion.button>
  );
};

// ── Animated Stat Card ─────────────────────────────────────────────────────
export const StatCard = ({
  label, value, icon, color, delay = 0
}: {
  label: string; value: number; icon: string; color: string; delay?: number;
}) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.2, delay, ease: 'easeOut' });
    const unsubscribe = rounded.on('change', v => setDisplay(v));
    return () => { controls.stop(); unsubscribe(); };
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -5, boxShadow: '0 16px 40px rgba(0,0,0,0.1)' }}
      style={{
        background: 'white', border: '1px solid var(--border)', borderRadius: 16,
        padding: '1.5rem', textAlign: 'center', cursor: 'default',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden'
      }}
    >
      {/* Colored top accent bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: delay + 0.2 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, transformOrigin: 'left' }}
      />
      <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color, lineHeight: 1 }}>{display}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </motion.div>
  );
};

// ── Glowing Border Card ────────────────────────────────────────────────────
export const GlowCard = ({
  children, style = {}, glowColor = 'var(--primary)', className = ""
}: {
  children: ReactNode; style?: React.CSSProperties; glowColor?: string; className?: string;
}) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      className={className}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ boxShadow: hovered ? `0 0 0 2px ${glowColor}40, 0 12px 36px ${glowColor}18` : '0 2px 12px rgba(0,0,0,0.06)' }}
      transition={{ duration: 0.25 }}
      style={{
        background: 'white', border: `1px solid ${hovered ? glowColor + '60' : 'var(--border)'}`,
        borderRadius: 16, padding: '2rem', transition: 'border-color 0.25s ease', ...style
      }}
    >
      {children}
    </motion.div>
  );
};

// ── Animated Badge ─────────────────────────────────────────────────────────
export const AnimatedBadge = ({ status }: { status: string }) => {
  const configs: Record<string, { label: string; color: string; bg: string; pulse?: boolean }> = {
    PENDING:   { label: 'Pending',   color: '#d97706', bg: '#fef3c7', pulse: true },
    APPROVED:  { label: 'Approved',  color: '#059669', bg: '#d1fae5' },
    REJECTED:  { label: 'Rejected',  color: '#dc2626', bg: '#fee2e2' },
    'IN PROGRESS': { label: 'In Progress', color: '#2563eb', bg: '#eff6ff', pulse: true },
  };
  const config = configs[status] || { label: status, color: '#64748b', bg: '#f1f5f9' };

  return (
    <motion.span
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.28rem 0.75rem', borderRadius: 999,
        background: config.bg, color: config.color,
        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase'
      }}
    >
      {config.pulse && (
        <motion.span
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: config.color, display: 'inline-block' }}
        />
      )}
      {config.label}
    </motion.span>
  );
};

// ── Feature Card (landing page) ────────────────────────────────────────────
export const FeatureCard = ({
  icon, title, desc, delay = 0
}: {
  icon: string; title: string; desc: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -6, boxShadow: '0 20px 48px rgba(37,99,235,0.12)' }}
    style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 16,
      padding: '2rem', textAlign: 'center', cursor: 'default',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden'
    }}
  >
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: delay + 0.15 }}
      style={{ fontSize: '2.5rem', marginBottom: '1rem' }}
    >
      {icon}
    </motion.div>
    <h3 style={{ fontWeight: 700, marginBottom: '0.6rem', fontSize: '1rem', color: 'var(--text-main)' }}>{title}</h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.65 }}>{desc}</p>
  </motion.div>
);

// ── Page Transition Wrapper ────────────────────────────────────────────────
export const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ── Expense List Item ──────────────────────────────────────────────────────
export const ExpenseItem = ({ children, style = {} }: { children: ReactNode; style?: React.CSSProperties }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
    whileHover={{ x: 4, borderColor: 'var(--border-focus)' }}
    transition={{ duration: 0.2 }}
    style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 10,
      padding: '1rem 1.25rem', marginBottom: '0.75rem', display: 'flex',
      justifyContent: 'space-between', alignItems: 'center', ...style
    }}
  >
    {children}
  </motion.div>
);

// ── Spotlight Card (Aceternity Style) ──────────────────────────────────────
export const SpotlightCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <div
      className={className}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)',
        borderRadius: 16, padding: '2.5rem', boxShadow: 'var(--shadow-md)', transition: 'all 0.3s ease'
      }}
    >
      <motion.div
        style={{
          position: 'absolute', top: -150, left: -150, width: 300, height: 300,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 60%)',
          pointerEvents: 'none', x: mouseX, y: mouseY, opacity: 0, transition: 'opacity 0.2s'
        }}
        whileHover={{ opacity: 1 }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
};

// ── Text Generate/Typewriter Effect ───────────────────────────────────────
export const TextGenerateEffect = ({ words, className }: { words: string; className?: string }) => {
  const wordsArray = words.split(' ');
  return (
    <motion.div className={className} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="visible">
      {wordsArray.map((word, idx) => (
        <motion.span
          key={word + idx}
          variants={{ hidden: { opacity: 0, filter: 'blur(10px)' }, visible: { opacity: 1, filter: 'blur(0px)' } }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ display: 'inline-block', marginRight: '0.25rem' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
};
