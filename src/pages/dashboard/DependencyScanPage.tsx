import React, { useState, useRef, useCallback } from 'react';

/**
 * Dependency-only scan — POST /api/scan/github/deep/stream/dependencies
 *
 * Runs the multi-source dependency engine (no LLM phases, no credits charged)
 * and renders the package-level findings it streams back.
 *
 * Events: status | complete { scan_id, dep_result } | error
 */

interface DepCve {
    cve_id?: string;
    title?: string;
    severity?: string;
    risk_score?: number;
    risk_label?: string;
}

interface DepUsage {
    file?: string;
    line?: number;
    context?: string;
}

interface DepPackage {
    package_name?: string;
    package_version?: string;
    severity?: string;
    is_reachable?: boolean;
    introduced_via?: string[];
    fix_command?: string;
    usages?: DepUsage[];
    cves?: DepCve[];
}

interface DepResult {
    status?: string;
    error?: string;
    vulnerabilities?: DepPackage[];
}

const SEV: Record<string, { color: string; bg: string; border: string }> = {
    critical: { color: '#f87171', bg: 'rgba(244,63,94,0.12)',  border: 'rgba(244,63,94,0.28)' },
    high:     { color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.28)' },
    medium:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.28)' },
    low:      { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)' },
    unknown:  { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.28)' },
};

const sevOrder = ['critical', 'high', 'medium', 'low', 'unknown'];

const CSS = `
  @keyframes ds-spin   { to { transform: rotate(360deg); } }
  @keyframes ds-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

  .ds-root * { box-sizing: border-box; }

  .ds-input {
    background: #13151F; border: 1.5px solid rgba(99,102,241,0.18);
    border-radius: 9px; color: #E8EEFF; padding: 10px 14px;
    font-size: 13px; font-family: 'Instrument Sans', sans-serif;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .ds-input::placeholder { color: #52525b; }
  .ds-input:focus { border-color: rgba(99,102,241,0.45); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

  .ds-btn {
    display: inline-flex; align-items: center; gap: 7px;
    border-radius: 9px; padding: 10px 20px; cursor: pointer;
    font-size: 13px; font-weight: 700; font-family: 'Instrument Sans', sans-serif;
    background: linear-gradient(135deg, #7c3aed, #6366f1); color: #fff; border: none;
    box-shadow: 0 4px 18px rgba(124,58,237,0.3); transition: opacity 0.15s, transform 0.15s;
  }
  .ds-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  .ds-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .ds-ghost-btn {
    display: inline-flex; align-items: center; gap: 7px;
    background: #13151F; border: 1px solid rgba(99,102,241,0.2);
    border-radius: 9px; color: #9BA3BF; padding: 10px 16px; cursor: pointer;
    font-size: 13px; font-weight: 600; font-family: 'Instrument Sans', sans-serif;
    transition: all 0.15s;
  }
  .ds-ghost-btn:hover { background: #1a1d2b; border-color: rgba(99,102,241,0.4); color: #E8EEFF; }

  .ds-pkg {
    background: #13151F; border: 1px solid rgba(99,102,241,0.14);
    border-radius: 12px; overflow: hidden;
    animation: ds-fadein 0.3s ease both;
  }
  .ds-pkg-head {
    display: flex; align-items: center; gap: 10px; padding: 13px 15px;
    cursor: pointer; transition: background 0.15s;
  }
  .ds-pkg-head:hover { background: rgba(99,102,241,0.05); }
  .ds-pkg-body { padding: 0 15px 14px; border-top: 1px solid rgba(99,102,241,0.1); }

  .ds-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10.5px; font-weight: 700; padding: 3px 9px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0;
  }

  .ds-code {
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    background: #0B0D14; border: 1px solid rgba(99,102,241,0.12);
    border-radius: 7px; padding: 8px 11px; color: #9BA3BF;
    overflow-x: auto; white-space: pre;
  }

  .ds-spinner {
    width: 22px; height: 22px; border: 2.5px solid rgba(99,102,241,0.2);
    border-top-color: #818cf8; border-radius: 50%;
    animation: ds-spin 0.8s linear infinite;
  }

  .ds-inline-error {
    background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.22);
    border-radius: 10px; padding: 12px 16px; color: #f87171; font-size: 13px;
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
    font-family: 'Instrument Sans', sans-serif;
  }
`;

