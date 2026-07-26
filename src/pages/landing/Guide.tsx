import React, { useState } from 'react';
import './Guide.css';

const steps = [
  {
    number: '01',
    reverse: false,

    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <circle
          cx="22"
          cy="22"
          r="13"
          stroke="white"
          strokeWidth="2.5"
        />

        <circle
          cx="22"
          cy="22"
          r="6"
          stroke="white"
          strokeWidth="1.5"
          strokeDasharray="3 2"
          opacity="0.5"
        />

        <line
          x1="31"
          y1="31"
          x2="42"
          y2="42"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    ),

    title: 'Connect Your Repository',

    subtitle:
      'Link GitHub or upload your codebase',

    bullets: [
      {
        label: 'GitHub App',
        desc:
          'Authorize and install the Magon AI GitHub App with secure read-only repository access.',
      },

      {
        label: 'Select Repository',
        desc:
          'Choose any repository and branch from your GitHub organization or personal account.',
      },

      {
        label: 'ZIP Upload',
        desc:
          'Upload a ZIP archive directly if your project is hosted outside GitHub.',
      },
    ],

    code: null,
  },

  {
    number: '02',
    reverse: true,

    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <circle
          cx="24"
          cy="24"
          r="18"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="5 3"
          opacity="0.35"
        />

        <circle
          cx="24"
          cy="24"
          r="11"
          stroke="white"
          strokeWidth="2.5"
        />

        <line
          x1="24"
          y1="13"
          x2="24"
          y2="21"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle
          cx="24"
          cy="27"
          r="2.5"
          fill="white"
        />
      </svg>
    ),

    title: 'Run the Deep Scan',

    subtitle:
      'AI analyses every file end-to-end',

    bullets: [
      {
        label: 'Phase 1 — Map',
        desc:
          'Every file is summarized while a global architecture model of the codebase is generated.',
      },

      {
        label: 'Phase 2 — Hunt',
        desc:
          'AI agents identify vulnerabilities, attack paths, and risky cross-file relationships.',
      },

      {
        label: 'Phase 3 — Report',
        desc:
          'A structured report is generated with CVSS scores, CWE mappings, and remediation guidance.',
      },
    ],

    code: null,
  },

  {
    number: '03',
    reverse: false,

    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <circle
          cx="24"
          cy="24"
          r="16"
          stroke="white"
          strokeWidth="2.5"
        />

        <path
          d="M16 24l6 6 10-12"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    title: 'Review & Auto Patch',

    subtitle:
      'Generate surgical vulnerability fixes',

    bullets: [
      {
        label: 'Inspect Findings',
        desc:
          'Review vulnerable lines, severity scores, exploitability analysis, and root causes.',
      },

      {
        label: 'Generate Patches',
        desc:
          'Create minimal surgical fixes that preserve functionality while removing vulnerabilities.',
      },

      {
        label: 'Push to GitHub',
        desc:
          'Open pull requests directly from the dashboard with AI-generated patches applied.',
      },
    ],

    code: `// Magon AI detects vulnerable SQL concatenation
const query = "SELECT * FROM users WHERE id = " + userId;

// Automatically patched by Magon AI
const query = "SELECT * FROM users WHERE id = ?";
db.execute(query, [userId]);`,
  },
];

const faqs = [
  {
    q: 'What languages are supported?',

    a:
      'Magon AI supports JavaScript, TypeScript, Python, Go, Java, PHP, Ruby, Rust, and C/C++.',
  },

  {
    q: 'Is my code stored permanently?',

    a:
      'No. Code is processed in isolated ephemeral environments and is never permanently persisted.',
  },

  {
    q: 'Can I scan private repositories?',

    a:
      'Yes. Private repositories are fully supported through secure GitHub App permissions.',
  },

  {
    q: 'How long does scanning take?',

    a:
      'Most enterprise repositories complete scanning within 10–20 minutes depending on size.',
  },
];

