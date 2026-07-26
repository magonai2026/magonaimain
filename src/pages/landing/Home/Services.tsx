import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Services.css';

const Services: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section id="services" className="services-section">

      {/* HEADER */}
      <div className="services-header">

        <span className="services-eyebrow">
          SERVICES
        </span>

        <h2 className="services-title">
          Everything You Need to Ship Secure Code
        </h2>

        <p className="services-subtitle">
          Enterprise-grade AI security workflows designed
          for modern development teams and autonomous coding.
        </p>

      </div>

      {/* GRID */}
      <div className="services-grid">

        {/* CARD 1 */}
        <div className="service-card">

          <div className="card-glow" />

          <h3>Deep Scan Pipeline</h3>

          <p>
            A four-phase AI-driven scan that summarises every file,
            builds a global architectural model, categorises risk
            domains, and surfaces vulnerabilities with full context —
            CVSS scores, CWE IDs, and cross-file impact included.
          </p>

          <ul className="service-features">
            <li>Critical / High / Medium / Low / Info severity</li>
            <li>CWE &amp; CVSS scoring</li>
            <li>Cross-file impact analysis</li>
          </ul>

        </div>

        {/* CARD 2 */}
        <div className="service-card">

          <div className="card-glow" />

          <h3>GitHub &amp; File Upload</h3>

          <p>
            Scan any GitHub repository with a single click using our
            native GitHub App integration, or upload a ZIP archive of
            your project directly — no repository required.
          </p>

          <ul className="service-features">
            <li>GitHub App integration</li>
            <li>ZIP &amp; multi-file upload</li>
            <li>Branch-level scanning</li>
          </ul>

        </div>

        {/* CARD 3 */}
        <div className="service-card">

          <div className="card-glow" />

          <h3>Autonomous Surgical Auto-Fix</h3>

          <p>
            One click generates a surgically patched version of the
            vulnerable file, or opens a GitHub pull request with fix
            guidance — without touching a single line of safe code.
          </p>

          <ul className="service-features">
            <li>LLM surgical code edit</li>
            <li>Syntax &amp; diff verification</li>
            <li>GitHub fix PR creation</li>
          </ul>

        </div>

      </div>

      {/* CTA */}
      <div className="services-cta">

        <button
          className="services-join-btn"
          onClick={() => navigate('/contact')}
        >
          Join Us
        </button>

      </div>

    </section>
  );
};

export default Services;