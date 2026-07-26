import React from 'react';
import type { DevMembership } from './workspaceTypes';

interface Props {
    membership: DevMembership;
}

const DeveloperCreditsPage: React.FC<Props> = ({ membership }) => {
    const { credits_allocated, credits_used, admin_name, admin_email } = membership;
    const remaining = credits_allocated - credits_used;
    const pct       = credits_allocated > 0 ? Math.min((credits_used / credits_allocated) * 100, 100) : 0;

    const barColor = pct > 85
        ? 'linear-gradient(90deg,#f43f5e,#ef4444)'
        : pct > 60
        ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
        : 'linear-gradient(90deg,#6366f1,#a855f7)';

    return (
        <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 2px' }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.55rem', color: '#E8EEFF', letterSpacing: '-0.02em', marginBottom: 6 }}>
                    My Credits
                </h1>
                <p style={{ fontSize: 14, color: '#5C6480' }}>
                    Credits allocated to you by your workspace admin.
                </p>
            </div>

            {/* Big number card */}
            <div style={{
                background: 'linear-gradient(145deg,rgba(99,102,241,0.08),rgba(124,58,237,0.06))',
                border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16,
                padding: '28px 28px 24px', marginBottom: 16,
            }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Credits Remaining
                </div>
                <div style={{ fontWeight: 900, fontSize: '3rem', color: remaining <= 0 ? '#f87171' : '#a5b4fc', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {remaining > 0 ? remaining.toLocaleString() : '0'}
                </div>
                <div style={{ fontSize: 12, color: '#5C6480', marginTop: 6 }}>
                    of {credits_allocated.toLocaleString()} allocated
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: '#5C6480' }}>{credits_used.toLocaleString()} used</span>
                        <span style={{ fontSize: 11, color: '#5C6480' }}>{Math.round(pct)}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'rgba(99,102,241,0.1)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, background: barColor, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                    </div>
                </div>
            </div>

            {/* Breakdown cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
                {[
                    { label: 'Allocated', value: credits_allocated, color: '#E8EEFF' },
                    { label: 'Used',      value: credits_used,      color: '#f87171'  },
                    { label: 'Left',      value: Math.max(remaining, 0), color: '#34d399' },
                ].map(({ label, value, color }) => (
                    <div key={label} style={{
                        background: '#13151F', border: '1px solid rgba(99,102,241,0.12)',
                        borderRadius: 12, padding: '14px 16px', textAlign: 'center',
                    }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
                        <div style={{ fontWeight: 800, fontSize: '1.3rem', color, fontFamily: "'JetBrains Mono', monospace" }}>
                            {value.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Admin info */}
            <div style={{
                background: '#13151F', border: '1px solid rgba(99,102,241,0.12)',
                borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: 'linear-gradient(145deg,#4f46e5,#7c3aed)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13,
                }}>
                    {(admin_name || 'A').charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Managed by</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#E8EEFF' }}>{admin_name}</div>
                    <div style={{ fontSize: 12, color: '#5C6480' }}>{admin_email}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: '#5C6480', textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: '#9BA3BF' }}>Need more credits?</div>
                    <div>Contact your admin</div>
                </div>
            </div>

            {remaining <= 0 && (
                <div style={{
                    marginTop: 16, background: 'rgba(244,63,94,0.08)',
                    border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10,
                    padding: '12px 18px', fontSize: 13, color: '#f87171', fontWeight: 600,
                }}>
                    ⚠ You've used all your allocated credits. Contact {admin_name} to get more.
                </div>
            )}
        </div>
    );
};

export default DeveloperCreditsPage;
