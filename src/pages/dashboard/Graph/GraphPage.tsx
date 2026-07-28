import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../Toast';
import {
    NODE_STYLE,
    EDGE_STYLE,
    repoColor,
    type GraphResponse,
    type GraphNode,
    type GraphEdge,
    type SimNode,
    type NodeType,
    type EdgeType,
} from './graphTypes';
import { runLayout } from './forceLayout';
import GroupPicker from './GroupPicker';

/**
 * Knowledge graph viewer — GET /api/scan/graph/:groupScanId
 *
 * Renders the Neo4j workspace graph built by Phase 2.5 / Step 3 / Step 4:
 *   File / Function / Infrastructure / ExternalEndpoint nodes
 *   IMPORTS / CONTAINS / CALLS / EXTERNAL_CALL / CROSS_REPO_CALLS / USES edges
 *
 * Layout is a small force simulation (see forceLayout.ts) drawn to SVG, so the
 * page adds no third-party rendering dependency to the bundle.
 */

const CSS = `
  @keyframes gv-spin   { to { transform: rotate(360deg); } }
  @keyframes gv-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

  .gv-root * { box-sizing: border-box; }

  .gv-canvas-wrap {
    position: relative;
    background: #0B0D14;
    border: 1px solid rgba(99,102,241,0.14);
    border-radius: 14px;
    overflow: hidden;
    animation: gv-fadein 0.3s ease both;
  }
  .gv-svg { display: block; width: 100%; cursor: grab; touch-action: none; }
  .gv-svg.dragging { cursor: grabbing; }

  .gv-node-label {
    font-family: 'Instrument Sans', sans-serif;
    font-size: 9.5px; font-weight: 600;
    fill: #9BA3BF; pointer-events: none; user-select: none;
  }
  .gv-node-label.focused { fill: #E8EEFF; }

  .gv-legend {
    position: absolute; left: 14px; bottom: 14px;
    background: rgba(11,13,20,0.9);
    border: 1px solid rgba(99,102,241,0.16);
    border-radius: 10px; padding: 10px 12px;
    display: flex; flex-direction: column; gap: 6px;
    font-family: 'Instrument Sans', sans-serif; font-size: 11px;
    backdrop-filter: blur(6px);
  }
  .gv-legend-row { display: flex; align-items: center; gap: 7px; color: #9BA3BF; }

  .gv-toolbar {
    position: absolute; right: 14px; top: 14px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .gv-tool-btn {
    width: 30px; height: 30px; border-radius: 8px;
    background: rgba(19,21,31,0.92); border: 1px solid rgba(99,102,241,0.2);
    color: #9BA3BF; cursor: pointer; font-size: 14px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Instrument Sans', sans-serif; transition: all 0.15s;
  }
  .gv-tool-btn:hover { background: #1a1d2b; border-color: rgba(99,102,241,0.4); color: #E8EEFF; }

  .gv-filter-btn {
    padding: 6px 12px; border-radius: 8px; font-size: 11.5px; font-weight: 600;
    cursor: pointer; font-family: 'Instrument Sans', sans-serif;
    background: transparent; border: 1.5px solid rgba(99,102,241,0.18);
    color: #9BA3BF; transition: all 0.15s;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .gv-filter-btn:hover { border-color: rgba(99,102,241,0.35); color: #E8EEFF; }
  .gv-filter-btn.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.45); color: #818cf8; }

  .gv-input {
    background: #13151F; border: 1.5px solid rgba(99,102,241,0.18);
    border-radius: 9px; color: #E8EEFF; padding: 9px 14px;
    font-size: 13px; font-family: 'Instrument Sans', sans-serif;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .gv-input::placeholder { color: #52525b; }
  .gv-input:focus { border-color: rgba(99,102,241,0.45); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

  .gv-btn {
    display: inline-flex; align-items: center; gap: 7px;
    background: #13151F; border: 1px solid rgba(99,102,241,0.2);
    border-radius: 9px; color: #9BA3BF; padding: 8px 15px; cursor: pointer;
    font-size: 13px; font-weight: 600; font-family: 'Instrument Sans', sans-serif;
    transition: all 0.15s;
  }
  .gv-btn:hover:not(:disabled) { background: #1a1d2b; border-color: rgba(99,102,241,0.4); color: #E8EEFF; }
  .gv-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .gv-btn-primary {
    background: linear-gradient(135deg, #7c3aed, #6366f1);
    border: none; color: #fff; box-shadow: 0 4px 18px rgba(124,58,237,0.3);
  }
  .gv-btn-primary:hover:not(:disabled) { opacity: 0.92; color: #fff; }

  .gv-inspector {
    position: absolute; right: 14px; bottom: 14px; width: 260px;
    background: rgba(19,21,31,0.95);
    border: 1px solid rgba(99,102,241,0.22);
    border-radius: 12px; padding: 14px;
    font-family: 'Instrument Sans', sans-serif;
    backdrop-filter: blur(8px);
    animation: gv-fadein 0.2s ease both;
  }
  .gv-inspector-close {
    position: absolute; right: 8px; top: 6px; background: none; border: none;
    color: #5C6480; cursor: pointer; font-size: 15px; line-height: 1; padding: 2px 5px;
  }
  .gv-inspector-close:hover { color: #E8EEFF; }
  .gv-kv { display: flex; gap: 8px; font-size: 11.5px; margin-top: 7px; }
  .gv-kv-key { color: #5C6480; min-width: 62px; flex-shrink: 0; }
  .gv-kv-val { color: #9BA3BF; word-break: break-word; }

  .gv-stat {
    display: flex; flex-direction: column; gap: 2px; padding: 10px 14px;
    border-radius: 9px; background: #13151F; border: 1px solid rgba(99,102,241,0.12);
  }

  .gv-empty {
    display: flex; flex-direction: column; align-items: center;
    padding: 80px 0 100px; gap: 14px; text-align: center;
  }
  .gv-empty-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(99,102,241,0.08); border: 1.5px dashed rgba(99,102,241,0.25);
    display: flex; align-items: center; justify-content: center; font-size: 28px;
  }

  .gv-spinner {
    width: 26px; height: 26px; border: 2.5px solid rgba(99,102,241,0.2);
    border-top-color: #818cf8; border-radius: 50%;
    animation: gv-spin 0.8s linear infinite;
  }

  .gv-inline-error {
    background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.22);
    border-radius: 10px; padding: 12px 16px; color: #f87171; font-size: 13px;
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
    font-family: 'Instrument Sans', sans-serif;
  }
  .gv-inline-error button {
    margin-left: auto; background: none; border: 1px solid rgba(244,63,94,0.3);
    color: #f87171; padding: 3px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;
    font-family: 'Instrument Sans', sans-serif;
  }

  /* ── Scan-group picker ── */
  .gv-picker {
    background: #13151F; border: 1px solid rgba(99,102,241,0.16);
    border-radius: 12px; padding: 13px 14px;
    animation: gv-fadein 0.25s ease both;
  }
  .gv-picker-head { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
  .gv-picker-refresh {
    margin-left: auto; background: #0B0D14; border: 1px solid rgba(99,102,241,0.2);
    border-radius: 7px; color: #9BA3BF; padding: 4px 7px; cursor: pointer;
    display: flex; align-items: center; transition: all 0.15s;
  }
  .gv-picker-refresh:hover:not(:disabled) { border-color: rgba(99,102,241,0.42); color: #E8EEFF; }
  .gv-picker-refresh:disabled { opacity: 0.45; cursor: not-allowed; }

  .gv-picker-list { display: flex; flex-direction: column; gap: 6px; max-height: 260px; overflow-y: auto; }

  .gv-picker-row {
    display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
    background: #0B0D14; border: 1px solid rgba(99,102,241,0.12);
    border-radius: 10px; padding: 9px 11px; cursor: pointer;
    font-family: 'Instrument Sans', sans-serif; transition: all 0.15s;
  }
  .gv-picker-row:hover { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.06); }
  .gv-picker-row.active { border-color: rgba(129,140,248,0.6); background: rgba(99,102,241,0.1); }

  .gv-picker-badge {
    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(145deg, #4f46e5, #7c3aed);
    color: #fff; font-weight: 800; font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
  }

  .gv-link-btn {
    background: none; border: none; cursor: pointer; padding: 8px 2px 0;
    color: #5C6480; font-size: 11.5px; font-weight: 600;
    font-family: 'Instrument Sans', sans-serif; transition: color 0.15s;
  }
  .gv-link-btn:hover { color: #818cf8; }
`;