const DependencyScanPage: React.FC = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [branch, setBranch]   = useState('main');

    const [running, setRunning] = useState(false);
    const [status, setStatus]   = useState<string | null>(null);
    const [error, setError]     = useState<string | null>(null);
    const [result, setResult]   = useState<DepResult | null>(null);
    const [scanId, setScanId]   = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const abortRef = useRef<AbortController | null>(null);

    const toggle = (key: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const cancel = () => {
        abortRef.current?.abort();
        setRunning(false);
        setStatus(null);
    };

    const runScan = useCallback(async () => {
        const url = repoUrl.trim();
        if (!url) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setRunning(true);
        setError(null);
        setResult(null);
        setScanId(null);
        setStatus('Starting dependency scan…');

        try {
            const res = await fetch('/api/scan/github/deep/stream/dependencies', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repo_url:   [url],
                    branch:     branch.trim() || 'main',
                    batch_size: 10,
                }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error((d as any).detail || `Scan failed to start (${res.status})`);
            }
            if (!res.body) throw new Error('Scan stream unavailable');

            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer    = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const frames = buffer.split('\n\n');
                buffer = frames.pop() ?? '';

                for (const frame of frames) {
                    const line = frame.split('\n').find(l => l.startsWith('data:'));
                    if (!line) continue;
                    let evt: any;
                    try { evt = JSON.parse(line.slice(5).trim()); } catch { continue; }

                    if (evt.event === 'status') {
                        setStatus(evt.message || null);
                    } else if (evt.event === 'complete') {
                        setResult(evt.dep_result ?? null);
                        setScanId(evt.scan_id ?? null);
                        setStatus(null);
                    } else if (evt.event === 'error') {
                        setError(evt.message || 'Dependency scan failed');
                        setStatus(null);
                    }
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') setError(err.message || 'Dependency scan failed');
        } finally {
            setRunning(false);
        }
    }, [repoUrl, branch]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const packages = result?.vulnerabilities ?? [];

    const sorted = [...packages].sort((a, b) => {
        const ai = sevOrder.indexOf((a.severity || 'unknown').toLowerCase());
        const bi = sevOrder.indexOf((b.severity || 'unknown').toLowerCase());
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    });

    const counts = sevOrder.map(sev => ({
        sev,
        n: packages.filter(p => (p.severity || 'unknown').toLowerCase() === sev).length,
    })).filter(c => c.n > 0);

    const reachableCount = packages.filter(p => p.is_reachable).length;

    return (
        <div className="ds-root" style={{ padding: '28px 32px', maxWidth: 980, margin: '0 auto', fontFamily: "'Instrument Sans', sans-serif" }}>
            <style>{CSS}</style>

            <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#E8EEFF', letterSpacing: '-0.03em' }}>Dependency Scan</h2>
                <p style={{ margin: '4px 0 0', color: '#5C6480', fontSize: 13.5 }}>
                    Check a repository's packages against multiple vulnerability sources. No credits are charged.
                </p>
            </div>

            {/* ── Form ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <input
                    className="ds-input"
                    style={{ flex: 1, minWidth: 280 }}
                    placeholder="https://github.com/owner/repository"
                    value={repoUrl}
                    onChange={e => setRepoUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !running) runScan(); }}
                    disabled={running}
                    aria-label="Repository URL"
                />
                <input
                    className="ds-input"
                    style={{ width: 130 }}
                    placeholder="branch"
                    value={branch}
                    onChange={e => setBranch(e.target.value)}
                    disabled={running}
                    aria-label="Branch"
                />
                {running ? (
                    <button className="ds-ghost-btn" onClick={cancel}>Cancel</button>
                ) : (
                    <button className="ds-btn" onClick={runScan} disabled={!repoUrl.trim()}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v6M12 22v-6M2 12h6M22 12h-6" /><circle cx="12" cy="12" r="3" />
                        </svg>
                        Scan dependencies
                    </button>
                )}
            </div>

            {error && <div className="ds-inline-error"><span>⚠</span> {error}</div>}

            {running && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0' }}>
                    <div className="ds-spinner" />
                    <div style={{ color: '#9BA3BF', fontSize: 13 }}>{status || 'Scanning…'}</div>
                    <div style={{ color: '#5C6480', fontSize: 11.5 }}>Cloning and resolving the dependency tree can take a minute.</div>
                </div>
            )}

            {/* ── Results ── */}
            {!running && result && (
                <>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div style={{
                            display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 14px',
                            borderRadius: 9, background: '#13151F', border: '1px solid rgba(99,102,241,0.12)',
                        }}>
                            <span style={{ fontSize: 19, fontWeight: 800, color: packages.length ? '#f87171' : '#34d399', lineHeight: 1 }}>
                                {packages.length}
                            </span>
                            <span style={{ fontSize: 9.5, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                                Vulnerable packages
                            </span>
                        </div>
                        {reachableCount > 0 && (
                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 14px',
                                borderRadius: 9, background: '#13151F', border: '1px solid rgba(244,63,94,0.25)',
                            }}>
                                <span style={{ fontSize: 19, fontWeight: 800, color: '#fb923c', lineHeight: 1 }}>{reachableCount}</span>
                                <span style={{ fontSize: 9.5, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                                    Actually imported
                                </span>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
                            {counts.map(({ sev, n }) => {
                                const cfg = SEV[sev] ?? SEV.unknown;
                                return (
                                    <span key={sev} className="ds-chip" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                        {n} {sev}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {scanId && (
                        <div style={{ fontSize: 11, color: 'rgba(99,102,241,0.5)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 14 }}>
                            #{scanId.slice(0, 12)}
                        </div>
                    )}

                    {packages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#34d399', fontSize: 14, fontWeight: 600 }}>
                            ✓ No vulnerable dependencies found
                            {result.status === 'failed' && (
                                <div style={{ color: '#f87171', fontSize: 12.5, fontWeight: 400, marginTop: 8 }}>
                                    {result.error || 'The dependency engine reported a failure.'}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {sorted.map((pkg, i) => {
                                const key = `${pkg.package_name}@${pkg.package_version}-${i}`;
                                const sev = (pkg.severity || 'unknown').toLowerCase();
                                const cfg = SEV[sev] ?? SEV.unknown;
                                const isOpen = expanded.has(key);
                                return (
                                    <div key={key} className="ds-pkg" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
                                        <div className="ds-pkg-head" onClick={() => toggle(key)}>
                                            <span className="ds-chip" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                                                {sev}
                                            </span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EEFF', fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>
                                                    {pkg.package_name}
                                                    <span style={{ color: '#5C6480', fontWeight: 500 }}>@{pkg.package_version}</span>
                                                </div>
                                                <div style={{ fontSize: 11, color: '#5C6480', marginTop: 3 }}>
                                                    {(pkg.cves?.length ?? 0)} CVE{(pkg.cves?.length ?? 0) === 1 ? '' : 's'}
                                                    {pkg.usages?.length ? ` · used in ${pkg.usages.length} place${pkg.usages.length === 1 ? '' : 's'}` : ''}
                                                </div>
                                            </div>
                                            {pkg.is_reachable && (
                                                <span className="ds-chip" style={{ color: '#fb923c', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)' }}>
                                                    reachable
                                                </span>
                                            )}
                                            <span style={{ color: '#5C6480', fontSize: 12, flexShrink: 0 }}>{isOpen ? '▾' : '▸'}</span>
                                        </div>

                                        {isOpen && (
                                            <div className="ds-pkg-body">
                                                {pkg.cves && pkg.cves.length > 0 && (
                                                    <div style={{ marginTop: 12 }}>
                                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                                                            Advisories
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                            {pkg.cves.map((cve, ci) => (
                                                                <div key={cve.cve_id || ci} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                                                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                                                                        {cve.cve_id || '—'}
                                                                    </span>
                                                                    <span style={{ fontSize: 12, color: '#9BA3BF', lineHeight: 1.5 }}>
                                                                        {cve.title || 'No description available'}
                                                                        {cve.risk_label ? ` (${cve.risk_label})` : ''}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {pkg.usages && pkg.usages.length > 0 && (
                                                    <div style={{ marginTop: 14 }}>
                                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                                                            Where it's used
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                                                            {pkg.usages.map((u, ui) => (
                                                                <div key={`${u.file}-${u.line}-${ui}`} className="ds-code">
                                                                    {u.file}:{u.line}  {u.context ? `— ${u.context.trim()}` : ''}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {pkg.introduced_via && pkg.introduced_via.length > 0 && (
                                                    <div style={{ marginTop: 14, fontSize: 11.5, color: '#5C6480' }}>
                                                        Introduced via{' '}
                                                        <span style={{ color: '#9BA3BF', fontFamily: "'JetBrains Mono', monospace" }}>
                                                            {pkg.introduced_via.join(' → ')}
                                                        </span>
                                                    </div>
                                                )}

                                                {pkg.fix_command && (
                                                    <div style={{ marginTop: 14 }}>
                                                        <div style={{ fontSize: 10, fontWeight: 800, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>
                                                            Fix
                                                        </div>
                                                        <div className="ds-code" style={{ color: '#34d399' }}>{pkg.fix_command}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {!running && !result && !error && (
                <div style={{ textAlign: 'center', padding: '70px 0', color: '#5C6480', fontSize: 13.5, lineHeight: 1.7 }}>
                    Paste a repository URL to check its dependencies.<br />
                    This runs the same engine that powers the dependency section of a full scan.
                </div>
            )}
        </div>
    );
};

export default DependencyScanPage;
