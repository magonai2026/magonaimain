import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { Spinner, StatusMsg } from './IntegrationsShared';

interface GitLabStatus {
  connected: boolean;
  tokenExpired: boolean;
  gitlabUsername: string | null;
  avatarUrl: string | null;
}

const GitLabPanel: React.FC = () => {
  const [status, setStatus]       = useState<GitLabStatus | null>(null);
  const [loading, setLoading]     = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [msg, setMsg]             = useState<{ ok: boolean; text: string } | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/gitlab/status', { credentials: 'include' });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ connected: false, tokenExpired: false, gitlabUsername: null, avatarUrl: null });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setMsg(null);
    try {
      const res = await fetch('/api/auth/gitlab', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to get authorization URL');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: unknown) {
      setMsg({ ok: false, text: (err as Error).message || 'Failed to start GitLab OAuth' });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your GitLab account?')) return;
    setDisconnecting(true);
    setMsg(null);
    try {
      const res = await fetch('/api/auth/gitlab', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to disconnect');
      setMsg({ ok: true, text: 'GitLab disconnected successfully.' });
      await fetchStatus();
    } catch (err: unknown) {
      setMsg({ ok: false, text: (err as Error).message || 'Failed to disconnect' });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="db-form-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="db-form-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {status?.connected ? (
          <>
            {status.avatarUrl && (
              <img
                src={status.avatarUrl}
                alt={status.gitlabUsername ?? 'GitLab'}
                style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(251,146,60,0.4)' }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={15} color="#34d399" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                  Connected as <span style={{ color: '#fb923c' }}>@{status.gitlabUsername}</span>
                </span>
              </div>
              {status.tokenExpired && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <AlertCircle size={13} color="#f87171" />
                  <span style={{ fontSize: '0.78rem', color: '#f87171' }}>
                    Token expired — reconnect to restore access
                  </span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={15} color="#94a3b8" />
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Not connected — click Connect to link your GitLab account via OAuth.
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {!status?.connected || status.tokenExpired ? (
          <button
            className="db-save-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg,#fb923c,#f97316)' }}
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting
              ? <><Loader2 size={14} className="animate-spin" /> Redirecting…</>
              : <>Connect GitLab <ExternalLink size={13} /></>}
          </button>
        ) : (
          <>
            <a
              href={`https://gitlab.com/${status.gitlabUsername}`}
              target="_blank"
              rel="noreferrer"
              className="db-settings-cancel-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none' }}
            >
              View profile <ExternalLink size={13} />
            </a>
            <button
              className="db-settings-cancel-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
              onClick={handleDisconnect}
              disabled={disconnecting}
            >
              {disconnecting
                ? <><Loader2 size={14} className="animate-spin" /> Disconnecting…</>
                : <><LogOut size={13} /> Disconnect</>}
            </button>
          </>
        )}
      </div>

      {msg && <StatusMsg ok={msg.ok} msg={msg.text} />}

      {/* Info note */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
        GitLab OAuth grants <code>read_user</code>, <code>api</code>, and <code>read_repository</code> access.
        Your credentials are stored encrypted and never shared.
      </p>
    </div>
  );
};

export default GitLabPanel;
