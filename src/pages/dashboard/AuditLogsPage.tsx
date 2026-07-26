import React, { useState, useEffect, useCallback } from 'react';

type EventType = 'invite' | 'permission_change' | 'suspend' | 'activate' | 'remove';

interface AuditEvent {
    id:           string;
    event_type:   EventType;
    user_name:    string;
    user_email:   string;
    description:  string;
    metadata?:    Record<string, string>;
    created_at:   string;
}

const DEFAULT_EVENT_COLOR = { bg: 'rgba(99,102,241,0.1)', color: '#818cf8', border: 'rgba(99,102,241,0.25)' };

const EVENT_COLORS: Record<EventType, { bg: string; color: string; border: string }> = {
    invite:            { bg: 'rgba(20,184,166,0.1)',  color: '#2dd4bf', border: 'rgba(20,184,166,0.25)'  },
    permission_change: { bg: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)'   },
    suspend:           { bg: 'rgba(244,63,94,0.1)',   color: '#f87171', border: 'rgba(244,63,94,0.25)'   },
    activate:          { bg: 'rgba(16,185,129,0.1)',  color: '#34d399', border: 'rgba(16,185,129,0.25)'  },
    remove:            { bg: 'rgba(148,150,161,0.1)', color: '#9BA3BF', border: 'rgba(148,150,161,0.2)'  },
};

const EVENT_ICON: Record<EventType, string> = {
    invite:            '📨',
    permission_change: '🔑',
    suspend:           '⊘',
    activate:          '✓',
    remove:            '✕',
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
    { value: 'all',               label: 'All Events'        },
    { value: 'invite',            label: 'Invite'            },
    { value: 'permission_change', label: 'Permission Change' },
    { value: 'suspend',           label: 'Suspend'           },
    { value: 'activate',          label: 'Reactivate'        },
    { value: 'remove',            label: 'Remove Member'     },
];

const PAGE_SIZE = 25;

