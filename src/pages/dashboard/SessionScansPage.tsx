import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

/**
 * Session scans — GET /api/scan/history/session/:sessionId
 *
 * A session groups every scan started from the same dashboard sitting
 * (session_id is minted per scan request from user_id + timestamp).
 * Reached from a scan card in Scan History via "Session".
 */

interface SessionScan {
    scan_id: string;
    repo_url: string;
    scanned_at: string;
    status?: string;
    total_files?: number;
    total_vulnerabilities?: number;
    phases_completed?: number;
    group_scan_id?: string;
}

const CSS = `
  @keyframes ss-spin   { to { transform: rotate(360deg); } }
  @keyframes ss-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

  .ss-root * { box-sizing: border-box; }

  .ss-row {
    display: flex; align-items: center; gap: 14px;
    background: #13151F; border: 1px solid rgba(99,102,241,0.14);
    border-radius: 12px; padding: 14px 16px; cursor: pointer;
    transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s;
    animation: ss-fadein 0.3s ease both;
  }
  .ss-row:hover {
    border-color: rgba(99,102,241,0.32);
    transform: translateY(-2px);
    box-shadow: 0 8px 26px rgba(0,0,0,0.22);
  }

  .ss-repo-icon {
    width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(145deg, #4f46e5, #7c3aed);
    color: #fff; font-weight: 800; font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
  }

  .ss-btn {
    display: inline-flex; align-items: center; gap: 7px;
    background: #13151F; border: 1px solid rgba(99,102,241,0.2);
    border-radius: 9px; color: #9BA3BF; padding: 8px 15px; cursor: pointer;
    font-size: 13px; font-weight: 600; font-family: 'Instrument Sans', sans-serif;
    transition: all 0.15s;
  }
  .ss-btn:hover:not(:disabled) { background: #1a1d2b; border-color: rgba(99,102,241,0.4); color: #E8EEFF; }
  .ss-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .ss-spinner {
    width: 24px; height: 24px; border: 2.5px solid rgba(99,102,241,0.2);
    border-top-color: #818cf8; border-radius: 50%;
    animation: ss-spin 0.8s linear infinite;
  }

  .ss-inline-error {
    background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.22);
    border-radius: 10px; padding: 12px 16px; color: #f87171; font-size: 13px;
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
    font-family: 'Instrument Sans', sans-serif;
  }
  .ss-inline-error button {
    margin-left: auto; background: none; border: 1px solid rgba(244,63,94,0.3);
    color: #f87171; padding: 3px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;
    font-family: 'Instrument Sans', sans-serif;
  }
`;

const SessionScansPage: React.FC = () => {
    const navigate = useNavigate();
    const { sessionId } = useParams<{ sessionId: string }>();

    const [scans, setScans]     = useState<SessionScan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    useEffect(() => () => abortRef.current?.abort(), []);

    const fetchSession = useCallback(async () => {
        if (!sessionId) return;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/scan/history/session/${encodeURIComponent(sessionId)}`, {
                credentials: 'include',
                signal: controller.signal,
            });
            if (res.status === 401) { navigate('/login'); return; }
            if (!res.ok) throw new Error(`Failed to load session (${res.status})`);
            const data = await res.json();
            setScans(Array.isArray(data) ? data : []);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            setError(err.message || 'Failed to load session scans');
        } finally {
            setLoading(false);
        }
    }, [sessionId, navigate]);

    useEffect(() => { fetchSession(); }, [fetchSession]);

    const formatDate = (iso: string) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return isNaN(d.getTime())
            ? '—'
            : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const repoName = (url: string) => {
        if (!url) return '—';
        if (url.startsWith('upload://')) return url.replace('upload://', '');
        return url.replace('https://github.com/', '').replace('https://gitlab.com/', '');
    };

    const groupId = scans.find(s => s.group_scan_id)?.group_scan_id;

    return (
        <div className="ss-root" style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto', fontFamily: "'Instrument Sans', sans-serif" }}>
            <style>{CSS}</style>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 14, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#E8EEFF', letterSpacing: '-0.03em' }}>Session Scans</h2>
                    <p style={{ margin: '4px 0 0', color: '#5C6480', fontSize: 13.5, wordBreak: 'break-all' }}>
                        Every scan started in session <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'rgba(99,102,241,0.75)' }}>{sessionId}</span>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="ss-btn" onClick={() => navigate('/history')}>← History</button>
                    {groupId && (
                        <button className="ss-btn" onClick={() => navigate(`/graph/${groupId}`)}>View graph</button>
                    )}
                    <button className="ss-btn" onClick={fetchSession} disabled={loading}>Refresh</button>
                </div>
            </div>

            {error && (
                <div className="ss-inline-error">
                    <span>⚠</span> {error}
                    <button onClick={fetchSession}>Retry</button>
                </div>
            )}

            {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '70px 0' }}>
                    <div className="ss-spinner" />
                    <div style={{ color: '#5C6480', fontSize: 13 }}>Loading session…</div>
                </div>
            )}

            {!loading && !error && scans.length === 0 && (
                <div style={{ textAlign: 'center', padding: '70px 0', color: '#5C6480', fontSize: 14 }}>
                    No scans found for this session.
                </div>
            )}

            {!loading && scans.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {scans.map((scan, i) => (
                        <div
                            key={scan.scan_id}
                            className="ss-row"
                            style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
                            onClick={() => navigate(`/scan/${scan.scan_id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/scan/${scan.scan_id}`); }}
                        >
                            <div className="ss-repo-icon">
                                {repoName(scan.repo_url).charAt(0).toUpperCase() || '?'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EEFF', wordBreak: 'break-all' }}>
                                    {repoName(scan.repo_url)}
                                </div>
                                <div style={{ fontSize: 11, color: '#5C6480', marginTop: 3 }}>
                                    {formatDate(scan.scanned_at)} · {scan.total_files ?? 0} files · phase {scan.phases_completed ?? 0}/4
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 17, fontWeight: 800, color: (scan.total_vulnerabilities ?? 0) > 0 ? '#f87171' : '#E8EEFF', lineHeight: 1 }}>
                                    {scan.total_vulnerabilities ?? 0}
                                </div>
                                <div style={{ fontSize: 9.5, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700, marginTop: 3 }}>
                                    vulns
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SessionScansPage;
