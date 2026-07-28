import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Scan-group picker for the knowledge graph.
 *
 * A graph belongs to a group_scan_id, not to a repo — but nobody knows their
 * group ids by heart. So this lists the user's scan groups from
 * GET /api/scan/history/me (which returns group_scan_id + repo_url per scan)
 * and lets them pick by repo name, the same way Multi-Repo picks by repo.
 *
 * Scans are grouped by group_scan_id so a multi-repo scan shows as one entry
 * listing every service in it.
 */

interface HistoryScan {
    scan_id: string;
    repo_url: string;
    scanned_at: string;
    status?: string;
    total_vulnerabilities?: number;
    group_scan_id?: string;
}

export interface ScanGroup {
    groupScanId: string;
    repos: string[];
    scannedAt: string;
    vulnerabilities: number;
    scanCount: number;
}

interface Props {
    /** Currently loaded group, so it can be marked as selected. */
    activeGroupId?: string;
    onSelect: (groupScanId: string) => void;
}

const repoName = (url: string) => {
    if (!url) return '—';
    if (url.startsWith('upload://')) return url.replace('upload://', '');
    return url.replace(/\/+$/, '')
        .replace('https://github.com/', '')
        .replace('https://gitlab.com/', '');
};

const GroupPicker: React.FC<Props> = ({ activeGroupId, onSelect }) => {
    const [groups, setGroups]   = useState<ScanGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);
    const [search, setSearch]   = useState('');

    const abortRef = useRef<AbortController | null>(null);
    useEffect(() => () => abortRef.current?.abort(), []);

    const load = useCallback(async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/scan/history/me', {
                credentials: 'include',
                signal: controller.signal,
            });
            if (!res.ok) throw new Error(`Could not load your scans (${res.status})`);
            const data = await res.json();
            const scans: HistoryScan[] = Array.isArray(data) ? data : [];

            // Fold scans into their groups — a multi-repo scan is one group
            // with several repos.
            const byGroup = new Map<string, ScanGroup>();
            for (const s of scans) {
                const gid = s.group_scan_id;
                if (!gid) continue;               // older scans predate grouping
                const existing = byGroup.get(gid);
                const name = repoName(s.repo_url);
                if (existing) {
                    if (!existing.repos.includes(name)) existing.repos.push(name);
                    existing.vulnerabilities += s.total_vulnerabilities ?? 0;
                    existing.scanCount += 1;
                    if (s.scanned_at > existing.scannedAt) existing.scannedAt = s.scanned_at;
                } else {
                    byGroup.set(gid, {
                        groupScanId: gid,
                        repos: [name],
                        scannedAt: s.scanned_at,
                        vulnerabilities: s.total_vulnerabilities ?? 0,
                        scanCount: 1,
                    });
                }
            }

            setGroups(
                Array.from(byGroup.values()).sort((a, b) => (a.scannedAt < b.scannedAt ? 1 : -1)),
            );
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            setError(err.message || 'Could not load your scans');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return groups;
        return groups.filter(g => g.repos.some(r => r.toLowerCase().includes(q)));
    }, [groups, search]);

    const fmtDate = (iso: string) => {
        const d = new Date(iso);
        return isNaN(d.getTime())
            ? '—'
            : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="gv-picker">
            <div className="gv-picker-head">
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#E8EEFF' }}>Your scans</span>
                <span style={{ fontSize: 11, color: '#5C6480' }}>
                    {groups.length} group{groups.length === 1 ? '' : 's'}
                </span>
                <button className="gv-picker-refresh" onClick={load} disabled={loading} title="Refresh">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                </button>
            </div>

            {groups.length > 4 && (
                <input
                    className="gv-input"
                    style={{ width: '100%', padding: '7px 12px', fontSize: 12, marginBottom: 8 }}
                    placeholder="Search by repository…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label="Search scan groups"
                />
            )}

            {loading ? (
                <div style={{ padding: '18px 4px', fontSize: 12, color: '#5C6480' }}>Loading your scans…</div>
            ) : error ? (
                <div style={{ padding: '14px 4px', fontSize: 12, color: '#f87171' }}>{error}</div>
            ) : filtered.length === 0 ? (
                <div style={{ padding: '18px 4px', fontSize: 12, color: '#5C6480', lineHeight: 1.6 }}>
                    {groups.length === 0
                        ? 'No scans with a graph yet. Run a scan — the graph is built automatically.'
                        : `No scans match “${search}”.`}
                </div>
            ) : (
                <div className="gv-picker-list">
                    {filtered.map(g => {
                        const isActive = g.groupScanId === activeGroupId;
                        return (
                            <button
                                key={g.groupScanId}
                                className={`gv-picker-row${isActive ? ' active' : ''}`}
                                onClick={() => onSelect(g.groupScanId)}
                                title={g.repos.join(', ')}
                            >
                                <span className="gv-picker-badge">
                                    {g.repos.length > 1 ? g.repos.length : g.repos[0]?.split('/').pop()?.charAt(0).toUpperCase() || '?'}
                                </span>
                                <span style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#E8EEFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {g.repos.join(' · ')}
                                    </span>
                                    <span style={{ display: 'block', fontSize: 10.5, color: '#5C6480', marginTop: 2 }}>
                                        {fmtDate(g.scannedAt)}
                                        {g.repos.length > 1 && ` · ${g.repos.length} repos`}
                                        {g.vulnerabilities > 0 && ` · ${g.vulnerabilities} vulns`}
                                    </span>
                                </span>
                                {isActive && <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 700 }}>shown</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GroupPicker;