const Guide: React.FC = () => {

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (

    <main className="guide-root">

      {/* Background System */}
      <div className="guide-bg-grid" />
      <div className="guide-center-glow" />

      <div className="guide-edge-light guide-edge-left" />
      <div className="guide-edge-light guide-edge-right" />

      {/* HERO */}
      <section className="guide-hero">

        <div className="guide-eyebrow">
          ✦ Documentation
        </div>

        <h1 className="guide-hero-title">

          <span className="guide-title-line">
            Secure Your Code with
          </span>

          <span className="guide-title-accent">
            Magon AI Security
          </span>

        </h1>

        <p className="guide-hero-sub">
          Connect your repository, run AI-powered deep scans,
          and automatically patch vulnerabilities with autonomous
          security orchestration.
        </p>

        <div className="guide-hero-pills">
          <span className="guide-pill">GitHub App</span>
          <span className="guide-pill">ZIP Upload</span>
          <span className="guide-pill">Auto Patch</span>
          <span className="guide-pill">Pull Requests</span>
        </div>

      </section>

      {/* CONNECTOR ROW */}
      <section className="guide-connector-row">

        {steps.map((step, index) => (

          <React.Fragment key={step.number}>

            <div className="guide-connector-item">

              <div className="guide-connector-icon">
                {step.icon}
              </div>

              <span className="guide-connector-label">
                {index + 1}. {step.title}
              </span>

            </div>

            {index < steps.length - 1 && (
              <div className="guide-connector-line" />
            )}

          </React.Fragment>

        ))}

      </section>

      {/* STEPS */}
      <section className="guide-steps">

        {steps.map((step) => (

          <div
            key={step.number}
            className={`guide-step ${step.reverse ? 'guide-step-alt' : ''}`}
          >

            <div className="guide-step-inner">

              {/* TEXT */}
              <div className="guide-step-text">

                <div className="guide-step-num">
                  STEP {step.number}
                </div>

                <h2 className="guide-step-title">
                  {step.title}
                </h2>

                <p className="guide-step-sub">
                  {step.subtitle}
                </p>

                <ul className="guide-step-bullets">

                  {step.bullets.map((bullet) => (

                    <li
                      key={bullet.label}
                      className="guide-step-bullet"
                    >

                      <span className="guide-bullet-dot" />

                      <span>
                        <strong>{bullet.label}:</strong> {bullet.desc}
                      </span>

                    </li>

                  ))}

                </ul>

                {step.code && (

                  <div className="guide-code-block">

                    <div className="guide-code-header">

                      <span
                        className="guide-code-dot"
                        style={{ background: '#ff5f57' }}
                      />

                      <span
                        className="guide-code-dot"
                        style={{ background: '#febc2e' }}
                      />

                      <span
                        className="guide-code-dot"
                        style={{ background: '#28c840' }}
                      />

                      <span className="guide-code-filename">
                        vulnerability-fix.js
                      </span>

                    </div>

                    <pre className="guide-code-pre">
                      <code>{step.code}</code>
                    </pre>

                  </div>

                )}

              </div>

              {/* VISUAL */}
              <div
                className="guide-step-visual"
                data-step={step.number}
              >

                <div className="guide-step-card">

                  <div className="guide-step-card-glow" />

                  <div className="guide-step-card-icon">
                    {step.icon}
                  </div>

                  <h3 className="guide-step-card-title">
                    {step.title}
                  </h3>

                  <p className="guide-step-card-sub">
                    {step.subtitle}
                  </p>

                  <div className="guide-step-card-tags">

                    {step.bullets.map((bullet) => (

                      <span
                        key={bullet.label}
                        className="guide-step-card-tag"
                      >
                        {bullet.label}
                      </span>

                    ))}

                  </div>

                </div>

              </div>

            </div>

          </div>

        ))}

      </section>

      {/* FAQ */}
      <section className="guide-faq">

        <div className="guide-faq-inner">

          <div className="guide-eyebrow">
            ✦ FAQ
          </div>

          <h2 className="guide-faq-title">
            Common Questions
          </h2>

          <div className="guide-faq-list">

            {faqs.map((faq, index) => (

              <div
                key={index}
                className={`guide-faq-item ${
                  openFaq === index ? 'open' : ''
                }`}
                onClick={() =>
                  setOpenFaq(openFaq === index ? null : index)
                }
              >

                <div className="guide-faq-q">

                  <span>{faq.q}</span>

                  <svg
                    className="guide-faq-arrow"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                </div>

                <div className="guide-faq-a">
                  {faq.a}
                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="guide-cta">

        <h2 className="guide-cta-title">
          Ready to Secure Your Code?
        </h2>

        <p className="guide-cta-sub">
          Join the waitlist and get early access to
          autonomous AI-powered security scanning.
        </p>

        <a
          href="/contact"
          className="guide-cta-btn"
        >
          Join the Waitlist →
        </a>

      </section>

    </main>
  );
};

export default Guide;