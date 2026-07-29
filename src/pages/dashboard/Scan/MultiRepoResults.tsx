import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Aggregated results for one multi-repo scan group.
 *
 * Loads from history rather than from the live SSE stream, so the same view
 * works right after a scan finishes and when reopening an older group:
 *   GET /api/scan/history/me            → the scans belonging to this group
 *   GET /api/scan/history/:scanId       → each scan's vulnerabilities
 *   GET /api/scan/graph/:groupScanId    → cross-repo call / shared-infra counts
 *
 * By the time a repo emits its complete event the scan doc is already written,
 * so there is no race with the stream.
 */

interface Vuln {
    id?: string;
    title?: string;
    severity?: string;
    file_path?: string;
    line_number?: number;
    description?: string;
    fix_suggestion?: string;
}

interface RepoResult {
    scanId: string;
    repo: string;
    status: string;
    totalFiles: number;
    summary: string;
    vulnerabilities: Vuln[];
    deepScan: boolean;
}

interface Props {
    groupScanId: string;
    /** Shown while the scan is still streaming, so the view can say so. */
    live?: boolean;
}

const SEV_ORDER = ['critical', 'high', 'medium', 'low', 'info'] as const;

const SEV: Record<string, { color: string; bg: string; border: string }> = {
    critical: { color: '#f87171', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.30)' },
    high:     { color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.30)' },
    medium:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.30)' },
    low:      { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.30)' },
    info:     { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.30)' },
};

const CSS = `
  @keyframes rr-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes rr-spin   { to { transform: rotate(360deg); } }

  .rr-root * { box-sizing: border-box; }

  .rr-panel {
    background: #13151F; border: 1px solid rgba(99,102,241,0.16);
    border-radius: 14px; padding: 16px 18px; margin-bottom: 14px;
    animation: rr-fadein 0.3s ease both;
  }

  .rr-stat {
    display: flex; flex-direction: column; gap: 3px;
    padding: 11px 15px; border-radius: 10px;
    background: #0B0D14; border: 1px solid rgba(99,102,241,0.14);
    min-width: 96px;
  }
  .rr-stat-num { font-size: 21px; font-weight: 800; line-height: 1; color: #E8EEFF; }
  .rr-stat-lbl {
    font-size: 9.5px; color: #5C6480; text-transform: uppercase;
    letter-spacing: 0.07em; font-weight: 700;
  }

  .rr-chip {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;
    letter-spacing: 0.02em; cursor: pointer; transition: all 0.15s;
    font-family: 'Instrument Sans', sans-serif;
  }
  .rr-chip.dim { opacity: 0.4; }

  .rr-repo-row {
    display: flex; align-items: center; gap: 12px;
    background: #0B0D14; border: 1px solid rgba(99,102,241,0.12);
    border-radius: 11px; padding: 12px 14px; margin-bottom: 8px;
    transition: border-color 0.15s;
  }
  .rr-repo-row:hover { border-color: rgba(99,102,241,0.32); }

  .rr-repo-icon {
    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(145deg, #4f46e5, #7c3aed);
    color: #fff; font-weight: 800; font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
  }

  .rr-vuln {
    border: 1px solid rgba(99,102,241,0.12); border-radius: 10px;
    background: #0B0D14; margin-bottom: 7px; overflow: hidden;
    animation: rr-fadein 0.25s ease both;
  }
  .rr-vuln-head {
    display: flex; align-items: center; gap: 10px; padding: 10px 13px;
    cursor: pointer; transition: background 0.15s;
  }
  .rr-vuln-head:hover { background: rgba(99,102,241,0.05); }
  .rr-vuln-body {
    padding: 0 13px 12px; border-top: 1px solid rgba(99,102,241,0.1);
    font-size: 12px; color: #9BA3BF; line-height: 1.65;
  }

  .rr-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: #13151F; border: 1px solid rgba(99,102,241,0.22);
    border-radius: 8px; color: #9BA3BF; padding: 6px 12px; cursor: pointer;
    font-size: 11.5px; font-weight: 600; font-family: 'Instrument Sans', sans-serif;
    transition: all 0.15s; white-space: nowrap;
  }
  .rr-btn:hover { background: #1a1d2b; border-color: rgba(99,102,241,0.45); color: #E8EEFF; }

  .rr-btn-primary {
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    border: none; color: #fff; box-shadow: 0 4px 16px rgba(124,58,237,0.28);
  }
  .rr-btn-primary:hover { opacity: 0.92; color: #fff; }

  .rr-spinner {
    width: 18px; height: 18px; border: 2.5px solid rgba(99,102,241,0.2);
    border-top-color: #818cf8; border-radius: 50%;
    animation: rr-spin 0.8s linear infinite;
  }

  .rr-code {
    font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
    color: #818cf8; word-break: break-all;
  }
`;

