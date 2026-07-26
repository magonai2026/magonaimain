import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AiTools.css';

// All AI + Vibe coding tools in one unified list
const AI_TOOLS: {
  name: string;
  glow: string;
  color?: string;
  imgSrc?: string;
  icon?: React.ReactNode;
}[] = [
  {
    name: 'ChatGPT',
    color: '#10a37f',
    glow: 'rgba(16,163,127,0.3)',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name: 'Claude',
    color: '#cc785c',
    glow: 'rgba(204,120,92,0.35)',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017L3.674 20H0L6.57 3.52zm4.132 9.959L8.453 7.687 6.205 13.479h4.496z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name: 'Gemini',
    color: '#4285f4',
    glow: 'rgba(66,133,244,0.3)',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285f4"/>
            <stop offset="50%" stopColor="#9b72cb"/>
            <stop offset="100%" stopColor="#d96570"/>
          </linearGradient>
        </defs>
        <path d="M12 24A14.304 14.304 0 0 0 0 12 14.304 14.304 0 0 0 12 0a14.305 14.305 0 0 0 12 12 14.305 14.305 0 0 0-12 12" fill="url(#geminiGrad)"/>
      </svg>
    ),
  },
  {
    name: 'DeepSeek',
    color: '#4D6BFE',
    glow: 'rgba(77,107,254,0.3)',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="deepseekGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4D6BFE"/>
            <stop offset="100%" stopColor="#6B8EFF"/>
          </linearGradient>
        </defs>
        <path d="M23.748 11.11a.832.832 0 0 0-.088-.314c-.634-1.229-1.755-1.765-3.077-1.788-.765-.014-1.49.195-2.168.561-.087.047-.14.04-.211-.03-.494-.491-.975-.994-1.55-1.38-1.048-.7-2.21-1.002-3.463-.944-1.24.057-2.356.476-3.306 1.264-.162.134-.31.28-.481.437l-.28-.42c-.434-.64-.985-1.14-1.744-1.35-1.044-.291-1.99-.077-2.82.592-.082.067-.129.063-.202-.005C4.017 7.3 3.6 6.972 3.13 6.73a4.715 4.715 0 0 0-.955-.354.275.275 0 0 0-.338.192.27.27 0 0 0 .155.322c.102.044.205.092.303.148.625.356 1.072.883 1.378 1.528.06.126.044.212-.062.308-.877.792-1.404 1.78-1.544 2.958-.16 1.347.183 2.552.99 3.619.81 1.07 1.886 1.72 3.203 1.963 1.463.269 2.82-.012 4.03-.844.163-.112.31-.243.481-.34.297-.17.618-.16.906.012.258.155.496.337.755.492.96.572 1.997.87 3.12.817 1.15-.054 2.178-.449 3.056-1.18.097-.08.147-.08.245-.002.55.44 1.158.782 1.848.96 1.198.307 2.305.1 3.268-.66.536-.42.9-.967 1.056-1.637.256-1.092.042-2.098-.277-3.12zm-14.3 3.946c-.796.644-1.717.9-2.74.73-1.29-.217-2.26-1.256-2.356-2.563-.072-.977.22-1.836.884-2.552.667-.718 1.508-1.063 2.5-1.018.872.04 1.612.399 2.193 1.053.565.637.822 1.39.79 2.238-.026.85-.368 1.558-.87 1.97-.131.106-.27.197-.4.142zm9.49.978c-.476.505-1.075.76-1.77.77-.7.01-1.305-.23-1.793-.722-.495-.5-.74-1.107-.736-1.812.003-.698.258-1.298.759-1.789.497-.488 1.1-.733 1.795-.733.7 0 1.305.248 1.8.742.491.49.733 1.093.73 1.79-.003.7-.257 1.253-.785 1.754z" fill="url(#deepseekGrad)"/>
      </svg>
    ),
  },
  {
    name: 'Lovable',
    glow: 'rgba(243,112,47,0.35)',
    imgSrc: 'https://lovable.dev/favicon.ico',
  },
  {
    name: 'Emergent',
    glow: 'rgba(255,255,255,0.15)',
    imgSrc: 'https://cdn2.futurepedia.io/2025-11-03T20-30-35.584Z-zx4HqPUXaDxHQ9tn1t4LOLK0j5_uvt0QV.jpg?w=256',
  },
  {
    name: 'Cursor',
    glow: 'rgba(200,200,200,0.2)',
    imgSrc: 'https://www.cursor.com/assets/images/logo.svg',
  },
  {
    name: 'Replit',
    glow: 'rgba(242,98,7,0.35)',
    imgSrc: 'https://cdn2.futurepedia.io/273e25784ddd17a8ae900fb3f27e047202fdbe64-128x128.png?w=256',
  },
];

const AiTools: React.FC = () => {
  const navigate = useNavigate();
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <>
      <section className="ai-tools-section">
        {/* Background decorative orbs */}
        

        <div className="ai-tools-inner">
          <div className="ai-tools-eyebrow">
            <span className="ai-tools-eyebrow-dot" />
            The problem
            <span className="ai-tools-eyebrow-dot" />
          </div>

          <h2 className="ai-tools-title">
            AI tools built your codebase.<br />
            Who's <span className="ai-tools-securing">securing</span> it today?
          </h2>

          <p className="ai-tools-subtitle">
            Over 40% of AI-generated code ships with at least one exploitable vulnerability.
          </p>

          <div className="ai-tools-logos">
            {AI_TOOLS.map(({ name, color, glow, icon, imgSrc }) => (
              <div
                key={name}
                className="ai-tool-item"
                style={{ '--tool-color': color ?? 'rgba(255,255,255,0.6)', '--tool-glow': glow } as React.CSSProperties}
              >
                <div className="ai-tool-icon-wrap">
                  <div className="ai-tool-glow-ring" />
                  <div className="ai-tool-icon" style={{ color: color ?? 'rgba(255,255,255,0.8)' }}>
                    {imgSrc
                      ? <img src={imgSrc} alt={name} className="vibe-logo-img" />
                      : icon
                    }
                  </div>
                </div>
                <span className="ai-tool-name">{name}</span>
              </div>
            ))}
          </div>

          <div className="ai-tools-tagline-wrap">
            <div className="ai-tools-tagline-bar" />
            <p className="ai-tools-tagline">
              Fast code is easy.<br />
              <span className="ai-tools-secure">Secure</span> code needs <span className="ai-tools-niyantri">magonai.</span>
            </p>
            <div className="ai-tools-tagline-bar" />
          </div>

          <div className="ai-tools-cta-group">
            <button className="ai-tools-cta-primary" onClick={() => navigate('/login')}>
              Scan your repo →
            </button>
            <button className="ai-tools-cta-secondary" onClick={() => setShowDemoModal(true)}>
              See what we catch
            </button>
          </div>
        </div>
      </section>

      {/* Demo Video Modal */}
      {showDemoModal && (
        <div className="demo-modal-overlay" onClick={() => setShowDemoModal(false)}>
          <div className="demo-modal" onClick={e => e.stopPropagation()}>
            <button className="demo-modal-close" onClick={() => setShowDemoModal(false)} aria-label="Close demo">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="demo-modal-video-wrap">
              <iframe
                className="demo-modal-iframe"
                src="https://www.youtube.com/embed/6ysncpzpFSI"
                title="MagonAI Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiTools;