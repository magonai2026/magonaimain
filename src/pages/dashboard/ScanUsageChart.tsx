import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';

/**
 * Scan credit usage — GET /api/scan/credits/history/:userId
 *
 * The scanner debits credits per phase as tokens are spent, which is a
 * different ledger from the wallet top-up transactions shown elsewhere on the
 * Credits page. This renders the balance-over-time curve plus per-scan debits.
 *
 * The backend rejects a mismatched user (403), so the uuid comes from
 * /api/profile rather than being passed in — the gateway forwards the same
 * identity as X-User-Id.
 */

interface CreditTxn {
    type: string;
    amount: number;
    balance_after: number;
    timestamp: string;
}

interface CreditHistory {
    user_id: string;
    balance: number;
    total: number;
    transactions: CreditTxn[];
}

const W = 620;
const H = 150;
const PAD = { top: 12, right: 10, bottom: 20, left: 10 };

const ScanUsageChart: React.FC = () => {
    const [data, setData]       = useState<CreditHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [hover, setHover]     = useState<number | null>(null);

    const abortRef = useRef<AbortController | null>(null);
    useEffect(() => () => abortRef.current?.abort(), []);

    const load = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        try {
            const pRes = await fetch('/api/profile', { credentials: 'include', signal: controller.signal });
            if (!pRes.ok) throw new Error('Could not resolve your account');
            const profile = await pRes.json();
            const uuid = profile?.uuid;
            if (!uuid) throw new Error('Could not resolve your account');

            const res = await fetch(`/api/scan/credits/history/${uuid}?limit=100`, {
                credentials: 'include',
                signal: controller.signal,
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error((d as any).detail || `Failed to load usage (${res.status})`);
            }
            setData(await res.json());
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            setError(err.message || 'Failed to load scan usage');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Backend returns newest-first; the chart reads left → right in time order.
    const points = useMemo(() => {
        const txns = [...(data?.transactions ?? [])].reverse();
        if (txns.length === 0) return [];

        const balances = txns.map(t => t.balance_after);
        const max = Math.max(...balances);
        const min = Math.min(...balances);
        const span = max - min || 1;

        const innerW = W - PAD.left - PAD.right;
        const innerH = H - PAD.top - PAD.bottom;
        const step = txns.length > 1 ? innerW / (txns.length - 1) : 0;

        return txns.map((t, i) => ({
            txn: t,
            x: PAD.left + (txns.length > 1 ? i * step : innerW / 2),
            y: PAD.top + innerH - ((t.balance_after - min) / span) * innerH,
        }));
    }, [data]);

    const linePath = useMemo(
        () => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
        [points],
    );

    const areaPath = useMemo(() => {
        if (points.length === 0) return '';
        const base = H - PAD.bottom;
        return `${linePath} L${points[points.length - 1].x.toFixed(1)},${base} L${points[0].x.toFixed(1)},${base} Z`;
    }, [points, linePath]);

    const totalSpent = useMemo(
        () => (data?.transactions ?? []).reduce((s, t) => s + (t.amount || 0), 0),
        [data],
    );

    const fmtDate = (iso: string) => {
        const d = new Date(iso);
        return isNaN(d.getTime())
            ? '—'
            : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const active = hover !== null ? points[hover] : null;

    return (
        <>
            <div className="cp2-section-heading">Scan Credit Usage</div>

            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
            }}>
                {loading ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Loading scan usage…
                    </div>
                ) : error ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#f87171' }}>
                        <span>⚠</span> {error}
                        <button
                            onClick={load}
                            style={{
                                marginLeft: 'auto', background: 'none', border: '1px solid rgba(244,63,94,0.3)',
                                color: '#f87171', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                                fontFamily: 'inherit',
                            }}
                        >
                            Retry
                        </button>
                    </div>
                ) : points.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No scan usage yet. Credits are debited per phase as scans run.
                    </div>
                ) : (
                    <>
                        {/* Summary row */}
                        <div style={{ display: 'flex', gap: 26, marginBottom: 14, flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Balance</div>
                                <div style={{ fontSize: 19, fontWeight: 800, color: '#E8EEFF', marginTop: 2 }}>
                                    {Number(data?.balance ?? 0).toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Spent on scans</div>
                                <div style={{ fontSize: 19, fontWeight: 800, color: '#fb923c', marginTop: 2 }}>
                                    {totalSpent.toFixed(2)}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Debits</div>
                                <div style={{ fontSize: 19, fontWeight: 800, color: '#E8EEFF', marginTop: 2 }}>
                                    {data?.total ?? points.length}
                                </div>
                            </div>
                        </div>

                        {/* Balance-over-time chart */}
                        <div style={{ position: 'relative' }}>
                            <svg
                                viewBox={`0 0 ${W} ${H}`}
                                style={{ width: '100%', height: H, display: 'block', overflow: 'visible' }}
                                onMouseLeave={() => setHover(null)}
                                role="img"
                                aria-label="Credit balance over time"
                            >
                                <defs>
                                    <linearGradient id="cu-fill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%"   stopColor="#a855f7" stopOpacity="0.28" />
                                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                                    </linearGradient>
                                </defs>

                                <path d={areaPath} fill="url(#cu-fill)" />
                                <path d={linePath} fill="none" stroke="#a855f7" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />

                                {points.map((p, i) => (
                                    <circle
                                        key={`${p.txn.timestamp}-${i}`}
                                        cx={p.x} cy={p.y}
                                        r={hover === i ? 4 : 2.4}
                                        fill={hover === i ? '#E8EEFF' : '#a855f7'}
                                        stroke="#0f0f0f" strokeWidth="1"
                                        onMouseEnter={() => setHover(i)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                ))}
                            </svg>

                            {active && (
                                <div style={{
                                    position: 'absolute',
                                    left: `${(active.x / W) * 100}%`,
                                    top: 0,
                                    transform: 'translate(-50%, -105%)',
                                    background: 'rgba(11,13,20,0.96)',
                                    border: '1px solid rgba(168,85,247,0.3)',
                                    borderRadius: 8, padding: '6px 10px',
                                    fontSize: 11, color: '#E8EEFF', whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                }}>
                                    <div style={{ fontWeight: 700 }}>−{active.txn.amount.toFixed(2)} credits</div>
                                    <div style={{ color: '#9BA3BF', marginTop: 2 }}>
                                        balance {active.txn.balance_after.toFixed(2)}
                                    </div>
                                    <div style={{ color: '#5C6480', marginTop: 1 }}>{fmtDate(active.txn.timestamp)}</div>
                                </div>
                            )}
                        </div>

                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                            Balance after each scan debit · oldest to newest · hover a point for detail
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default ScanUsageChart;
