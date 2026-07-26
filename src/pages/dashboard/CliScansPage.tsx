import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BySeverity {
    critical: number;
    high:     number;
    medium:   number;
    low:      number;
}

interface ScanSummary {
    _id:                   string;
    source:                string;
    scanned_at:            string;
    ecosystem:             string;
    scanner_version:       string;
    total_dependencies:    number;
    total_vulnerabilities: number;
    by_severity:           BySeverity;
    fixable_count:         number;
    no_fix_count:          number;
    suppressed_count:      number;
}

interface Vulnerability {
    id:             string;
    package:        string;
    version:        string;
    severity:       string;
    title:          string;
    description?:   string;
    fix_version?:   string;
    fix_available?: boolean;  // from DB: false = explicitly no fix, undefined = unknown
    cvss_score?:    number;
    sources?:       string[]; // stored in DB but not displayed in UI
}

interface ScanDetail extends ScanSummary {
    vulnerabilities: Vulnerability[];
    risk_summary?:   Record<string, unknown>;
    top5_by_risk?:   unknown[];
}

interface HistoryResponse {
    scans: ScanSummary[];
    total: number;
    page:  number;
    limit: number;
}

// ─── Severity config ──────────────────────────────────────────────────────────
const SEV: Record<string, { color: string; bg: string; dot: string }> = {
    CRITICAL: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   dot: '#ef4444' },
    HIGH:     { color: '#f97316', bg: 'rgba(249,115,22,0.10)',  dot: '#f97316' },
    MEDIUM:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  dot: '#f59e0b' },
    LOW:      { color: '#10b981', bg: 'rgba(16,185,129,0.10)',  dot: '#10b981' },
    UNKNOWN:  { color: '#9896a1', bg: 'rgba(152,150,161,0.10)', dot: '#9896a1' },
};

const sevOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function riskScore(s: ScanSummary): number {
    const b = s.by_severity || {};
    return (b.critical || 0) * 10 + (b.high || 0) * 4 +
           (b.medium || 0) * 2  + (b.low || 0);
}

function riskLabel(score: number): { label: string; color: string } {
    if (score === 0)   return { label: 'Clean',    color: '#10b981' };
    if (score <= 4)    return { label: 'Low',      color: '#10b981' };
    if (score <= 15)   return { label: 'Moderate', color: '#f59e0b' };
    if (score <= 40)   return { label: 'High',     color: '#f97316' };
    return                    { label: 'Critical', color: '#ef4444' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const SevBadge: React.FC<{ sev: string; count?: number }> = ({ sev, count }) => {
    const cfg = SEV[sev.toUpperCase()] ?? SEV.UNKNOWN;
    if (count !== undefined && count === 0) return null;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.color}22`,
            borderRadius: 6, padding: '2px 8px',
            fontSize: '0.75rem', fontWeight: 600,
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
            {count !== undefined ? count : sev}
        </span>
    );
};

const SevBar: React.FC<{ by_severity: BySeverity; total: number }> = ({ by_severity, total }) => {
    if (!total) return (
        <div style={{ height: 6, borderRadius: 4, background: 'rgba(16,185,129,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>clean</span>
        </div>
    );
    const colors = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981' };
    return (
        <div style={{ display: 'flex', height: 6, borderRadius: 4, overflow: 'hidden', gap: 1 }}>
            {(Object.entries(colors) as [keyof BySeverity, string][]).map(([k, c]) => {
                const val = by_severity[k] || 0;
                if (!val) return null;
                return (
                    <div key={k} title={`${k}: ${val}`}
                        style={{ flex: val, background: c, minWidth: 3 }} />
                );
            })}
        </div>
    );
};

// ─── Scan Card ────────────────────────────────────────────────────────────────
const ScanCard: React.FC<{
    scan:     ScanSummary;
    onClick:  (id: string) => void;
    selected: boolean;
}> = ({ scan, onClick, selected }) => {
    const risk = riskLabel(riskScore(scan));
    const b    = scan.by_severity || {};
    const hasVulns = scan.total_vulnerabilities > 0;

    return (
        <div
            onClick={() => onClick(scan._id)}
            style={{
                background:    selected ? 'var(--accent-light)' : 'var(--surface)',
                border:        `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius:  'var(--radius)',
                padding:       '1rem 1.25rem',
                cursor:        'pointer',
                transition:    'border-color .15s, box-shadow .15s',
                boxShadow:     selected ? '0 0 0 2px var(--accent-glow)' : 'none',
            }}
            onMouseEnter={e => {
                if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-mid)';
            }}
            onMouseLeave={e => {
                if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
            }}
        >
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '0.7rem', color: 'var(--text-muted)',
                        background: 'var(--surface2)', border: '1px solid var(--border)',
                        borderRadius: 4, padding: '2px 6px',
                    }}>
                        {scan.ecosystem || 'unknown'}
                    </span>
                    <span style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '0.65rem', color: 'var(--text-muted)',
                    }}>
                        ⌨ CLI
                    </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: risk.color, fontWeight: 600 }}>
                    {risk.label}
                </span>
            </div>

            {/* Sev pills */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                {hasVulns ? (
                    <>
                        <SevBadge sev="CRITICAL" count={b.critical} />
                        <SevBadge sev="HIGH"     count={b.high} />
                        <SevBadge sev="MEDIUM"   count={b.medium} />
                        <SevBadge sev="LOW"      count={b.low} />
                    </>
                ) : (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>✓ No vulnerabilities</span>
                )}
            </div>

            {/* Bar */}
            <SevBar by_severity={scan.by_severity} total={scan.total_vulnerabilities} />

            {/* Footer */}
            <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)',
            }}>
                <span>{scan.total_dependencies} deps · {scan.fixable_count} fixable</span>
                <span title={formatDate(scan.scanned_at)}>{timeAgo(scan.scanned_at)}</span>
            </div>
        </div>
    );
};

