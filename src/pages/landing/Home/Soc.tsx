import React from 'react';
import './Soc.css';
import {
  Search, Bot, Activity, Zap, ShieldAlert, Cpu,
  ClipboardList, Scale, TrendingUp, RefreshCw, Users, Link2,
  Lock, Globe, ClipboardCheck,
  Heart, Landmark, BookOpen, Building, Monitor, Wrench, ShoppingCart,
  Mail, Building2,
} from 'lucide-react';


/* ─── data ────────────────────────────────────────────────────────────────── */

const metrics = [
  { num: '24/7',    label: 'Continuous\nmonitoring',       trend: 'LIVE' },
  { num: '<4 min',  label: 'Mean time\nto detect',         trend: '↓ 38%' },
  { num: '99.97%',  label: 'Alert\naccuracy',              trend: '↑ 2.1%' },
  { num: '3-tier',  label: 'Escalation\nframework',        trend: null },
  { num: '200+',    label: 'Organizations\nprotected',     trend: '↑ YoY' },
];

const capabilities = [
  {
    Icon: Search,
    accent: 'cl-cyan',
    title: 'Threat Detection & Intelligence',
    desc: 'AI-augmented detection across cloud, endpoint, identity, and network surfaces. ML-driven anomaly scoring surfaces real signals from noise at scale.',
  },
  {
    Icon: Bot,
    accent: 'cl-purple',
    title: 'AI-Powered Security Automation',
    desc: 'Automated triage, enrichment, and playbook execution reduce analyst toil and compress detection-to-containment from hours to minutes.',
  },
  {
    Icon: Activity,
    accent: 'cl-green',
    title: 'Continuous Security Monitoring',
    desc: 'Real-time SIEM correlated with proprietary threat intelligence and behavioral baselines. Every event logged, every anomaly scored, every escalation tracked.',
  },
  {
    Icon: Zap,
    accent: 'cl-orange',
    title: 'Incident Response & Containment',
    desc: 'Structured evidence-preserving response from first alert through root cause. Forensic integrity maintained while blast radius is minimized fast.',
  },
  {
    Icon: ShieldAlert,
    accent: 'cl-indigo',
    title: 'Vulnerability & Risk Management',
    desc: 'Continuous scanning, prioritization by exploitability and business impact, and tracked remediation workflows across hybrid environments.',
  },
  {
    Icon: Cpu,
    accent: 'cl-ops',
    title: 'Strategic Security Intelligence',
    desc: 'Actionable reporting for security teams, technology leaders, and boards. Risk registers, compliance dashboards, and trend analysis that drive decisions.',
  },
];

const tiers = [
  {
    badge: 't1',
    label: 'Tier 1 · Triage',
    sla: 'SLA: < 15 min',
    title: 'Alert triage & validation',
    desc: 'AI-assisted correlation filters false positives at ingestion. Tier 1 analysts validate, categorize, and route every alert within the first detection window.',
    items: [
      'Automated alert enrichment & deduplication',
      'Initial severity classification (P0–P3)',
      'Low-severity closure with automated recommendation',
      'Escalation to T2 for confirmed threats',
    ],
  },
  {
    badge: 't2',
    label: 'Tier 2 · Investigation',
    sla: 'SLA: < 1 hr',
    title: 'Deep investigation & containment',
    desc: 'Confirmed threats escalate to Tier 2 for root cause analysis, forensic artifact collection, and execution of targeted containment playbooks.',
    items: [
      'Full kill-chain reconstruction',
      'System isolation & evidence preservation',
      'Playbook-driven containment actions',
      'Customer & stakeholder notification initiation',
    ],
  },
  {
    badge: 't3',
    label: 'Tier 3 · Hunting',
    sla: 'SLA: Ongoing',
    title: 'Threat hunting & engineering',
    desc: 'Senior analysts and security engineers handle nation-state actors, novel attack vectors, and long-dwell intrusions, while running proactive hunting campaigns.',
    items: [
      'Proactive hypothesis-driven threat hunting',
      'Detection rule engineering & tuning',
      'Red team / blue team adversarial exercises',
      'Post-incident intelligence integration',
    ],
  },
];

const governance = [
  {
    Icon: ClipboardList,
    accent: '#6366f1',
    title: 'Enterprise Security Governance',
    desc: 'Security policies, standards, and frameworks aligned to ISO 27001, NIST CSF, and CIS Controls — reviewed and updated quarterly.',
  },
  {
    Icon: Scale,
    accent: '#38bdf8',
    title: 'Compliance & Regulatory Management',
    desc: 'Continuous compliance posture across SOC 2 Type II, GDPR, HIPAA, and sector-specific regulations. Audit-ready evidence collected automatically.',
  },
  {
    Icon: TrendingUp,
    accent: '#a855f7',
    title: 'Risk Assessment & Register',
    desc: 'Quantitative and qualitative cyber risk assessments with board-level reporting. Risk register maintained and reviewed with executive stakeholders monthly.',
  },
  {
    Icon: RefreshCw,
    accent: '#34d399',
    title: 'Business Continuity & Resilience',
    desc: 'Business continuity plans, disaster recovery procedures, and tabletop exercises ensure operations remain viable under degraded security conditions.',
  },
  {
    Icon: Users,
    accent: '#fb923c',
    title: 'Security Culture & Awareness',
    desc: 'Role-specific security training, phishing simulation programs, and a security champion network embedded in every engineering and business team.',
  },
  {
    Icon: Link2,
    accent: '#c084fc',
    title: 'Vendor & Supply Chain Security',
    desc: 'Third-party risk assessments, vendor security questionnaires, and continuous monitoring of critical SaaS and infrastructure dependencies.',
  },
];

