import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';

interface ScanSummary {
  scan_id: string;
  repo_url: string;
  scanned_at: string;
  status: string;
  total_vulnerabilities: number;
  total_files: number;
  phases_completed: number;
  severity_counts?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
}

const SEV: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  critical: { color: '#f87171', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.28)',  dot: '#f43f5e' },
  high:     { color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.28)', dot: '#f97316' },
  medium:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)', dot: '#f59e0b' },
  low:      { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)', dot: '#10b981' },
  info:     { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.28)', dot: '#3b82f6' },
};

const CSS = `
  @keyframes sh-spin    { to { transform: rotate(360deg); } }
  @keyframes sh-fadein  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes sh-card-in { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes sh-shimmer { from { background-position: -400px 0; } to { background-position: 400px 0; } }

  .sh-root * { box-sizing: border-box; }

  /* ── Card ── */
  .sh-card {
    background: #13151F;
    border: 1px solid rgba(99,102,241,0.14);
    border-radius: 14px;
    padding: 0;
    cursor: pointer;
    text-align: left;
    transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: sh-card-in 0.3s ease both;
    position: relative;
  }
  .sh-card:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(99,102,241,0.25);
    transform: translateY(-3px);
    border-color: rgba(99,102,241,0.28);
  }
  .sh-card:focus-visible {
    outline: 2px solid rgba(99,102,241,0.6);
    outline-offset: 2px;
  }
  .sh-card-inner { padding: 18px 18px 16px; display: flex; flex-direction: column; gap: 14px; }

  .sh-card-accent-bar { height: 2px; width: 100%; flex-shrink: 0; }

  /* View hint */
  .sh-view-hint {
    font-size: 11px; color: rgba(99,102,241,0.45); font-weight: 600;
    display: flex; align-items: center; gap: 3px;
    transition: color 0.15s;
  }
  .sh-card:hover .sh-view-hint { color: #818cf8; }

  /* ── Skeleton ── */
  .sh-skeleton-card {
    background: #13151F;
    border: 1px solid rgba(99,102,241,0.1);
    border-radius: 14px; overflow: hidden;
    animation: sh-card-in 0.3s ease both;
  }
  .sh-skeleton-bar { height: 2px; background: rgba(99,102,241,0.15); }
  .sh-skeleton-inner { padding: 18px; display: flex; flex-direction: column; gap: 14px; }
  .sh-shimmer {
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%);
    background-size: 400px 100%;
    animation: sh-shimmer 1.4s ease infinite;
    border-radius: 6px;
  }

  /* ── Search & filter bar ── */
  .sh-search-input {
    flex: 1; min-width: 0;
    background: #13151F;
    border: 1.5px solid rgba(99,102,241,0.18);
    border-radius: 9px;
    color: #E8EEFF;
    padding: 9px 14px 9px 38px;
    font-size: 13px;
    font-family: 'Instrument Sans', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .sh-search-input::placeholder { color: #52525b; }
  .sh-search-input:focus { border-color: rgba(99,102,241,0.45); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .sh-search-wrap { position: relative; flex: 1; }
  .sh-search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #52525b; pointer-events: none; }
  .sh-search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #52525b; cursor: pointer; font-size: 13px; padding: 2px 4px; border-radius: 4px; transition: color 0.15s; }
  .sh-search-clear:hover { color: #a1a1aa; }

  .sh-filter-btn {
    padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
    cursor: pointer; font-family: 'Instrument Sans', sans-serif;
    background: transparent; border: 1.5px solid rgba(99,102,241,0.18);
    color: #9BA3BF; transition: all 0.15s;
  }
  .sh-filter-btn:hover { border-color: rgba(99,102,241,0.35); color: #E8EEFF; }
  .sh-filter-btn.active {
    background: rgba(99,102,241,0.15);
    border-color: rgba(99,102,241,0.45);
    color: #818cf8;
  }

  /* ── Refresh / back buttons ── */
  .sh-refresh-btn {
    display: flex; align-items: center; gap: 7px;
    background: #13151F; border: 1px solid rgba(99,102,241,0.2);
    border-radius: 9px; color: #9BA3BF;
    padding: 8px 15px; cursor: pointer;
    font-size: 13px; font-weight: 600;
    font-family: 'Instrument Sans', sans-serif;
    transition: all 0.15s;
  }
  .sh-refresh-btn:hover { background: #1a1d2b; border-color: rgba(99,102,241,0.4); color: #E8EEFF; }
  .sh-refresh-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* ── Stat pill ── */
  .sh-stat-pill {
    display: flex; flex-direction: column; align-items: center;
    gap: 2px; padding: 10px 12px; border-radius: 9px;
    background: #0B0D14; border: 1px solid rgba(99,102,241,0.12);
    font-family: 'Instrument Sans', sans-serif; transition: border-color 0.15s;
  }
  .sh-card:hover .sh-stat-pill { border-color: rgba(99,102,241,0.2); }

  /* ── Severity mini chip ── */
  .sh-mini-sev {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 700;
    padding: 3px 8px; border-radius: 20px;
    font-family: 'Instrument Sans', sans-serif; letter-spacing: 0.02em;
  }

  /* ── Repo icon ── */
  .sh-repo-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
    background: linear-gradient(145deg, #4f46e5, #7c3aed);
    color: #fff; font-weight: 800; font-family: 'JetBrains Mono', monospace;
    box-shadow: 0 2px 10px rgba(124,58,237,0.3);
  }

  /* ── Spinner ── */
  .sh-btn-spinner {
    width: 11px; height: 11px; flex-shrink: 0;
    border: 2px solid rgba(168,85,247,0.3); border-top-color: #a855f7;
    border-radius: 50%; animation: sh-spin 0.75s linear infinite; display: inline-block;
  }

  /* ── Empty state ── */
  .sh-empty {
    display: flex; flex-direction: column; align-items: center;
    padding: 80px 0 100px; gap: 16px; text-align: center;
  }
  .sh-empty-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(99,102,241,0.08); border: 1.5px dashed rgba(99,102,241,0.25);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 4px;
  }
  .sh-empty-cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 22px; border-radius: 10px; border: none; cursor: pointer;
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    color: #fff; font-size: 13px; font-weight: 700;
    font-family: 'Instrument Sans', sans-serif;
    box-shadow: 0 4px 18px rgba(124,58,237,0.3);
    transition: opacity 0.15s, transform 0.15s;
  }
  .sh-empty-cta:hover { opacity: 0.92; transform: translateY(-1px); }

  /* ── Card action buttons ── */
  .sh-card-actions { display: flex; gap: 6px; }
  .sh-delete-btn {
    display: flex; align-items: center; justify-content: center;
    padding: 7px 11px; border-radius: 8px; font-size: 13px;
    cursor: pointer; font-family: 'Instrument Sans', sans-serif;
    background: rgba(244,63,94,0.08); color: #f87171;
    border: 1px solid rgba(244,63,94,0.2); transition: all 0.15s;
  }
  .sh-delete-btn:hover:not(:disabled) { background: rgba(244,63,94,0.16); border-color: rgba(244,63,94,0.4); }
  .sh-delete-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .sh-confirm-row {
    display: flex; gap: 6px; align-items: center; flex: 1;
    padding: 7px 12px; border-radius: 8px;
    background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.2);
    font-size: 12px; color: #f87171; font-family: 'Instrument Sans', sans-serif;
  }
  .sh-confirm-yes {
    padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;
    background: #ef4444; color: #fff; border: none; cursor: pointer;
    font-family: 'Instrument Sans', sans-serif; transition: background 0.12s; margin-left: auto;
  }
  .sh-confirm-yes:hover { background: #dc2626; }
  .sh-confirm-no {
    padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
    background: rgba(255,255,255,0.05); color: #9BA3BF;
    border: 1px solid rgba(99,102,241,0.2); cursor: pointer;
    font-family: 'Instrument Sans', sans-serif; transition: background 0.12s;
  }
  .sh-confirm-no:hover { background: rgba(255,255,255,0.08); }

  /* ── Inline error ── */
  .sh-inline-error {
    background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.22); border-radius: 10px;
    padding: 12px 16px; color: #f87171; font-size: 13px;
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px; font-family: 'Instrument Sans', sans-serif;
    animation: sh-fadein 0.25s ease both;
  }
  .sh-inline-error button {
    margin-left: auto; background: none; border: 1px solid rgba(244,63,94,0.3);
    color: #f87171; padding: 3px 10px; border-radius: 6px;
    cursor: pointer; font-size: 12px; font-family: 'Instrument Sans', sans-serif;
    transition: background 0.15s;
  }
  .sh-inline-error button:hover { background: rgba(244,63,94,0.12); }

  /* ── Hover glow ── */
  .sh-card::after {
    content: ''; position: absolute; inset: 0; border-radius: 14px;
    opacity: 0; transition: opacity 0.2s; pointer-events: none;
    background: radial-gradient(ellipse at top, rgba(168,85,247,0.05) 0%, transparent 70%);
  }
  .sh-card:hover::after { opacity: 1; }

  /* ── No results ── */
  .sh-no-results {
    grid-column: 1 / -1;
    display: flex; flex-direction: column; align-items: center;
    padding: 60px 0; gap: 10px; color: #5C6480; font-size: 14px;
    font-family: 'Instrument Sans', sans-serif;
  }
`;

