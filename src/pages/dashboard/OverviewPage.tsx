import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
    uuid: string;
    email: string;
    name: string;
    role?: string;
    industry?: string;
    age?: number;
    country?: string;
    createdAt: string;
}

interface OverviewPageProps {
    user: User;
    onNavigate?: (tab: string) => void;
}

interface RecentScan {
    scan_id: string;
    repo_url: string;
    scanned_at: string;
    status: string;
    total_vulnerabilities: number;
    severity_counts?: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
}

const TAB_PATHS: Record<string, string> = {
    'new-session': '/new-session',
    'overview':    '/overview',
    'profile':     '/profile',
    'credits':     '/credits',
    'settings':    '/settings',
    'history':     '/history',
    'integrations': '/integrations',
};

const SEV_COLORS: Record<string, string> = {
    critical: '#f43f5e',
    high:     '#f97316',
    medium:   '#f59e0b',
    low:      '#10b981',
    info:     '#3b82f6',
};

const GitHubSVG = ({ size = 18, style }: { size?: number; style?: React.CSSProperties }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" style={style}>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
);

const GitLabSVG = ({ size = 18, style }: { size?: number; style?: React.CSSProperties }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" style={style}>
        <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 0 0-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 0 0-.867 0L1.386 9.45.044 13.587a.924.924 0 0 0 .331 1.023L12 23.054l11.625-8.443a.924.924 0 0 0 .33-1.024" />
    </svg>
);

const getInitials = (name: string) =>
    (name || 'U').trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';

