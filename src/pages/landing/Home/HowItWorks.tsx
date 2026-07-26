import React from 'react';
import './HowItWorks.css';

const SDP_CARDS = [
  {
    step: '01',
    label: 'Scan Agent',
    tagline: 'Understand everything, miss nothing',
    description:
      'A deep multi-phase AI scan reads every file, builds a global architectural model, and maps your entire codebase — giving you complete visibility before a single vulnerability is named.',
    accent: '#2d7a4f',
    accentRgb: '45,122,79',
    bg: 'linear-gradient(135deg, #f0faf4 0%, #e6f5ec 100%)',
    reverse: false,
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="54" stroke="#2d7a4f" strokeWidth="1" strokeDasharray="6 4" opacity="0.2"/>
        <circle cx="60" cy="60" r="36" stroke="#2d7a4f" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.35"/>
        <circle cx="52" cy="52" r="22" stroke="#2d7a4f" strokeWidth="3"/>
        <circle cx="52" cy="52" r="10" fill="#2d7a4f" opacity="0.12"/>
        <circle cx="52" cy="52" r="5"  fill="#2d7a4f" opacity="0.5"/>
        <line x1="69" y1="69" x2="90" y2="90" stroke="#2d7a4f" strokeWidth="4" strokeLinecap="round"/>
        <line x1="30" y1="22" x2="30" y2="32" stroke="#2d7a4f" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
        <line x1="25" y1="27" x2="35" y2="27" stroke="#2d7a4f" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
  },
  {
    step: '02',
    label: 'Detect Agent',
    tagline: 'Surface threats with surgical clarity',
    description:
      'Pinpoint every vulnerability with full context — CVSS scores, CWE IDs, severity levels, and cross-file impact chains. Know exactly what is broken, where it lives, and why it matters.',
    accent: '#c0392b',
    accentRgb: '192,57,43',
    bg: 'linear-gradient(135deg, #fdf4f3 0%, #fae8e6 100%)',
    reverse: true,
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="54" stroke="#c0392b" strokeWidth="1" strokeDasharray="6 4" opacity="0.18"/>
        <circle cx="60" cy="60" r="38" stroke="#c0392b" strokeWidth="1.5" opacity="0.25"/>
        <circle cx="60" cy="60" r="24" stroke="#c0392b" strokeWidth="2.5"/>
        <circle cx="60" cy="60" r="10" fill="#c0392b" opacity="0.15"/>
        <line x1="60" y1="22" x2="60" y2="46" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        <line x1="60" y1="74" x2="60" y2="98" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        <line x1="22" y1="60" x2="46" y2="60" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        <line x1="74" y1="60" x2="98" y2="60" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        <path d="M60 50 L60 63" stroke="#c0392b" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="60" cy="72" r="3.5" fill="#c0392b"/>
      </svg>
    ),
  },
  {
    step: '03',
    label: 'Patch Agent',
    tagline: 'Fix it fast, fix it right',
    description:
      'One click generates a surgically patched file or opens a GitHub pull request with precise fix guidance — touching only the vulnerable lines, leaving every safe line exactly as it was.',
    accent: '#1a1a1a',
    accentRgb: '26,26,26',
    bg: 'linear-gradient(135deg, #f5f5f5 0%, #ebebeb 100%)',
    reverse: false,
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="54" stroke="#1a1a1a" strokeWidth="1" strokeDasharray="6 4" opacity="0.12"/>
        <circle cx="60" cy="60" r="36" stroke="#1a1a1a" strokeWidth="2" opacity="0.15"/>
        <circle cx="60" cy="60" r="22" stroke="#1a1a1a" strokeWidth="3"/>
        <path d="M46 60 L55 70 L75 48" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="86" cy="30" r="9" fill="#1a1a1a"/>
        <path d="M83 30 L85.5 32.5 L90.5 27.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    step: '04',
    label: 'Secure Agent',
    tagline: 'Fortify your software lifecycle',
    description:
      'Integrate seamless security checks directly into your workflow. MagonAI ensures your deployed code remains fortified against emerging threats, automatically enforcing robust security guardrails.',
    accent: '#2563eb',
    accentRgb: '37,99,235',
    bg: 'linear-gradient(135deg, #f0f7ff 0%, #e6f2ff 100%)',
    reverse: true,
    icon: (
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="54" stroke="#2563eb" strokeWidth="1" strokeDasharray="6 4" opacity="0.15"/>
        <circle cx="60" cy="60" r="40" stroke="#2563eb" strokeWidth="1.5" opacity="0.2"/>
        <path d="M60 25 L35 35 V55 C35 75 45 90 60 95 C75 90 85 75 85 55 V35 L60 25 Z" stroke="#2563eb" strokeWidth="3" strokeLinejoin="round"/>
        <path d="M50 60 L57 67 L72 50" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
] as const;

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="sdp-section">
      <div className="sdp-header">
        <span className="sdp-eyebrow">How it works</span>
        <h2 className="sdp-title">Four steps to a secure codebase</h2>
      </div>
      <div className="sdp-cards">
        {SDP_CARDS.map(({ step, label, tagline, description, accent, accentRgb, bg, reverse, icon }) => (
          <div
            key={label}
            className={`sdp-card${reverse ? ' sdp-card-reverse' : ''}`}
            style={{ '--accent': accent, '--accent-rgb': accentRgb, '--card-bg': bg } as React.CSSProperties}
          >
            <div className="sdp-card-visual" data-step={step}>
              <div className="sdp-card-icon-ring">{icon}</div>
            </div>
            <div className="sdp-card-body">
              <span className="sdp-card-step">{step}</span>
              <h3 className="sdp-card-label">{label}</h3>
              <p className="sdp-card-tagline">{tagline}</p>
              <p className="sdp-card-description">{description}</p>
            </div>
            <div className="sdp-card-stripe" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;