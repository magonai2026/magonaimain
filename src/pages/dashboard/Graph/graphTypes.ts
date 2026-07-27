/**
 * Types + visual styling for the knowledge graph returned by
 * GET /api/scan/graph/:groupScanId (proxied to the scanner's /scan/graph/{id}).
 *
 * The payload is Cytoscape-shaped ({ data: {...} } wrappers) because the
 * backend emits it that way; we keep that shape as the wire format and
 * flatten into SimNode for rendering.
 */

export type NodeType = 'File' | 'Function' | 'Infrastructure' | 'ExternalEndpoint';

export type EdgeType =
    | 'IMPORTS'
    | 'CONTAINS'
    | 'CALLS'
    | 'EXTERNAL_CALL'
    | 'CROSS_REPO_CALLS'
    | 'USES';

export interface GraphNode {
    data: {
        id: string;
        label: string;
        type: NodeType;
        repo?: string;
        file_path?: string;
        full_path?: string;
        infra_type?: string;
        endpoint_exposed?: string;
        expose_intent?: string;
        [key: string]: unknown;
    };
}

export interface GraphEdge {
    data: {
        id: string;
        source: string;
        target: string;
        type: EdgeType;
        intent?: string;
        endpoint?: string;
        operation?: string;
        [key: string]: unknown;
    };
}

export interface GraphResponse {
    group_scan_id: string;
    total_nodes: number;
    total_edges: number;
    nodes: GraphNode[];
    edges: GraphEdge[];
}

/** A node with layout coordinates attached. */
export interface SimNode {
    id: string;
    label: string;
    type: NodeType;
    repo: string;
    degree: number;
    x: number;
    y: number;
    raw: GraphNode['data'];
}

export const NODE_STYLE: Record<NodeType, { fill: string; stroke: string; radius: number; label: string }> = {
    File:             { fill: '#6366f1', stroke: 'rgba(99,102,241,0.5)',  radius: 7,  label: 'Files' },
    Function:         { fill: '#a855f7', stroke: 'rgba(168,85,247,0.5)',  radius: 5.5, label: 'Functions' },
    Infrastructure:   { fill: '#2dd4bf', stroke: 'rgba(45,212,191,0.5)',  radius: 9,  label: 'Infrastructure' },
    ExternalEndpoint: { fill: '#fbbf24', stroke: 'rgba(251,191,36,0.5)',  radius: 7,  label: 'External' },
};

/**
 * Palette used when colouring nodes by repo instead of by type — the useful
 * view for a multi-repo scan, where you want to see which service a file or
 * function belongs to. Infrastructure and external endpoints are shared across
 * repos so they keep their type colour.
 */
export const REPO_COLORS = [
    '#6366f1', '#ec4899', '#22c55e', '#f97316',
    '#06b6d4', '#a855f7', '#eab308', '#14b8a6',
];

export const repoColor = (repo: string, repos: string[]): string => {
    const i = repos.indexOf(repo);
    return i < 0 ? '#64748b' : REPO_COLORS[i % REPO_COLORS.length];
};

export const EDGE_STYLE: Record<EdgeType, { stroke: string; width: number; opacity: number; dash?: string }> = {
    IMPORTS:          { stroke: '#4c51bf', width: 1,   opacity: 0.35 },
    CONTAINS:         { stroke: '#3f3f5a', width: 0.8, opacity: 0.3 },
    CALLS:            { stroke: '#a855f7', width: 1.2, opacity: 0.5 },
    EXTERNAL_CALL:    { stroke: '#fbbf24', width: 1.3, opacity: 0.6, dash: '4 3' },
    CROSS_REPO_CALLS: { stroke: '#ec4899', width: 1.8, opacity: 0.85 },
    USES:             { stroke: '#2dd4bf', width: 1.4, opacity: 0.6, dash: '2 3' },
};
