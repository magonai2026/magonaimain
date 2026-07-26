import React, { useState, useEffect, useRef } from 'react';
import './TimeSavings.css';

// ── Count-up hook ──────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1600, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started || target === 0) { setCount(target); return; }
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, started]);
  return count;
}

// ── Bottom stat items ──────────────────────────────────────────────────────────
const STATS = [
  { value: 500, suffix: '+', label: 'Repos Scanned', sub: 'Public & private GitHub repos' },
  { value: 25,  suffix: '+', label: 'Developers Tested', sub: 'Across startups & enterprise teams' },
  { value: 97,  suffix: '%', label: 'Vuln Elimination Rate', sub: 'Across all production codebases' },
  { value: 2000, suffix: '+', label: 'PRs Auto-Merged', sub: 'Surgical patches with zero regressions' },
] as const;

const Stat: React.FC<{ item: typeof STATS[number]; delay: number; started: boolean }> = ({
  item, delay, started,
}) => {
  const count = useCountUp(item.value, 1500, started);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (started) setTimeout(() => setVisible(true), delay);
  }, [started, delay]);
  return (
    <div className="ts-stat" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `opacity .5s ease ${delay}ms, transform .5s ease ${delay}ms` }}>
      <span className="ts-stat-num">{count}<span className="ts-stat-suf">{item.suffix}</span></span>
      <span className="ts-stat-label">{item.label}</span>
      <span className="ts-stat-sub">{item.sub}</span>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const TimeSavings: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="ts-section" ref={sectionRef}>
      <div className="ts-bg-glow" />

      <div className="ts-inner">

        {/* ── Header ── */}
        <p className="ts-eyebrow">EFFICIENCY METRICS</p>
        <h2 className="ts-title">Stop spending hours on<br />what takes minutes</h2>
        <p className="ts-subtitle">
          Every vulnerability fixed manually costs your team 5 – 8 hours of
          review, patch, and testing cycles. MagonAI collapses that to minutes
          — with automated test generation, syntax verification, and GitHub PR
          creation built in.
        </p>

        {/* ── VS Panel ── */}
        <div className="ts-vs-wrap">

          {/* Left — Manual */}
          <div className="ts-card ts-card-manual">
            <div className="ts-card-badge ts-badge-manual">❌ Without MagonAI</div>
            <div className="ts-time-display ts-time-manual">
              5 – 8 <span className="ts-time-unit">hrs</span>
            </div>
            <p className="ts-time-caption">per vulnerability fixed</p>
            <ul className="ts-checklist">
              <li className="ts-check-no">Manual code review across every file</li>
              <li className="ts-check-no">No automated test generation</li>
              <li className="ts-check-no">Error-prone hand-written patches</li>
              <li className="ts-check-no">One developer tied up per fix</li>
              <li className="ts-check-no">No cross-file impact analysis</li>
              <li className="ts-check-no">Zero verification before merge</li>
            </ul>
          </div>

          {/* VS Divider */}
          <div className="ts-vs-divider">
            <div className="ts-vs-line" />
            <div className="ts-vs-badge">VS</div>
            <div className="ts-vs-line" />
          </div>

          {/* Right — MagonAI */}
          <div className="ts-card ts-card-ai">
            <div className="ts-card-badge ts-badge-ai">✓ With MagonAI</div>
            <div className="ts-time-display ts-time-ai">
              10 – 25<span className="ts-time-unit">mins</span>
            </div>
            <p className="ts-time-caption">per vulnerability fixed</p>
            <ul className="ts-checklist">
              <li className="ts-check-yes">AI deep scan across all files & repos</li>
              <li className="ts-check-yes">Automated unit & integration test generation</li>
              <li className="ts-check-yes">Surgical LLM patches — minimal diff</li>
              <li className="ts-check-yes">Zero developer time on routine fixes</li>
              <li className="ts-check-yes">Cross-repo dependency impact analysis</li>
              <li className="ts-check-yes">Syntax + test verified before GitHub PR</li>
            </ul>
          </div>

        </div>

        {/* ── Time saved callout ── */}
        <div className="ts-callout">
          <span className="ts-callout-icon">⚡</span>
          <span className="ts-callout-text">
            Teams using MagonAI recover <strong>95 %+ of engineering time</strong> spent on security remediation
          </span>
        </div>

        {/* ── Bottom stat row ── */}
        <div className="ts-stats-row">
          {STATS.map((s, i) => (
            <Stat key={s.label} item={s} delay={i * 110} started={started} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default TimeSavings;
