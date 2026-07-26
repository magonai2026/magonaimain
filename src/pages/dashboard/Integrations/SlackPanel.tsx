import React, { useState, useEffect } from 'react';
import { Spinner, StatusMsg } from './IntegrationsShared';

interface SlackBinding {
    channel:  string;
    scan_id:  string;
    repo_url: string;
    branch:   string;
}

const SlackBindingRow: React.FC<{ binding: SlackBinding; onUnbind: () => void }> = ({ binding, onUnbind }) => {
    const [confirmUnbind, setConfirmUnbind] = useState(false);
    const repoName = binding.repo_url?.replace(/\/$/, '').split('/').pop() ?? '—';

    return (
        <div className="ns-repo-item">
            <div className="ns-repo-item-left" style={{ alignItems: 'center' }}>
                <span className="ns-repo-item-name">#{binding.channel}</span>
                <span className="ns-repo-item-desc" style={{ marginTop: 0 }}>{repoName} / {binding.branch}</span>
                <span className="ns-repo-lang">{binding.scan_id.slice(0, 8)}…</span>
            </div>

            <div className="ns-repo-item-right">
                <button className="db-danger-btn" style={{ padding: '6px 12px' }} onClick={() => setConfirmUnbind(true)}>Unbind</button>
            </div>

            {confirmUnbind && (
                <div className="db-delete-confirm" style={{ position: 'absolute', right: '10px', zIndex: 10, background: 'var(--surface)' }}>
                    <div className="db-delete-confirm-body"><div className="db-delete-confirm-title">Unbind channel?</div></div>
                    <div className="db-delete-confirm-actions">
                        <button className="db-danger-btn" onClick={onUnbind}>Yes</button>
                        <button className="db-settings-cancel-btn" onClick={() => setConfirmUnbind(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SlackPanel: React.FC = () => {
    const [slackConnected, setSlackConnected] = useState<boolean | null>(null);
    const [slackTeam, setSlackTeam]           = useState<string | null>(null);
    const [bindings, setBindings]             = useState<SlackBinding[]>([]);
    const [loading, setLoading]               = useState(true);
    const [showForm, setShowForm]             = useState(false);
    const [status, setStatus]                 = useState<{ ok: boolean; msg: string } | null>(null);
    const [saving, setSaving]                 = useState(false);

    const [channel, setChannel] = useState('');
    const [scanId,  setScanId]  = useState('');
    const [branch,  setBranch]  = useState('main');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('slack_connected') === 'true') {
            setSlackConnected(true);
            window.history.replaceState({}, '', window.location.pathname);
            fetchSlackStatus();
        } else if (params.get('error') === 'slack_failed') {
            setSlackConnected(false);
            window.history.replaceState({}, '', window.location.pathname);
            fetchSlackStatus();
        } else {
            fetchSlackStatus();
        }
        fetchBindings();
    }, []);

    const fetchSlackStatus = async () => {
        try {
            const res = await fetch('/api/auth/slack/status', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setSlackConnected(data.connected);
                if (data.connected) setSlackTeam(data.teamName);
            } else {
                setSlackConnected(false);
            }
        } catch {
            setSlackConnected(false);
        }
    };

    const fetchBindings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/slack/bindings', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setBindings(data.bindings || []);
            }
        } catch { }
        finally { setLoading(false); }
    };

    const handleConnectSlack = async () => {
        try {
            const res = await fetch('/api/auth/slack', { credentials: 'include' });
            if (res.ok) {
                const { url } = await res.json();
                window.location.href = url;
            }
        } catch (err) {
            console.error("Failed to initiate Slack OAuth", err);
        }
    };

    const handleBind = async () => {
        if (!channel.trim() || !scanId.trim()) { setStatus({ ok: false, msg: 'Channel and Scan ID required.' }); return; }
        setSaving(true); setStatus(null);
        try {
            const res = await fetch('/api/slack/bind', {
                method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel: channel.trim(), scan_id: scanId.trim(), branch: branch.trim() || 'main' }),
            });
            if (res.ok) {
                setStatus({ ok: true, msg: `Channel bound! Chat in #${channel.trim()}` });
                setShowForm(false); resetForm(); fetchBindings();
            } else {
                const err = await res.json().catch(() => ({}));
                setStatus({ ok: false, msg: err.detail || 'Failed to bind channel.' });
            }
        } catch {
            setStatus({ ok: false, msg: 'Network error.' });
        } finally { setSaving(false); }
    };

    const handleUnbind = async (ch: string) => {
        try {
            const res = await fetch('/api/slack/bind', {
                method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ channel: ch }),
            });
            if (res.ok) fetchBindings();
        } catch { }
    };

    const resetForm = () => { setChannel(''); setScanId(''); setBranch('main'); };

    if (slackConnected === false) {
        return (
            <div className="db-form-card" style={{ background: 'var(--surface2)', animation: 'ns-fade-up 0.3s var(--ease-out) both' }}>
                <div className="ns-not-connected">
                    <div className="ns-not-connected-title">Connect Slack Workspace</div>
                    <div className="ns-not-connected-sub">Authenticate with Slack to allow Niyantri to send security alerts to your channels.</div>
                    <button className="ns-connect-btn" onClick={handleConnectSlack} style={{ background: '#4A154B', borderColor: '#611f69' }}>
                        <span style={{ fontSize: '1.2rem', marginRight: '4px' }}>💬</span>
                        Connect Slack Workspace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="db-form-card" style={{ background: 'var(--surface2)', animation: 'ns-fade-up 0.3s var(--ease-out) both' }}>
            
            {slackConnected && (
                <div className="ns-selected-repo" style={{ background: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.18)', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '1rem', color: '#16a34a' }}>✓</span>
                    <div style={{ flex: 1 }}>
                        <div className="ns-selected-repo-name" style={{ color: '#16a34a' }}>Connected to Slack</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Workspace: {slackTeam || 'Loading...'}
                        </div>
                    </div>
                </div>
            )}

            {status && <StatusMsg ok={status.ok} msg={status.msg} />}

            {loading ? (
                <div className="ns-loading"><Spinner /><span>Loading bindings…</span></div>
            ) : bindings.length > 0 ? (
                <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
                        Bound Channels ({bindings.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {bindings.map(b => <SlackBindingRow key={b.channel} binding={b} onUnbind={() => handleUnbind(b.channel)} />)}
                    </div>
                </div>
            ) : !showForm && (
                <div className="ns-repo-empty">No channels bound yet.</div>
            )}

            {showForm ? (
                <div className="db-form" style={{ paddingTop: bindings.length > 0 ? '1rem' : 0, borderTop: bindings.length > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-sub)' }}>Bind Channel to Scan</div>

                    <div className="db-form-row">
                        <div className="db-form-group">
                            <label>Slack Channel ID</label>
                            <select className="ns-input" value={channel} onChange={e => setChannel(e.target.value)}>
  <option value="DM">Direct Message (DM)</option>
  <option value="">Custom Channel ID</option>
</select>
                        </div>
                        <div className="db-form-group">
                            <label>Scan ID</label>
                            <input className="ns-input" value={scanId} onChange={e => setScanId(e.target.value)} placeholder="From Scan History" />
                        </div>
                    </div>

                    <div className="db-form-group">
                        <label>Branch</label>
                        <input className="ns-input" value={branch} onChange={e => setBranch(e.target.value)} placeholder="main" />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="db-save-btn" onClick={handleBind} disabled={saving}>{saving ? 'Binding…' : 'Bind Channel'}</button>
                        <button className="db-settings-cancel-btn" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                    </div>
                </div>
            ) : (
                <button className="db-action-btn" style={{ marginTop: bindings.length > 0 ? '0.5rem' : 0 }} onClick={() => setShowForm(true)}>
                    <span>＋</span> Bind a Channel
                </button>
            )}
        </div>
    );
};

export default SlackPanel;