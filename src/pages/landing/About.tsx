import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (

    <main className="about-page">

      {/* Background System */}
      <div className="about-grid-bg" />
      <div className="about-center-glow" />

      <div className="about-edge-light about-edge-left" />
      <div className="about-edge-light about-edge-right" />

      {/* HERO */}
      <section className="about-hero">

        <div className="about-badge">
          ✦ AI Safety • Security • Innovation
        </div>

        <h1 className="about-title">

          <span className="about-title-line">
            Innovating for a
          </span>

          <span className="about-title-accent">
            Better Tomorrow
          </span>

        </h1>

        <p className="about-description">
          We’re a team of engineers, researchers, and innovators building
          next-generation AI systems focused on security, automation,
          transparency, and human-centered technology.
        </p>

      </section>

      {/* STORY */}
      <section className="about-section">

        <div className="story-section">

          <h2>Our Story</h2>

          <p>
            Founded in 2025,
            <span className="story-highlight"> Niyantri Labs </span>
            emerged from a simple belief:
            technology should empower humanity — not control it.
          </p>

          <p>
            What began as a small initiative in Hyderabad evolved into a
            research-driven AI security company focused on building
            intelligent systems that protect, automate, and scale securely.
          </p>

          <p>
            The name
            <span className="story-highlight"> Niyantri </span>
            means “controller” in Sanskrit — representing our mission to give
            people meaningful control over the AI systems shaping modern life.
          </p>

          <p>
            Today, we work at the frontier of AI safety, code intelligence,
            multi-agent orchestration, and autonomous vulnerability detection.
          </p>

        </div>

      </section>

      {/* VALUES */}
      <section className="about-section">

        <h2 className="section-title">
          Our Core Values
        </h2>

        <p className="section-subtitle">
          The principles guiding every model, system, and platform we build.
        </p>

        <div className="values-grid">

          <div className="value-card">

            <div className="value-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3>Safety First</h3>

            <p>
              Security and trust remain central to every AI system and platform
              we develop.
            </p>

          </div>

          <div className="value-card">

            <div className="value-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h3>Innovation</h3>

            <p>
              We continuously push the boundaries of AI-powered automation,
              reasoning, and intelligent security.
            </p>

          </div>

          <div className="value-card">

            <div className="value-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <h3>Transparency</h3>

            <p>
              We believe AI systems should remain understandable, auditable,
              and aligned with human values.
            </p>

          </div>

        </div>

      </section>

      {/* TEAM */}
      <section className="about-section">

        <h2 className="section-title">
          Our Team
        </h2>

        <p className="section-subtitle">
          Builders, researchers, and engineers creating the future of secure AI.
        </p>

        <div className="team-grid">

          <div className="team-card">

            <div className="team-avatar">
              CVST
            </div>

            <h3>
              Chappidi Venkata Sri Teja
            </h3>

            <div className="role">
              CEO & Founder
            </div>

            <p>
              Leading the vision for safe, transparent, and scalable AI systems.
            </p>

          </div>

          <div className="team-card">

            <div className="team-avatar">
              GSR
            </div>

            <h3>
              Geggelapally Shiva Reddy
            </h3>

            <div className="role">
              CTO & Co-Founder
            </div>

            <p>
              Architecting multi-agent AI systems and intelligent security
              infrastructure.
            </p>

          </div>

          <div className="team-card">

            <div className="team-avatar">
              EVS
            </div>

            <h3>
              Endla Venkat Sai
            </h3>

            <div className="role">
              CMO & Co-Founder
            </div>

            <p>
              Driving product strategy, partnerships, and global growth
              initiatives.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
};

export default About;