const VIEW_W = 1100;
const VIEW_H = 620;

const GraphPage: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { groupScanId: routeGroupId } = useParams<{ groupScanId: string }>();
    const [searchParams] = useSearchParams();

    // Group id can arrive from the route (/graph/:groupScanId), from ?group=,
    // or be typed in manually when the user lands on /graph directly.
    const initialId = routeGroupId || searchParams.get('group') || '';

    const [groupId, setGroupId]   = useState(initialId);
    const [inputId, setInputId]   = useState(initialId);
    const [showIdEntry, setShowIdEntry] = useState(false);
    const [graph, setGraph]       = useState<GraphResponse | null>(null);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState<string | null>(null);

    const [nodes, setNodes]       = useState<SimNode[]>([]);
    const [hiddenTypes, setHidden] = useState<Set<NodeType>>(new Set());
    const [selected, setSelected] = useState<SimNode | null>(null);
    const [search, setSearch]     = useState('');

    // Multi-repo controls
    const [hiddenRepos, setHiddenRepos] = useState<Set<string>>(new Set());
    const [colorByRepo, setColorByRepo] = useState(false);
    const [crossOnly, setCrossOnly]     = useState(false);

    // Pan / zoom
    const [zoom, setZoom]   = useState(1);
    const [pan, setPan]     = useState({ x: 0, y: 0 });
    const dragRef           = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
    const [dragging, setDragging] = useState(false);

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => () => abortRef.current?.abort(), []);

    const fetchGraph = useCallback(async (id: string) => {
        if (!id.trim()) return;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(null);
        setSelected(null);
        try {
            const res = await fetch(`/api/scan/graph/${encodeURIComponent(id.trim())}`, {
                credentials: 'include',
                signal: controller.signal,
            });
            if (res.status === 401) { navigate('/login'); return; }
            if (res.status === 404) {
                setGraph(null);
                setNodes([]);
                throw new Error('No graph found for this scan group. It may not have been built yet, or the ID is wrong.');
            }
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error((d as any).detail || `Failed to load graph (${res.status})`);
            }
            const data: GraphResponse = await res.json();
            setGraph(data);
            setNodes(runLayout(data.nodes, data.edges, VIEW_W, VIEW_H));
            setZoom(1);
            setPan({ x: 0, y: 0 });
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            setError(err.message || 'Failed to load graph');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        if (groupId) fetchGraph(groupId);
    }, [groupId, fetchGraph]);

    // ── Derived view model ────────────────────────────────────────────────────
    const repos = useMemo(() => {
        const s = new Set<string>();
        for (const n of nodes) if (n.repo) s.add(n.repo);
        return Array.from(s).sort();
    }, [nodes]);

    // Nodes involved in a cross-repo call, plus infrastructure shared by more
    // than one repo — the "how do these services actually touch" view.
    const crossRepoIds = useMemo(() => {
        if (!graph) return new Set<string>();
        const ids = new Set<string>();

        for (const e of graph.edges) {
            if (e.data.type === 'CROSS_REPO_CALLS') {
                ids.add(e.data.source);
                ids.add(e.data.target);
            }
        }

        // Infrastructure touched by two or more distinct repos
        const repoByNode = new Map(nodes.map(n => [n.id, n.repo]));
        const infraRepos = new Map<string, Set<string>>();
        for (const e of graph.edges) {
            if (e.data.type !== 'USES') continue;
            const r = repoByNode.get(e.data.source) || '';
            if (!infraRepos.has(e.data.target)) infraRepos.set(e.data.target, new Set());
            if (r) infraRepos.get(e.data.target)!.add(r);
        }
        for (const [infraId, rs] of infraRepos) {
            if (rs.size > 1) {
                ids.add(infraId);
                for (const e of graph.edges) {
                    if (e.data.type === 'USES' && e.data.target === infraId) ids.add(e.data.source);
                }
            }
        }
        return ids;
    }, [graph, nodes]);

    const visibleNodes = useMemo(
        () => nodes.filter(n =>
            !hiddenTypes.has(n.type) &&
            !(n.repo && hiddenRepos.has(n.repo)) &&
            (!crossOnly || crossRepoIds.has(n.id)),
        ),
        [nodes, hiddenTypes, hiddenRepos, crossOnly, crossRepoIds],
    );

    const visibleIds = useMemo(
        () => new Set(visibleNodes.map(n => n.id)),
        [visibleNodes],
    );

    const visibleEdges = useMemo(() => {
        if (!graph) return [];
        return graph.edges.filter(e => visibleIds.has(e.data.source) && visibleIds.has(e.data.target));
    }, [graph, visibleIds]);

    const nodeById = useMemo(() => {
        const m = new Map<string, SimNode>();
        for (const n of nodes) m.set(n.id, n);
        return m;
    }, [nodes]);

    const matchIds = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return null;
        return new Set(
            visibleNodes.filter(n => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)).map(n => n.id),
        );
    }, [search, visibleNodes]);

    const typeCounts = useMemo(() => {
        const c = {} as Record<NodeType, number>;
        for (const n of nodes) c[n.type] = (c[n.type] ?? 0) + 1;
        return c;
    }, [nodes]);

    const edgeCounts = useMemo(() => {
        const c = {} as Record<EdgeType, number>;
        for (const e of (graph?.edges ?? [])) c[e.data.type] = (c[e.data.type] ?? 0) + 1;
        return c;
    }, [graph]);

    // Per-repo node counts for the repo filter chips
    const repoCounts = useMemo(() => {
        const c: Record<string, number> = {};
        for (const n of nodes) if (n.repo) c[n.repo] = (c[n.repo] ?? 0) + 1;
        return c;
    }, [nodes]);

    // ── Interaction ───────────────────────────────────────────────────────────
    const toggleType = (t: NodeType) => {
        setHidden(prev => {
            const next = new Set(prev);
            if (next.has(t)) next.delete(t); else next.add(t);
            return next;
        });
    };

    const toggleRepo = (r: string) => {
        setHiddenRepos(prev => {
            const next = new Set(prev);
            if (next.has(r)) next.delete(r); else next.add(r);
            return next;
        });
    };

    /** Colour a node by repo when that mode is on; shared nodes keep type colour. */
    const fillFor = (n: SimNode) =>
        colorByRepo && n.repo ? repoColor(n.repo, repos) : NODE_STYLE[n.type].fill;

    const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
        dragRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        setDragging(true);
        (e.target as Element).setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
        const d = dragRef.current;
        if (!d) return;
        setPan({ x: d.panX + (e.clientX - d.x), y: d.panY + (e.clientY - d.y) });
    };

    const endDrag = () => { dragRef.current = null; setDragging(false); };

    const zoomBy = (factor: number) => setZoom(z => Math.min(3, Math.max(0.25, z * factor)));

    const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

    const relayout = () => {
        if (!graph) return;
        setNodes(runLayout(graph.nodes, graph.edges, VIEW_W, VIEW_H));
        resetView();
    };

    const copyId = () => {
        if (!groupId) return;
        navigator.clipboard?.writeText(groupId).then(
            () => showToast('Group scan ID copied', 'success'),
            () => showToast('Could not copy ID', 'error'),
        );
    };

    const submitId = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = inputId.trim();
        if (!trimmed) return;
        selectGroup(trimmed);
    };

    /** Load a group and reflect it in the URL so the view is shareable. */
    const selectGroup = (id: string) => {
        setGroupId(id);
        setInputId(id);
        navigate(`/graph/${encodeURIComponent(id)}`, { replace: true });
    };

    // ── Render ────────────────────────────────────────────────────────────────
    const hasGraph = Boolean(graph && graph.nodes.length > 0);

    return (
        <div className="gv-root" style={{ padding: '28px 32px', maxWidth: 1240, margin: '0 auto', fontFamily: "'Instrument Sans', sans-serif" }}>
            <style>{CSS}</style>

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#E8EEFF', letterSpacing: '-0.03em' }}>Knowledge Graph</h2>
                    <p style={{ margin: '4px 0 0', color: '#5C6480', fontSize: 13.5 }}>
                        Files, functions, infrastructure and cross-service calls discovered across every repo in a scan group
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="gv-btn" onClick={() => fetchGraph(groupId)} disabled={!groupId || loading}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Pick a scan by repo, the same way Multi-Repo does ── */}
            <div style={{ maxWidth: 560, marginBottom: 18 }}>
                <GroupPicker activeGroupId={groupId} onSelect={selectGroup} />

                {/* Raw id entry stays available for links shared between users
                    or ids copied out of the API, but it is not the main path. */}
                <button
                    className="gv-link-btn"
                    onClick={() => setShowIdEntry(v => !v)}
                >
                    {showIdEntry ? '− Hide manual ID entry' : '+ Enter a group scan ID manually'}
                </button>

                {showIdEntry && (
                    <form onSubmit={submitId} style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        <input
                            className="gv-input"
                            style={{ flex: 1, minWidth: 240 }}
                            placeholder="Group scan ID…"
                            value={inputId}
                            onChange={e => setInputId(e.target.value)}
                            aria-label="Group scan ID"
                        />
                        <button type="submit" className="gv-btn gv-btn-primary" disabled={!inputId.trim() || loading}>
                            Load
                        </button>
                        {groupId && (
                            <button type="button" className="gv-btn" onClick={copyId} title="Copy group scan ID">Copy ID</button>
                        )}
                    </form>
                )}
            </div>

            {error && (
                <div className="gv-inline-error">
                    <span>⚠</span> {error}
                    <button onClick={() => fetchGraph(groupId)}>Retry</button>
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '90px 0' }}>
                    <div className="gv-spinner" />
                    <div style={{ color: '#5C6480', fontSize: 13 }}>Building graph view…</div>
                </div>
            )}

            {/* ── Empty ── */}
            {!loading && !hasGraph && !error && (
                <div className="gv-empty">
                    <div className="gv-empty-icon">🕸</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#9BA3BF' }}>No graph loaded</div>
                    <div style={{ fontSize: 13, color: '#5C6480', maxWidth: 380, lineHeight: 1.6 }}>
                        Pick one of your scans above to see its graph. Graphs are built
                        automatically during every scan — multi-repo scans show cross-service calls.
                    </div>
                    <button className="gv-btn gv-btn-primary" onClick={() => navigate('/multi-repo')}>
                        Start a multi-repo scan
                    </button>
                </div>
            )}

            {/* ── Graph ── */}
            {!loading && hasGraph && graph && (
                <>
                    {/* Stats */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                        <div className="gv-stat">
                            <span style={{ fontSize: 19, fontWeight: 800, color: '#E8EEFF', lineHeight: 1 }}>{graph.total_nodes}</span>
                            <span style={{ fontSize: 9.5, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Nodes</span>
                        </div>
                        <div className="gv-stat">
                            <span style={{ fontSize: 19, fontWeight: 800, color: '#E8EEFF', lineHeight: 1 }}>{graph.total_edges}</span>
                            <span style={{ fontSize: 9.5, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Edges</span>
                        </div>
                        <div className="gv-stat">
                            <span style={{ fontSize: 19, fontWeight: 800, color: '#E8EEFF', lineHeight: 1 }}>{repos.length}</span>
                            <span style={{ fontSize: 9.5, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Repos</span>
                        </div>
                        {(edgeCounts.CROSS_REPO_CALLS ?? 0) > 0 && (
                            <div className="gv-stat" style={{ borderColor: 'rgba(236,72,153,0.3)' }}>
                                <span style={{ fontSize: 19, fontWeight: 800, color: '#f472b6', lineHeight: 1 }}>{edgeCounts.CROSS_REPO_CALLS}</span>
                                <span style={{ fontSize: 9.5, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Cross-repo</span>
                            </div>
                        )}
                        {(edgeCounts.USES ?? 0) > 0 && (
                            <div className="gv-stat" style={{ borderColor: 'rgba(45,212,191,0.3)' }}>
                                <span style={{ fontSize: 19, fontWeight: 800, color: '#2dd4bf', lineHeight: 1 }}>{edgeCounts.USES}</span>
                                <span style={{ fontSize: 9.5, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>Infra links</span>
                            </div>
                        )}
                    </div>

                    {/* Filters + search */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                        {(Object.keys(NODE_STYLE) as NodeType[]).map(t => (
                            <button
                                key={t}
                                className={`gv-filter-btn ${hiddenTypes.has(t) ? '' : 'active'}`}
                                onClick={() => toggleType(t)}
                                title={hiddenTypes.has(t) ? `Show ${t} nodes` : `Hide ${t} nodes`}
                            >
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: NODE_STYLE[t].fill, display: 'inline-block' }} />
                                {NODE_STYLE[t].label} ({typeCounts[t] ?? 0})
                            </button>
                        ))}
                        <input
                            className="gv-input"
                            style={{ marginLeft: 'auto', width: 220, padding: '7px 12px', fontSize: 12 }}
                            placeholder="Highlight node…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            aria-label="Highlight nodes by name"
                        />
                    </div>

                    {/* Multi-repo controls — only meaningful once more than one
                        repo is in the workspace */}
                    {repos.length > 1 && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                Repos
                            </span>
                            {repos.map(r => (
                                <button
                                    key={r}
                                    className={`gv-filter-btn ${hiddenRepos.has(r) ? '' : 'active'}`}
                                    onClick={() => toggleRepo(r)}
                                    title={hiddenRepos.has(r) ? `Show ${r}` : `Hide ${r}`}
                                >
                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: repoColor(r, repos), display: 'inline-block' }} />
                                    {r} ({repoCounts[r] ?? 0})
                                </button>
                            ))}

                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                <button
                                    className={`gv-filter-btn ${colorByRepo ? 'active' : ''}`}
                                    onClick={() => setColorByRepo(v => !v)}
                                    title="Colour nodes by which repo they belong to"
                                >
                                    Colour by repo
                                </button>
                                <button
                                    className={`gv-filter-btn ${crossOnly ? 'active' : ''}`}
                                    onClick={() => setCrossOnly(v => !v)}
                                    title="Show only cross-repo calls and infrastructure shared between repos"
                                >
                                    Cross-repo only ({(edgeCounts.CROSS_REPO_CALLS ?? 0)})
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Canvas */}
                    <div className="gv-canvas-wrap">
                        <svg
                            className={`gv-svg${dragging ? ' dragging' : ''}`}
                            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                            height={VIEW_H}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={endDrag}
                            onPointerLeave={endDrag}
                        >
                            <defs>
                                {(Object.keys(EDGE_STYLE) as EdgeType[]).map(t => (
                                    <marker
                                        key={t}
                                        id={`gv-arrow-${t}`}
                                        viewBox="0 0 10 10"
                                        refX="10" refY="5"
                                        markerWidth="6" markerHeight="6"
                                        orient="auto-start-reverse"
                                    >
                                        <path d="M 0 0 L 10 5 L 0 10 z" fill={EDGE_STYLE[t].stroke} opacity="0.75" />
                                    </marker>
                                ))}
                            </defs>

                            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                                {/* Edges */}
                                {visibleEdges.map(edge => {
                                    const s = nodeById.get(edge.data.source);
                                    const t = nodeById.get(edge.data.target);
                                    if (!s || !t) return null;
                                    const style = EDGE_STYLE[edge.data.type] ?? EDGE_STYLE.IMPORTS;
                                    const dim = matchIds ? !(matchIds.has(s.id) || matchIds.has(t.id)) : false;
                                    return (
                                        <line
                                            key={edge.data.id}
                                            x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                                            stroke={style.stroke}
                                            strokeWidth={style.width}
                                            strokeDasharray={style.dash}
                                            opacity={dim ? 0.07 : style.opacity}
                                            markerEnd={`url(#gv-arrow-${edge.data.type})`}
                                        />
                                    );
                                })}

                                {/* Nodes */}
                                {visibleNodes.map(n => {
                                    const style = NODE_STYLE[n.type];
                                    const isMatch    = matchIds ? matchIds.has(n.id) : false;
                                    const isSelected = selected?.id === n.id;
                                    const dim = matchIds ? !isMatch : false;
                                    return (
                                        <g
                                            key={n.id}
                                            opacity={dim ? 0.16 : 1}
                                            style={{ cursor: 'pointer' }}
                                            onPointerDown={e => e.stopPropagation()}
                                            onClick={() => setSelected(n)}
                                        >
                                            <circle
                                                cx={n.x} cy={n.y} r={style.radius}
                                                fill={fillFor(n)}
                                                stroke={isSelected || isMatch ? '#E8EEFF' : style.stroke}
                                                strokeWidth={isSelected || isMatch ? 2 : 1.2}
                                            />
                                            <text
                                                className={`gv-node-label${isSelected || isMatch ? ' focused' : ''}`}
                                                x={n.x} y={n.y + style.radius + 10}
                                                textAnchor="middle"
                                            >
                                                {n.label.length > 22 ? `${n.label.slice(0, 21)}…` : n.label}
                                            </text>
                                        </g>
                                    );
                                })}
                            </g>
                        </svg>

                        {/* Toolbar */}
                        <div className="gv-toolbar">
                            <button className="gv-tool-btn" onClick={() => zoomBy(1.25)} title="Zoom in" aria-label="Zoom in">+</button>
                            <button className="gv-tool-btn" onClick={() => zoomBy(0.8)}  title="Zoom out" aria-label="Zoom out">−</button>
                            <button className="gv-tool-btn" onClick={resetView} title="Reset view" aria-label="Reset view">⤾</button>
                            <button className="gv-tool-btn" onClick={relayout} title="Re-run layout" aria-label="Re-run layout">✳</button>
                        </div>

                        {/* Legend */}
                        <div className="gv-legend">
                            {(Object.keys(EDGE_STYLE) as EdgeType[])
                                .filter(t => (edgeCounts[t] ?? 0) > 0)
                                .map(t => (
                                    <div className="gv-legend-row" key={t}>
                                        <svg width="22" height="6">
                                            <line
                                                x1="0" y1="3" x2="22" y2="3"
                                                stroke={EDGE_STYLE[t].stroke}
                                                strokeWidth={EDGE_STYLE[t].width}
                                                strokeDasharray={EDGE_STYLE[t].dash}
                                            />
                                        </svg>
                                        {t} ({edgeCounts[t]})
                                    </div>
                                ))}
                        </div>

                        {/* Inspector */}
                        {selected && (
                            <div className="gv-inspector">
                                <button className="gv-inspector-close" onClick={() => setSelected(null)} aria-label="Close">×</button>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: fillFor(selected), flexShrink: 0 }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#5C6480' }}>
                                        {NODE_STYLE[selected.type].label}
                                    </span>
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EEFF', marginTop: 6, wordBreak: 'break-word' }}>
                                    {selected.label}
                                </div>
                                {selected.repo && (
                                    <div className="gv-kv"><span className="gv-kv-key">Repo</span><span className="gv-kv-val">{selected.repo}</span></div>
                                )}
                                {selected.raw.file_path && (
                                    <div className="gv-kv"><span className="gv-kv-key">File</span><span className="gv-kv-val">{String(selected.raw.file_path)}</span></div>
                                )}
                                {selected.raw.full_path && (
                                    <div className="gv-kv"><span className="gv-kv-key">Path</span><span className="gv-kv-val">{String(selected.raw.full_path)}</span></div>
                                )}
                                {selected.raw.infra_type && (
                                    <div className="gv-kv"><span className="gv-kv-key">Kind</span><span className="gv-kv-val">{String(selected.raw.infra_type)}</span></div>
                                )}
                                {selected.raw.endpoint_exposed && (
                                    <div className="gv-kv"><span className="gv-kv-key">Exposes</span><span className="gv-kv-val">{String(selected.raw.endpoint_exposed)}</span></div>
                                )}
                                {selected.raw.expose_intent && (
                                    <div className="gv-kv"><span className="gv-kv-key">Intent</span><span className="gv-kv-val">{String(selected.raw.expose_intent)}</span></div>
                                )}
                                <div className="gv-kv"><span className="gv-kv-key">Degree</span><span className="gv-kv-val">{selected.degree} connection{selected.degree === 1 ? '' : 's'}</span></div>
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: 10, fontSize: 11.5, color: '#5C6480' }}>
                        Drag to pan · use the toolbar to zoom · click any node for details
                        {repos.length > 0 && <> · repos: {repos.join(', ')}</>}
                    </div>
                </>
            )}
        </div>
    );
};

export default GraphPage;
export type { GraphNode, GraphEdge };
