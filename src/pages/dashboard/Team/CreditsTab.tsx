import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../Toast';

interface MemberCredit {
    id:                string;
    name:              string;
    email:             string;
    credits_allocated: number;
    credits_used:      number;
}

interface CreditsConfig {
    mode:          'equal' | 'manual';
    total_credits: number;
    members:       MemberCredit[];
}

const CreditsTab: React.FC = () => {
    const { showToast } = useToast();
    const [config,   setConfig]   = useState<CreditsConfig | null>(null);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState<string | null>(null);
    const [saving,   setSaving]   = useState(false);
    const [mode,     setMode]     = useState<'equal' | 'manual'>('equal');
    const [manual,   setManual]   = useState<Record<string, string>>({});

    const fetchConfig = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch('/api/workspace/credits', { credentials: 'include' });
            if (!res.ok) throw new Error(`Failed to load credits config (${res.status})`);
            const data: CreditsConfig = await res.json();
            setConfig(data);
            setMode(data.mode);
            const init: Record<string, string> = {};
            data.members.forEach(m => { init[m.id] = String(m.credits_allocated); });
            setManual(init);
        } catch (err: any) {
            setError(err.message || 'Failed to load credits');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchConfig(); }, [fetchConfig]);

    const equalShare = config && config.members.length > 0
        ? Math.floor(config.total_credits / config.members.length) : 0;

    const manualTotal = Object.values(manual).reduce((s, v) => s + (parseInt(v, 10) || 0), 0);

    const saveConfig = async () => {
        if (!config) return;
        if (mode === 'manual') {
            if (manualTotal > config.total_credits) {
                showToast(`Total exceeds your ${config.total_credits.toLocaleString()} available credits`, 'error');
                return;
            }
            for (const [, val] of Object.entries(manual)) {
                if (isNaN(parseInt(val, 10)) || parseInt(val, 10) < 0) {
                    showToast('All credit values must be non-negative numbers', 'error');
                    return;
                }
            }
        }
        setSaving(true);
        try {
            const payload = mode === 'equal'
                ? { mode: 'equal' }
                : { mode: 'manual', allocations: Object.fromEntries(Object.entries(manual).map(([k, v]) => [k, parseInt(v, 10)])) };
            const res = await fetch('/api/workspace/credits', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed to save credits config');
            showToast('Credits distribution saved', 'success');
            await fetchConfig();
        } catch (err: any) {
            showToast(err.message || 'Failed to save', 'error');
        } finally { setSaving(false); }
    };

    const initials = (name: string) =>
        (name || '?').trim().split(/\s+/).map(w => w[0]?.toUpperCase()).slice(0, 2).join('') || '?';

    const refreshBar = (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
                className="cli-refresh-btn"
                onClick={fetchConfig}
                disabled={loading}
                title="Refresh credits"
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
                {[0, 0.1].map((d, i) => (
                    <div key={i} style={{
                        height: 80, borderRadius: 12,
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
                <button onClick={fetchConfig} style={{ marginLeft: 'auto', background: 'none', border: '1px solid rgba(244,63,94,0.3)', color: '#f87171', borderRadius: 6, padding: '3px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button>
            </div>
        </div>
    );

    if (!config || config.members.length === 0) return (
        <div>
            {refreshBar}
            <div style={{ textAlign: 'center', padding: '60px 0 80px', color: '#5C6480' }}>
                <div style={{ fontSize: 44, marginBottom: 14, opacity: 0.35 }}>💰</div>
                <div style={{ fontWeight: 700, color: '#9BA3BF', fontSize: 15, marginBottom: 6 }}>No members to distribute credits</div>
                <div style={{ fontSize: 13 }}>Add developers first via the Invitations tab.</div>
            </div>
        </div>
    );

    const available = config.total_credits;
    const remaining = mode === 'equal' ? (available - equalShare * config.members.length) : (available - manualTotal);

    return (
        <div>
            {refreshBar}
            {/* Summary */}
            <div style={{
                background: '#13151F', border: '1px solid rgba(99,102,241,0.14)',
                borderRadius: 12, padding: '16px 20px', marginBottom: 20,
                display: 'flex', gap: 24, flexWrap: 'wrap',
            }}>
                {[
                    { label: 'Total Credits', value: available.toLocaleString(), color: '#E8EEFF' },
                    { label: 'Distributed', value: (mode === 'equal' ? equalShare * config.members.length : manualTotal).toLocaleString(), color: '#a5b4fc' },
                    { label: 'Unallocated', value: remaining.toLocaleString(), color: remaining < 0 ? '#f87171' : '#34d399' },
                ].map(({ label, value, color }) => (
                    <div key={label}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Mode selector */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9BA3BF', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Distribution Mode</div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {(['equal', 'manual'] as const).map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            style={{
                                flex: 1, padding: '12px', borderRadius: 10, fontFamily: 'inherit',
                                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                background: mode === m ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                                color: mode === m ? '#a5b4fc' : '#5C6480',
                                border: `1px solid ${mode === m ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                                transition: 'all 0.15s',
                            }}
                        >
                            {m === 'equal' ? '= Equal Share' : '✎ Manual Share'}
                        </button>
                    ))}
                </div>
                <p style={{ fontSize: 12, color: '#5C6480', marginTop: 8, lineHeight: 1.6 }}>
                    {mode === 'equal'
                        ? `Each developer gets ${equalShare.toLocaleString()} credits (${available.toLocaleString()} ÷ ${config.members.length}).`
                        : 'Set a custom credit amount for each developer below. Total cannot exceed your available credits.'}
                </p>
            </div>

            {/* Member rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                {config.members.map(member => {
                    const alloc   = mode === 'equal' ? equalShare : (parseInt(manual[member.id], 10) || 0);
                    const pct     = alloc > 0 ? Math.min((member.credits_used / alloc) * 100, 100) : 0;
                    const barClr  = pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#6366f1';

                    return (
                        <div key={member.id} style={{
                            background: '#13151F', border: '1px solid rgba(99,102,241,0.12)',
                            borderRadius: 10, padding: '14px 18px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: mode === 'manual' ? 12 : 10 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                    background: 'linear-gradient(145deg,#4f46e5,#7c3aed)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 800, fontSize: 11,
                                }}>{initials(member.name)}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#E8EEFF' }}>{member.name}</div>
                                    <div style={{ fontSize: 11, color: '#5C6480' }}>{member.email}</div>
                                </div>
                                {mode === 'manual' ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={manual[member.id] ?? '0'}
                                            onChange={e => setManual(p => ({ ...p, [member.id]: e.target.value }))}
                                            style={{
                                                width: 90, textAlign: 'right',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(99,102,241,0.2)',
                                                borderRadius: 8, color: '#E8EEFF', fontSize: 14,
                                                padding: '6px 10px', fontFamily: "'JetBrains Mono', monospace",
                                                outline: 'none',
                                            }}
                                        />
                                        <span style={{ fontSize: 11, color: '#5C6480' }}>credits</span>
                                    </div>
                                ) : (
                                    <div style={{ fontWeight: 800, fontSize: 16, color: '#a5b4fc', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                                        {alloc.toLocaleString()}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', borderRadius: 2, background: barClr, width: `${pct}%`, transition: 'width 0.4s ease' }} />
                                </div>
                                <span style={{ fontSize: 10, color: '#5C6480', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
                                    {member.credits_used.toLocaleString()} used
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Save bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
                {mode === 'manual' && remaining < 0 && (
                    <span style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>
                        Exceeds available by {Math.abs(remaining).toLocaleString()} credits
                    </span>
                )}
                <button
                    onClick={saveConfig}
                    disabled={saving || (mode === 'manual' && remaining < 0)}
                    style={{
                        padding: '10px 24px', borderRadius: 10, border: 'none',
                        background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                        color: '#fff', fontWeight: 700, fontSize: 14,
                        cursor: (saving || (mode === 'manual' && remaining < 0)) ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', opacity: saving ? 0.7 : 1,
                        boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
                    }}
                >
                    {saving ? 'Saving…' : 'Save Distribution'}
                </button>
            </div>
        </div>
    );
};

export default CreditsTab;
