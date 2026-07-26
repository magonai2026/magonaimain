import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../Toast';

interface Invitation {
    id:         string;
    email:      string;
    status:     'pending' | 'accepted' | 'declined' | 'expired';
    expires_at: string;
    invited_at: string;
}

const InvitationsTab: React.FC = () => {
    const { showToast } = useToast();
    const [invites,    setInvites]    = useState<Invitation[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState<string | null>(null);
    const [showModal,  setShowModal]  = useState(false);
    const [email,      setEmail]      = useState('');
    const [sending,    setSending]    = useState(false);
    const [emailError, setEmailError] = useState('');
    const [revoking,   setRevoking]   = useState<string | null>(null);

    const fetchInvites = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch('/api/workspace/invitations', { credentials: 'include' });
            if (!res.ok) throw new Error(`Failed to load invitations (${res.status})`);
            const data = await res.json();
            setInvites(Array.isArray(data) ? data : (data.invitations ?? []));
        } catch (err: any) {
            setError(err.message || 'Failed to load invitations');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchInvites(); }, [fetchInvites]);

    const sendInvite = async () => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) { setEmailError('Enter an email address'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setEmailError('Enter a valid email'); return; }
        setSending(true); setEmailError('');
        try {
            const res = await fetch('/api/workspace/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: trimmed }),
            });
            if (res.status === 409) { setEmailError('This email is already a member or has a pending invite'); return; }
            if (!res.ok) throw new Error('Failed to send invitation');
            const newInvite = await res.json();
            setInvites(prev => [newInvite, ...prev]);
            setEmail(''); setShowModal(false);
            showToast(`Invitation sent to ${trimmed}`, 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to send invitation', 'error');
        } finally { setSending(false); }
    };

    const revokeInvite = async (id: string, email: string) => {
        setRevoking(id);
        try {
            const res = await fetch(`/api/workspace/invitations/${id}/revoke`, {
                method: 'DELETE', credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to revoke');
            setInvites(prev => prev.filter(i => i.id !== id));
            showToast(`Invitation to ${email} revoked`, 'info');
        } catch (err: any) {
            showToast(err.message || 'Failed to revoke', 'error');
        } finally { setRevoking(null); }
    };

    const expiresLabel = (iso: string) => {
        const diff = new Date(iso).getTime() - Date.now();
        if (diff <= 0) return 'Expired';
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        if (hrs >= 24) return `Expires in ${Math.floor(hrs / 24)}d`;
        if (hrs > 0) return `Expires in ${hrs}h ${mins}m`;
        return `Expires in ${mins}m`;
    };

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const statusStyle = (s: Invitation['status']) => {
        const map: Record<Invitation['status'], { bg: string; color: string; border: string }> = {
            pending:  { bg: 'rgba(245,158,11,0.1)',  color: '#fbbf24', border: 'rgba(245,158,11,0.25)'  },
            accepted: { bg: 'rgba(16,185,129,0.1)',  color: '#34d399', border: 'rgba(16,185,129,0.25)'  },
            declined: { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8', border: 'rgba(99,102,241,0.25)'  },
            expired:  { bg: 'rgba(255,255,255,0.04)', color: '#5C6480', border: 'rgba(255,255,255,0.08)' },
        };
        return map[s] ?? map.expired;
    };

    const toolbar = (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
            <button
                className="cli-refresh-btn"
                onClick={fetchInvites}
                disabled={loading}
                title="Refresh invitations"
                style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
                ↻
            </button>
            <button
                onClick={() => setShowModal(true)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                    border: 'none', borderRadius: 10, padding: '9px 18px',
                    color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Invite Developer
            </button>
        </div>
    );

    if (loading) return (
        <div>
            {toolbar}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0, 0.12].map((d, i) => (
                    <div key={i} style={{
                        height: 66, borderRadius: 10,
                        background: 'linear-gradient(90deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 100%)',
                        backgroundSize: '400px 100%', animation: 'ov-shimmer 1.4s ease infinite',
                        animationDelay: `${d}s`, border: '1px solid rgba(99,102,241,0.08)',
                    }} />
                ))}
            </div>
        </div>
    );

    if (error) return (
        <div>
            {toolbar}
            <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, padding: '14px 18px', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                ⚠ {error}
                <button onClick={fetchInvites} style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(244,63,94,0.3)', color: '#f87171', borderRadius: 6, padding: '3px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button>
            </div>
        </div>
    );

    return (
        <div>
            {toolbar}

            {/* List */}
            {invites.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0 80px', color: '#5C6480' }}>
                    <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.35 }}>📬</div>
                    <div style={{ fontWeight: 700, color: '#9BA3BF', fontSize: 15, marginBottom: 6 }}>No invitations yet</div>
                    <div style={{ fontSize: 13 }}>Click "Invite Developer" to send your first invitation.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {invites.map(inv => {
                        const busy = revoking === inv.id;
                        const st   = statusStyle(inv.status);
                        return (
                            <div key={inv.id} style={{
                                background: '#13151F', border: '1px solid rgba(99,102,241,0.12)',
                                borderRadius: 10, padding: '14px 18px',
                                display: 'flex', alignItems: 'center', gap: 12,
                                opacity: busy ? 0.6 : 1, transition: 'opacity 0.15s',
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                    background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: '#818cf8',
                                }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                                    </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: '#E8EEFF', marginBottom: 2 }}>{inv.email}</div>
                                    <div style={{ fontSize: 11, color: '#5C6480' }}>
                                        Sent {fmtDate(inv.invited_at)}
                                        {inv.status === 'pending' && ` · ${expiresLabel(inv.expires_at)}`}
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                                    background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                                    textTransform: 'capitalize',
                                }}>
                                    {inv.status}
                                </span>
                                {inv.status === 'pending' && (
                                    <button onClick={() => revokeInvite(inv.id, inv.email)} disabled={busy} style={{
                                        background: 'none', border: '1px solid rgba(244,63,94,0.2)',
                                        color: '#f87171', borderRadius: 7, padding: '5px 12px',
                                        fontSize: 11, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer',
                                        fontFamily: 'inherit', flexShrink: 0,
                                    }}>
                                        Revoke
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal overlay */}
            {showModal && (
                <div
                    onClick={e => { if (e.target === e.currentTarget) { setShowModal(false); setEmail(''); setEmailError(''); } }}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9000, backdropFilter: 'blur(4px)',
                    }}
                >
                    <div style={{
                        width: '100%', maxWidth: 420, background: '#13151F',
                        border: '1px solid rgba(99,102,241,0.25)', borderRadius: 18,
                        padding: '32px 28px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                    }}>
                        <h3 style={{ fontWeight: 800, fontSize: 18, color: '#E8EEFF', marginBottom: 6 }}>Invite Developer</h3>
                        <p style={{ fontSize: 13, color: '#5C6480', marginBottom: 22, lineHeight: 1.6 }}>
                            They'll receive an email with a link to join your workspace. The invite expires in 2 days.
                        </p>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9BA3BF', marginBottom: 6 }}>
                            Email address
                        </label>
                        <input
                            autoFocus
                            type="email"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                            onKeyDown={e => { if (e.key === 'Enter') sendInvite(); if (e.key === 'Escape') { setShowModal(false); setEmail(''); setEmailError(''); } }}
                            placeholder="developer@example.com"
                            style={{
                                width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                                background: 'rgba(255,255,255,0.04)', border: `1px solid ${emailError ? '#f87171' : 'rgba(99,102,241,0.2)'}`,
                                borderRadius: 10, color: '#E8EEFF', fontSize: 14, fontFamily: 'inherit',
                                outline: 'none', marginBottom: emailError ? 6 : 20,
                            }}
                        />
                        {emailError && (
                            <div style={{ color: '#f87171', fontSize: 12, marginBottom: 16 }}>{emailError}</div>
                        )}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => { setShowModal(false); setEmail(''); setEmailError(''); }}
                                style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)', background: 'none', color: '#9BA3BF', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                            >Cancel</button>
                            <button
                                onClick={sendInvite}
                                disabled={sending}
                                style={{
                                    flex: 2, padding: '11px', borderRadius: 10, border: 'none',
                                    background: 'linear-gradient(135deg,#7c3aed,#6366f1)', color: '#fff',
                                    cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                    fontWeight: 700, fontSize: 14, opacity: sending ? 0.7 : 1,
                                    boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                                }}
                            >
                                {sending ? 'Sending…' : 'Send Invitation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvitationsTab;
