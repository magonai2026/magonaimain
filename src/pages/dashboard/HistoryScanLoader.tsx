/**
 * HistoryScanLoader.tsx
 *
 * Mounted at /scan/:scanId (see App.tsx).
 * Fetches the completed scan from the API and renders the full ScanPage
 * (left chat panel + right results panel) — identical to the live-scan view.
 *
 * Usage in App.tsx — replace:
 *   <Route path="/scan/:scanId" element={<Dashboard />} />
 * with:
 *   <Route path="/scan/:scanId" element={<HistoryScanLoader />} />
 *
 * Or, if you want it inside the Dashboard shell (sidebar visible), keep the
 * Dashboard route and add a `history-scan` case in Dashboard.renderPage():
 *   case 'history-scan': return <HistoryScanLoader />;
 * and map  /scan/:scanId  →  activeTab = 'history-scan'  in pathToTab.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ScanPage from './Scan/ScanPage';
import type { ScanProgress, DeepScanResult } from './Scan/scanTypes';

// ─── tiny local spinner (no external dep) ─────────────────────────────────────
const Spinner: React.FC<{ label?: string }> = ({ label = 'Loading scan…' }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', gap: 14,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      border: '3px solid #ede9e3', borderTopColor: '#7c3aed',
      animation: 'hsl-spin 0.75s linear infinite',
    }} />
    <style>{`@keyframes hsl-spin { to { transform: rotate(360deg); } }`}</style>
    <span style={{ fontSize: 14, color: '#aaa' }}>{label}</span>
  </div>
);

// ─── Error card ───────────────────────────────────────────────────────────────
const ErrorCard: React.FC<{ message: string; onBack: () => void; onRetry: () => void }> = ({
  message, onBack, onRetry,
}) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', gap: 16, padding: 32,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  }}>
    <div style={{
      background: '#fff5f5', border: '1px solid #fecdd3', borderRadius: 16,
      padding: '28px 36px', maxWidth: 440, width: '100%', textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#b91c1c', marginBottom: 8 }}>
        Failed to load scan
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
        {message}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button
          onClick={onBack}
          style={{
            padding: '8px 20px', borderRadius: 9, border: '1.5px solid #e8e4de',
            background: '#fff', color: '#555', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ← Back to History
        </button>
        <button
          onClick={onRetry}
          style={{
            padding: '8px 20px', borderRadius: 9, border: 'none',
            background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 2px 10px rgba(124,58,237,0.3)',
          }}
        >
          Retry
        </button>
      </div>
    </div>
  </div>
);

// ─── HistoryScanLoader ────────────────────────────────────────────────────────
const HistoryScanLoader: React.FC = () => {
  const { scanId }   = useParams<{ scanId: string }>();
  const navigate     = useNavigate();
  const abortRef     = useRef<AbortController | null>(null);

  const [status, setStatus]   = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState<ScanProgress | null>(null);

  // Pull GitHub token from session/localStorage if previously stored by NewSessionPage
  const githubToken =
    typeof window !== 'undefined'
      ? (window.sessionStorage?.getItem('github_token') ?? '')
      : '';

  const loadScan = async () => {
    if (!scanId) { navigate('/history'); return; }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`/api/scan/history/${scanId}`, {
        credentials: 'include',
        signal: ctrl.signal,
      });

      if (res.status === 401) { navigate('/login'); return; }
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data: DeepScanResult = await res.json();

      // Build a ScanProgress that looks exactly like a freshly-completed scan
      const syntheticProgress: ScanProgress = {
        phase:              'complete',
        message:            'Scan complete!',
        categoriesComplete: (data.category_results ?? []).map(c => c.category),
        result:             data,
        error:              null,
      };

      setProgress(syntheticProgress);
      setStatus('ready');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setErrorMsg(err.message ?? 'Unknown error');
      setStatus('error');
    }
  };

  useEffect(() => {
    loadScan();
    return () => { abortRef.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId]);

  const handleClose = () => navigate('/history');

  if (status === 'loading') return <Spinner label="Loading scan…" />;
  if (status === 'error' || !progress) {
    return (
      <ErrorCard
        message={errorMsg || 'Could not load scan data.'}
        onBack={handleClose}
        onRetry={loadScan}
      />
    );
  }

  // Render the full ScanPage — identical experience to a just-completed live scan
  return (
    <ScanPage
      progress={progress}
      onClose={handleClose}
      githubToken={githubToken}
    />
  );
};

export default HistoryScanLoader;