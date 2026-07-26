import React from 'react';
import ScanVisual from './ScanVisual';
import type {  ScanProgress } from './scanTypes';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ScanResultsPageProps {
  progress: ScanProgress;
  githubToken?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ScanResultsPage: React.FC<ScanResultsPageProps> = ({
  progress,
  githubToken = '',
}) => {
  const isRunning  = !['complete', 'error', 'idle'].includes(progress.phase);
  const isComplete = progress.phase === 'complete';
  const isError    = progress.phase === 'error';
  const accent     = isComplete ? '#15803d' : isError ? '#dc2626' : '#7c3aed';

  return (
    <div style={{
      flex: 1, minWidth: 0,
      position: 'relative',
      background: '#ece8e1',
      borderRadius: 20,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%',
    }}>

      {/* Subtle gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, borderRadius: 20,
        background: 'radial-gradient(ellipse 55% 45% at 28% 22%, rgba(124,58,237,0.07) 0%, transparent 65%), radial-gradient(ellipse 45% 40% at 78% 82%, rgba(99,102,241,0.05) 0%, transparent 60%)',
      }} />

      {/* Decorative circles — hidden when results are showing */}
      {!isComplete && [
        { top: 26, right: 34, size: 78 },
        { bottom: 50, left: 38, size: 112 },
        { top: '44%' as any, right: -16, size: 54 },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.07)',
          width: s.size, height: s.size,
          top: s.top, right: s.right as any,
          bottom: s.bottom as any, left: s.left as any,
          pointerEvents: 'none', zIndex: 0,
        }} />
      ))}

      {/* Label — hidden when results are showing */}
      {!isComplete && (
        <div style={{
          position: 'absolute', top: 24, left: 28, zIndex: 2,
          display: 'flex', flexDirection: 'column', gap: 2,
          pointerEvents: 'none',
        }}>
          <span style={{
            fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.28)', fontFamily: "'JetBrains Mono',monospace",
          }}>Security Analysis</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.42)' }}>
            Deep Scan Pipeline
          </span>
        </div>
      )}

      {/* Scrollable body */}
      <div className="sp-right-body" style={{
        flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden',
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: isComplete ? 'stretch' : 'center',
        justifyContent: isComplete ? 'flex-start' : 'center',
        paddingBottom: 56,
      }}>
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%',
          maxWidth: isComplete ? 'none' : 420,
          alignSelf: isComplete ? 'stretch' : 'center',
        }}>
          <ScanVisual
            phase={progress.phase}
            categoriesComplete={progress.categoriesComplete}
            result={progress.result}
            githubToken={githubToken}
          />
        </div>
      </div>

      {/* Status pill — bottom centre */}
      <div style={{
        position: 'absolute', bottom: 20, left: 0, right: 0, zIndex: 3,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 20px', borderRadius: 999,
          background: isComplete
            ? 'rgba(22,163,74,0.1)'
            : isError
            ? 'rgba(220,38,38,0.1)'
            : 'rgba(255,255,255,0.65)',
          border: `1px solid ${isComplete ? 'rgba(22,163,74,0.22)' : isError ? 'rgba(220,38,38,0.22)' : 'rgba(255,255,255,0.8)'}`,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', display: 'inline-block',
            background: isComplete ? '#15803d' : isError ? '#dc2626' : '#7c3aed',
            animation: isRunning ? 'sp-breathe 1.1s infinite' : 'none',
            boxShadow: isRunning ? '0 0 8px ' + accent + '90' : 'none',
          }} />
          <span style={{
            fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: isComplete ? '#15803d' : isError ? '#dc2626' : 'rgba(0,0,0,0.45)',
            fontFamily: "'JetBrains Mono',monospace", fontWeight: 600,
          }}>
            {isRunning ? 'Deep scan in progress…' : isComplete ? 'Analysis Complete' : 'Scan Failed'}
          </span>
        </div>
      </div>

    </div>
  );
};

export default ScanResultsPage;