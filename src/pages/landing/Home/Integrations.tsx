import React from 'react';
import './Integrations.css';

const LEFT_INTEGRATIONS = [
  {
    name: 'GitHub',
    desc: 'Native app & PR auto-fixes',
    accent: '#60a5fa',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="#60a5fa"/>
      </svg>
    ),
  },

  {
    name: 'Slack',
    desc: 'Instant alerts in any channel',
    accent: '#818cf8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.521 2.521 2.527 2.527 0 0 1-2.521-2.521V2.522A2.527 2.527 0 0 1 15.167 0a2.528 2.528 0 0 1 2.521 2.522v6.312zM15.167 18.956a2.527 2.527 0 0 1 2.521 2.522A2.528 2.528 0 0 1 15.167 24a2.527 2.527 0 0 1-2.521-2.522v-2.522h2.521zM15.167 17.688a2.527 2.527 0 0 1-2.521-2.521 2.527 2.527 0 0 1 2.521-2.521h6.312A2.528 2.528 0 0 1 24 15.167a2.528 2.528 0 0 1-2.522 2.521h-6.311z" fill="#818cf8"/>
      </svg>
    ),
  },

  {
    name: 'Linear',
    desc: 'Auto-create issues per finding',
    accent: '#a855f7',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.275 14.372a9.957 9.957 0 0 0 6.353 6.353l-6.353-6.353zM2.371 11.383l10.246 10.246A10.025 10.025 0 0 1 2 12c0-.207.005-.413.014-.617l.357.357v-.357zM2.195 8.73L15.27 21.805A10.02 10.02 0 0 1 12 22a9.971 9.971 0 0 1-.617-.014L2 12.617A10.02 10.02 0 0 1 2 12a9.971 9.971 0 0 1 .195-1.27zM3.55 5.785L18.215 20.45A10.007 10.007 0 0 1 5.785 20.45a9.97 9.97 0 0 1-3.55-5.785L3.55 5.785zM5.785 3.55A10.007 10.007 0 0 1 20.45 18.215L5.785 3.55z" fill="#a855f7"/>
      </svg>
    ),
  },
] as const;

const RIGHT_INTEGRATIONS = [
  {
    name: 'Microsoft Teams',
    desc: 'Reports to your channels',
    accent: '#60a5fa',
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M20 2H4C2.9 2 2 2.9 2 4v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="rgba(96,165,250,0.15)"/>
        <circle cx="15.5" cy="7.5" r="2.5" fill="#60a5fa"/>
      </svg>
    ),
  },

  {
    name: 'Jira',
    desc: 'Tickets by severity, auto-assigned',
    accent: '#818cf8',
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M11.975 2.006L2.148 11.83a.5.5 0 0 0 0 .708l4.243 4.243a.5.5 0 0 0 .707 0l4.95-4.95 4.95 4.95a.5.5 0 0 0 .707 0l4.243-4.243a.5.5 0 0 0 0-.708L12.682 2.006a.5.5 0 0 0-.707 0z" fill="#818cf8"/>
      </svg>
    ),
  },

  {
    name: 'Email',
    desc: 'Digest reports on schedule',
    accent: '#a855f7',
    icon: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" fill="rgba(168,85,247,0.1)" stroke="#a855f7" strokeWidth="1.5"/>
        <path d="M2 7l10 7 10-7" stroke="#a855f7" strokeWidth="1.5"/>
      </svg>
    ),
  },
] as const;

const Integrations: React.FC = () => {
  return (
    <section className="integrations-section">
      <div className="integrations-inner">

        <div className="integrations-header">
          <span className="integrations-eyebrow">
            INTEGRATIONS
          </span>

          <h2 className="integrations-title">
            Works where your team works
          </h2>

          <p className="integrations-sub">
            MagonAI plugs directly into the tools your team already uses —
            delivering security alerts, fix suggestions, and PR notifications
            without leaving your workflow.
          </p>
        </div>

        <div className="integrations-hub">

          {/* LEFT */}
          <div className="integrations-col integrations-col-left">
            {LEFT_INTEGRATIONS.map(({ name, desc, accent, icon }) => (
              <div
                key={name}
                className="int-card"
                style={{ '--int-accent': accent } as React.CSSProperties}
              >
                <div className="int-card-icon">
                  {icon}
                </div>

                <div className="int-card-text">
                  <span className="int-card-name">{name}</span>
                  <span className="int-card-desc">{desc}</span>
                </div>

                <div className="int-connector-dot" />
              </div>
            ))}
          </div>

          {/* CENTER */}
          <div className="integrations-center">

            <svg
              className="int-lines-svg"
              viewBox="0 0 260 420"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line x1="0" y1="112" x2="113" y2="204" stroke="rgba(129,140,248,0.24)" strokeWidth="1.2" strokeDasharray="5 4"/>
              <line x1="0" y1="210" x2="108" y2="210" stroke="rgba(129,140,248,0.36)" strokeWidth="1.2" strokeDasharray="5 4"/>
              <line x1="0" y1="308" x2="113" y2="216" stroke="rgba(129,140,248,0.24)" strokeWidth="1.2" strokeDasharray="5 4"/>

              <line x1="260" y1="112" x2="147" y2="204" stroke="rgba(129,140,248,0.24)" strokeWidth="1.2" strokeDasharray="5 4"/>
              <line x1="260" y1="210" x2="152" y2="210" stroke="rgba(129,140,248,0.36)" strokeWidth="1.2" strokeDasharray="5 4"/>
              <line x1="260" y1="308" x2="147" y2="216" stroke="rgba(129,140,248,0.24)" strokeWidth="1.2" strokeDasharray="5 4"/>
            </svg>

            <div className="int-hub-node">

              <div className="int-hub-rings" />

              <div className="int-hub-logo-wrap">
                <img
                  src="/mangoai.png"
                  alt="MagonAI"
                  className="int-hub-img"
                />
              </div>

              <span className="int-hub-label">
                MAGONAI
              </span>
            </div>
          </div>

          {/* RIGHT */}
          <div className="integrations-col integrations-col-right">
            {RIGHT_INTEGRATIONS.map(({ name, desc, accent, icon }) => (
              <div
                key={name}
                className="int-card int-card-right"
                style={{ '--int-accent': accent } as React.CSSProperties}
              >
                <div className="int-connector-dot" />

                <div className="int-card-icon">
                  {icon}
                </div>

                <div className="int-card-text">
                  <span className="int-card-name">{name}</span>
                  <span className="int-card-desc">{desc}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        <p className="integrations-tagline">
          Webhooks & custom destinations available on all plans.
        </p>

      </div>
    </section>
  );
};

export default Integrations;