import React, { useState, useEffect } from 'react';
import { Spinner } from './IntegrationsShared';

const TeamsPanel: React.FC = () => {
    const [connected, setConnected] = useState<boolean | null>(null);
    const [msProfile, setMsProfile] = useState<{ name: string; email: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('teams_connected') === 'true') {
            setConnected(true);
            window.history.replaceState({}, '', window.location.pathname);
            fetchStatus();
        } else {
            fetchStatus();
        }
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/auth/teams/status', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setConnected(data.connected);
                if (data.connected) {
                    setMsProfile({ name: data.name, email: data.email });
                }
            } else {
                setConnected(false);
            }
        } catch {
            setConnected(false);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            const res = await fetch('/api/auth/teams', { credentials: 'include' });
            if (res.ok) {
                const { url } = await res.json();
                window.location.href = url; 
            }
        } catch (err) {
            console.error("Failed to initiate Teams OAuth", err);
        }
    };

    return (
        <div className="db-form-card" style={{ background: 'var(--surface2)', animation: 'ns-fade-up 0.3s var(--ease-out) both' }}>
            {loading ? (
                <div className="ns-loading"><Spinner /><span>Loading Teams status…</span></div>
            ) : !connected ? (
                <div className="ns-not-connected">
                    <div className="ns-not-connected-title">Connect Microsoft Teams</div>
                    <div className="ns-not-connected-sub">Authenticate with Microsoft to allow Niyantri to send security alerts to your Teams channels.</div>
                    <button className="ns-connect-btn" onClick={handleConnect} style={{ background: '#4A4C8C', borderColor: '#5C5FC8' }}>
                        <span style={{ fontSize: '1.2rem', marginRight: '4px' }}>🟦</span>
                        Connect Microsoft Teams
                    </button>
                </div>
            ) : (
                <div className="db-form">
                    <div className="ns-selected-repo" style={{ background: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.18)' }}>
                        <span style={{ fontSize: '1rem', color: '#16a34a' }}>✓</span>
                        <div style={{ flex: 1 }}>
                            <div className="ns-selected-repo-name" style={{ color: '#16a34a' }}>Connected to Microsoft Teams</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                {msProfile?.name} ({msProfile?.email})
                            </div>
                        </div>
                    </div>

                    <div className="ns-error" style={{ background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.18)', color: 'var(--text-muted)' }}>
                        <strong style={{ color: 'var(--text-sub)' }}>Account Linked!</strong> You can now select Microsoft Teams as a notification channel in your repository webhook configurations.
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamsPanel;