import React from 'react';
import './ResponsibleDisclosure.css';

const pathwaySteps = [
  { label: 'Discover & Report' },
  { label: 'Acknowledge & Investigate' },
  { label: 'Remediate' },
  { label: 'Coordinated Disclosure' },
];

const reportChecklist = [
  'A detailed description of the vulnerability',
  'Steps required to reproduce the issue',
  'Affected URLs, systems, or services',
  'Proof-of-concept code or screenshots, if applicable',
  'Potential impact of the vulnerability',
  'Your contact information for follow-up communication',
];

const commitments = [
  'Acknowledge receipt of the report in a timely manner',
  'Investigate the reported vulnerability',
  'Assess the potential impact and risk',
  'Take appropriate remediation actions',
  'Maintain communication with the reporter when possible',
  'Work to resolve verified vulnerabilities as quickly as practical',
  'Recognize the contributions of responsible security researchers where appropriate',
];

const guidelines = [
  'Act in good faith to avoid privacy violations and service disruptions',
  'Report vulnerabilities promptly after discovery',
  'Avoid accessing, modifying, or deleting user data',
  'Avoid disrupting systems, services, or business operations',
  'Limit testing to the minimum necessary to validate findings',
  'Respect the privacy and confidentiality of our users and customers',
  'Provide reasonable time for remediation before public disclosure',
];

const outOfScope = [
  'Accessing data that does not belong to you',
  'Modifying, deleting, or exposing sensitive information',
  'Social engineering attacks against employees, customers, or partners',
  'Physical security testing without written authorization',
  'Denial-of-Service (DoS) or Distributed Denial-of-Service (DDoS) testing',
  'Malware deployment or exploitation that could impact users or services',
  'Automated scanning that causes service degradation',
  'Any activity that violates applicable laws or regulations',
];

const safeHarbor = [
  'Act in good faith',
  'Follow this Responsible Disclosure Policy',
  'Avoid causing harm to users, data, or services',
  'Respect privacy and confidentiality',
  'Report vulnerabilities responsibly and promptly',
];

