import React from 'react';
import './Archer.css';

const Archer: React.FC = () => {
  return (
    <section id="archer" className="section archer-section">
      <h2 className="section-title">Precision Vulnerability Detection</h2>
      <p className="archer-subtitle">
        Our deep scan pipeline targets every vulnerability with surgical precision. Like an arrow hitting the bullseye,
        magonai Code pinpoints exactly what is broken, where it is, and how to fix it — every single time.
      </p>
      <div className="archer-animation-container">
        <svg viewBox="0 0 1000 400" style={{ overflow: 'visible' }}>
          <defs>
            <radialGradient id="targetGradient1"><stop offset="0%" stopColor="#f0f0f0"/><stop offset="100%" stopColor="#c0c0c0"/></radialGradient>
            <radialGradient id="targetGradient2"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#e8e8e8"/></radialGradient>
            <radialGradient id="targetGradient3"><stop offset="0%" stopColor="#5dade2"/><stop offset="100%" stopColor="#2e86c1"/></radialGradient>
            <radialGradient id="targetGradient4"><stop offset="0%" stopColor="#e74c3c"/><stop offset="100%" stopColor="#c0392b"/></radialGradient>
            <radialGradient id="targetGradient5"><stop offset="0%" stopColor="#f4d03f"/><stop offset="100%" stopColor="#f1c40f"/></radialGradient>
            <linearGradient id="bowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#8b4513"/>
              <stop offset="50%"  stopColor="#654321"/>
              <stop offset="100%" stopColor="#8b4513"/>
            </linearGradient>
          </defs>
          <g id="target" transform="translate(850, 180)">
            <ellipse cx="8" cy="8" rx="75" ry="75" fill="rgba(0,0,0,0.1)" />
            <circle cx="0" cy="0" r="70" fill="url(#targetGradient1)" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.2))"/>
            <circle cx="0" cy="0" r="56" fill="url(#targetGradient2)" />
            <circle cx="0" cy="0" r="42" fill="url(#targetGradient3)" />
            <circle cx="0" cy="0" r="28" fill="url(#targetGradient4)" />
            <circle cx="0" cy="0" r="14" fill="url(#targetGradient5)" />
            <g id="impact-mark" opacity="0">
              <line x1="0" y1="0" x2="-8" y2="-8" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="0" x2="10" y2="-6" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="0" x2="-6" y2="9"  stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="0" y1="0" x2="7"  y2="8"  stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="0" cy="0" r="3" fill="#222" opacity="0.6"/>
              <circle cx="0" cy="0" r="8" fill="none" stroke="#fff" strokeWidth="2" opacity="0.5"/>
            </g>
            <ellipse cx="-15" cy="-15" rx="25" ry="25" fill="white" opacity="0.2" />
          </g>
          <g id="bow-and-arrow-group">
            <path id="bow" d="M50,40 C130,110 130,250 50,320" stroke="url(#bowGradient)" strokeWidth="8" fill="none" strokeLinecap="round" filter="drop-shadow(2px 2px 3px rgba(0,0,0,0.3))" />
            <g id="arrow">
              <path d="M0,180 L105,180" stroke="#8b4513" strokeWidth="5" fill="none" strokeLinecap="round" filter="drop-shadow(1px 1px 2px rgba(0,0,0,0.3))" />
              <polygon points="105,174 121,180 105,186" fill="#303030" stroke="#303030" strokeWidth="1" filter="drop-shadow(1px 1px 2px rgba(0,0,0,0.3))" />
              <path d="M5,174 L18,180 L5,186 Z" fill="#c0392b" stroke="#c0392b" strokeWidth="1"/>
            </g>
            <path id="bow-string" d="M50,40 C50,133, 50,227, 50,320" stroke="#d4af37" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
          </g>
        </svg>
      </div>
    </section>
  );
};

export default Archer;