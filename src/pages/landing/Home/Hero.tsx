import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero: React.FC = () => {

  const navigate = useNavigate();

  return (

    <section className="magon-hero">

      {/* Background Grid */}
      <div className="hero-dot-grid" aria-hidden="true" />

      {/* Cinematic Center Glow */}
      <div className="hero-center-glow" />

      {/* Edge Ambient Lights */}
      <div className="hero-edge-light edge-left" />
      <div className="hero-edge-light edge-right" />

      {/* ── BLUE WAVE — hugs left edge ── */}
      <svg
        className="hero-wave-svg hero-wave-blue"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id="blueGlow" x="-100%" y="-20%" width="300%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Primary strand — starts offscreen left-bottom, exits top-left area */}
        {/* x values kept left: ~-80 to ~260 so it stays on left edge */}
        <path
          d="M -80 940 C -40 720, 10 560, 80 400 C 150 240, 190 175, 240 80 C 260 35, 275 5, 290 -30"
          stroke="rgba(99,179,237,0.06)"
          strokeWidth="80"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M -80 940 C -40 720, 10 560, 80 400 C 150 240, 190 175, 240 80 C 260 35, 275 5, 290 -30"
          stroke="rgba(99,179,237,0.12)"
          strokeWidth="40"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M -80 940 C -40 720, 10 560, 80 400 C 150 240, 190 175, 240 80 C 260 35, 275 5, 290 -30"
          stroke="rgba(147,210,255,0.28)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M -80 940 C -40 720, 10 560, 80 400 C 150 240, 190 175, 240 80 C 260 35, 275 5, 290 -30"
          stroke="rgba(186,230,255,0.58)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          filter="url(#blueGlow)"
        />
        <path
          d="M -80 940 C -40 720, 10 560, 80 400 C 150 240, 190 175, 240 80 C 260 35, 275 5, 290 -30"
          stroke="rgba(230,248,255,0.92)"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Second strand — ~22px to the right of the first */}
        <path
          d="M -58 940 C -18 720, 32 560, 102 400 C 172 240, 212 175, 262 80 C 282 35, 297 5, 312 -30"
          stroke="rgba(99,179,237,0.04)"
          strokeWidth="50"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M -58 940 C -18 720, 32 560, 102 400 C 172 240, 212 175, 262 80 C 282 35, 297 5, 312 -30"
          stroke="rgba(147,210,255,0.18)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M -58 940 C -18 720, 32 560, 102 400 C 172 240, 212 175, 262 80 C 282 35, 297 5, 312 -30"
          stroke="rgba(186,230,255,0.42)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M -58 940 C -18 720, 32 560, 102 400 C 172 240, 212 175, 262 80 C 282 35, 297 5, 312 -30"
          stroke="rgba(230,248,255,0.78)"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* ── PURPLE WAVE — hugs right edge ── */}
      <svg
        className="hero-wave-svg hero-wave-purple"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id="purpleGlow" x="-100%" y="-20%" width="300%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Primary strand — starts top-right offscreen, exits bottom-right area */}
        {/* x values: ~1150 to ~1520, stays on right edge */}
        <path
          d="M 1520 -30 C 1500 60, 1470 160, 1420 280 C 1365 410, 1330 480, 1285 590 C 1248 680, 1220 750, 1195 940"
          stroke="rgba(168,85,247,0.06)"
          strokeWidth="80"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 1520 -30 C 1500 60, 1470 160, 1420 280 C 1365 410, 1330 480, 1285 590 C 1248 680, 1220 750, 1195 940"
          stroke="rgba(168,85,247,0.14)"
          strokeWidth="40"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 1520 -30 C 1500 60, 1470 160, 1420 280 C 1365 410, 1330 480, 1285 590 C 1248 680, 1220 750, 1195 940"
          stroke="rgba(192,132,252,0.30)"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 1520 -30 C 1500 60, 1470 160, 1420 280 C 1365 410, 1330 480, 1285 590 C 1248 680, 1220 750, 1195 940"
          stroke="rgba(216,180,254,0.62)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          filter="url(#purpleGlow)"
        />
        <path
          d="M 1520 -30 C 1500 60, 1470 160, 1420 280 C 1365 410, 1330 480, 1285 590 C 1248 680, 1220 750, 1195 940"
          stroke="rgba(245,235,255,0.94)"
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Second strand — ~22px to the left of the first */}
        <path
          d="M 1498 -30 C 1478 60, 1448 160, 1398 280 C 1343 410, 1308 480, 1263 590 C 1226 680, 1198 750, 1173 940"
          stroke="rgba(168,85,247,0.04)"
          strokeWidth="50"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 1498 -30 C 1478 60, 1448 160, 1398 280 C 1343 410, 1308 480, 1263 590 C 1226 680, 1198 750, 1173 940"
          stroke="rgba(192,132,252,0.20)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 1498 -30 C 1478 60, 1448 160, 1398 280 C 1343 410, 1308 480, 1263 590 C 1226 680, 1198 750, 1173 940"
          stroke="rgba(216,180,254,0.45)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 1498 -30 C 1478 60, 1448 160, 1398 280 C 1343 410, 1308 480, 1263 590 C 1226 680, 1198 750, 1173 940"
          stroke="rgba(245,235,255,0.80)"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {/* Hero Content */}
      <div className="hero-content">

        {/* Announcement Banner */}
        <a href="#" className="hero-announcement">
          <span className="hero-announcement-icon">✦</span>
          <span className="hero-announcement-text">
            Introducing AI-Native Threat Intelligence for the Enterprise
          </span>
          <svg className="hero-announcement-arrow" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10M8 3l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>

        {/* Main Heading */}
        <h1 className="hero-heading">
          <span className="hero-heading-line">AI-Powered Security for</span>
          <span className="hero-h1-accent">Vibe Coding</span>
        </h1>

        {/* Subheading */}
        <p className="hero-subheading">
          Autonomous defense for the way AI builds today.
        </p>

        {/* Description */}
        <p className="hero-description">
          Vibe coding moves fast — Magon AI moves faster.
          Instantly scan, detect, and auto-fix vulnerabilities
          in AI-generated websites and apps before they reach production.
        </p>

        {/* CTA Buttons */}
        <div className="hero-cta-group">
          <button
            className="hero-cta-primary"
            onClick={() => navigate('/login')}
          >
            Explore the platform
            <svg className="hero-cta-icon" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 10h12M10 4l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button className="hero-cta-secondary">Watch Demo</button>
        </div>

      </div>

    </section>

  );
};

export default Hero;