// ─── Detail Panel ─────────────────────────────────────────────────────────────
const DetailPanel: React.FC<{
    scan:    ScanDetail;
    onClose: () => void;
}> = ({ scan, onClose }) => {
    const [sevFilter, setSevFilter] = useState<string>('ALL');
    const [search, setSearch]       = useState('');

    const vulns = (scan.vulnerabilities || []).filter(v => {
        const sev = (v.severity || '').toUpperCase();
        if (sevFilter !== 'ALL' && sev !== sevFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (v.package || '').toLowerCase().includes(q) ||
                   (v.title   || '').toLowerCase().includes(q) ||
                   (v.id      || '').toLowerCase().includes(q);
        }
        return true;
    });

    const b    = scan.by_severity || {};
    const risk = riskLabel(riskScore(scan));

    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column',
        flex: 1, minHeight: 0, overflow: 'hidden',
    }}>
            {/* Panel header */}
            <div style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <button onClick={onClose} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1,
                    padding: '2px 4px', borderRadius: 4,
                }}>←</button>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                            Scan Detail
                        </span>
                        <span style={{
                            fontFamily: 'monospace', fontSize: '0.7rem',
                            color: 'var(--text-muted)', background: 'var(--surface2)',
                            border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px',
                        }}>
                            {scan.ecosystem}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: risk.color, fontWeight: 600 }}>
                            {risk.label} risk
                        </span>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatDate(scan.scanned_at)} · {scan.total_dependencies} deps
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                borderBottom: '1px solid var(--border)',
            }}>
                {[
                    { label: 'Total',    val: scan.total_vulnerabilities, color: 'var(--text)' },
                    { label: 'Fixable',  val: scan.fixable_count,          color: '#10b981' },
                    { label: 'No Fix',   val: scan.no_fix_count,           color: '#f97316' },
                    { label: 'Deps',     val: scan.total_dependencies,     color: 'var(--text-sub)' },
                ].map(s => (
                    <div key={s.label} style={{
                        padding: '0.75rem', textAlign: 'center',
                        borderRight: '1px solid var(--border)',
                    }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color,
                                      fontFamily: 'monospace' }}>
                            {s.val}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {s.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Severity filter */}
            <div style={{
                display: 'flex', gap: 6, padding: '0.75rem 1.25rem',
                borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
            }}>
                {['ALL', ...sevOrder].map(s => {
                    const count = s === 'ALL' ? scan.total_vulnerabilities
                        : b[s.toLowerCase() as keyof BySeverity] || 0;
                    const active = sevFilter === s;
                    const cfg = SEV[s] ?? { color: 'var(--text-sub)', bg: 'var(--surface2)' };
                    return (
                        <button key={s} onClick={() => setSevFilter(s)} style={{
                            padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem',
                            fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                            background: active ? cfg.bg    : 'transparent',
                            color:      active ? cfg.color : 'var(--text-muted)',
                            border:     active ? `1px solid ${cfg.color}44` : '1px solid var(--border)',
                        }}>
                            {s} {count > 0 && <span style={{ opacity: .7 }}>({count})</span>}
                        </button>
                    );
                })}
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search package, CVE…"
                    style={{
                        marginLeft: 'auto', padding: '3px 10px', borderRadius: 6,
                        border: '1px solid var(--border)', background: 'var(--surface2)',
                        color: 'var(--text)', fontSize: '0.78rem', outline: 'none',
                        width: 180,
                    }}
                />
            </div>

            {/* Vuln list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1.25rem 1.25rem' }}>
                {vulns.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '3rem 1rem',
                        color: 'var(--text-muted)', fontSize: '0.9rem',
                    }}>
                        {scan.total_vulnerabilities === 0
                            ? '✅ No vulnerabilities found in this scan'
                            : 'No results match your filter'}
                    </div>
                ) : (
                    vulns.map((v, i) => {
                        const sev = (v.severity || 'UNKNOWN').toUpperCase();
                        const cfg = SEV[sev] ?? SEV.UNKNOWN;
                        return (
                            <div key={v.id || i} style={{
                                borderBottom: '1px solid var(--border)',
                                padding: '0.85rem 0',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                    <span style={{
                                        marginTop: 2, width: 8, height: 8, borderRadius: '50%',
                                        background: cfg.dot, flexShrink: 0,
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center',
                                                      gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                            <span style={{
                                                fontWeight: 600, fontSize: '0.85rem',
                                                color: 'var(--text)', fontFamily: 'monospace',
                                            }}>
                                                {v.package}
                                            </span>
                                            <span style={{
                                                fontSize: '0.73rem', color: 'var(--text-muted)',
                                                background: 'var(--surface2)', border: '1px solid var(--border)',
                                                borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace',
                                            }}>
                                                {v.version}
                                            </span>
                                            <SevBadge sev={sev} />
                                            {v.cvss_score !== undefined && (
                                                <span style={{
                                                    fontSize: '0.7rem', color: cfg.color,
                                                    fontWeight: 600,
                                                }}>
                                                    CVSS {v.cvss_score.toFixed(1)}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '0.82rem', color: 'var(--text-sub)',
                                            marginBottom: 4, lineHeight: 1.45,
                                        }}>
                                            {v.title}
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap',
                                                      fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                                            {v.id && (
                                                <span style={{ fontFamily: 'monospace' }}>{v.id}</span>
                                            )}
                                            {v.fix_version ? (
                                                <span style={{ color: '#10b981' }}>
                                                    → fix: {v.fix_version}
                                                </span>
                                            ) : v.fix_available === false ? (
                                                <span style={{ color: '#f97316' }}>no fix available</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState: React.FC = () => (
    <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center',
        gap: '1rem',
    }}>
        <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem',
        }}>
            ⌨
        </div>
        <div>
            <h3 style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 6 }}>
                No CLI scans yet
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 320, lineHeight: 1.6 }}>
                Install the Niyantri CLI and run your first scan to see results here.
            </p>
        </div>
        <div style={{
            background: '#0c0c0f', border: '1px solid #2d2d4e',
            borderRadius: 10, padding: '0.75rem 1.25rem',
            fontFamily: 'monospace', fontSize: '0.82rem', color: '#a5b4fc',
            lineHeight: 1.8,
        }}>
            <div>npm install -g klinkaara</div>
            <div>niyantri login</div>
            <div>niyantri</div>
        </div>
    </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const CliScansPage: React.FC = () => {
    const [scans, setScans]         = useState<ScanSummary[]>([]);
    const [total, setTotal]         = useState(0);
    const [page, setPage]           = useState(1);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);

    const [selectedId, setSelectedId]   = useState<string | null>(null);
    const [detail, setDetail]           = useState<ScanDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const limit = 20;

    const fetchHistory = useCallback(async (p = 1) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/cli/scans?page=${p}&limit=${limit}`, {
                credentials: 'include',
            });
            if (!res.ok) throw new Error(`${res.status}`);
            const data: HistoryResponse = await res.json();
            setScans(data.scans);
            setTotal(data.total);
            setPage(p);
        } catch (e) {
            setError('Failed to load scan history. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchHistory(1); }, [fetchHistory]);

    const handleSelectScan = async (id: string) => {
        if (selectedId === id) {
            setSelectedId(null);
            setDetail(null);
            return;
        }
        setSelectedId(id);
        setDetailLoading(true);
        try {
            const res = await fetch(`/api/cli/scans/${id}`, { credentials: 'include' });
            if (!res.ok) throw new Error(`${res.status}`);
            const data: ScanDetail = await res.json();
            setDetail(data);
        } catch {
            setDetail(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const totalPages = Math.ceil(total / limit);

    // ── Aggregate stats across current page ───────────────────────────────────
    const stats = scans.reduce((acc, s) => {
        acc.vulns += s.total_vulnerabilities;
        acc.critical += (s.by_severity?.critical || 0);
        acc.high     += (s.by_severity?.high     || 0);
        acc.fixable  += s.fixable_count;
        return acc;
    }, { vulns: 0, critical: 0, high: 0, fixable: 0 });

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1200, margin: '0 auto' }}>

            {/* ── Page header ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <span style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'var(--accent-light)', border: '1px solid var(--accent)',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1rem',
                        }}>⌨</span>
                        CLI Scans
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 }}>
                        Scan results submitted via the Niyantri CLI
                    </p>
                </div>
                <button
                    onClick={() => fetchHistory(page)}
                    style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '6px 14px',
                        fontSize: '0.82rem', color: 'var(--text-sub)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                >
                    ↻ Refresh
                </button>
            </div>

            {/* ── Stats bar ── */}
            {!loading && scans.length > 0 && (
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '0.75rem', marginBottom: '1.5rem',
                }}>
                    {[
                        { label: 'Total Scans',  val: total,          color: 'var(--accent)' },
                        { label: 'Vulns Found',  val: stats.vulns,    color: '#f97316' },
                        { label: 'Critical',     val: stats.critical, color: '#ef4444' },
                        { label: 'High',         val: stats.high,     color: '#f97316' },
                        { label: 'Fixable',      val: stats.fixable,  color: '#10b981' },
                    ].map(s => (
                        <div key={s.label} style={{
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)', padding: '0.9rem 1rem',
                        }}>
                            <div style={{
                                fontSize: '1.6rem', fontWeight: 700, color: s.color,
                                fontFamily: 'monospace', lineHeight: 1,
                            }}>
                                {s.val}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                {s.label}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    padding: '4rem', gap: 12, color: 'var(--text-muted)',
                }}>
                    <div style={{
                        width: 20, height: 20, border: '2px solid var(--border)',
                        borderTop: '2px solid var(--accent)', borderRadius: '50%',
                        animation: 'spin .7s linear infinite',
                    }} />
                    Loading scan history…
                </div>
            )}

            {/* ── Error ── */}
            {error && !loading && (
                <div style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
                    color: '#ef4444', fontSize: '0.88rem', marginBottom: '1.25rem',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    ⚠ {error}
                    <button onClick={() => fetchHistory(1)} style={{
                        marginLeft: 'auto', background: 'none', border: '1px solid #ef444440',
                        borderRadius: 6, padding: '3px 10px', color: '#ef4444',
                        cursor: 'pointer', fontSize: '0.78rem',
                    }}>Retry</button>
                </div>
            )}

            {/* ── Empty ── */}
            {!loading && !error && scans.length === 0 && <EmptyState />}

            {/* ── Split layout: list + detail ── */}
            {!loading && scans.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: selectedId ? '340px 1fr' : '1fr',
                    gap: '1rem', alignItems: 'start',
                }}>
                    {/* List column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {scans.map(scan => (
                            <ScanCard
                                key={scan._id}
                                scan={scan}
                                onClick={handleSelectScan}
                                selected={selectedId === scan._id}
                            />
                        ))}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                display: 'flex', justifyContent: 'center', gap: 6,
                                marginTop: '0.5rem',
                            }}>
                                <button
                                    disabled={page <= 1}
                                    onClick={() => fetchHistory(page - 1)}
                                    style={{
                                        padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem',
                                        border: '1px solid var(--border)', background: 'var(--surface)',
                                        color: page <= 1 ? 'var(--text-muted)' : 'var(--text)',
                                        cursor: page <= 1 ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    ← Prev
                                </button>
                                <span style={{
                                    padding: '5px 12px', fontSize: '0.8rem',
                                    color: 'var(--text-muted)',
                                }}>
                                    {page} / {totalPages}
                                </span>
                                <button
                                    disabled={page >= totalPages}
                                    onClick={() => fetchHistory(page + 1)}
                                    style={{
                                        padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem',
                                        border: '1px solid var(--border)', background: 'var(--surface)',
                                        color: page >= totalPages ? 'var(--text-muted)' : 'var(--text)',
                                        cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Detail column */}
                    {selectedId && (
                        <div style={{
                            position: 'sticky',
                            top: '1rem',
                            height: 'calc(100vh - 120px)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            {detailLoading ? (
                                <div style={{
                                    background: 'var(--surface)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius)', padding: '3rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: 10, color: 'var(--text-muted)', fontSize: '0.88rem',
                                }}>
                                    <div style={{
                                        width: 18, height: 18,
                                        border: '2px solid var(--border)',
                                        borderTop: '2px solid var(--accent)',
                                        borderRadius: '50%',
                                        animation: 'spin .7s linear infinite',
                                    }} />
                                    Loading vulnerabilities…
                                </div>
                            ) : detail ? (
                                <DetailPanel
                                    scan={detail}
                                    onClose={() => { setSelectedId(null); setDetail(null); }}
                                />
                            ) : null}
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default CliScansPage;