const SkeletonCard: React.FC<{ delay?: number }> = ({ delay = 0 }) => (
  <div className="sh-skeleton-card" style={{ animationDelay: `${delay}s` }}>
    <div className="sh-skeleton-bar" />
    <div className="sh-skeleton-inner">
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="sh-shimmer" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="sh-shimmer" style={{ height: 13, width: '70%' }} />
          <div className="sh-shimmer" style={{ height: 10, width: '45%' }} />
        </div>
        <div className="sh-shimmer" style={{ width: 64, height: 20, borderRadius: 20 }} />
      </div>
      <div className="sh-shimmer" style={{ height: 10, width: '40%' }} />
      <div style={{ display: 'flex', gap: 7 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="sh-shimmer" style={{ flex: 1, height: 52, borderRadius: 9 }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5 }}>
        <div className="sh-shimmer" style={{ height: 22, width: 70, borderRadius: 20 }} />
        <div className="sh-shimmer" style={{ height: 22, width: 55, borderRadius: 20 }} />
      </div>
    </div>
  </div>
);

type FilterType = 'all' | 'completed' | 'running';

const ScanHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [scans, setScans]                     = useState<ScanSummary[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [search, setSearch]                   = useState('');
  const [filter, setFilter]                   = useState<FilterType>('all');

  const listAbortRef = useRef<AbortController | null>(null);

  useEffect(() => { return () => { listAbortRef.current?.abort(); }; }, []);

  const fetchHistory = useCallback(async () => {
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scan/history/me', { credentials: 'include', signal: controller.signal });
      if (res.status === 401) { navigate('/login'); return; }
      if (!res.ok) throw new Error(`Failed to load history (${res.status})`);
      const data = await res.json();
      if (data && typeof data === 'object' && !Array.isArray(data) && 'balance' in data && Number(data.balance) <= 0) {
        setScans([]); setError(`LOW_BALANCE::${data.balance}`); return;
      }
      setScans(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to load scan history');
    } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const openScanDetail = (scanId: string) => navigate(`/scan/${scanId}`);

  const handleDeleteConfirm = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setConfirmDeleteId(id); };
  const handleDeleteCancel  = (e: React.MouseEvent)              => { e.stopPropagation(); setConfirmDeleteId(null); };

  const handleDelete = async (e: React.MouseEvent, scanId: string) => {
    e.stopPropagation();
    setDeletingId(scanId); setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/scan/history/${scanId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error((d as any).detail || `Delete failed`); }
      setScans(prev => prev.filter(s => s.scan_id !== scanId));
      showToast('Scan deleted successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete scan', 'error');
    } finally { setDeletingId(null); }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const repoName    = (url: string) => {
    if (!url) return '—';
    if (url.startsWith('upload://')) return url.replace('upload://', '');
    return url.replace('https://github.com/', '').replace('https://gitlab.com/', '');
  };
  const repoInitial = (url: string) => repoName(url).charAt(0).toUpperCase() || '?';
  const isUpload    = (url: string) => Boolean(url?.startsWith('upload://'));

  const topSeverity = (sc?: ScanSummary['severity_counts']) => {
    if (!sc) return null;
    for (const sev of ['critical', 'high', 'medium', 'low', 'info']) { if ((sc as any)[sev] > 0) return sev; }
    return null;
  };

  const getScanStatus = (scan: ScanSummary) => {
    const lower = scan.status?.toLowerCase?.() ?? '';
    const isRunning = ['running', 'pending', 'in_progress', 'processing', 'queued', 'started', 'initializing'].includes(lower);
    return !isRunning && lower !== '';
  };

  const filtered = scans.filter(scan => {
    const matchSearch = repoName(scan.repo_url).toLowerCase().includes(search.toLowerCase());
    const isComplete  = getScanStatus(scan);
    const matchFilter = filter === 'all' || (filter === 'completed' && isComplete) || (filter === 'running' && !isComplete);
    return matchSearch && matchFilter;
  });

  return (
    <div className="sh-root" style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto', fontFamily: "'Instrument Sans', sans-serif" }}>
      <style>{CSS}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#E8EEFF', letterSpacing: '-0.03em' }}>Scan History</h2>
          <p style={{ margin: '4px 0 0', color: '#5C6480', fontSize: 13.5 }}>All previous security scans for your account</p>
        </div>
        <button className="sh-refresh-btn" onClick={fetchHistory} disabled={loading} aria-label="Refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Search + Filter bar ── */}
      {!loading && !error?.startsWith('LOW_BALANCE::') && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="sh-search-wrap">
            <svg className="sh-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="sh-search-input"
              placeholder="Search by repository…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search scans"
            />
            {search && (
              <button className="sh-search-clear" onClick={() => setSearch('')} aria-label="Clear search">✕</button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'completed', 'running'] as FilterType[]).map(f => (
              <button
                key={f}
                className={`sh-filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {[0, 0.06, 0.12, 0.18].map((d, i) => <SkeletonCard key={i} delay={d} />)}
        </div>
      )}

      {/* ── Low Balance ── */}
      {error?.startsWith('LOW_BALANCE::') && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{
            width: 480, background: '#13151F',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 20, padding: '40px 36px', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>💳</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#E8EEFF', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              You're out of balance
            </h2>
            <p style={{ color: '#5C6480', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              Your wallet balance is zero or negative. Add credits to continue security scans.
            </p>
            <div style={{ background: '#0B0D14', borderRadius: 12, padding: 18, marginBottom: 20, border: '1px solid rgba(99,102,241,0.15)' }}>
              <div style={{ fontSize: 12, color: '#5C6480', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Current Balance</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#a855f7', lineHeight: 1 }}>
                ₹{error.replace('LOW_BALANCE::', '')}
              </div>
              <div style={{ color: '#f87171', fontWeight: 600, fontSize: 12, marginTop: 6 }}>Insufficient Balance</div>
            </div>
            <button
              onClick={() => navigate('/credits')}
              style={{
                width: '100%', padding: 13, border: 'none', borderRadius: 11,
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                marginBottom: 10, fontFamily: 'inherit',
                boxShadow: '0 4px 18px rgba(124,58,237,0.35)',
              }}
            >+ Add Balance</button>
            <button onClick={fetchHistory} style={{ background: 'none', border: 'none', color: '#818cf8', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* ── Normal error ── */}
      {error && !error.startsWith('LOW_BALANCE::') && (
        <div className="sh-inline-error">
          <span>⚠</span> {error}
          <button onClick={fetchHistory}>Retry</button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && scans.length === 0 && (
        <div className="sh-empty">
          <div className="sh-empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#9BA3BF' }}>No scans yet</div>
          <div style={{ fontSize: 13, color: '#5C6480', maxWidth: 280 }}>
            Run a deep security scan on your repository to see results here.
          </div>
          <button className="sh-empty-cta" onClick={() => navigate('/new-session')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Start your first scan
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && scans.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }} role="list">
          {filtered.length === 0 ? (
            <div className="sh-no-results">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              No scans match "{search}"
            </div>
          ) : filtered.map((scan, i) => {
            const top          = topSeverity(scan.severity_counts);
            const topCfg       = top ? SEV[top] : null;
            const accentColor  = topCfg ? topCfg.dot : '#6366f1';
            const isDeleting   = deletingId  === scan.scan_id;
            const isConfirming = confirmDeleteId === scan.scan_id;
            const isComplete   = getScanStatus(scan);

            return (
              <div
                key={scan.scan_id}
                className="sh-card"
                style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
                onClick={() => openScanDetail(scan.scan_id)}
                role="listitem button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') openScanDetail(scan.scan_id); }}
                aria-label={`View scan for ${repoName(scan.repo_url)}, ${scan.total_vulnerabilities} vulnerabilities`}
              >
                <div className="sh-card-accent-bar" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}40)` }} />

                <div className="sh-card-inner">
                  {/* Repo + date + status */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div className="sh-repo-icon" style={{ fontSize: isUpload(scan.repo_url) ? 15 : undefined }}>
                      {isUpload(scan.repo_url) ? '📁' : repoInitial(scan.repo_url)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EEFF', wordBreak: 'break-all', lineHeight: 1.35 }}>
                        {repoName(scan.repo_url)}
                      </div>
                      <div style={{ fontSize: 11, color: '#5C6480', marginTop: 3 }}>{formatDate(scan.scanned_at)}</div>
                    </div>
                    <div style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, flexShrink: 0,
                      background: isComplete ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                      color: isComplete ? '#34d399' : '#fbbf24',
                      border: `1px solid ${isComplete ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                    }}>
                      {isComplete ? '✓ Completed' : '… Running'}
                    </div>
                  </div>

                  {/* Scan ID */}
                  <div style={{ fontSize: 11, color: 'rgba(99,102,241,0.5)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.02em' }}>
                    #{scan.scan_id.slice(0, 12)}
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 7 }}>
                    {[
                      { value: scan.total_vulnerabilities ?? 0, label: 'Vulns',  accent: (scan.total_vulnerabilities ?? 0) > 0 },
                      { value: scan.total_files ?? 0,           label: 'Files',  accent: false },
                      { value: `${scan.phases_completed ?? 0}/4`, label: 'Phases', accent: false },
                    ].map(({ value, label, accent }) => (
                      <div key={label} className="sh-stat-pill" style={{ flex: 1 }}>
                        <span style={{ fontSize: 19, fontWeight: 800, lineHeight: 1, color: accent ? accentColor : '#E8EEFF' }}>{value}</span>
                        <span style={{ fontSize: 9.5, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Severity chips */}
                  {scan.severity_counts && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
                        const count = (scan.severity_counts as any)[sev] ?? 0;
                        if (!count) return null;
                        const cfg = SEV[sev];
                        return (
                          <span key={sev} className="sh-mini-sev" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }} />
                            {count} {sev}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer row: delete + view hint */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={e => e.stopPropagation()}>
                    <div className="sh-card-actions">
                      {isConfirming ? (
                        <div className="sh-confirm-row">
                          <span>Delete this scan?</span>
                          <button className="sh-confirm-yes" onClick={e => handleDelete(e, scan.scan_id)} disabled={isDeleting}>
                            {isDeleting ? '…' : 'Delete'}
                          </button>
                          <button className="sh-confirm-no" onClick={handleDeleteCancel}>Cancel</button>
                        </div>
                      ) : (
                        <button
                          className="sh-delete-btn"
                          onClick={e => handleDeleteConfirm(e, scan.scan_id)}
                          disabled={isDeleting}
                          title="Delete scan"
                          aria-label="Delete scan"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    {!isConfirming && (
                      <span className="sh-view-hint" onClick={e => { e.stopPropagation(); openScanDetail(scan.scan_id); }}>
                        View details
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </span>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScanHistoryPage;