const repoName = (url: string) => {
    if (!url) return '—';
    if (url.startsWith('upload://')) return url.replace('upload://', '');
    return url.replace(/\/+$/, '')
        .replace('https://github.com/', '')
        .replace('https://gitlab.com/', '');
};

const MultiRepoResults: React.FC<Props> = ({ groupScanId, live = false }) => {
    const navigate = useNavigate();

    const [repos, setRepos]     = useState<RepoResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [sevFilter, setSevFilter] = useState<Set<string>>(new Set());
    const [repoFilter, setRepoFilter] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [graphStats, setGraphStats] = useState<{ crossRepo: number; infra: number } | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    useEffect(() => () => abortRef.current?.abort(), []);

    const load = useCallback(async () => {
        if (!groupScanId) return;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        try {
            const listRes = await fetch('/api/scan/history/me', {
                credentials: 'include',
                signal: controller.signal,
            });
            if (!listRes.ok) throw new Error(`Could not load scans (${listRes.status})`);
            const list = await listRes.json();
            const inGroup = (Array.isArray(list) ? list : [])
                .filter((s: any) => s.group_scan_id === groupScanId);

            if (inGroup.length === 0) {
                setRepos([]);
                return;
            }

            // Few repos per group, so a request each is fine and keeps this
            // working without a dedicated "get group" endpoint.
            const details = await Promise.all(inGroup.map(async (s: any) => {
                try {
                    const r = await fetch(`/api/scan/history/${s.scan_id}`, {
                        credentials: 'include',
                        signal: controller.signal,
                    });
                    const doc = r.ok ? await r.json() : {};
                    return {
                        scanId: s.scan_id,
                        repo: repoName(s.repo_url || doc.repo_url || ''),
                        status: doc.status || s.status || '',
                        totalFiles: doc.total_files ?? s.total_files ?? 0,
                        summary: doc.summary || '',
                        vulnerabilities: Array.isArray(doc.vulnerabilities) ? doc.vulnerabilities : [],
                        deepScan: s.deep_scan !== false,
                    } as RepoResult;
                } catch {
                    return {
                        scanId: s.scan_id,
                        repo: repoName(s.repo_url || ''),
                        status: s.status || '',
                        totalFiles: s.total_files ?? 0,
                        summary: '',
                        vulnerabilities: [],
                        deepScan: s.deep_scan !== false,
                    } as RepoResult;
                }
            }));

            setRepos(details.sort((a, b) => b.vulnerabilities.length - a.vulnerabilities.length));
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            setError(err.message || 'Could not load results');
        } finally {
            setLoading(false);
        }
    }, [groupScanId]);

    useEffect(() => { load(); }, [load]);

    // Cross-repo edges are the whole point of scanning together — surface the
    // counts here so the value is visible without opening the graph.
    useEffect(() => {
        if (!groupScanId) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/scan/graph/${groupScanId}`, { credentials: 'include' });
                if (!res.ok) return;
                const g = await res.json();
                if (cancelled) return;
                const edges = Array.isArray(g.edges) ? g.edges : [];
                const nodes = Array.isArray(g.nodes) ? g.nodes : [];
                setGraphStats({
                    crossRepo: edges.filter((e: any) => e.data?.type === 'CROSS_REPO_CALLS').length,
                    infra: nodes.filter((n: any) => n.data?.type === 'Infrastructure').length,
                });
            } catch {
                // Graph is optional context — never block the results view
            }
        })();
        return () => { cancelled = true; };
    }, [groupScanId, repos.length]);

    // ── Aggregates ────────────────────────────────────────────────────────────
    const allVulns = useMemo(
        () => repos.flatMap(r => r.vulnerabilities.map(v => ({ ...v, __repo: r.repo, __scanId: r.scanId }))),
        [repos],
    );

    const sevCounts = useMemo(() => {
        const c: Record<string, number> = {};
        for (const v of allVulns) {
            const s = (v.severity || 'info').toLowerCase();
            c[s] = (c[s] ?? 0) + 1;
        }
        return c;
    }, [allVulns]);

    const filtered = useMemo(() => {
        let list = allVulns;
        if (sevFilter.size) list = list.filter(v => sevFilter.has((v.severity || 'info').toLowerCase()));
        if (repoFilter)     list = list.filter(v => (v as any).__repo === repoFilter);
        return list.sort((a, b) =>
            SEV_ORDER.indexOf((a.severity || 'info').toLowerCase() as any) -
            SEV_ORDER.indexOf((b.severity || 'info').toLowerCase() as any),
        );
    }, [allVulns, sevFilter, repoFilter]);

    const totalFiles = repos.reduce((s, r) => s + r.totalFiles, 0);
    const deepCount  = repos.filter(r => r.deepScan).length;

    const toggleSev = (s: string) => setSevFilter(prev => {
        const next = new Set(prev);
        if (next.has(s)) next.delete(s); else next.add(s);
        return next;
    });

    const toggleVuln = (key: string) => setExpanded(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
    });

    if (!groupScanId) return null;

    return (
        <div className="rr-root">
            <style>{CSS}</style>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 12px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#E8EEFF' }}>
                    Group results
                </h3>
                {live && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#fbbf24' }}>
                        <span className="rr-spinner" style={{ width: 11, height: 11, borderWidth: 2 }} />
                        scan still running — updating as repos finish
                    </span>
                )}
                <button className="rr-btn" style={{ marginLeft: 'auto' }} onClick={load} disabled={loading}>
                    Refresh
                </button>
                <button className="rr-btn rr-btn-primary" onClick={() => navigate(`/graph/${groupScanId}`)}>
                    Knowledge graph
                </button>
            </div>

            {error && (
                <div className="rr-panel" style={{ color: '#f87171', fontSize: 13, borderColor: 'rgba(244,63,94,0.25)' }}>
                    ⚠ {error}
                </div>
            )}

            {loading && repos.length === 0 ? (
                <div className="rr-panel" style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#5C6480', fontSize: 13 }}>
                    <div className="rr-spinner" /> Loading results…
                </div>
            ) : repos.length === 0 ? (
                <div className="rr-panel" style={{ color: '#5C6480', fontSize: 13, lineHeight: 1.6 }}>
                    No finished scans in this group yet. Results appear here as each repo completes.
                </div>
            ) : (
                <>
                    {/* ── Totals ── */}
                    <div className="rr-panel">
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                            <div className="rr-stat">
                                <span className="rr-stat-num" style={{ color: allVulns.length ? '#f87171' : '#34d399' }}>
                                    {allVulns.length}
                                </span>
                                <span className="rr-stat-lbl">Vulnerabilities</span>
                            </div>
                            <div className="rr-stat">
                                <span className="rr-stat-num">{repos.length}</span>
                                <span className="rr-stat-lbl">Repos</span>
                            </div>
                            <div className="rr-stat">
                                <span className="rr-stat-num">{totalFiles}</span>
                                <span className="rr-stat-lbl">Files</span>
                            </div>
                            {graphStats && (
                                <>
                                    <div className="rr-stat" style={{ borderColor: 'rgba(236,72,153,0.3)' }}>
                                        <span className="rr-stat-num" style={{ color: '#f472b6' }}>{graphStats.crossRepo}</span>
                                        <span className="rr-stat-lbl">Cross-repo calls</span>
                                    </div>
                                    <div className="rr-stat" style={{ borderColor: 'rgba(45,212,191,0.3)' }}>
                                        <span className="rr-stat-num" style={{ color: '#2dd4bf' }}>{graphStats.infra}</span>
                                        <span className="rr-stat-lbl">Infrastructure</span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Severity filter chips */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {SEV_ORDER.filter(s => sevCounts[s]).map(s => {
                                const cfg = SEV[s];
                                const active = sevFilter.size === 0 || sevFilter.has(s);
                                return (
                                    <button
                                        key={s}
                                        className={`rr-chip${active ? '' : ' dim'}`}
                                        style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                                        onClick={() => toggleSev(s)}
                                        title={sevFilter.has(s) ? `Stop filtering ${s}` : `Show only ${s}`}
                                    >
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                                        {sevCounts[s]} {s}
                                    </button>
                                );
                            })}
                            {(sevFilter.size > 0 || repoFilter) && (
                                <button className="rr-btn" onClick={() => { setSevFilter(new Set()); setRepoFilter(null); }}>
                                    Clear filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── Per repo ── */}
                    <div className="rr-panel">
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                            Per repository · {deepCount} deep · {repos.length - deepCount} context-only
                        </div>
                        {repos.map(r => {
                            const worst = SEV_ORDER.find(s => r.vulnerabilities.some(v => (v.severity || '').toLowerCase() === s));
                            const cfg = worst ? SEV[worst] : null;
                            return (
                                <div className="rr-repo-row" key={r.scanId}>
                                    <div className="rr-repo-icon">{r.repo.split('/').pop()?.charAt(0).toUpperCase() || '?'}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#E8EEFF', wordBreak: 'break-all' }}>
                                            {r.repo}
                                            {!r.deepScan && (
                                                <span style={{ marginLeft: 8, fontSize: 9.5, color: '#5C6480', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    context only
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 10.5, color: '#5C6480', marginTop: 3 }}>
                                            {r.totalFiles} files · {r.status || 'unknown'}
                                        </div>
                                    </div>
                                    {cfg && (
                                        <span className="rr-chip" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, cursor: 'default' }}>
                                            {worst}
                                        </span>
                                    )}
                                    <div style={{ textAlign: 'right', minWidth: 44 }}>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: r.vulnerabilities.length ? '#f87171' : '#34d399', lineHeight: 1 }}>
                                            {r.vulnerabilities.length}
                                        </div>
                                        <div style={{ fontSize: 9, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginTop: 2 }}>
                                            vulns
                                        </div>
                                    </div>
                                    <button
                                        className="rr-btn"
                                        onClick={() => setRepoFilter(repoFilter === r.repo ? null : r.repo)}
                                        title="Filter the list below to this repo"
                                    >
                                        {repoFilter === r.repo ? 'Unfilter' : 'Filter'}
                                    </button>
                                    <button className="rr-btn" onClick={() => navigate(`/scan/${r.scanId}`)}>
                                        Open
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Findings across the group ── */}
                    {allVulns.length > 0 && (
                        <div className="rr-panel">
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                                Findings across the group
                                {(sevFilter.size > 0 || repoFilter) && ` · ${filtered.length} shown`}
                            </div>

                            {filtered.length === 0 ? (
                                <div style={{ color: '#5C6480', fontSize: 12.5, padding: '10px 0' }}>
                                    Nothing matches the current filters.
                                </div>
                            ) : filtered.slice(0, 100).map((v, i) => {
                                const sev = (v.severity || 'info').toLowerCase();
                                const cfg = SEV[sev] ?? SEV.info;
                                const key = `${(v as any).__scanId}-${v.id || i}`;
                                const open = expanded.has(key);
                                return (
                                    <div className="rr-vuln" key={key}>
                                        <div className="rr-vuln-head" onClick={() => toggleVuln(key)}>
                                            <span className="rr-chip" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, cursor: 'pointer' }}>
                                                {sev}
                                            </span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#E8EEFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {v.title || 'Untitled finding'}
                                                </div>
                                                <div className="rr-code" style={{ marginTop: 3 }}>
                                                    {(v as any).__repo} · {v.file_path}{v.line_number ? `:${v.line_number}` : ''}
                                                </div>
                                            </div>
                                            <span style={{ color: '#5C6480', fontSize: 12, flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
                                        </div>
                                        {open && (
                                            <div className="rr-vuln-body">
                                                {v.description && <p style={{ margin: '10px 0 0' }}>{v.description}</p>}
                                                {v.fix_suggestion && (
                                                    <>
                                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '12px 0 5px' }}>
                                                            Suggested fix
                                                        </div>
                                                        <p style={{ margin: 0, color: '#34d399' }}>{v.fix_suggestion}</p>
                                                    </>
                                                )}
                                                <button
                                                    className="rr-btn"
                                                    style={{ marginTop: 12 }}
                                                    onClick={() => navigate(`/scan/${(v as any).__scanId}`)}
                                                >
                                                    Open in full scan view
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {filtered.length > 100 && (
                                <div style={{ fontSize: 11.5, color: '#5C6480', marginTop: 8 }}>
                                    Showing the first 100 of {filtered.length}. Open a repo for its full list.
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MultiRepoResults;