const OverviewPage: React.FC<OverviewPageProps> = ({ user }) => {
    const navigate = useNavigate();
    const goTo = (tab: string) => navigate(TAB_PATHS[tab] ?? '/overview');

    const [recentScans, setRecentScans]         = useState<RecentScan[]>([]);
    const [scansLoading, setScansLoading]       = useState(true);
    const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
    const [githubLoading, setGithubLoading]     = useState(false);
    const [gitlabConnected, setGitlabConnected] = useState<boolean | null>(null);
    const [gitlabLoading, setGitlabLoading]     = useState(false);
    const [credits, setCredits]                 = useState<number | null>(null);
    const [creditsLoading, setCreditsLoading]   = useState(true);

    const abortRef = useRef<AbortController | null>(null);

    const formatDate = (iso: string) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatRelative = (iso: string) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (isNaN(d.getTime())) return '—';
        const diff  = Date.now() - d.getTime();
        const mins  = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days  = Math.floor(diff / 86400000);
        if (mins  < 1)  return 'just now';
        if (mins  < 60) return `${mins}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const repoName = (url: string) => {
        if (!url) return 'Unknown';
        if (url.startsWith('upload://')) return url.replace('upload://', '');
        const parts = url.replace(/\.git$/, '').split('/');
        return parts[parts.length - 1] || url;
    };

    const topSeverity = (counts?: RecentScan['severity_counts']): string | null => {
        if (!counts) return null;
        for (const s of ['critical', 'high', 'medium', 'low', 'info'] as const) {
            if (counts[s] > 0) return s;
        }
        return null;
    };

    const firstName = (name: string) =>
        (name || 'there').split(' ').filter(Boolean)[0] || name;

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    useEffect(() => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        fetch('/api/scans/history', { credentials: 'include', signal: controller.signal })
            .then(r => { if (r.status === 401) { navigate('/login'); return []; } return r.ok ? r.json() : []; })
            .then(data => setRecentScans(Array.isArray(data) ? data.slice(0, 5) : []))
            .catch(err => { if (err.name !== 'AbortError') setRecentScans([]); })
            .finally(() => setScansLoading(false));

        fetch('/api/auth/github/status', { credentials: 'include', signal: controller.signal })
            .then(r => r.ok ? r.json() : { connected: false })
            .then(data => setGithubConnected(Boolean(data.connected)))
            .catch(err => { if (err.name !== 'AbortError') setGithubConnected(false); });

        fetch('/api/auth/gitlab/status', { credentials: 'include', signal: controller.signal })
            .then(r => r.ok ? r.json() : { connected: false })
            .then(data => setGitlabConnected(Boolean(data.connected)))
            .catch(err => { if (err.name !== 'AbortError') setGitlabConnected(false); });

        fetch('/api/wallet', { credentials: 'include', signal: controller.signal })
            .then(r => { if (r.status === 401) { navigate('/login'); return null; } return r.ok ? r.json() : null; })
            .then(data => { if (data !== null) setCredits(data?.balance ?? data?.credits ?? 0); })
            .catch(err => { if (err.name !== 'AbortError') setCredits(0); })
            .finally(() => setCreditsLoading(false));

        return () => { controller.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleGitHubConnect = async () => {
        if (githubConnected) return;
        setGithubLoading(true);
        try {
            const res  = await fetch('/api/auth/github', { credentials: 'include' });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch { /* silent */ }
        finally { setGithubLoading(false); }
    };

    const handleGitLabConnect = async () => {
        if (gitlabConnected) return;
        setGitlabLoading(true);
        try {
            const res  = await fetch('/api/auth/gitlab', { credentials: 'include' });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch { /* silent */ }
        finally { setGitlabLoading(false); }
    };

    return (
        <div className="ov-root">

            {/* ── Welcome ─────────────────────────────────────────────── */}
            <div className="ov-welcome">
                <div className="ov-welcome-glow" aria-hidden="true" />
                <div className="ov-welcome-inner">
                    <div>
                        <h1 className="ov-heading">
                            {greeting()}, <span className="ov-name">{firstName(user.name)}</span>
                        </h1>
                        <p className="ov-subheading">Your Magon AI security workspace at a glance.</p>
                    </div>
                    <div className="ov-pills">
                        <span className="ov-pill">
                            <span className="ov-pill-dot ov-pill-dot--purple" />
                            {creditsLoading ? '…' : (credits ?? 0).toLocaleString()} credits
                        </span>
                        <span className="ov-pill">
                            <span className={`ov-pill-dot ${githubConnected ? 'ov-pill-dot--green' : 'ov-pill-dot--muted'}`} />
                            GitHub {githubConnected ? 'connected' : 'disconnected'}
                        </span>
                        <span className="ov-pill">
                            <span className={`ov-pill-dot ${gitlabConnected ? 'ov-pill-dot--orange' : 'ov-pill-dot--muted'}`} />
                            GitLab {gitlabConnected ? 'connected' : 'disconnected'}
                        </span>
                        {!scansLoading && recentScans.length > 0 && (
                            <span className="ov-pill">
                                <span className="ov-pill-dot ov-pill-dot--blue" />
                                {recentScans.length} recent scan{recentScans.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Stat cards ──────────────────────────────────────────── */}
            <div className="ov-cards">

                {/* Credits */}
                <div className="db-card db-card--accent ov-card" onClick={() => goTo('credits')} style={{ cursor: 'pointer' }}>
                    <div className="ov-card-chip ov-card-chip--purple" aria-hidden="true">❋</div>
                    <div className="db-card-label">Available Credits</div>
                    <div className="db-card-value">
                        {creditsLoading
                            ? <div style={{ height: 36, width: 120, borderRadius: 8, background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)', backgroundSize: '400px 100%', animation: 'ov-shimmer 1.4s ease infinite' }} />
                            : (credits ?? 0).toLocaleString()}
                    </div>
                    <div className="db-card-sub">Credits remaining</div>
                </div>

                {/* GitHub */}
                <div
                    className="db-card ov-card ov-card--github"
                    style={{
                        background:   githubConnected ? 'rgba(74,222,128,0.04)' : undefined,
                        borderColor:  githubConnected ? 'rgba(74,222,128,0.2)'  : undefined,
                        cursor:       githubConnected ? 'default' : 'pointer',
                    }}
                    onClick={githubConnected ? undefined : handleGitHubConnect}
                    role={githubConnected ? undefined : 'button'}
                    tabIndex={githubConnected ? undefined : 0}
                    onKeyDown={e => { if (!githubConnected && (e.key === 'Enter' || e.key === ' ')) handleGitHubConnect(); }}
                >
                    <div className={`ov-card-chip ${githubConnected ? 'ov-card-chip--green' : 'ov-card-chip--muted'}`} aria-hidden="true">
                        <GitHubSVG size={15} />
                    </div>
                    <div className="db-card-label">GitHub</div>
                    <div className="db-card-value db-card-value--md">
                        {githubConnected === null ? (
                            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Checking…</span>
                        ) : githubConnected ? (
                            <span className="db-badge db-badge--green">Connected</span>
                        ) : (
                            <span className="ov-connect-pill">
                                {githubLoading ? 'Connecting…' : 'Connect →'}
                            </span>
                        )}
                    </div>
                    <div className="db-card-sub">
                        {githubConnected ? 'Scan private repos & push fixes' : 'Click to link your account'}
                    </div>
                </div>

                {/* GitLab */}
                <div
                    className="db-card ov-card"
                    style={{
                        background:  gitlabConnected ? 'rgba(252,109,38,0.04)' : undefined,
                        borderColor: gitlabConnected ? 'rgba(252,109,38,0.22)' : undefined,
                        cursor:      gitlabConnected ? 'default' : 'pointer',
                    }}
                    onClick={gitlabConnected ? undefined : handleGitLabConnect}
                    role={gitlabConnected ? undefined : 'button'}
                    tabIndex={gitlabConnected ? undefined : 0}
                    onKeyDown={e => { if (!gitlabConnected && (e.key === 'Enter' || e.key === ' ')) handleGitLabConnect(); }}
                >
                    <div className={`ov-card-chip ${gitlabConnected ? 'ov-card-chip--orange' : 'ov-card-chip--muted'}`} aria-hidden="true">
                        <GitLabSVG size={15} />
                    </div>
                    <div className="db-card-label">GitLab</div>
                    <div className="db-card-value db-card-value--md">
                        {gitlabConnected === null ? (
                            <span style={{ color: '#aaa', fontSize: '0.85rem' }}>Checking…</span>
                        ) : gitlabConnected ? (
                            <span className="db-badge" style={{ background: 'rgba(252,109,38,0.12)', color: '#fb923c', boxShadow: 'inset 0 0 0 1px rgba(252,109,38,0.25)' }}>Connected</span>
                        ) : (
                            <span className="ov-connect-pill">
                                {gitlabLoading ? 'Connecting…' : 'Connect →'}
                            </span>
                        )}
                    </div>
                    <div className="db-card-sub">
                        {gitlabConnected ? 'Scan GitLab projects via OAuth' : 'Click to link your account'}
                    </div>
                </div>

                {/* Account */}
                <div className="db-card ov-card">
                    <div className="ov-card-chip ov-card-chip--blue" aria-hidden="true">◈</div>
                    <div className="db-card-label">Account Status</div>
                    <div className="db-card-value db-card-value--md">
                        <span className="db-badge db-badge--green">Verified</span>
                    </div>
                    <div className="db-card-sub">Member since {formatDate(user.createdAt)}</div>
                </div>

            </div>

            {/* ── New scan CTA ─────────────────────────────────────────── */}
            <div
                className="ov-cta"
                onClick={() => goTo('new-session')}
                role="button"
                tabIndex={0}
                aria-label="Start a new security scan"
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') goTo('new-session'); }}
            >
                <div className="ov-cta-glow" aria-hidden="true" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
                    <div className="ov-cta-icon" aria-hidden="true">✦</div>
                    <div>
                        <div className="ov-cta-title">Start a New Security Scan</div>
                        <div className="ov-cta-sub">Deep-scan a GitHub / GitLab repo or upload project files for vulnerabilities</div>
                    </div>
                </div>
                <div className="ov-cta-arrow" aria-hidden="true">Launch →</div>
            </div>

            {/* ── Bottom 3-col grid ─────────────────────────────────────── */}
            <div className="ov-grid">

                {/* Recent Scans */}
                <div className="ov-panel">
                    <div className="ov-panel-header">
                        <span className="ov-panel-title">Recent Scans</span>
                        <button className="db-link-btn" onClick={() => goTo('history')} style={{ padding: 0, fontSize: '0.78rem' }}>
                            View all →
                        </button>
                    </div>

                    {scansLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }} role="status" aria-label="Loading scans">
                            {[1,2,3].map(i => (
                                <div key={i} style={{
                                    height: 54, borderRadius: 10,
                                    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 100%)',
                                    backgroundSize: '400px 100%',
                                    animation: 'ov-shimmer 1.4s ease infinite',
                                    animationDelay: `${i * 0.12}s`,
                                }} />
                            ))}
                        </div>
                    ) : recentScans.length === 0 ? (
                        <div className="ov-empty">
                            <div className="ov-empty-icon" aria-hidden="true">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.45)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                            </div>
                            <p>No scans yet.</p>
                            <button className="ov-empty-btn" onClick={() => goTo('new-session')}>Start your first scan →</button>
                        </div>
                    ) : (
                        <div className="ov-scan-list" role="list">
                            {recentScans.map(scan => {
                                const top   = topSeverity(scan.severity_counts);
                                const color = top ? SEV_COLORS[top] : '#6366f1';
                                return (
                                    <div
                                        key={scan.scan_id}
                                        className="ov-scan-item"
                                        style={{ borderLeftColor: color }}
                                        onClick={() => goTo('history')}
                                        role="listitem button"
                                        tabIndex={0}
                                        onKeyDown={e => { if (e.key === 'Enter') goTo('history'); }}
                                        aria-label={`${repoName(scan.repo_url)}, ${scan.total_vulnerabilities} vulnerabilities`}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="ov-scan-name">{repoName(scan.repo_url)}</div>
                                            <div className="ov-scan-time">{formatRelative(scan.scanned_at)}</div>
                                        </div>
                                        <div className="ov-scan-badge" style={{
                                            background: scan.total_vulnerabilities > 0 ? `${color}18` : 'rgba(16,185,129,0.1)',
                                            color:      scan.total_vulnerabilities > 0 ? color : '#10b981',
                                            border:     `1px solid ${scan.total_vulnerabilities > 0 ? color + '35' : 'rgba(16,185,129,0.25)'}`,
                                        }}>
                                            {scan.total_vulnerabilities > 0 ? `${scan.total_vulnerabilities} vuln${scan.total_vulnerabilities !== 1 ? 's' : ''}` : 'Clean'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Your Profile */}
                <div className="ov-panel">
                    <div className="ov-panel-header">
                        <span className="ov-panel-title">Your Profile</span>
                    </div>
                    <div className="ov-avatar-row">
                        <div className="ov-avatar">{getInitials(user.name)}</div>
                        <div>
                            <div className="ov-avatar-name">{user.name}</div>
                            <div className="ov-avatar-sub">{user.role ?? 'Member'}</div>
                        </div>
                    </div>
                    <div className="ov-divider" />
                    <div className="db-info-row"><span>Email</span>
                        <strong style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                        </strong>
                    </div>
                    {user.industry && <div className="db-info-row"><span>Industry</span><strong>{user.industry}</strong></div>}
                    {user.country  && <div className="db-info-row"><span>Country</span><strong>{user.country}</strong></div>}
                    <div className="db-info-row">
                        <span>Member since</span><strong>{formatDate(user.createdAt)}</strong>
                    </div>
                    <button className="db-link-btn" onClick={() => goTo('profile')}>Edit profile →</button>
                </div>

                {/* Quick Actions */}
                <div className="ov-panel">
                    <div className="ov-panel-header">
                        <span className="ov-panel-title">Quick Actions</span>
                    </div>
                    <div className="ov-actions">
                        {[
                            { icon: '✦', label: 'New Scan',       tab: 'new-session',  bg: 'rgba(168,85,247,0.15)',  color: '#a855f7' },
                            { icon: '◷', label: 'Scan History',   tab: 'history',       bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
                            { icon: '❋', label: 'View Credits',   tab: 'credits',       bg: 'rgba(6,182,212,0.12)',  color: '#22d3ee' },
                            { icon: '⬡', label: 'Integrations',   tab: 'integrations',  bg: 'rgba(74,222,128,0.12)', color: '#4ade80' },
                            { icon: '⚙', label: 'Settings',       tab: 'settings',      bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' },
                        ].map(({ icon, label, tab, bg, color }) => (
                            <button key={tab} className="ov-action-btn" onClick={() => goTo(tab)}>
                                <span className="ov-action-icon" style={{ background: bg, color }} aria-hidden="true">
                                    {icon}
                                </span>
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OverviewPage;