const ResponsibleDisclosure: React.FC = () => {
  return (
    <div className="rd-page">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="rd-hero">
        <div className="rd-hero-glow-l" />
        <div className="rd-hero-glow-r" />
        <div className="rd-hero-inner">
          <div className="rd-hero-text">
            <div className="rd-badge">
              <span className="rd-badge-dot" />
              Responsible Disclosure
            </div>
            <h1>
              Security Is a <span className="rd-hero-grad">Shared Responsibility</span>
            </h1>
            <p>
              At Magon AI, we are committed to maintaining the highest standards of security,
              privacy, and trust. We recognize that security researchers, ethical hackers,
              customers, and members of the security community play an important role in helping
              identify potential vulnerabilities.
            </p>
            <p>
              This Responsible Disclosure Policy provides guidelines for reporting security
              vulnerabilities in a manner that protects our users, systems, and services while
              enabling us to investigate and address issues effectively.
            </p>
            <div className="rd-hero-cta">
              <a href="#report" className="btn-rd-primary">Report a Vulnerability</a>
              <a href="#guidelines" className="btn-rd-ghost">View Guidelines</a>
            </div>
          </div>

          {/* Signature: Disclosure Pathway */}
          <div className="rd-pathway-strip">
            <div className="rd-pathway-label">Disclosure Pathway</div>
            <div className="rd-pathway-track">
              <div className="rd-pathway-track-bg" />
              <div className="rd-pathway-line" />
              <div className="rd-pathway-nodes">
                {pathwaySteps.map((step) => (
                  <div className="rd-pathway-node" key={step.label}>
                    <div className="rd-node-dot" />
                    <div className="rd-node-label">{step.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="rd-divider" />

      {/* ── REPORTING ─────────────────────────────────────────────────── */}
      <section className="rd-section" id="report">
        <div className="rd-eyebrow">Reporting</div>
        <h2 className="rd-section-title">Reporting a Security Vulnerability</h2>
        <p className="rd-section-sub">
          If you believe you have discovered a security vulnerability affecting Magon AI systems,
          applications, services, or infrastructure, we encourage you to report it promptly and
          responsibly. Security reports should contain sufficient information to allow our team to
          validate and reproduce the issue.
        </p>
        <div className="rd-report-wrap">
          <div className="rd-report-body">
            <p>When submitting a report, please include:</p>
            <div className="rd-checklist">
              {reportChecklist.map((item) => (
                <div className="rd-checklist-item" key={item}>
                  <span className="rd-checklist-icon">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rd-report-card">
            <div className="rd-report-card-glow" />
            <h3>Our Commitment</h3>
            <div className="rd-report-card-sub">
              When a valid vulnerability report is received, Magon AI will:
            </div>
            <div className="rd-commit-rows">
              {commitments.map((item) => (
                <div className="rd-commit-row" key={item}>
                  <span className="rd-commit-bullet" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="rd-divider" />

      {/* ── GUIDELINES ────────────────────────────────────────────────── */}
      <section className="rd-section" id="guidelines">
        <div className="rd-eyebrow">Guidelines</div>
        <h2 className="rd-section-title">Guidelines for Security Researchers</h2>
        <p className="rd-section-sub">
          To ensure responsible testing and disclosure, we ask researchers to follow these
          principles throughout the discovery, validation, and reporting process.
        </p>
        <div className="rd-guidelines">
          {guidelines.map((item, i) => (
            <div className="rd-guide-step" key={item}>
              <div className="rd-guide-num">{String(i + 1).padStart(2, '0')}</div>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="rd-divider" />

      {/* ── SCOPE LEDGER ──────────────────────────────────────────────── */}
      <section className="rd-section">
        <div className="rd-eyebrow">Scope &amp; Safe Harbor</div>
        <h2 className="rd-section-title">Out of Scope &amp; Legal Safe Harbor</h2>
        <p className="rd-section-sub">
          The following activities are prohibited and not authorized under this policy. Researchers
          who act in good faith and follow this policy are protected under our legal safe harbor.
        </p>
        <div className="rd-scope-grid">
          <div className="rd-scope-panel out">
            <div className="rd-scope-head">
              <span className="rd-scope-icon">✕</span>
              <h3>Out of Scope Activities</h3>
            </div>
            <ul className="rd-scope-list">
              {outOfScope.map((item) => (
                <li key={item}>
                  <span className="rd-scope-mark">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rd-scope-panel safe">
            <div className="rd-scope-head">
              <span className="rd-scope-icon">✓</span>
              <h3>Legal Safe Harbor</h3>
            </div>
            <ul className="rd-scope-list">
              {safeHarbor.map((item) => (
                <li key={item}>
                  <span className="rd-scope-mark">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="rd-divider" />

      {/* ── COORDINATED DISCLOSURE ────────────────────────────────────── */}
      <section className="rd-section">
        <div className="rd-eyebrow">Coordinated Disclosure</div>
        <h2 className="rd-section-title">Working Together Toward Resolution</h2>
        <p className="rd-section-sub">
          We request that researchers maintain confidentiality regarding discovered vulnerabilities
          until Magon AI has had a reasonable opportunity to investigate and remediate the issue.
          Coordinated disclosure helps protect users and reduces the risk of malicious exploitation.
          Magon AI values the efforts of the global security community &mdash; responsible disclosure
          helps us continuously improve our security posture, protect our customers, and strengthen
          the resilience of our platforms and services.
        </p>
      </section>

      {/* ── CONTACT CTA ───────────────────────────────────────────────── */}
      <section className="rd-section">
        <div className="rd-cta">
          <div className="rd-cta-grid" />
          <div className="rd-cta-glow" />
          <div className="rd-cta-tagline">
            Act in Good Faith <span>·</span> Disclose Responsibly <span>·</span> Help Us Improve
          </div>
          <h2>Contact Our Security Team</h2>
          <p>
            If you discover a security vulnerability, please contact our security team with
            detailed information about your findings. We appreciate your commitment to making the
            digital ecosystem safer for everyone.
          </p>
          <div className="rd-cta-contact-card">
            <span className="rd-cta-contact-label">Security Contact</span>
            <a href="mailto:security@magon.ai" className="rd-cta-contact-email">
              security@magon.ai
            </a>
            <p className="rd-cta-contact-goal">
              Response Goal: We aim to acknowledge security reports within a reasonable timeframe
              and keep researchers informed throughout the remediation process.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResponsibleDisclosure;