import React, { useState, useEffect, useRef } from 'react';
import { Spinner, StatusMsg, ToggleSwitch, type GitHubRepo } from './IntegrationsShared';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface DepScheduleConfig {
    enabled:         boolean;
    interval_hours:  number;
    time:            string;
    timezone:        string;
    auto_fix:        boolean;
    last_scanned_at: string | null;
    next_scan_at:    string | null;
}

interface CodeScheduleConfig {
    enabled:         boolean;
    interval_hours:  number;
    time:            string;
    timezone:        string;
    auto_fix:        boolean;
    last_scanned_at: string | null;
    next_scan_at:    string | null;
}

interface ScheduleConfig {
    dependencies: DepScheduleConfig;
    code:         CodeScheduleConfig;
}

interface WebhookConfig {
    repo_url:      string;
    branch:        string;
    auto_fix:      boolean;
    fix_severity:  string[];
    notifications: {
        enabled: string[];
        slack?:  { webhook_url?: string };
        email?:  { to: string[] };
        jira?:   { domain: string; email: string; api_token: string; project_key: string; issue_type: string };
        teams?:  { webhook_url?: string };
    };
    schedule?: ScheduleConfig;
}

const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low'];

const TIMEZONES = [
    'UTC',
    'Asia/Kolkata',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Asia/Dubai',
    'Australia/Sydney',
];

const DEFAULT_DEP_SCHEDULE: DepScheduleConfig = {
    enabled:         false,
    interval_hours:  24,
    time:            '02:00',
    timezone:        'UTC',
    auto_fix:        false,
    last_scanned_at: null,
    next_scan_at:    null,
};

const DEFAULT_CODE_SCHEDULE: CodeScheduleConfig = {
    enabled:         false,
    interval_hours:  168,
    time:            '03:00',
    timezone:        'UTC',
    auto_fix:        false,
    last_scanned_at: null,
    next_scan_at:    null,
};

// ─── RepoDropdown Component ───────────────────────────────────────────────────

const RepoDropdown: React.FC<{
    repos:     GitHubRepo[];
    selected:  GitHubRepo | null;
    loading:   boolean;
    connected: boolean | null;
    onSelect:  (repo: GitHubRepo | null) => void;
    onConnect: () => void;
}> = ({ repos, selected, loading, connected, onSelect, onConnect }) => {
    const [open,   setOpen]   = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = repos.filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()));

    if (!loading && connected === false) {
        return (
            <div className="ns-repo-item" style={{ padding: '10px 14px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Connect GitHub to pick a repository</span>
                <button type="button" className="db-save-btn" style={{ padding: '5px 14px', fontSize: '0.78rem' }} onClick={onConnect}>
                    Connect GitHub
                </button>
            </div>
        );
    }

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                type="button"
                className="ns-input"
                disabled={loading || !connected}
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor:      loading ? 'wait' : 'pointer',
                    borderColor: open ? 'var(--accent)' : 'var(--border)',
                    boxShadow:   open ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                    opacity:     loading || !connected ? 0.6 : 1,
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {loading ? (
                        <><Spinner /><span style={{ marginLeft: 8 }}>Loading repos…</span></>
                    ) : selected ? (
                        <><span style={{ fontSize: '0.8rem' }}>{selected.private ? '🔒' : '📂'}</span>{selected.full_name}</>
                    ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Select a repository…</span>
                    )}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▼</span>
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                    zIndex: 50, borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>
                        <div className="ns-repo-search">
                            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search repositories…" className="ns-repo-search-input" />
                        </div>
                    </div>
                    <div className="ns-repo-list" style={{ padding: '8px' }}>
                        {filtered.length === 0 ? (
                            <div className="ns-repo-empty">{search ? `No repos match "${search}"` : 'No repositories found.'}</div>
                        ) : filtered.map(repo => {
                            const isSelected = selected?.id === repo.id;
                            return (
                                <div key={repo.id} className={`ns-repo-item ${isSelected ? 'ns-repo-item--selected' : ''}`} onClick={() => { onSelect(repo); setOpen(false); setSearch(''); }}>
                                    <span style={{ fontSize: '0.85rem' }}>{repo.private ? '🔒' : '📂'}</span>
                                    <div className="ns-repo-item-left">
                                        <div className="ns-repo-item-name" style={{ color: isSelected ? 'var(--accent)' : 'var(--text)' }}>{repo.full_name}</div>
                                    </div>
                                    <div className="ns-repo-item-right">
                                        {repo.private && <span className="ns-repo-lang">private</span>}
                                        {isSelected && <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1 5.5L5 9.5L13 1.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── ScheduleSection Component ────────────────────────────────────────────────

const ScheduleSection: React.FC<{
    depSchedule:    DepScheduleConfig;
    codeSchedule:   CodeScheduleConfig;
    onDepChange:    (v: DepScheduleConfig) => void;
    onCodeChange:   (v: CodeScheduleConfig) => void;
}> = ({ depSchedule, codeSchedule, onDepChange, onCodeChange }) => {

    const fieldStyle: React.CSSProperties = {
        display: 'flex', flexDirection: 'column', gap: 4, flex: 1,
    };
    const labelStyle: React.CSSProperties = {
        fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
    };
    const inputStyle: React.CSSProperties = {
        fontSize: '0.82rem',
    };

    const renderScheduleBlock = <T extends DepScheduleConfig | CodeScheduleConfig>(
        title:       string,
        description: string,
        icon:        string,
        value:       T,
        onChange:    (v: T) => void,
    ) => (
        <div style={{
            border: '1.5px solid var(--border)',
            borderRadius: 10,
            overflow: 'hidden',
            background: value.enabled ? 'var(--surface)' : 'var(--surface2)',
            transition: 'border-color 0.15s, background 0.15s',
            ...(value.enabled ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 2px rgba(124,58,237,0.07)' } : {}),
        }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: value.enabled ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: '1rem' }}>{icon}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text)' }}>{title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{description}</div>
                </div>
                <ToggleSwitch checked={value.enabled} onChange={en => onChange({ ...value, enabled: en })} />
            </div>

            {/* Config rows — visible only when enabled */}
            {value.enabled && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 14px' }}>
                    {/* Row 1: Frequency + Time + Timezone */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Frequency</label>
                            <select
                                className="ns-input"
                                style={inputStyle}
                                value={value.interval_hours}
                                onChange={e => onChange({ ...value, interval_hours: Number(e.target.value) })}
                            >
                                <option value={24}>Daily (every 24h)</option>
                                <option value={168}>Weekly (every 7 days)</option>
                            </select>
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle}>Time</label>
                            <input
                                type="time"
                                className="ns-input"
                                style={inputStyle}
                                value={value.time}
                                onChange={e => onChange({ ...value, time: e.target.value })}
                            />
                        </div>
                        <div style={{ ...fieldStyle, flex: 2 }}>
                            <label style={labelStyle}>Timezone</label>
                            <select
                                className="ns-input"
                                style={inputStyle}
                                value={value.timezone}
                                onChange={e => onChange({ ...value, timezone: e.target.value })}
                            >
                                {TIMEZONES.map(tz => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 2: Auto-fix toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-sub)', fontWeight: 500 }}>
                        <ToggleSwitch checked={value.auto_fix} onChange={af => onChange({ ...value, auto_fix: af })} />
                        Auto-fix — open PRs with fixes automatically on scheduled scan
                    </label>

                    {/* Row 3: next_scan_at / last_scanned_at read-only info */}
                    {(value.last_scanned_at || value.next_scan_at) && (
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {value.last_scanned_at && (
                                <div style={fieldStyle}>
                                    <span style={labelStyle}>Last scanned</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                                        {new Date(value.last_scanned_at).toLocaleString()}
                                    </span>
                                </div>
                            )}
                            {value.next_scan_at && (
                                <div style={fieldStyle}>
                                    <span style={labelStyle}>Next scan</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                                        {new Date(value.next_scan_at).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{
                fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
                Scheduled Scans
            </label>
            {renderScheduleBlock(
                'Dependency Scan',
                'Trivy-based scan — recommended daily',
                '📦',
                depSchedule,
                onDepChange,
            )}
            {renderScheduleBlock(
                'Code Scan',
                'Full LLM pipeline scan — recommended weekly',
                '🔍',
                codeSchedule,
                onCodeChange,
            )}
        </div>
    );
};

// ─── WebhookConfigRow Component ───────────────────────────────────────────────

const WebhookConfigRow: React.FC<{
    config:   WebhookConfig;
    testing:  boolean;
    onDelete: () => void;
    onTest:   () => void;
    onEdit:   () => void;
}> = ({ config, testing, onDelete, onTest, onEdit }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const repoName = config.repo_url.replace(/\/$/, '').split('/').pop() ?? config.repo_url;
    const channels = config.notifications?.enabled ?? [];
    const depSched  = config.schedule?.dependencies;
    const codeSched = config.schedule?.code;

    return (
        <div className="ns-repo-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6, padding: '10px 14px', position: 'relative' }}>
            {/* Top row: name + actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="ns-repo-item-left" style={{ alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                    <span className="ns-repo-item-name">{repoName}</span>
                    <span className="ns-repo-lang">{config.branch}</span>
                    {config.auto_fix && <span className="db-badge db-badge--green">auto-fix</span>}
                    {channels.map(ch => <span key={ch} className="db-badge db-badge--purple">{ch}</span>)}
                </div>
                <div className="ns-repo-item-right" style={{ flexShrink: 0 }}>
                    <button className="ns-btn ns-btn--ghost" onClick={onTest} disabled={testing}>{testing ? '…' : 'Test'}</button>
                    <button
                        className="ns-btn ns-btn--ghost"
                        onClick={onEdit}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        ✏️ Edit
                    </button>
                    <button className="db-danger-btn" style={{ padding: '6px 12px' }} onClick={() => setConfirmDelete(true)}>Remove</button>
                </div>
            </div>

            {/* Schedule summary row */}
            {(depSched || codeSched) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 2 }}>
                    {depSched && (
                        <span style={{
                            fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20,
                            background: depSched.enabled ? 'rgba(124,58,237,0.09)' : 'var(--surface2)',
                            color: depSched.enabled ? 'var(--accent)' : 'var(--text-muted)',
                            border: `1px solid ${depSched.enabled ? 'var(--accent)' : 'var(--border)'}`,
                            fontWeight: 600,
                        }}>
                            📦 Dep scan: {depSched.enabled ? `${depSched.interval_hours === 24 ? 'daily' : 'weekly'} @ ${depSched.time} ${depSched.timezone}` : 'off'}
                        </span>
                    )}
                    {codeSched && (
                        <span style={{
                            fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20,
                            background: codeSched.enabled ? 'rgba(124,58,237,0.09)' : 'var(--surface2)',
                            color: codeSched.enabled ? 'var(--accent)' : 'var(--text-muted)',
                            border: `1px solid ${codeSched.enabled ? 'var(--accent)' : 'var(--border)'}`,
                            fontWeight: 600,
                        }}>
                            🔍 Code scan: {codeSched.enabled ? `${codeSched.interval_hours === 168 ? 'weekly' : 'daily'} @ ${codeSched.time} ${codeSched.timezone}` : 'off'}
                        </span>
                    )}
                </div>
            )}

            {confirmDelete && (
                <div className="db-delete-confirm" style={{ position: 'absolute', right: '10px', top: '36px', zIndex: 10, background: 'var(--surface)' }}>
                    <div className="db-delete-confirm-body"><div className="db-delete-confirm-title">Remove webhook?</div></div>
                    <div className="db-delete-confirm-actions">
                        <button className="db-danger-btn" onClick={onDelete}>Yes</button>
                        <button className="db-settings-cancel-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main WebhookPanel Component ──────────────────────────────────────────────

const WebhookPanel: React.FC = () => {
    const [configs,      setConfigs]      = useState<WebhookConfig[]>([]);
    const [loading,      setLoading]      = useState(true);
    const [showForm,     setShowForm]     = useState(false);
    const [editingRepo,  setEditingRepo]  = useState<string | null>(null);   // repo_url being edited
    const [status,       setStatus]       = useState<{ ok: boolean; msg: string } | null>(null);
    const [saving,       setSaving]       = useState(false);
    const [testingRepo,  setTestingRepo]  = useState<string | null>(null);

    const [ghConnected,    setGhConnected]    = useState<boolean | null>(null);
    const [ghRepos,        setGhRepos]        = useState<GitHubRepo[]>([]);
    const [ghReposLoading, setGhReposLoading] = useState(false);

    const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
    const [branch,       setBranch]       = useState('main');
    const [autoFix,      setAutoFix]      = useState(true);
    const [severities,   setSeverities]   = useState<string[]>(['critical', 'high']);
    const [slackUrl,     setSlackUrl]     = useState('');
    const [emailStr,     setEmailStr]     = useState('');

    // Schedule state
    const [depSchedule,  setDepSchedule]  = useState<DepScheduleConfig>({ ...DEFAULT_DEP_SCHEDULE });
    const [codeSchedule, setCodeSchedule] = useState<CodeScheduleConfig>({ ...DEFAULT_CODE_SCHEDULE });

    const [accessToken,  setAccessToken]  = useState<string | null>(null);
    const [tokenLoading, setTokenLoading] = useState(false);
    const [tokenError,   setTokenError]   = useState<string | null>(null);

    const isEditing = editingRepo !== null;

    const webhookPayloadUrl = `${window.location.origin}/api/webhook/github`;

    // ── Data fetching ──────────────────────────────────────────────────────────

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/webhook/configs', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setConfigs(data.configs || []);
            }
        } catch { }
        finally { setLoading(false); }
    };

    const fetchGhRepos = async () => {
        setGhReposLoading(true);
        try {
            const res = await fetch('/api/auth/github/repos', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setGhRepos(data.repositories ?? []);
            }
        } catch { }
        finally { setGhReposLoading(false); }
    };

    const checkGitHubStatus = async () => {
        try {
            const res = await fetch('/api/auth/github/status', { credentials: 'include' });
            if (!res.ok) { setGhConnected(false); return; }
            const data = await res.json();
            setGhConnected(!!data.connected);
            if (data.connected) fetchGhRepos();
        } catch { setGhConnected(false); }
    };

    const fetchAccessToken = async () => {
        setTokenLoading(true); setTokenError(null);
        try {
            const res = await fetch('/api/auth/github/token', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setAccessToken(data.access_token ?? null);
            } else {
                const err = await res.json().catch(() => ({}));
                setTokenError(err.error || 'Could not fetch GitHub token.');
            }
        } catch {
            setTokenError('Network error while fetching token.');
        } finally { setTokenLoading(false); }
    };

    useEffect(() => {
        fetchConfigs();
        checkGitHubStatus();
    }, []);

    useEffect(() => {
        if (showForm && ghConnected) fetchAccessToken();
    }, [showForm, ghConnected]);

    // ── Helpers ────────────────────────────────────────────────────────────────

    const toggleSeverity = (s: string) =>
        setSeverities(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

    const handleConnectGitHub = async () => {
        try {
            const res = await fetch('/api/auth/github', { credentials: 'include' });
            if (res.ok) {
                const { url } = await res.json();
                window.location.href = url;
            }
        } catch { setStatus({ ok: false, msg: 'Could not initiate GitHub connection.' }); }
    };

    // ── Edit: populate form from existing config ───────────────────────────────

    const handleEdit = (cfg: WebhookConfig) => {
        setEditingRepo(cfg.repo_url);

        // Try to match the repo to the ghRepos list for the dropdown
        const repoFullName = cfg.repo_url.replace('https://github.com/', '');
        const matched = ghRepos.find(r => r.full_name === repoFullName) ?? null;
        setSelectedRepo(matched);

        setBranch(cfg.branch);
        setAutoFix(cfg.auto_fix);
        setSeverities(cfg.fix_severity ?? ['critical', 'high']);
        setSlackUrl(cfg.notifications?.slack?.webhook_url ?? '');
        setEmailStr((cfg.notifications?.email?.to ?? []).join(', '));

        // Populate schedule
        setDepSchedule(cfg.schedule?.dependencies
            ? { ...DEFAULT_DEP_SCHEDULE, ...cfg.schedule.dependencies }
            : { ...DEFAULT_DEP_SCHEDULE });
        setCodeSchedule(cfg.schedule?.code
            ? { ...DEFAULT_CODE_SCHEDULE, ...cfg.schedule.code }
            : { ...DEFAULT_CODE_SCHEDULE });

        setShowForm(true);
        if (ghConnected) fetchAccessToken();
    };

    // ── Save (create or update) ────────────────────────────────────────────────

    const handleSave = async () => {
        if (!isEditing && !selectedRepo) {
            setStatus({ ok: false, msg: 'Please select a repository.' }); return;
        }
        if (!accessToken) {
            setStatus({ ok: false, msg: tokenError || 'GitHub token not available. Please reconnect your GitHub account.' }); return;
        }

        setSaving(true); setStatus(null);
        try {
            const enabled: string[] = [];
            const notifications: Record<string, unknown> = { enabled };

            if (slackUrl.trim()) {
                enabled.push('slack');
                notifications['slack'] = { webhook_url: slackUrl.trim() };
            }

            const validEmails = emailStr.split(',').map(e => e.trim()).filter(Boolean);
            if (validEmails.length > 0) {
                enabled.push('email');
                notifications['email'] = { to: validEmails };
            }

            const repoUrl = isEditing
                ? editingRepo!
                : `https://github.com/${selectedRepo!.full_name}`;

            const payload = {
                repo_url:     repoUrl,
                github_token: accessToken,
                branch:       branch.trim() || 'main',
                auto_fix:     autoFix,
                fix_severity: severities,
                notifications,
                schedule: {
                    dependencies: depSchedule,
                    code:         codeSchedule,
                },
            };

            const res = await fetch('/api/webhook/config', {
                method:      'POST',
                credentials: 'include',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify(payload),
            });

            if (res.ok) {
                setStatus({
                    ok:  true,
                    msg: isEditing
                        ? 'Webhook config updated!'
                        : 'Webhook config saved! Set up the webhook in your GitHub repo settings.',
                });
                setShowForm(false); resetForm(); fetchConfigs();
            } else {
                const err = await res.json().catch(() => ({}));
                setStatus({ ok: false, msg: err.detail || 'Failed to save config.' });
            }
        } catch {
            setStatus({ ok: false, msg: 'Network error — please try again.' });
        } finally { setSaving(false); }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────

    const handleDelete = async (repoUrl: string) => {
        try {
            const res = await fetch(
                `/api/webhook/config/${encodeURIComponent(repoUrl)}`,
                { method: 'DELETE', credentials: 'include' },
            );
            if (res.ok) fetchConfigs();
        } catch { }
    };

    // ── Test notification ──────────────────────────────────────────────────────

    const handleTest = async (repoUrl: string) => {
        setTestingRepo(repoUrl);
        try {
            const res = await fetch('/api/webhook/test', {
                method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo_url: repoUrl }),
            });
            setStatus(res.ok
                ? { ok: true,  msg: `Test notification sent for ${repoUrl.split('/').pop()}.` }
                : { ok: false, msg: 'Test notification failed.' },
            );
        } catch {
            setStatus({ ok: false, msg: 'Network error.' });
        } finally { setTestingRepo(null); }
    };

    // ── Reset ──────────────────────────────────────────────────────────────────

    const resetForm = () => {
        setSelectedRepo(null); setBranch('main'); setAutoFix(true);
        setSeverities(['critical', 'high']); setSlackUrl(''); setEmailStr('');
        setDepSchedule({ ...DEFAULT_DEP_SCHEDULE });
        setCodeSchedule({ ...DEFAULT_CODE_SCHEDULE });
        setAccessToken(null); setTokenError(null);
        setEditingRepo(null);
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="db-form-card" style={{ background: 'var(--surface2)', animation: 'ns-fade-up 0.3s var(--ease-out) both' }}>
            {status && <StatusMsg ok={status.ok} msg={status.msg} />}

            {loading ? (
                <div className="ns-loading"><Spinner /><span>Loading configs…</span></div>
            ) : configs.length > 0 ? (
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
                        Active Repos ({configs.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {configs.map(cfg => (
                            <WebhookConfigRow
                                key={cfg.repo_url}
                                config={cfg}
                                testing={testingRepo === cfg.repo_url}
                                onDelete={() => handleDelete(cfg.repo_url)}
                                onTest={() => handleTest(cfg.repo_url)}
                                onEdit={() => handleEdit(cfg)}
                            />
                        ))}
                    </div>
                </div>
            ) : !showForm && (
                <div className="ns-repo-empty">No webhook configs yet.</div>
            )}

            {showForm ? (
                <div className="db-form" style={{ paddingTop: configs.length > 0 ? '1rem' : 0, borderTop: configs.length > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-sub)' }}>
                        {isEditing
                            ? `Edit Webhook — ${editingRepo!.replace(/\/$/, '').split('/').pop()}`
                            : 'Add Repo Webhook'}
                    </div>

                    {/* Repo + Branch */}
                    <div className="db-form-row">
                        <div className="db-form-group" style={{ flex: 2 }}>
                            <label>Repository</label>
                            {isEditing ? (
                                <div className="ns-selected-repo" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
                                    <span style={{ fontSize: '0.8rem' }}>📂</span>
                                    <span className="ns-selected-repo-name">{editingRepo!.replace(/\/$/, '').split('/').slice(-2).join('/')}</span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>locked during edit</span>
                                </div>
                            ) : (
                                <RepoDropdown
                                    repos={ghRepos}
                                    selected={selectedRepo}
                                    loading={ghReposLoading}
                                    connected={ghConnected}
                                    onSelect={setSelectedRepo}
                                    onConnect={handleConnectGitHub}
                                />
                            )}
                        </div>
                        <div className="db-form-group" style={{ flex: 1 }}>
                            <label>Branch</label>
                            <input className="ns-input" value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" />
                        </div>
                    </div>

                    {/* Token status */}
                    <div className={`ns-selected-repo ${tokenError ? 'ns-error' : ''}`} style={{ background: tokenError ? undefined : accessToken ? 'rgba(34,197,94,0.06)' : 'var(--surface)' }}>
                        {tokenLoading ? (
                            <><Spinner /><span style={{ marginLeft: 6, fontSize: '0.8rem' }}>Fetching GitHub token…</span></>
                        ) : tokenError ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <span>{tokenError}</span>
                                <button onClick={fetchAccessToken} className="ns-btn ns-btn--ghost" style={{ padding: '4px 8px' }}>Retry</button>
                            </div>
                        ) : accessToken ? (
                            <>
                                <span style={{ fontSize: '1rem' }}>✓</span>
                                <span className="ns-selected-repo-name" style={{ color: '#16a34a' }}>GitHub token fetched automatically</span>
                            </>
                        ) : (
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>🔑 Token will be fetched from connected account.</span>
                        )}
                    </div>

                    {/* Slack */}
                    <div className="db-form-row">
                        <div className="db-form-group">
                            <label>Slack Webhook URL <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                            <input className="ns-input" value={slackUrl} onChange={e => setSlackUrl(e.target.value)} placeholder="https://hooks.slack.com/…" />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="db-form-row">
                        <div className="db-form-group">
                            <label>Email Alerts <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(comma-separated, optional)</span></label>
                            <input
                                className="ns-input"
                                value={emailStr}
                                onChange={e => setEmailStr(e.target.value)}
                                placeholder="team@company.com, alerts@company.com"
                            />
                        </div>
                    </div>

                    {/* Fix Severities */}
                    <div className="db-form-group">
                        <label>Fix Severities</label>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {SEVERITY_OPTIONS.map(s => (
                                <button
                                    key={s} type="button" onClick={() => toggleSeverity(s)}
                                    className={`ns-chip ${severities.includes(s) ? 'ns-chip--purple' : ''}`}
                                    style={{
                                        background: severities.includes(s) ? 'var(--accent-light)' : 'var(--surface)',
                                        border:     `1.5px solid ${severities.includes(s) ? 'var(--accent)' : 'var(--border)'}`,
                                        color:      severities.includes(s) ? 'var(--accent)' : 'var(--text-muted)',
                                        cursor:     'pointer',
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Auto-fix toggle */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-sub)', fontWeight: 500 }}>
                        <ToggleSwitch checked={autoFix} onChange={setAutoFix} />
                        Auto-fix — open PRs with fixes automatically on push
                    </label>

                    {/* ── Schedule Section ─────────────────────────────────── */}
                    <ScheduleSection
                        depSchedule={depSchedule}
                        codeSchedule={codeSchedule}
                        onDepChange={setDepSchedule}
                        onCodeChange={setCodeSchedule}
                    />

                    {/* GitHub webhook setup hint (only for new configs) */}
                    {!isEditing && (
                        <div className="ns-error" style={{ background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.18)', color: 'var(--text-muted)' }}>
                            <div>
                                <strong style={{ color: 'var(--text-sub)' }}>Next step:</strong>{' '}
                                In your GitHub repo go to <strong style={{ color: 'var(--text-sub)' }}>Settings → Webhooks → Add webhook</strong> and set:
                            </div>
                            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payload URL</span>
                                    <br />
                                    <code style={{ background: 'var(--border)', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem', userSelect: 'all' }}>
                                        {webhookPayloadUrl}
                                    </code>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Content type</span>
                                    <br />
                                    <code style={{ background: 'var(--border)', padding: '2px 6px', borderRadius: 4, fontSize: '0.78rem' }}>application/json</code>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="db-save-btn" onClick={handleSave} disabled={saving || (!isEditing && !selectedRepo) || tokenLoading}>
                            {saving ? 'Saving…' : isEditing ? 'Update Config' : 'Save Config'}
                        </button>
                        <button className="db-settings-cancel-btn" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                    </div>
                </div>
            ) : (
                <button className="db-action-btn" style={{ marginTop: configs.length > 0 ? '0.5rem' : 0 }} onClick={() => setShowForm(true)}>
                    <span>＋</span> Add Repo Webhook
                </button>
            )}
        </div>
    );
};

export default WebhookPanel;