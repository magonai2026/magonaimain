import React, { useState, useEffect, useRef } from 'react';
import './ImpactStats.css';

const IMPACT_STATS = [
  {
    icon: '👥',
    value: 50,
    unit: '+',
    label: 'Active Developers',
    sub: 'Early adopters securing their code daily',
    accent: '#de10f5', // Violet from your Home.css
    accentRgb: '222,16,245',
    gradient: 'linear-gradient(135deg, #f0abfc, #de10f5)',
    iconBg: 'rgba(222,16,245,0.15)',
  },
  {
    icon: '📁',
    value: 500,
    unit: '+',
    label: 'Repositories Scanned',
    sub: 'From startup MVPs to complex enterprise systems',
    accent: '#2563eb', // Blue
    accentRgb: '37,99,235',
    gradient: 'linear-gradient(135deg, #60a5fa, #2563eb)',
    iconBg: 'rgba(37,99,235,0.15)',
  },
  {
    icon: '🔍',
    value: 5500,
    unit: '+',
    label: 'Vulnerabilities Identified',
    sub: 'Deep-scan detection across 15+ programming languages',
    accent: '#e05a2b', // Orange/Red
    accentRgb: '224,90,43',
    gradient: 'linear-gradient(135deg, #fb923c, #e05a2b)',
    iconBg: 'rgba(224,90,43,0.15)',
  },
  {
    icon: '🌿',
    value: 2000,
    unit: '+',
    label: "Pull Requests Raised",
    sub: 'Autonomous security patches merged into codebases',
    accent: '#06b6d4', // Cyan accent
    accentRgb: '6,182,212',
    gradient: 'linear-gradient(135deg, #67e8f9, #06b6d4)',
    iconBg: 'rgba(6,182,212,0.15)',
  },
  {
    icon: '🛡️',
    value: 97,
    unit: '%',
    label: 'Vulnerabilities Eliminated',
    sub: 'Across thousands of scans in production codebases',
    accent: '#2d7a4f',
    accentRgb: '45,122,79',
    gradient: 'linear-gradient(135deg, #34d399, #2d7a4f)',
    iconBg: 'rgba(45,122,79,0.15)',
  },
  {
    icon: '⚡',
    value: 30,
    unit: 'mins',
    label: 'Saved Per Sprint',
    sub: 'Manual security review time cut from 5 hrs to under 30 min',
    accent: '#2563eb',
    accentRgb: '37,99,235',
    gradient: 'linear-gradient(135deg, #60a5fa, #2563eb)',
    iconBg: 'rgba(37,99,235,0.15)',
  },
  {
    icon: '🔥',
    value: 3,
    unit: '×',
    label: 'Faster Remediation',
    sub: 'One-click patches vs days of manual fix cycles',
    accent: '#e05a2b',
    accentRgb: '224,90,43',
    gradient: 'linear-gradient(135deg, #fb923c, #e05a2b)',
    iconBg: 'rgba(224,90,43,0.15)',
  },
  {
    icon: '✓',
    value: 0,
    unit: '',
    label: 'False Positives on Critical',
    sub: 'Context-aware engine eliminates noise from real threats',
    accent: '#7c3aed',
    accentRgb: '124,58,237',
    gradient: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
    iconBg: 'rgba(124,58,237,0.15)',
  },
] as const;

function useCountUp(target: number, duration = 1800, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    if (target === 0) { setCount(0); return; }
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, started]);
  return count;
}

const StatCard: React.FC<{
  stat: typeof IMPACT_STATS[number];
  delay: number;
  started: boolean;
}> = ({ stat, delay, started }) => {
  const count = useCountUp(stat.value, 1600, started);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (started) setTimeout(() => setVisible(true), delay);
  }, [started, delay]);

  return (
    <div
      className="impact-stat-card"
      style={{
        '--card-accent': stat.accent,
        '--card-glow': `rgba(${stat.accentRgb},0.15)`,
        '--card-glow-color': `rgba(${stat.accentRgb},0.25)`,
        '--card-number-gradient': stat.gradient,
        '--card-icon-bg': stat.iconBg,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, border-color 0.35s ease, box-shadow 0.35s ease`,
      } as React.CSSProperties}
    >
      <div className="impact-stat-glow"
        style={{ background: `radial-gradient(circle at 50% 0%, rgba(${stat.accentRgb},0.25) 0%, transparent 70%)` }}
      />
      <div className="impact-stat-icon" style={{ background: stat.iconBg }}>
        {stat.icon}
      </div>
      <span className="impact-stat-number">
        {count}<span className="impact-stat-unit">{stat.unit}</span>
      </span>
      <div className="impact-stat-divider" />
      <span className="impact-stat-label">{stat.label}</span>
      <span className="impact-stat-sub">{stat.sub}</span>
    </div>
  );
};

const ImpactStats: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="impact-stats-section" ref={sectionRef}>

      <div className="impact-stats-inner">
        <div className="impact-stats-eyebrow">
          <span className="impact-stats-eyebrow-dot" />
          Real-World Impact
          <span className="impact-stats-eyebrow-dot" />
        </div>
        <h2 className="impact-stats-title">Numbers that speak for themselves</h2>
        <p className="impact-stats-subtitle">
          Teams using MagonAI ship faster, sleep better, and stay secure — automatically.
        </p>
        <div className="impact-stats-grid">
          {IMPACT_STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} delay={i * 100} started={started} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactStats;