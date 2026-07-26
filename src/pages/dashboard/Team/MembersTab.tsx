import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../Toast';

interface Permission { scan: boolean; fix_and_pr: boolean; chat: boolean; }

interface WorkspaceMember {
    id:                string;
    name:              string;
    email:             string;
    status:            'active' | 'suspended';
    permissions:       Permission;
    credits_allocated: number;
    credits_used:      number;
    joined_at:         string;
    last_active?:      string;
}

const Toggle: React.FC<{
    label:    string;
    checked:  boolean;
    onChange: () => void;
    disabled: boolean;
}> = ({ label, checked, onChange, disabled }) => (
    <div
        style={{ display: 'flex', alignItems: 'center', gap: 7, opacity: disabled ? 0.45 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        onClick={() => !disabled && onChange()}
    >
        <div style={{
            width: 36, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0,
            background: checked ? 'rgba(99,102,241,0.75)' : 'rgba(255,255,255,0.08)',
            border: `1px solid ${checked ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.1)'}`,
            transition: 'background 0.18s, border-color 0.18s',
        }}>
            <div style={{
                position: 'absolute', top: 2, left: checked ? 17 : 2,
                width: 14, height: 14, borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                transition: 'left 0.18s',
            }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: checked ? '#a5b4fc' : '#5C6480', userSelect: 'none' }}>
            {label}
        </span>
    </div>
);

const MembersTab: React.FC = () => {
    const { showToast } = useToast();
    const [members,         setMembers]         = useState<WorkspaceMember[]>([]);
    const [loading,         setLoading]         = useState(true);
    const [error,           setError]           = useState<string | null>(null);
    const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
    const [updatingId,      setUpdatingId]      = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch('/api/workspace/members', { credentials: 'include' });
            if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
            const data = await res.json();
            setMembers(Array.isArray(data) ? data : (data.members ?? []));
        } catch (err: any) {
            setError(err.message || 'Failed to load members');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);

    const patchPermissions = async (member: WorkspaceMember, key: keyof Permission) => {
        if (updatingId) return;
        const newPerms = { ...member.permissions, [key]: !member.permissions[key] };
        setUpdatingId(member.id);
        try {
            const res = await fetch(`/api/workspace/members/${member.id}/permissions`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newPerms),
            });
            if (!res.ok) throw new Error('Failed to update permissions');
            setMembers(prev => prev.map(m => m.id === member.id ? { ...m, permissions: newPerms } : m));
            showToast('Permissions updated', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to update', 'error');
        } finally { setUpdatingId(null); }
    };

    const toggleSuspend = async (member: WorkspaceMember) => {
        if (updatingId) return;
        const action = member.status === 'active' ? 'suspend' : 'activate';
        setUpdatingId(member.id);
        try {
            const res = await fetch(`/api/workspace/members/${member.id}/${action}`, {
                method: 'PATCH', credentials: 'include',
            });
            if (!res.ok) throw new Error(`Failed to ${action}`);
            setMembers(prev => prev.map(m =>
                m.id === member.id ? { ...m, status: action === 'suspend' ? 'suspended' : 'active' } : m
            ));
            showToast(action === 'suspend' ? 'Developer suspended' : 'Developer re-enabled', 'success');
        } catch (err: any) {
            showToast(err.message || 'Action failed', 'error');
        } finally { setUpdatingId(null); }
    };

    const removeMember = async (memberId: string) => {
        setUpdatingId(memberId);
        try {
            const res = await fetch(`/api/workspace/members/${memberId}`, {
                method: 'DELETE', credentials: 'include',
            });
            if (!res.ok) throw new Error('Failed to remove');
            setMembers(prev => prev.filter(m => m.id !== memberId));
            setConfirmRemoveId(null);
            showToast('Developer removed from workspace', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to remove', 'error');
        } finally { setUpdatingId(null); }
    };

    const fmt = (iso: string) =>
        !iso ? '—' : new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const relTime = (iso?: string) => {
        if (!iso) return 'Never';
        const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    const initials = (name: string) =>
        (name || '?').trim().split(/\s+/).map(w => w[0]?.toUpperCase()).slice(0, 2).join('') || '?';

    const refreshBar = (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
                className="cli-refresh-btn"
                onClick={fetchMembers}
                disabled={loading}
                title="Refresh members"
                style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
                ↻
            </button>
        </div>
    );

    if (loading) return (
        <div>
            {refreshBar}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[0, 0.1, 0.2].map((d, i) => (
                    <div key={i} style={{
                        height: 120, borderRadius: 12,
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
            {refreshBar}
            <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, padding: '14px 18px', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                ⚠ {error}
                <button onClick={fetchMembers} style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(244,63,94,0.3)', color: '#f87171', borderRadius: 6, padding: '3px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button>
            </div>
        </div>
    );

    if (members.length === 0) return (
        <div>
            {refreshBar}
            <div style={{ textAlign: 'center', padding: '60px 0 80px', color: '#5C6480' }}>
                <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.35 }}>👥</div>
                <div style={{ fontWeight: 700, color: '#9BA3BF', fontSize: 15, marginBottom: 6 }}>No developers yet</div>
                <div style={{ fontSize: 13 }}>Go to the Invitations tab to invite your first developer.</div>
            </div>
        </div>
    );

    return (
        <div>
            {refreshBar}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {members.map(member => {
                const busy     = updatingId === member.id;
                const removing = confirmRemoveId === member.id;
                const pct      = member.credits_allocated > 0
                    ? Math.min((member.credits_used / member.credits_allocated) * 100, 100) : 0;
                const barColor = pct > 85 ? 'linear-gradient(90deg,#f43f5e,#ef4444)'
                               : pct > 60 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                               : 'linear-gradient(90deg,#6366f1,#a855f7)';

                return (
                    <div key={member.id} style={{
                        background: '#13151F',
                        border: `1px solid ${member.status === 'suspended' ? 'rgba(244,63,94,0.18)' : 'rgba(99,102,241,0.14)'}`,
                        borderRadius: 12, padding: '18px 20px',
                        opacity: busy ? 0.7 : 1, transition: 'opacity 0.2s',
                    }}>
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                                background: 'linear-gradient(145deg,#4f46e5,#7c3aed)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#fff', fontWeight: 800, fontSize: 13,
                                boxShadow: '0 2px 10px rgba(124,58,237,0.25)',
                            }}>{initials(member.name)}</div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#E8EEFF' }}>{member.name}</span>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                                        background: member.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                                        color: member.status === 'active' ? '#34d399' : '#f87171',
                                        border: `1px solid ${member.status === 'active' ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`,
                                    }}>
                                        {member.status === 'active' ? 'Active' : 'Suspended'}
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: '#5C6480' }}>
                                    {member.email} · Joined {fmt(member.joined_at)} · Last active: {relTime(member.last_active)}
                                </div>
                            </div>

                            {/* Action buttons */}
                            {removing ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                                    background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                                    borderRadius: 9, padding: '7px 12px', fontSize: 12, color: '#f87171',
                                }}>
                                    <span>Remove {member.name.split(' ')[0]}?</span>
                                    <button onClick={() => removeMember(member.id)} disabled={busy}
                                        style={{ padding: '3px 10px', borderRadius: 5, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>
                                        Yes
                                    </button>
                                    <button onClick={() => setConfirmRemoveId(null)}
                                        style={{ padding: '3px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', color: '#9BA3BF', border: '1px solid rgba(99,102,241,0.2)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => toggleSuspend(member)} disabled={busy} style={{
                                        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                                        cursor: busy ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                                        background: member.status === 'active' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                        color: member.status === 'active' ? '#fbbf24' : '#34d399',
                                        border: `1px solid ${member.status === 'active' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
                                    }}>
                                        {member.status === 'active' ? 'Suspend' : 'Re-enable'}
                                    </button>
                                    <button onClick={() => setConfirmRemoveId(member.id)} disabled={busy} style={{
                                        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                                        cursor: busy ? 'not-allowed' : 'pointer',
                                        background: 'rgba(244,63,94,0.08)', color: '#f87171',
                                        border: '1px solid rgba(244,63,94,0.2)', transition: 'all 0.15s',
                                    }}>
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Permissions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 14 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Permissions</span>
                            <Toggle label="Scan"     checked={member.permissions.scan}       onChange={() => patchPermissions(member, 'scan')}       disabled={busy || member.status === 'suspended'} />
                            <Toggle label="Fix & PR" checked={member.permissions.fix_and_pr} onChange={() => patchPermissions(member, 'fix_and_pr')} disabled={busy || member.status === 'suspended'} />
                            <Toggle label="Chat"     checked={member.permissions.chat}       onChange={() => patchPermissions(member, 'chat')}       disabled={busy || member.status === 'suspended'} />
                        </div>

                        {/* Credits bar */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Credits</span>
                                <span style={{ fontSize: 11, color: '#9BA3BF', fontFamily: "'JetBrains Mono', monospace" }}>
                                    {member.credits_used.toLocaleString()} / {member.credits_allocated.toLocaleString()} used
                                </span>
                            </div>
                            <div style={{ height: 5, borderRadius: 3, background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 3, background: barColor, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                            </div>
                        </div>
                    </div>
                );
            })}
            </div>
        </div>
    );
};

export default MembersTab;
