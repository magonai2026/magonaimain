import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface InviteInfo {
    admin_name:  string;
    admin_email: string;
    expires_at:  string;
}

const WorkspaceJoinPage: React.FC = () => {
    const [params]   = useSearchParams();
    const navigate   = useNavigate();
    const token      = params.get('token') ?? '';

    const [info,    setInfo]    = useState<InviteInfo | null>(null);
    const [status,  setStatus]  = useState<'loading' | 'valid' | 'expired' | 'error'>('loading');
    const [acting,  setActing]  = useState<'accept' | 'decline' | null>(null);
    const [done,    setDone]    = useState<'accepted' | 'declined' | null>(null);

    useEffect(() => {
        if (!token) { setStatus('error'); return; }
        fetch(`/api/workspace/invitations/${token}`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(d => { setInfo(d); setStatus('valid'); })
            .catch(code => setStatus(code === 410 || code === 404 ? 'expired' : 'error'));
    }, [token]);

    const respond = async (action: 'accept' | 'decline') => {
        setActing(action);
        try {
            const res = await fetch(`/api/workspace/invitations/${token}/${action}`, {
                method: 'POST', credentials: 'include',
            });
            if (!res.ok) throw new Error();
            setDone(action === 'accept' ? 'accepted' : 'declined');
            if (action === 'accept') setTimeout(() => navigate('/overview'), 2000);
        } catch {
            setStatus('error');
        } finally {
            setActing(null);
        }
    };

    const cardStyle: React.CSSProperties = {
        minHeight: '100vh',
        background: '#09090b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Instrument Sans', sans-serif",
        padding: 24,
    };

    const boxStyle: React.CSSProperties = {
        width: '100%', maxWidth: 440,
        background: '#13151F',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 20, padding: '40px 36px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        textAlign: 'center',
    };

    const logo = (
        <div style={{ marginBottom: 28 }}>
            <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 12, padding: '8px 18px',
            }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#E8EEFF', letterSpacing: '-0.02em' }}>Magon AI</span>
            </div>
        </div>
    );

    if (status === 'loading') return (
        <div style={cardStyle}>
            <div style={boxStyle}>
                {logo}
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid rgba(99,102,241,0.2)', borderTopColor: '#818cf8', animation: 'spin 0.75s linear infinite', margin: '0 auto 16px' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: '#5C6480', fontSize: 14 }}>Checking invitation…</p>
            </div>
        </div>
    );

    if (done === 'accepted') return (
        <div style={cardStyle}>
            <div style={boxStyle}>
                {logo}
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>✓</div>
                <h2 style={{ color: '#34d399', fontWeight: 800, fontSize: 22, marginBottom: 10 }}>You're in!</h2>
                <p style={{ color: '#9BA3BF', fontSize: 14 }}>Redirecting to your workspace…</p>
            </div>
        </div>
    );

    if (done === 'declined') return (
        <div style={cardStyle}>
            <div style={boxStyle}>
                {logo}
                <h2 style={{ color: '#E8EEFF', fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Invitation declined</h2>
                <p style={{ color: '#9BA3BF', fontSize: 14, marginBottom: 24 }}>You've declined the invitation. You can close this page.</p>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', padding: '10px 24px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    Go to Home
                </button>
            </div>
        </div>
    );

    if (status === 'expired') return (
        <div style={cardStyle}>
            <div style={boxStyle}>
                {logo}
                <div style={{ fontSize: 44, marginBottom: 16 }}>⏱</div>
                <h2 style={{ color: '#E8EEFF', fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Invitation expired</h2>
                <p style={{ color: '#9BA3BF', fontSize: 14 }}>This invitation link has expired or already been used. Ask your admin to send a new invite.</p>
            </div>
        </div>
    );

    if (status === 'error' || !info) return (
        <div style={cardStyle}>
            <div style={boxStyle}>
                {logo}
                <div style={{ fontSize: 44, marginBottom: 16 }}>⚠</div>
                <h2 style={{ color: '#f87171', fontWeight: 800, fontSize: 22, marginBottom: 10 }}>Invalid link</h2>
                <p style={{ color: '#9BA3BF', fontSize: 14 }}>This invitation link is invalid. Please check the email and try again.</p>
            </div>
        </div>
    );

    const expiresIn = () => {
        const diff = new Date(info.expires_at).getTime() - Date.now();
        if (diff <= 0) return 'Expired';
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        if (hrs >= 24) return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? 's' : ''} left`;
        if (hrs > 0) return `${hrs}h ${mins}m left`;
        return `${mins}m left`;
    };

    return (
        <div style={cardStyle}>
            <div style={boxStyle}>
                {logo}

                {/* Invite icon */}
                <div style={{
                    width: 60, height: 60, borderRadius: '50%', margin: '0 auto 20px',
                    background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                }}>📨</div>

                <h2 style={{ color: '#E8EEFF', fontWeight: 800, fontSize: 22, marginBottom: 8, letterSpacing: '-0.02em' }}>
                    Workspace Invitation
                </h2>
                <p style={{ color: '#9BA3BF', fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>
                    <strong style={{ color: '#E8EEFF' }}>{info.admin_name}</strong> has invited you to join their
                    Magon AI security workspace.
                </p>

                {/* Expiry badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#fbbf24',
                    fontWeight: 600, marginBottom: 28,
                }}>
                    ⏱ {expiresIn()}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={() => respond('decline')}
                        disabled={!!acting}
                        style={{
                            flex: 1, padding: '12px', borderRadius: 11, border: '1px solid rgba(99,102,241,0.2)',
                            background: 'transparent', color: '#9BA3BF', fontWeight: 600, fontSize: 14,
                            cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                            opacity: acting === 'decline' ? 0.6 : 1, transition: 'all 0.15s',
                        }}
                    >
                        {acting === 'decline' ? 'Declining…' : 'Decline'}
                    </button>
                    <button
                        onClick={() => respond('accept')}
                        disabled={!!acting}
                        style={{
                            flex: 2, padding: '12px', borderRadius: 11, border: 'none',
                            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                            color: '#fff', fontWeight: 700, fontSize: 14,
                            cursor: acting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                            boxShadow: '0 4px 18px rgba(124,58,237,0.35)',
                            opacity: acting === 'accept' ? 0.7 : 1, transition: 'opacity 0.15s',
                        }}
                    >
                        {acting === 'accept' ? 'Joining…' : 'Accept & Join Workspace'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkspaceJoinPage;
