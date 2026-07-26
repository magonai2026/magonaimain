import React from 'react';
import './MobilePocket.css';

const MobilePocket: React.FC = () => {
  return (
    <section className="mobile-pocket-section">

      {/* Ambient Background */}
      <div className="mobile-pocket-bg-glow mobile-pocket-bg-glow-1" />
      <div className="mobile-pocket-bg-glow mobile-pocket-bg-glow-2" />

      <div className="mobile-pocket-inner">

        {/* HEADER */}
        <div className="mobile-pocket-header">

          <span className="mobile-pocket-eyebrow">
            MOBILE EXPERIENCE
          </span>

          <h2 className="mobile-pocket-title">
            AI Security Engineer
            <br />
            In Your Pocket
          </h2>

          <p className="mobile-pocket-subtitle">
            Scan repositories, review vulnerabilities,
            approve auto-fix pull requests, and monitor
            security posture from anywhere.
          </p>

        </div>

        {/* BODY */}
        <div className="mobile-pocket-body">

          {/* PHONE */}
          <div className="mobile-pocket-visual">

            <div className="phone-glow-ring" />

            <div className="phone-mockup">

              {/* Electric Border */}
              <div className="phone-electric-border" />

              {/* Reflection */}
              <div className="phone-reflection" />

              {/* Notch */}
              <div className="phone-notch" />

              {/* Screen */}
              <div className="phone-screen">

                <video
                  className="phone-video"
                  autoPlay
                  muted
                  loop
                  playsInline
                  src="https://www.w3schools.com/html/mov_bbb.mp4"
                />

                {/* Overlay */}
                <div className="phone-screen-overlay">

                  <div className="phone-ui">

                    <div className="phone-ui-top">
                      <span className="phone-ui-status">
                        LIVE SECURITY MONITOR
                      </span>
                    </div>

                    <div className="phone-ui-center">

                      <div className="phone-alert-card">
                        <div className="phone-alert-dot" />

                        <div className="phone-alert-content">
                          <span className="phone-alert-title">
                            Vulnerability Detected
                          </span>

                          <span className="phone-alert-sub">
                            Critical auth bypass vulnerability
                          </span>
                        </div>
                      </div>

                      <div className="phone-pr-card">

                        <span className="phone-pr-label">
                          AUTO-FIX READY
                        </span>

                        <button className="phone-pr-btn">
                          Approve PR
                        </button>

                      </div>

                    </div>

                    <div className="phone-ui-bottom">
                      AI security agent connected
                    </div>

                  </div>

                </div>
              </div>

              {/* Home bar */}
              <div className="phone-home-bar" />

            </div>

          </div>

          {/* TEXT SIDE */}
          <div className="mobile-pocket-text">

            <div className="mobile-pocket-tagline-wrap">

              <div className="mobile-pocket-tagline-bar" />

              <p className="mobile-pocket-tagline">
                Enterprise-grade mobile security workflows powered by AI.
              </p>

            </div>

            <ul className="mobile-pocket-features">

              <li>
                <span className="mpf-icon">
                  ✓
                </span>

                Trigger deep repository scans directly from mobile
              </li>

              <li>
                <span className="mpf-icon">
                  ✓
                </span>

                Receive real-time vulnerability alerts and summaries
              </li>

              <li>
                <span className="mpf-icon">
                  ✓
                </span>

                Review and approve AI-generated security fix PRs
              </li>

              <li>
                <span className="mpf-icon">
                  ✓
                </span>

                Monitor audit history and remediation activity anywhere
              </li>

            </ul>

            <a
              href="/contact"
              className="mobile-pocket-cta"
            >
              Get Early Access
            </a>

          </div>

        </div>

      </div>

    </section>
  );
};

export default MobilePocket;