const csoTags = [
  { Icon: Lock,          label: 'Security Strategy' },
  { Icon: Scale,         label: 'Risk Governance' },
  { Icon: Bot,           label: 'AI Security' },
  { Icon: ClipboardList, label: 'Compliance' },
  { Icon: Globe,         label: 'Enterprise Resilience' },
];

const sectors = [
  { Icon: Heart,        label: 'Healthcare' },
  { Icon: Landmark,     label: 'Financial Services' },
  { Icon: BookOpen,     label: 'Education' },
  { Icon: Building,     label: 'Government' },
  { Icon: Monitor,      label: 'Technology' },
  { Icon: Wrench,       label: 'Manufacturing' },
  { Icon: ShoppingCart, label: 'Retail & E-commerce' },
  { Icon: Zap,          label: 'Energy & Utilities' },
];

/* ─── component ───────────────────────────────────────────────────────────── */

const Soc: React.FC = () => {
  return (
    <div className="soc-page">

      {/* ══ HERO ═══════════════════════════════════════════════════════════ */}
      <section className="soc-hero">
        <div className="soc-hero-glow-l" aria-hidden="true" />
        <div className="soc-hero-glow-r" aria-hidden="true" />
        <div className="soc-hero-grid"   aria-hidden="true" />

        <div className="soc-hero-content">
          <div className="soc-live-bar">
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <span className="soc-live-ping" />
              <span className="soc-live-dot" />
            </span>
            SOC · All systems operational
          </div>

          <h1>Security Operations<br />Center</h1>
          <p className="soc-hero-sub-title">Magon AI · 24 / 7 / 365</p>

          <p>
            AI-augmented analysts and autonomous detection pipelines monitor Magon AI's
            infrastructure — and customer environments — around the clock. We detect,
            contain, and communicate before threats reach production.
          </p>

          <div className="soc-hero-cta">
            <a className="btn-soc-primary" href="#capabilities">
              Explore capabilities →
            </a>
            <a className="btn-soc-ghost" href="mailto:soc@magonai.com">
              Contact the SOC
            </a>
          </div>
        </div>

        {/* Radar */}
        <div className="soc-radar-wrap" aria-hidden="true">
          <div className="soc-radar">
            <div className="soc-radar-ring" />
            <div className="soc-radar-ring" />
            <div className="soc-radar-ring" />
            <div className="soc-radar-cross-h" />
            <div className="soc-radar-cross-v" />
            <div className="soc-radar-sweep" />
            <div className="soc-blip" />
            <div className="soc-blip" />
            <div className="soc-blip" />
            <div className="soc-blip" />
            <div className="soc-blip" />
            <div className="soc-blip" />
            <div className="soc-radar-center" />
          </div>
        </div>
      </section>

      {/* ══ METRICS ════════════════════════════════════════════════════════ */}
      <div className="soc-metrics">
        {metrics.map(({ num, label, trend }) => (
          <div className="soc-metric" key={num}>
            {trend && <span className="soc-metric-trend">{trend}</span>}
            <div className="soc-metric-num">{num}</div>
            <div className="soc-metric-label" style={{ whiteSpace: 'pre-line' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="soc-divider" />

      {/* ══ CSO PROFILE ════════════════════════════════════════════════════ */}
      <section className="soc-section">
        <div className="soc-cso-strip">

          {/* avatar */}
          <div className="soc-cso-avatar">
            <div className="soc-cso-avatar-ring" />
            <div className="soc-cso-avatar-inner">
              <span className="soc-cso-initials">EVS</span>
            </div>
          </div>

          {/* bio */}
          <div>
            <div className="soc-cso-name">Endla Venkat Sai</div>
            <div className="soc-cso-role">Chief Security Officer (CSO) · Magon AI</div>
            <p className="soc-cso-bio">
              Endla Venkat Sai leads Magon AI's strategic security vision, enterprise risk
              management, governance programs, and business resilience efforts. His leadership
              integrates advanced AI-driven security intelligence with deep human expertise —
              enabling organizations to identify risks early, strengthen their security posture,
              and transform security into a strategic business advantage.
            </p>
          </div>

          {/* tags */}
          <div className="soc-cso-tags">
            {csoTags.map(({ Icon, label }) => (
              <div className="soc-cso-tag" key={label}>
                <span className="soc-cso-tag-icon"><Icon size={13} strokeWidth={1.8} /></span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Capabilities ─────────────────────────────────────────────── */}
        <div id="capabilities">
          <div className="soc-label">What we do</div>
          <h2 className="soc-title">SOC capabilities</h2>
          <p className="soc-subtitle">
            Six domains of security operation, working as a unified system rather than
            isolated functions.
          </p>
          <div className="soc-cap-grid">
            {capabilities.map(({ Icon, accent, title, desc }) => (
              <div className={`soc-cap-card ${accent}`} key={title}>
                <span className="soc-cap-icon"><Icon size={24} strokeWidth={1.5} /></span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="soc-divider" />

      {/* ══ ESCALATION TIERS ═══════════════════════════════════════════════ */}
      <section className="soc-section">
        <div className="soc-label">How we respond</div>
        <h2 className="soc-title">Escalation tiers</h2>
        <p className="soc-subtitle">
          Every alert enters the same structured pipeline. Speed is built into the
          architecture, not left to individual judgment.
        </p>
        <div className="soc-tiers">
          {tiers.map(({ badge, label, sla, title, desc, items }) => (
            <div className="soc-tier" key={label}>
              <div className="soc-tier-top">
                <span className={`soc-tier-badge ${badge}`}>{label}</span>
                <span className="soc-tier-sla">{sla}</span>
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
              <ul className="soc-tier-items">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <div className="soc-divider" />

      {/* ══ GOVERNANCE ═════════════════════════════════════════════════════ */}
      <section className="soc-section">
        <div className="soc-label">Leadership scope</div>
        <h2 className="soc-title">Governance & risk management</h2>
        <p className="soc-subtitle">
          Under Endla Venkat Sai's direction, security extends beyond the SOC into every
          layer of the business.
        </p>
        <div className="soc-gov">
          {governance.map(({ Icon, accent, title, desc }) => (
            <div
              className="soc-gov-item"
              style={{ '--gov-accent': accent } as React.CSSProperties}
              key={title}
            >
              <span className="soc-gov-icon"><Icon size={20} strokeWidth={1.6} /></span>
              <div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="soc-divider" />

      {/* ══ SECTORS ════════════════════════════════════════════════════════ */}
      <section className="soc-section">
        <div className="soc-label">Industries served</div>
        <h2 className="soc-title">Cross-sector security leadership</h2>
        <p className="soc-subtitle">
          Magon AI delivers enterprise-grade security leadership across critical industries,
          each with distinct regulatory, threat, and resilience requirements.
        </p>
        <div className="soc-sectors">
          {sectors.map(({ Icon, label }) => (
            <div className="soc-sector" key={label}>
              <span className="soc-sector-icon"><Icon size={15} strokeWidth={1.7} /></span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="soc-divider" />

      {/* ══ PHILOSOPHY ═════════════════════════════════════════════════════ */}
      <section className="soc-section">
        <div className="soc-philosophy">
          <div className="soc-philosophy-grid" aria-hidden="true" />
          <div className="soc-philosophy-glow" aria-hidden="true" />
          <blockquote>
            "Rather than treating security as a reactive function, the mission is to
            embed security into every aspect of business operations — combining{' '}
            <strong>human expertise with intelligent automation</strong> to build adaptive
            programs capable of defending against modern cyber threats and{' '}
            <strong>rapidly evolving attack techniques</strong>."
          </blockquote>
          <cite>— Endla Venkat Sai, CSO · Magon AI</cite>
        </div>
      </section>

      <div className="soc-divider" />

      {/* ══ CONTACT ════════════════════════════════════════════════════════ */}
      <section className="soc-section" style={{ paddingBottom: '96px' }}>
        <div className="soc-label">Get in touch</div>
        <h2 className="soc-title" style={{ marginBottom: '40px' }}>Contact the SOC</h2>
        <div className="soc-contact">

          <div className="soc-contact-card">
            <h3>Security inquiries</h3>
            <p>
              For compliance reviews, enterprise security partnerships, advisory
              engagements, or general security questions — reach the team directly.
            </p>
            <div className="soc-contact-items">
              <div className="soc-contact-row">
                <Mail size={15} strokeWidth={1.7} />
                <a href="mailto:security@magonai.com">security@magonai.com</a>
              </div>
              <div className="soc-contact-row">
                <ClipboardCheck size={15} strokeWidth={1.7} />
                <a href="mailto:compliance@magonai.com">compliance@magonai.com</a>
              </div>
              <div className="soc-contact-row">
                <Building2 size={15} strokeWidth={1.7} />
                <span>Magon AI · Remote, Worldwide</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a className="btn-soc-primary" href="mailto:security@magonai.com">
                Send a message →
              </a>
              <a className="btn-soc-ghost" href="#">
                Schedule a briefing
              </a>
            </div>
          </div>

          <div className="soc-hotline">
            <div>
              <div className="soc-hotline-label">🔴 Emergency line</div>
              <h4>Active security incident?</h4>
              <p>
                For active breaches, confirmed compromises, or critical security
                events requiring immediate SOC response — use our 24/7 hotline.
                Our on-call team responds within 15 minutes.
              </p>
            </div>
            <div className="soc-hotline-num">soc@magonai.com</div>
            <a className="btn-soc-primary" href="mailto:soc@magonai.com">
              Report an incident →
            </a>
          </div>

        </div>
      </section>

    </div>
  );
};

export default Soc;
