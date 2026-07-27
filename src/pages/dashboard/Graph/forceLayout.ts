import type { GraphNode, GraphEdge, SimNode, NodeType } from './graphTypes';

/**
 * Minimal force-directed layout.
 *
 * Deliberately dependency-free: the dashboard bundle already carries three.js
 * and framer-motion, and a graph of a few hundred nodes does not justify
 * pulling in cytoscape/d3-force. Runs a fixed number of iterations
 * synchronously and returns final positions — there is no animation loop, so
 * this costs one burst of work on load rather than per-frame CPU.
 *
 * Model:
 *   - repulsion  — every node pushes every other node apart (Coulomb-like)
 *   - springs    — edges pull their endpoints together
 *   - gravity    — weak pull to centre so disconnected parts don't drift off
 *   - repo bias  — nodes of the same repo get their own angular sector, which
 *                  keeps multi-repo graphs visually separated
 */

const ITERATIONS   = 320;
const REPULSION    = 5200;
const SPRING       = 0.011;
const SPRING_LEN   = 62;
const GRAVITY      = 0.014;
const DAMPING      = 0.86;
const MAX_STEP     = 26;
const MIN_DIST_SQ  = 90;

export function runLayout(
    rawNodes: GraphNode[],
    rawEdges: GraphEdge[],
    width: number,
    height: number,
): SimNode[] {
    const cx = width / 2;
    const cy = height / 2;

    if (rawNodes.length === 0) return [];

    // Degree drives both initial placement and how strongly a node resists
    // being pushed around — hubs should sit near the middle.
    const degree = new Map<string, number>();
    for (const e of rawEdges) {
        degree.set(e.data.source, (degree.get(e.data.source) ?? 0) + 1);
        degree.set(e.data.target, (degree.get(e.data.target) ?? 0) + 1);
    }

    // Give each repo its own angular sector for the initial ring.
    const repos = Array.from(new Set(rawNodes.map(n => n.data.repo || ''))).sort();
    const repoIndex = new Map(repos.map((r, i) => [r, i]));

    const nodes: SimNode[] = rawNodes.map((n, i) => {
        const repo = n.data.repo || '';
        const sector = repoIndex.get(repo) ?? 0;
        const sectorSpan = (Math.PI * 2) / Math.max(repos.length, 1);
        // Spread nodes within their sector, radius varies so we start as a disc
        const angle = sectorSpan * sector + (sectorSpan * ((i * 2654435761) % 1000)) / 1000;
        const radius = 90 + ((i * 7919) % 190);
        return {
            id: n.data.id,
            label: n.data.label ?? n.data.id,
            type: (n.data.type ?? 'File') as NodeType,
            repo,
            degree: degree.get(n.data.id) ?? 0,
            x: cx + Math.cos(angle) * radius,
            y: cy + Math.sin(angle) * radius,
            raw: n.data,
        };
    });

    const index = new Map(nodes.map((n, i) => [n.id, i]));

    // Pre-resolve edges to index pairs; skip edges pointing at missing nodes.
    const links: Array<[number, number]> = [];
    for (const e of rawEdges) {
        const a = index.get(e.data.source);
        const b = index.get(e.data.target);
        if (a !== undefined && b !== undefined && a !== b) links.push([a, b]);
    }

    const vx = new Float64Array(nodes.length);
    const vy = new Float64Array(nodes.length);

    // Hubs move less, leaves move freely.
    const mass = nodes.map(n => 1 + Math.min(n.degree, 24) * 0.35);

    for (let iter = 0; iter < ITERATIONS; iter++) {
        // Cooling: large early moves, fine adjustment later
        const cool = 1 - iter / ITERATIONS;

        // ── Repulsion (O(n²) — fine up to a few hundred nodes) ────────────────
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                let dx = nodes[i].x - nodes[j].x;
                let dy = nodes[i].y - nodes[j].y;
                let distSq = dx * dx + dy * dy;

                if (distSq < MIN_DIST_SQ) {
                    // Perfectly coincident nodes would produce NaN — nudge apart
                    // deterministically using the index so layouts stay stable.
                    dx = ((i % 7) - 3) || 1;
                    dy = ((j % 7) - 3) || 1;
                    distSq = dx * dx + dy * dy;
                }

                const force = REPULSION / distSq;
                const dist = Math.sqrt(distSq);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                vx[i] += fx / mass[i];
                vy[i] += fy / mass[i];
                vx[j] -= fx / mass[j];
                vy[j] -= fy / mass[j];
            }
        }

        // ── Springs ───────────────────────────────────────────────────────────
        for (const [a, b] of links) {
            const dx = nodes[b].x - nodes[a].x;
            const dy = nodes[b].y - nodes[a].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - SPRING_LEN) * SPRING;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            vx[a] += fx / mass[a];
            vy[a] += fy / mass[a];
            vx[b] -= fx / mass[b];
            vy[b] -= fy / mass[b];
        }

        // ── Gravity + integrate ───────────────────────────────────────────────
        for (let i = 0; i < nodes.length; i++) {
            vx[i] += (cx - nodes[i].x) * GRAVITY;
            vy[i] += (cy - nodes[i].y) * GRAVITY;

            vx[i] *= DAMPING;
            vy[i] *= DAMPING;

            const step = Math.hypot(vx[i], vy[i]);
            const cap = MAX_STEP * cool;
            const scale = step > cap && step > 0 ? cap / step : 1;

            nodes[i].x += vx[i] * scale;
            nodes[i].y += vy[i] * scale;
        }
    }

    return fitToViewport(nodes, width, height);
}

/** Scale + translate final positions so the whole graph sits inside the canvas. */
function fitToViewport(nodes: SimNode[], width: number, height: number): SimNode[] {
    const pad = 46;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
    }

    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;
    // Never magnify a tiny graph past 1:1 — a 2-node graph shouldn't fill 1100px.
    const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY, 1);

    const offsetX = (width - spanX * scale) / 2 - minX * scale;
    const offsetY = (height - spanY * scale) / 2 - minY * scale;

    for (const n of nodes) {
        n.x = n.x * scale + offsetX;
        n.y = n.y * scale + offsetY;
    }
    return nodes;
}
