import React from 'react';
import './Ciso.css';
import {
  ShieldAlert, Cpu, Activity, Zap, Scale, Bot,
  ShieldCheck, RefreshCw, Globe, ClipboardCheck,
  Mail, Building2,
} from 'lucide-react';

const Ciso: React.FC = () => {
  return (
    <div className="ciso-page">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="ciso-hero">
        <div className="ciso-hero-bg" aria-hidden="true" />

        {/* Avatar */}
        <div className="ciso-avatar-block">
          <div className="ciso-avatar-ring">
            <div className="ciso-avatar-inner">
              <span className="ciso-avatar-initials">EVS</span>
            </div>
          </div>
          <div className="ciso-status-badge">
            <span className="ciso-status-dot" />
            Active CISO
          </div>
        </div>

        {/* Identity */}
        <div className="ciso-hero-content">
          <div className="ciso-eyebrow">Magon AI · Leadership</div>

          <h1 className="ciso-hero-name">Endla Venkat Sai</h1>

          <p className="ciso-hero-title">
            Chief Information Security Officer (CISO)
          </p>

          <p className="ciso-hero-org">Magon AI</p>

          <p className="ciso-hero-bio">
            Leading cybersecurity strategy, governance, risk management, and security
            operations — integrating human-led security leadership with AI-powered threat
            intelligence to transform security from a reactive necessity into a strategic
            advantage.
          </p>

          <div className="ciso-cert-row">
            {[
              'Vulnerability Management',
              'Security Monitoring',
              'Incident Response',
              'Cyber Risk Assessment',
              'AI Threat Intelligence',
              'Security Governance',
            ].map((cert) => (
              <span key={cert} className="ciso-cert">{cert}</span>
            ))}
          </div>

          <div className="ciso-hero-cta">
            <a className="btn-ciso-primary" href="mailto:venkat@niyantri.ai">
              Contact Endla →
            </a>
            <a className="btn-ciso-ghost" href="#approach">
              View approach
            </a>
          </div>
        </div>
      </section>

      <div className="ciso-divider" />

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="ciso-section" style={{ paddingBottom: 0 }}>
        <div className="ciso-stats">
          {[
            { num: '1.5+', label: 'Years in\ncybersecurity' },
            { num: '200+', label: 'Organizations\nsecured' },
            { num: '99.97%', label: 'Threat detection\naccuracy' },
            { num: '24/7', label: 'Continuous security\noversight' },
          ].map(({ num, label }) => (
            <div className="ciso-stat" key={num}>
              <div className="ciso-stat-num">{num}</div>
              <div className="ciso-stat-label" style={{ whiteSpace: 'pre-line' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Expertise ────────────────────────────────────────────────── */}
      <section className="ciso-section">
        <div className="ciso-section-label">Core expertise</div>
        <h2 className="ciso-section-title">Security domains</h2>
        <p className="ciso-section-sub">
          Deep capability across the full spectrum of modern enterprise security.
        </p>

        <div className="ciso-expertise-grid">
          {[
            {
              Icon: ShieldAlert,
              iconBg: 'icon-bg-blue',
              accent: 'accent-blue',
              title: 'Vulnerability Management',
              desc: 'Continuous identification, classification, and remediation of vulnerabilities across cloud, on-prem, and hybrid environments — before they become incidents.',
            },
            {
              Icon: Cpu,
              iconBg: 'icon-bg-purple',
              accent: 'accent-purple',
              title: 'AI-Powered Threat Intelligence',
              desc: 'Leveraging large-scale AI models to surface attack patterns, correlate indicators of compromise, and prioritize threats with actionable precision.',
            },
            {
              Icon: Activity,
              iconBg: 'icon-bg-cyan',
              accent: 'accent-cyan',
              title: 'Security Monitoring & SIEM',
              desc: 'Real-time monitoring of security events across all surfaces with ML-driven anomaly detection, reducing mean time to detect to under 4 minutes.',
            },
            {
              Icon: Zap,
              iconBg: 'icon-bg-green',
              accent: 'accent-green',
              title: 'Incident Response',
              desc: 'Structured, evidence-preserving incident response from first detection through root cause analysis, remediation, and post-incident reporting.',
            },
            {
              Icon: Scale,
              iconBg: 'icon-bg-orange',
              accent: 'accent-orange',
              title: 'Cyber Risk & Compliance',
              desc: 'Enterprise risk assessments, regulatory compliance programs (SOC 2, ISO 27001, GDPR), and board-level security reporting.',
            },
            {
              Icon: Bot,
              iconBg: 'icon-bg-indigo',
              accent: 'accent-indigo',
              title: 'Security Automation',
              desc: 'Designing AI-powered workflows that automate triage, accelerate investigations, and eliminate manual toil across the entire security operations pipeline.',
            },
          ].map(({ Icon, iconBg, accent, title, desc }) => (
            <div className={`ciso-expertise-card ${accent}`} key={title}>
              <div className={`ciso-card-icon ${iconBg}`}><Icon size={22} strokeWidth={1.6} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="ciso-divider" />

      {/* ── Vision ───────────────────────────────────────────────────── */}
      <section className="ciso-section">
        <div className="ciso-vision">
          <p className="ciso-vision-quote">
            "My vision is to empower businesses with{' '}
            <strong>intelligent, scalable, and future-ready</strong> cybersecurity
            solutions that transform security from a reactive necessity into a{' '}
            <strong>strategic advantage</strong> — enabling organizations to protect
            critical assets, maintain resilience, and foster trust in an increasingly
            connected world."
          </p>
          <p className="ciso-vision-attr">
            — Endla Venkat Sai, CISO · Magon AI
          </p>
        </div>
      </section>

      <div className="ciso-divider" />

      {/* ── Approach ─────────────────────────────────────────────────── */}
      <section className="ciso-section" id="approach">
        <div className="ciso-section-label">Security philosophy</div>
        <h2 className="ciso-section-title">How Endla approaches security</h2>
        <p className="ciso-section-sub">
          A proactive, intelligence-first methodology that keeps organizations ahead of
          the threat landscape.
        </p>

        <div className="ciso-approach">
          {[
            {
              tag: 'Foundation',
              title: 'Build resilient security frameworks',
              body: 'Every engagement begins with a comprehensive security posture assessment — evaluating existing controls, identifying gaps, and designing frameworks that balance protection with operational continuity. Security architecture is never bolted on after the fact.',
            },
            {
              tag: 'Detection',
              title: 'Identify risks before they become incidents',
              body: 'Proactive threat hunting, continuous vulnerability scanning, and AI-augmented behavioral analytics surface threats in their earliest stages. The goal is always to act on intelligence, not react to consequences.',
            },
            {
              tag: 'Intelligence',
              title: 'Integrate AI across the security stack',
              body: 'From automated triage and enriched alert context to predictive risk scoring and natural-language investigation summaries — AI is applied where it removes latency and analyst toil, not as a buzzword but as a precision tool.',
            },
            {
              tag: 'Operations',
              title: 'Enable continuous monitoring at scale',
              body: 'A 24/7 security operations capability is not a headcount problem — it is a systems problem. Endla architects monitoring pipelines that maintain visibility across cloud, endpoint, identity, and supply chain surfaces simultaneously.',
            },
            {
              tag: 'Governance',
              title: 'Translate security into business language',
              body: 'Security outcomes must be legible to boards and executives. Risk registers, compliance dashboards, and clear SLA reporting convert technical findings into strategic business decisions — making security a driver of trust, not a cost center.',
            },
          ].map(({ tag, title, body }, i) => (
            <div className="ciso-approach-item" key={title}>
              <div className="ciso-approach-left">
                <div className="ciso-approach-num">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="ciso-approach-line" />
              </div>
              <div className="ciso-approach-body">
                <span className="ciso-approach-tag">{tag}</span>
                <h4>{title}</h4>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="ciso-divider" />

      {/* ── Pillars ──────────────────────────────────────────────────── */}
      <section className="ciso-section">
        <div className="ciso-section-label">Leadership pillars</div>
        <h2 className="ciso-section-title">What Endla brings to every organization</h2>
        <p className="ciso-section-sub">
          Core commitments that define how security leadership is practised at Magon AI.
        </p>

        <div className="ciso-pillars">
          {[
            {
              Icon: ShieldCheck,
              title: 'Proactive defense',
              desc: 'Threats are addressed during planning and architecture reviews — not discovered after deployment. Every system is designed with an adversarial mindset from the first whiteboard session.',
            },
            {
              Icon: RefreshCw,
              title: 'Business continuity',
              desc: 'Security controls are designed to protect without disrupting operations. Incident response plans include recovery paths that keep critical business processes running under degraded conditions.',
            },
            {
              Icon: Globe,
              title: 'Cross-industry expertise',
              desc: 'Working with organizations across fintech, healthcare, manufacturing, and SaaS brings a broad threat perspective and the ability to apply lessons from one sector to accelerate security maturity in another.',
            },
            {
              Icon: ClipboardCheck,
              title: 'Compliance without friction',
              desc: 'Regulatory frameworks (SOC 2, ISO 27001, GDPR, HIPAA) are managed as operational programs, not annual checkbox exercises — embedded into engineering workflows so compliance is a byproduct of good practice.',
            },
          ].map(({ Icon, title, desc }) => (
            <div className="ciso-pillar" key={title}>
              <div className="ciso-pillar-icon"><Icon size={20} strokeWidth={1.6} /></div>
              <div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="ciso-divider" />

      {/* ── Contact ──────────────────────────────────────────────────── */}
      <section className="ciso-section" style={{ paddingBottom: '88px' }}>
        <div className="ciso-contact">
          <div className="ciso-contact-glow" aria-hidden="true" />
          <h2>Work with Endla</h2>
          <p>
            Security inquiries, advisory engagements, compliance consultations, and
            enterprise security partnerships — reach out directly.
          </p>
          <div className="ciso-contact-btns">
            <a className="btn-ciso-primary" href="mailto:venkat@magonai">
              Send a message →
            </a>
            <a className="btn-ciso-ghost" href="#">
              Schedule a call
            </a>
          </div>
          <div className="ciso-contact-detail">
            <div className="ciso-contact-item">
              <Mail size={15} strokeWidth={1.7} />
              <a href="mailto:security@niyantri.ai">info@magonai.com</a>
            </div>
            <div className="ciso-contact-item">
              <Building2 size={15} strokeWidth={1.7} />
              <span>Magon AI</span>
            </div>
            <div className="ciso-contact-item">
              <Globe size={15} strokeWidth={1.7} />
              <span>Remote · Worldwide</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Ciso;