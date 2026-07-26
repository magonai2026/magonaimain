import React from 'react';
import './Research.css';

const Research: React.FC = () => {
  return (

    <main className="research-page">

      {/* Background System */}
      <div className="research-grid-bg" />
      <div className="research-center-glow" />

      <div className="research-edge-light research-edge-left" />
      <div className="research-edge-light research-edge-right" />

      {/* Hero */}
      <section className="research-hero">

        <div className="research-badge">
          ✦ Advanced AI Security Research
        </div>

        <h1 className="research-title">
          <span className="research-title-line">
            Building the Future of
          </span>

          <span className="research-title-accent">
            Autonomous Security
          </span>
        </h1>

        <p className="research-description">
          We research cutting-edge AI systems for vulnerability detection,
          automated code repair, threat intelligence, and multi-agent security
          orchestration — enabling enterprises to secure AI-generated software
          at unprecedented scale.
        </p>

      </section>

      {/* Research Grid */}
      <section className="research-grid">

        {/* CARD 1 */}
        <div className="research-card">
          <div className="research-card-content">

            <div className="research-details">
              <h3>
                AI-Powered Vulnerability Detection in Enterprise Codebases
              </h3>

              <p>
                Developing advanced machine learning models that analyze source
                code at scale to identify security vulnerabilities before they
                reach production. Our multi-phase detection pipeline combines
                static analysis, semantic understanding, and contextual risk
                assessment to achieve industry-leading accuracy.
              </p>
            </div>

            <div className="research-meta-section">

              <div className="meta-item">
                <span className="meta-label">
                  Research Area
                </span>

                <div className="meta-value">
                  Code Security & AI
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-label">
                  Status
                </span>

                <div className="meta-value highlight">
                  Active Development
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-label">
                  Applications
                </span>

                <ul className="uses-list">
                  <li>Enterprise security scanning</li>
                  <li>CI/CD pipeline integration</li>
                  <li>Real-time vulnerability alerts</li>
                  <li>Automated patch generation</li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* CARD 2 */}
        <div className="research-card">
          <div className="research-card-content">

            <div className="research-details">
              <h3>
                Large Language Models for Automated Code Repair
              </h3>

              <p>
                Exploring surgical AI-driven code editing systems that preserve
                software semantics while eliminating vulnerabilities. Our work
                combines formal verification and advanced LLM reasoning to
                produce secure, context-aware patches at enterprise scale.
              </p>
            </div>

            <div className="research-meta-section">

              <div className="meta-item">
                <span className="meta-label">
                  Research Area
                </span>

                <div className="meta-value">
                  LLMs & Code Generation
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-label">
                  Status
                </span>

                <div className="meta-value highlight">
                  Production Ready
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-label">
                  Applications
                </span>

                <ul className="uses-list">
                  <li>Surgical auto-fix generation</li>
                  <li>Context-aware patching</li>
                  <li>Multi-file refactoring</li>
                  <li>Pull request automation</li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* CARD 3 */}
        <div className="research-card">
          <div className="research-card-content">

            <div className="research-details">
              <h3>
                Multi-Agent Systems for Deep Code Analysis
              </h3>

              <p>
                Investigating distributed AI architectures where specialized
                agents collaborate to perform holistic security analysis across
                massive codebases. This enables deep contextual reasoning that
                traditional static analysis systems cannot achieve.
              </p>
            </div>

            <div className="research-meta-section">

              <div className="meta-item">
                <span className="meta-label">
                  Research Area
                </span>

                <div className="meta-value">
                  Agent Orchestration
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-label">
                  Status
                </span>

                <div className="meta-value highlight">
                  Research Phase
                </div>
              </div>

              <div className="meta-item">
                <span className="meta-label">
                  Applications
                </span>

                <ul className="uses-list">
                  <li>Deep codebase scanning</li>
                  <li>Cross-file impact analysis</li>
                  <li>Architectural risk mapping</li>
                  <li>Compliance verification</li>
                </ul>
              </div>

            </div>
          </div>
        </div>

      </section>

    </main>
  );
};

export default Research;