const AuditLogsPage: React.FC = () => {
    const [events,    setEvents]    = useState<AuditEvent[]>([]);
    const [loading,   setLoading]   = useState(true);
    const [error,     setError]     = useState<string | null>(null);
    const [filter,    setFilter]    = useState('all');
    const [search,    setSearch]    = useState('');
    const [page,      setPage]      = useState(1);
    const [total,     setTotal]     = useState(0);

    const fetchLogs = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(PAGE_SIZE),
                ...(filter !== 'all' ? { event_type: filter } : {}),
                ...(search.trim() ? { search: search.trim() } : {}),
            });
            const res = await fetch(`/api/workspace/audit-logs?${params}`, { credentials: 'include' });
            if (!res.ok) throw new Error(`Failed to load audit logs (${res.status})`);
            const data = await res.json();
            setEvents(Array.isArray(data) ? data : (data.logs ?? []));
            setTotal(data.total ?? 0);
        } catch (err: any) {
            setError(err.message || 'Failed to load audit logs');
        } finally { setLoading(false); }
    }, [page, filter, search]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    useEffect(() => { setPage(1); }, [filter, search]);

    const fmt = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const initials = (name: string) =>
        (name || '?').trim().split(/\s+/).map(w => w[0]?.toUpperCase()).slice(0, 2).join('') || '?';

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 2px' }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.55rem', color: '#E8EEFF', letterSpacing: '-0.02em', marginBottom: 6 }}>
                    Audit Logs
                </h1>
                <p style={{ fontSize: 14, color: '#5C6480' }}>
                    Track all developer activity across your workspace.
                </p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C6480" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by developer or description…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', boxSizing: 'border-box', paddingLeft: 36, paddingRight: 14,
                            paddingTop: 9, paddingBottom: 9,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)',
                            borderRadius: 10, color: '#E8EEFF', fontSize: 13, fontFamily: 'inherit', outline: 'none',
                        }}
                    />
                </div>
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{
                        padding: '9px 14px', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10,
                        color: '#E8EEFF', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                    }}
                >
                    {FILTER_OPTIONS.map(o => (
                        <option key={o.value} value={o.value} style={{ background: '#13151F' }}>{o.label}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div style={{ background: '#13151F', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 14, overflow: 'hidden' }}>
                {/* Header row */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 2fr 140px',
                    padding: '12px 20px', borderBottom: '1px solid rgba(99,102,241,0.1)',
                }}>
                    {['Developer', 'Event', 'Description', 'Time'].map(h => (
                        <span key={h} style={{ fontSize: 10, fontWeight: 700, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
                    ))}
                </div>

                {loading ? (
                    <div style={{ padding: '20px 20px' }}>
                        {[0, 0.1, 0.2, 0.3, 0.4].map((d, i) => (
                            <div key={i} style={{
                                height: 48, borderRadius: 8, marginBottom: 8,
                                background: 'linear-gradient(90deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 100%)',
                                backgroundSize: '400px 100%', animation: 'ov-shimmer 1.4s ease infinite',
                                animationDelay: `${d}s`,
                            }} />
                        ))}
                    </div>
                ) : error ? (
                    <div style={{ padding: '20px 20px', color: '#f87171', fontSize: 13, textAlign: 'center' }}>
                        ⚠ {error}
                        <button onClick={fetchLogs} style={{ marginLeft: 10, background: 'none', border: '1px solid rgba(244,63,94,0.3)', color: '#f87171', borderRadius: 6, padding: '3px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Retry</button>
                    </div>
                ) : events.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0 56px', color: '#5C6480' }}>
                        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📋</div>
                        <div style={{ fontWeight: 700, color: '#9BA3BF', fontSize: 14, marginBottom: 4 }}>No events found</div>
                        <div style={{ fontSize: 12 }}>Try adjusting your filter or search term.</div>
                    </div>
                ) : events.map((ev, i) => {
                    const clr = EVENT_COLORS[ev.event_type] ?? DEFAULT_EVENT_COLOR;
                    return (
                        <div key={ev.id} style={{
                            display: 'grid', gridTemplateColumns: '1fr 120px 2fr 140px',
                            padding: '12px 20px', alignItems: 'center',
                            borderBottom: i < events.length - 1 ? '1px solid rgba(99,102,241,0.07)' : 'none',
                        }}>
                            {/* Developer */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                                    background: 'linear-gradient(145deg,#4f46e5,#7c3aed)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontWeight: 800, fontSize: 10,
                                }}>{initials(ev.user_name)}</div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: 12, color: '#E8EEFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.user_name}</div>
                                    <div style={{ fontSize: 10, color: '#5C6480', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.user_email}</div>
                                </div>
                            </div>

                            {/* Event badge */}
                            <div>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 5,
                                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                                    background: clr.bg, color: clr.color, border: `1px solid ${clr.border}`,
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}>
                                    <span>{EVENT_ICON[ev.event_type] ?? '•'}</span>
                                    {ev.event_type.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Description */}
                            <div style={{ fontSize: 12, color: '#9BA3BF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ev.description}
                                {ev.metadata?.repo && (
                                    <span style={{ color: '#5C6480', marginLeft: 6 }}>— {ev.metadata.repo}</span>
                                )}
                            </div>

                            {/* Time */}
                            <div style={{ fontSize: 11, color: '#5C6480', fontFamily: "'JetBrains Mono', monospace" }}>
                                {fmt(ev.created_at)}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18 }}>
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                        style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', background: 'none', color: page <= 1 ? '#5C6480' : '#9BA3BF', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13 }}
                    >← Prev</button>
                    <span style={{ padding: '7px 16px', fontSize: 13, color: '#9BA3BF' }}>Page {page} of {totalPages}</span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', background: 'none', color: page >= totalPages ? '#5C6480' : '#9BA3BF', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 13 }}
                    >Next →</button>
                </div>
            )}
        </div>
    );
};

export default AuditLogsPage;
