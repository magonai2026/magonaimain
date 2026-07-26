import './Dast.css'; // ✨ Added this import to link your stylesheet!
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScanOptions {
    // Auth
    authType:      'none' | 'form' | 'json' | 'totp' | 'preauth' | 'recorded';
    loginUrl:      string;
    username:      string;
    password:      string;
    bearerToken:   string;
    sessionCookie: string;
    totpSecret:    string;
    headerName:    string;
    tokenPath:     string;
    // Discovery
    openApiUrl:    string;
    seedUrls:      string;
    logoutUrls:    string;
    // Scanner behaviour
    parallelScan:  boolean;
    useBrowser:    boolean;
    scanGraphQL:   boolean;
    jsonFuzz:      boolean;
    tokenTtlSec:   number;
}

const DEFAULT_OPTIONS: ScanOptions = {
    authType:      'none',
    loginUrl:      '',
    username:      '',
    password:      '',
    bearerToken:   '',
    sessionCookie: '',
    totpSecret:    '',
    headerName:    'Authorization',
    tokenPath:     'token',
    openApiUrl:    '',
    seedUrls:      '',
    logoutUrls:    '',
    parallelScan:  false,
    useBrowser:    false,
    scanGraphQL:   false,
    jsonFuzz:      false,
    tokenTtlSec:   840,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildScanBody = (target: string, opts: ScanOptions) => {
    const body: Record<string, unknown> = { target };

    // Auth block
    if (opts.authType !== 'none') {
        const auth: Record<string, unknown> = { type: opts.authType };
        if (opts.loginUrl)      auth.loginUrl      = opts.loginUrl;
        if (opts.username)      auth.username       = opts.username;
        if (opts.password)      auth.password       = opts.password;
        if (opts.bearerToken)   auth.bearerToken    = opts.bearerToken;
        if (opts.sessionCookie) auth.sessionCookie  = opts.sessionCookie;
        if (opts.totpSecret)    auth.totpSecret     = opts.totpSecret;
        if (opts.authType === 'json') {
            auth.headerName = opts.headerName || 'Authorization';
            auth.tokenPath  = opts.tokenPath  || 'token';
            auth.body       = { username: opts.username, password: opts.password };
        }
        if (opts.authType === 'totp') {
            auth.subType = 'form'; // default; users can change via JSON if needed
        }
        body.auth = auth;
    }

    // Discovery
    if (opts.openApiUrl) body.openApiUrl = opts.openApiUrl;
    if (opts.seedUrls)   body.seedUrls   = opts.seedUrls.split(',').map(s => s.trim()).filter(Boolean);
    if (opts.logoutUrls) body.logoutUrls = opts.logoutUrls.split(',').map(s => s.trim()).filter(Boolean);

    // Scanner behaviour
    body.parallelScan = opts.parallelScan;
    body.useBrowser   = opts.useBrowser;
    body.scanGraphQL  = opts.scanGraphQL;
    body.jsonFuzz     = opts.jsonFuzz;
    if (opts.tokenTtlSec !== 840) body.tokenTtlSec = opts.tokenTtlSec;

    return body;
};

// ── Component ─────────────────────────────────────────────────────────────────

const DastScanPage = () => {
    const [targetUrl, setTargetUrl] = useState('https://testphp.vulnweb.com');
    const [isScanning, setIsScanning]   = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [opts, setOpts]               = useState<ScanOptions>(DEFAULT_OPTIONS);
    const navigate = useNavigate();

    const [status, setStatus]   = useState({ progress: 0, stage: 'idle', error: null as string | null });
    const [report, setReport]   = useState<any>(null);
    const [_scanId, setScanId]  = useState<string | null>(null);

    const [queuePos, setQueuePos] = useState<number | null>(null); // [NEW] queue position

    const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const [, setLogs] = useState<{time: string, msg: string}[]>([]);  

    // ── Option setter helper ───────────────────────────────────────────────────
    const setOpt = <K extends keyof ScanOptions>(key: K, val: ScanOptions[K]) =>
        setOpts(prev => ({ ...prev, [key]: val }));

    // ── Mount: check for in-progress scan ─────────────────────────────────────
    useEffect(() => {
        checkCurrentStatus();
        return () => stopPolling();
    }, []);

    const checkCurrentStatus = async () => {
        try {
            const res  = await fetch('/api/dast/scan/status');
            if (!res.ok) return;
            const data = await res.json();
            if (data.status === 'running') {
                setIsScanning(true);
                setScanId(data.scanId || null);
                setStatus({ progress: data.progress, stage: data.stage, error: data.error });
                startPolling(data.scanId);
            } else if (data.status === 'done' && data.scanId) {
                fetchReport(data.scanId);
            }
        } catch (err) {
            console.error("Failed to fetch initial DAST status", err);
        }
    };

    // ── Start scan ─────────────────────────────────────────────────────────────
    const handleStartScan = async () => {
        if (!targetUrl) return;
        try {
            setIsScanning(true);
            setShowOptions(false); // 👈 ADD THIS: Auto-collapse options on start
            setStatus({ progress: 0, stage: 'opening', error: null });
            setReport(null);
            setScanId(null);
            setQueuePos(null);
            setLogs([]); // Clear logs on new scan (we will add this state below)

            const body = buildScanBody(targetUrl, opts);

            const res  = await fetch('/api/dast/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409 && data.scanId) {
                    setScanId(data.scanId);
                    startPolling(data.scanId);
                    return;
                }
                throw new Error(data.error || 'Failed to start scan');
            }

            setScanId(data.scanId);
            // [NEW] If queued, show position
            if (data.queued) setQueuePos(data.queuePosition ?? null);
            startPolling(data.scanId);
        } catch (err: any) {
            setStatus(prev => ({ ...prev, error: err.message }));
            setIsScanning(false);
        }
    };

    // ── Poll for progress ──────────────────────────────────────────────────────
    const startPolling = (id: string) => {
        stopPolling();
        let pollCount = 0;
        const MAX_POLLS = 360; // 30 min at 5s intervals

        pollInterval.current = setInterval(async () => {
            pollCount++;
            if (pollCount > MAX_POLLS) {
                stopPolling();
                setIsScanning(false);
                setStatus(prev => ({ ...prev, error: 'Scan timed out. Please check back later.' }));
                return;
            }

            try {
                const res  = await fetch(`/api/dast/scan/status?scanId=${id}`);
                const data = await res.json();

                if (res.status === 401 || res.status === 403 || res.status === 404) {
                    stopPolling();
                    setIsScanning(false);
                    setStatus(prev => ({ ...prev, error: data.error || `Error ${res.status}` }));
                    return;
                }

                setStatus({ progress: data.progress, stage: data.stage, error: data.error });

                // [NEW] Track queue position if still pending
                if (data.queued) {
                    setQueuePos(data.queuePosition ?? null);
                } else {
                    setQueuePos(null);
                }

                if (data.status === 'done') {
                    stopPolling();
                    setIsScanning(false);
                    fetchReport(id);
                } else if (data.status === 'error') {
                    stopPolling();
                    setIsScanning(false);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 5000);
    };

    const stopPolling = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
    };

    // ── Fetch results & navigate ───────────────────────────────────────────────
    const fetchReport = async (id: string) => {
        try {
            const res = await fetch(`/api/dast/report/${id}`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
                navigate(`/dast/result/${id}`, { state: { report: data, scanId: id }, replace: false });
            }
        } catch (err) {
            console.error("Failed to fetch report", err);
        }
    };

    // ── Derived progress ───────────────────────────────────────────────────────
    const spiderPct = Math.min(100, Math.max(0, ((status.progress - 10) / 30) * 100));
    const activePct = Math.min(100, Math.max(0, ((status.progress - 40) / 55) * 100));
    const totalVulns = report
        ? (report.summary?.High || 0) + (report.summary?.Medium || 0) + (report.summary?.Low || 0)
        : 0;

    // ── Auth fields shown per type ─────────────────────────────────────────────
    const showLoginUrl   = ['form','json','totp'].includes(opts.authType);
    const showCreds      = ['form','json','totp'].includes(opts.authType);
    const showTotp       = opts.authType === 'totp';
    const showJsonFields = opts.authType === 'json';
    const showBearer     = opts.authType === 'preauth';
    const showCookie     = opts.authType === 'preauth';

    return (
        <div className="dast-root">

            {/* ── 1. Target + options card ────────────────────────────────── */}
            <div className="db-card dast-header-card">
                <div className="dast-card-header">
                    <div className="dast-icon-shield">🛡️</div>
                    <div>
                        <h2 className="dast-title">Start DAST Scan</h2>
                        <p className="dast-sub">Enter the target URL and configure scan options</p>
                    </div>
                </div>

                <div className="dast-input-row">
                    <div className="dast-input-wrapper">
                        <span className="dast-input-icon">🔗</span>
                        <input
                            type="text"
                            className="dast-input"
                            value={targetUrl}
                            onChange={e => setTargetUrl(e.target.value)}
                            placeholder="https://example.com"
                            disabled={isScanning}
                        />
                    </div>
                    <button
                        className="dast-btn-options"
                        onClick={() => setShowOptions(o => !o)}
                        disabled={isScanning}
                        title="Configure scan options"
                    >
                        ⚙ {showOptions ? 'Hide' : 'Options'}
                    </button>
                    <button
                        className={`dast-btn ${isScanning ? 'dast-btn-stop' : 'dast-btn-start'}`}
                        onClick={handleStartScan}
                        disabled={isScanning}
                        style={{ opacity: isScanning ? 0.6 : 1, cursor: isScanning ? 'not-allowed' : 'pointer' }}
                    >
                        {isScanning ? '⏳ Scanning…' : '▶ Start Scan'}
                    </button>
                </div>

                {status.error && (
                    <div className="dast-error-banner">⚠ {status.error}</div>
                )}

                {/* ── Expanded options panel ────────────────────────────── */}
                {showOptions && (
                    <div className="dast-options-panel">

                        {/* Auth */}
                        <div className="dast-options-section">
                            <div className="dast-options-label">Authentication</div>
                            <div className="dast-options-row">
                                <label className="dast-field-label">Auth type</label>
                                <select
                                    className="dast-select"
                                    value={opts.authType}
                                    onChange={e => setOpt('authType', e.target.value as ScanOptions['authType'])}
                                >
                                    <option value="none">None — public pages only</option>
                                    <option value="form">Form login (username + password)</option>
                                    <option value="json">JSON / JWT login endpoint</option>
                                    <option value="totp">TOTP 2FA</option>
                                    <option value="preauth">Pre-auth (paste cookie / bearer)</option>
                                </select>
                            </div>

                            {showLoginUrl && (
                                <div className="dast-options-row">
                                    <label className="dast-field-label">Login URL</label>
                                    <input className="dast-opt-input" type="text" placeholder="https://app.com/api/login"
                                        value={opts.loginUrl} onChange={e => setOpt('loginUrl', e.target.value)} />
                                </div>
                            )}

                            {showCreds && (
                                <div className="dast-options-2col">
                                    <div>
                                        <label className="dast-field-label">Username / Email</label>
                                        <input className="dast-opt-input" type="text" placeholder="admin@example.com"
                                            value={opts.username} onChange={e => setOpt('username', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="dast-field-label">Password</label>
                                        <input className="dast-opt-input" type="password" placeholder="••••••••"
                                            value={opts.password} onChange={e => setOpt('password', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {showJsonFields && (
                                <div className="dast-options-2col">
                                    <div>
                                        <label className="dast-field-label">Token path in response</label>
                                        <input className="dast-opt-input" type="text" placeholder="data.token"
                                            value={opts.tokenPath} onChange={e => setOpt('tokenPath', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="dast-field-label">Inject as header</label>
                                        <input className="dast-opt-input" type="text" placeholder="Authorization"
                                            value={opts.headerName} onChange={e => setOpt('headerName', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {showTotp && (
                                <div className="dast-options-row">
                                    <label className="dast-field-label">TOTP secret (base32)</label>
                                    <input className="dast-opt-input" type="text" placeholder="JBSWY3DPEHPK3PXP"
                                        value={opts.totpSecret} onChange={e => setOpt('totpSecret', e.target.value)} />
                                </div>
                            )}

                            {showBearer && (
                                <div className="dast-options-row">
                                    <label className="dast-field-label">Bearer token</label>
                                    <input className="dast-opt-input" type="text" placeholder="eyJhbGci…"
                                        value={opts.bearerToken} onChange={e => setOpt('bearerToken', e.target.value)} />
                                </div>
                            )}

                            {showCookie && (
                                <div className="dast-options-row">
                                    <label className="dast-field-label">Session cookie</label>
                                    <input className="dast-opt-input" type="text" placeholder="connect.sid=abc123"
                                        value={opts.sessionCookie} onChange={e => setOpt('sessionCookie', e.target.value)} />
                                </div>
                            )}

                            {opts.authType !== 'none' && (
                                <div className="dast-options-row">
                                    <label className="dast-field-label">Token refresh interval (sec)</label>
                                    <input className="dast-opt-input" type="number" min={60} max={3600} style={{ width: 100 }}
                                        value={opts.tokenTtlSec} onChange={e => setOpt('tokenTtlSec', Number(e.target.value))} />
                                    <span className="dast-field-hint">For json / totp auth — auto-refreshes token every N seconds</span>
                                </div>
                            )}
                        </div>

                        {/* Discovery */}
                        <div className="dast-options-section">
                            <div className="dast-options-label">Discovery</div>
                            <div className="dast-options-row">
                                <label className="dast-field-label">OpenAPI spec URL</label>
                                <input className="dast-opt-input" type="text" placeholder="https://app.com/api/openapi.json"
                                    value={opts.openApiUrl} onChange={e => setOpt('openApiUrl', e.target.value)} />
                                <span className="dast-field-hint">Seeds every endpoint into ZAP before spidering</span>
                            </div>
                            <div className="dast-options-row">
                                <label className="dast-field-label">Extra seed URLs</label>
                                <input className="dast-opt-input" type="text" placeholder="https://app.com/dashboard, https://app.com/settings"
                                    value={opts.seedUrls} onChange={e => setOpt('seedUrls', e.target.value)} />
                                <span className="dast-field-hint">Comma-separated — seeded before spidering</span>
                            </div>
                            <div className="dast-options-row">
                                <label className="dast-field-label">Logout URLs (exclude)</label>
                                <input className="dast-opt-input" type="text" placeholder="https://app.com/logout"
                                    value={opts.logoutUrls} onChange={e => setOpt('logoutUrls', e.target.value)} />
                                <span className="dast-field-hint">ZAP will never visit these URLs</span>
                            </div>
                        </div>

                        {/* Scanner behaviour */}
                        <div className="dast-options-section">
                            <div className="dast-options-label">Scanner behaviour</div>
                            <div className="dast-toggle-grid">
                                <label className="dast-toggle-item">
                                    <input type="checkbox" checked={opts.parallelScan} onChange={e => setOpt('parallelScan', e.target.checked)} />
                                    <div>
                                        <div className="dast-toggle-name">⚡ Parallel scan</div>
                                        <div className="dast-toggle-desc">Spider + active scan run simultaneously — faster on large sites</div>
                                    </div>
                                </label>
                                <label className="dast-toggle-item">
                                    <input type="checkbox" checked={opts.useBrowser} onChange={e => setOpt('useBrowser', e.target.checked)} />
                                    <div>
                                        <div className="dast-toggle-name">🌐 Playwright browser spider</div>
                                        <div className="dast-toggle-desc">Captures XHR/fetch calls from JS-heavy apps</div>
                                    </div>
                                </label>
                                <label className="dast-toggle-item">
                                    <input type="checkbox" checked={opts.scanGraphQL} onChange={e => setOpt('scanGraphQL', e.target.checked)} />
                                    <div>
                                        <div className="dast-toggle-name">◈ GraphQL scan</div>
                                        <div className="dast-toggle-desc">Auto-discover endpoint, introspect schema, fuzz all arguments</div>
                                    </div>
                                </label>
                                <label className="dast-toggle-item">
                                    <input type="checkbox" checked={opts.jsonFuzz} onChange={e => setOpt('jsonFuzz', e.target.checked)} />
                                    <div>
                                        <div className="dast-toggle-name">🎯 JSON body fuzzing</div>
                                        <div className="dast-toggle-desc">Mutates API request bodies with SQLi / XSS / SSTI payloads</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 2. Progress card ────────────────────────────────────────── */}
            {(isScanning || status.stage === 'done') && (
                <div className="db-card dast-progress-card">
                    <div className="dast-progress-header">
                        <div>
                            <h2 className="dast-title">
                                {isScanning ? 'Scan Progress' : 'Scan Complete'}
                            </h2>
                            <p className="dast-sub">
                                {/* [NEW] Show queue position if waiting */}
                                {queuePos !== null && isScanning
                                    ? `Queued — position #${queuePos} · waiting for a worker`
                                    : isScanning
                                        ? `Stage: ${status.stage.charAt(0).toUpperCase() + status.stage.slice(1)}…`
                                        : 'Redirecting to results…'}
                            </p>
                        </div>
                        <span className="dast-status-badge" style={{
                            background: isScanning ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                            color: isScanning ? 'var(--green)' : '#3b82f6',
                        }}>
                            {isScanning ? '⟳ In Progress' : '✓ Done'}
                        </span>
                    </div>

                    {/* [NEW] Queue waiting indicator */}
                    {queuePos !== null && isScanning && (
                        <div className="dast-queue-banner">
                            <span className="dast-queue-icon">🕐</span>
                            <div>
                                <strong>Waiting in queue — position #{queuePos}</strong>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                    A worker will pick up your scan shortly. You can safely close this tab.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Spider progress */}
                    <div className="dast-tracker">
                        <div className="dast-tracker-info">
                            <div className="dast-tracker-left">
                                <span className="dast-tracker-icon purple">🕷️</span>
                                <strong>Spider (Crawling)</strong>
                                {opts.useBrowser && <span className="dast-mode-tag">Playwright</span>}
                                {opts.parallelScan && <span className="dast-mode-tag">Parallel</span>}
                            </div>
                            <span className="dast-tracker-pct">{Math.round(spiderPct)}%</span>
                        </div>
                        <div className="dast-bar-bg">
                            <div className="dast-bar-fill purple" style={{ width: `${spiderPct}%` }}></div>
                        </div>
                        <div className="dast-tracker-meta">
                            <span>Crawling pages and collecting endpoints…</span>
                            <span>{status.progress > 40 ? 'Complete' : 'Working…'}</span>
                        </div>
                    </div>

                    {/* Active scan progress */}
                    <div className="dast-tracker">
                        <div className="dast-tracker-info">
                            <div className="dast-tracker-left">
                                <span className="dast-tracker-icon orange">⚡</span>
                                <strong>Active Scan</strong>
                                {opts.jsonFuzz && <span className="dast-mode-tag">+ Fuzzing</span>}
                                {opts.scanGraphQL && <span className="dast-mode-tag">+ GraphQL</span>}
                            </div>
                            <span className="dast-tracker-pct">{Math.round(activePct)}%</span>
                        </div>
                        <div className="dast-bar-bg">
                            <div className="dast-bar-fill orange" style={{ width: `${activePct}%` }}></div>
                        </div>
                        <div className="dast-tracker-meta">
                            <span>Testing for vulnerabilities…</span>
                            <span>{status.progress >= 95 ? 'Complete' : 'Working…'}</span>
                        </div>
                    </div>

                    {/* [NEW] OpenAPI indicator */}
                    {opts.openApiUrl && (
                        <div className="dast-feature-tag-row">
                            <span className="dast-feature-tag">📄 OpenAPI: {opts.openApiUrl.replace(/^https?:\/\//, '').slice(0, 50)}</span>
                        </div>
                    )}

                    {/* Stat grid */}
                    <div className="dast-stats-grid">
                        <div className="dast-stat-box">
                            <div className="dast-stat-icon blue">🌐</div>
                            <div>
                                <div className="dast-stat-val">{report ? 'Done' : '--'}</div>
                                <div className="dast-stat-label">Pages Crawled</div>
                            </div>
                        </div>
                        <div className="dast-stat-box">
                            <div className="dast-stat-icon purple">☷</div>
                            <div>
                                <div className="dast-stat-val">{report ? 'Done' : '--'}</div>
                                <div className="dast-stat-label">Endpoints Found</div>
                            </div>
                        </div>
                        <div className="dast-stat-box">
                            <div className="dast-stat-icon green">🛡️</div>
                            <div>
                                <div className="dast-stat-val">{report?.summary?.High || 0}</div>
                                <div className="dast-stat-label">High Risk</div>
                            </div>
                        </div>
                        <div className="dast-stat-box">
                            <div className="dast-stat-icon red">⚠️</div>
                            <div>
                                <div className="dast-stat-val">{totalVulns}</div>
                                <div className="dast-stat-label">Total Findings</div>
                            </div>
                        </div>
                    </div>

                    {/* Active options summary */}
                    {isScanning && (
                        <div className="dast-active-opts">
                            {opts.authType !== 'none' && <span className="dast-opt-chip">🔑 {opts.authType} auth</span>}
                            {opts.parallelScan && <span className="dast-opt-chip">⚡ parallel</span>}
                            {opts.useBrowser   && <span className="dast-opt-chip">🌐 playwright</span>}
                            {opts.scanGraphQL  && <span className="dast-opt-chip">◈ graphql</span>}
                            {opts.jsonFuzz     && <span className="dast-opt-chip">🎯 fuzzing</span>}
                            {opts.openApiUrl   && <span className="dast-opt-chip">📄 openapi</span>}
                        </div>
                    )}

                    {isScanning && (
                        <div className="dast-warning-banner">
                            ⓘ Please do not close this page. Scan will continue in the background if you navigate away.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DastScanPage;