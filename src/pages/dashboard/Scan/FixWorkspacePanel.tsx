import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileCode2, Loader2, RefreshCw } from 'lucide-react';

/**
 * Live view of the agentic fix agent's working directory.
 *
 *   GET /api/scan/fix/workspace/:scanId/tree   → { files: string[] }
 *   GET /api/scan/fix/workspace/:scanId/file   → { content: string }
 *
 * The tree is polled while the fix is running (the agent adds files as it
 * fetches and edits them) and refreshed once more when it finishes. The open
 * file is re-fetched on each poll so edits appear without a manual click.
 */

interface Props {
    scanId: string;
    /** While true the tree is polled; set false once the fix stream ends. */
    active: boolean;
}

const POLL_MS = 2500;

const FixWorkspacePanel: React.FC<Props> = ({ scanId, active }) => {
    const [files, setFiles]       = useState<string[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [content, setContent]   = useState<string>('');
    const [loadingFile, setLoadingFile] = useState(false);
    const [error, setError]       = useState<string | null>(null);

    // Keep the latest selection available to the interval without re-arming it
    const selectedRef = useRef<string | null>(null);
    selectedRef.current = selected;

    const fetchTree = useCallback(async () => {
        try {
            const res = await fetch(`/api/scan/fix/workspace/${scanId}/tree`, { credentials: 'include' });
            if (!res.ok) return;                    // workspace may not exist yet
            const data = await res.json();
            const list: string[] = Array.isArray(data?.files) ? data.files : [];
            setFiles(list);
            setError(null);
            // Auto-open the first file the agent touches so the panel isn't empty
            if (!selectedRef.current && list.length > 0) setSelected(list[0]);
        } catch {
            // Non-fatal — the panel is informational, the fix continues regardless
        }
    }, [scanId]);

    const fetchFile = useCallback(async (path: string, quiet = false) => {
        if (!quiet) setLoadingFile(true);
        try {
            const res = await fetch(
                `/api/scan/fix/workspace/${scanId}/file?path=${encodeURIComponent(path)}`,
                { credentials: 'include' },
            );
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error((d as any).detail || `Could not read ${path}`);
            }
            const data = await res.json();
            setContent(typeof data?.content === 'string' ? data.content : '');
            setError(null);
        } catch (err: any) {
            if (!quiet) setError(err.message || 'Failed to read file');
        } finally {
            if (!quiet) setLoadingFile(false);
        }
    }, [scanId]);

    // Initial load + polling while the fix runs
    useEffect(() => {
        fetchTree();
        if (!active) return;

        const id = setInterval(() => {
            fetchTree();
            if (selectedRef.current) fetchFile(selectedRef.current, true);
        }, POLL_MS);

        return () => clearInterval(id);
    }, [active, fetchTree, fetchFile]);

    // Load whichever file is selected
    useEffect(() => {
        if (selected) fetchFile(selected);
    }, [selected, fetchFile]);

    const lineCount = content ? content.split('\n').length : 0;

    return (
        <div style={{
            border: '1.5px solid #e6e2db', borderRadius: 11, overflow: 'hidden',
            background: '#faf9f6', marginBottom: 16,
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 12px', borderBottom: '1px solid #e6e2db', background: '#fff',
            }}>
                <FileCode2 size={13} color="#6366f1" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1e293b' }}>
                    Agent workspace
                </span>
                <span style={{ fontSize: 10.5, color: '#94a3b8' }}>
                    {files.length} file{files.length === 1 ? '' : 's'}
                </span>
                {active && <Loader2 size={11} color="#94a3b8" style={{ animation: 'spin 1s linear infinite', marginLeft: 'auto' }} />}
                {!active && (
                    <button
                        onClick={() => { fetchTree(); if (selected) fetchFile(selected); }}
                        title="Refresh workspace"
                        style={{
                            marginLeft: 'auto', border: '1px solid #e2e8f0', background: '#f8fafc',
                            borderRadius: 6, cursor: 'pointer', padding: '3px 6px',
                            display: 'flex', alignItems: 'center', color: '#94a3b8',
                        }}
                    >
                        <RefreshCw size={10} />
                    </button>
                )}
            </div>

            {files.length === 0 ? (
                <div style={{ padding: '18px 12px', fontSize: 11.5, color: '#94a3b8', textAlign: 'center' }}>
                    {active ? 'Waiting for the agent to fetch files…' : 'No files in the workspace yet.'}
                </div>
            ) : (
                <div style={{ display: 'flex', minHeight: 150, maxHeight: 260 }}>
                    {/* File list */}
                    <div style={{
                        width: 148, flexShrink: 0, borderRight: '1px solid #e6e2db',
                        overflowY: 'auto', background: '#fff',
                    }}>
                        {files.map(f => {
                            const isActive = f === selected;
                            return (
                                <button
                                    key={f}
                                    onClick={() => setSelected(f)}
                                    title={f}
                                    style={{
                                        display: 'block', width: '100%', textAlign: 'left',
                                        padding: '7px 10px', border: 'none', cursor: 'pointer',
                                        background: isActive ? 'rgba(99,102,241,0.09)' : 'transparent',
                                        color: isActive ? '#4338ca' : '#475569',
                                        fontSize: 10.5, fontWeight: isActive ? 700 : 500,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
                                    }}
                                >
                                    {f.split('/').pop()}
                                </button>
                            );
                        })}
                    </div>

                    {/* File content */}
                    <div style={{ flex: 1, minWidth: 0, overflow: 'auto', background: '#0B0D14' }}>
                        {loadingFile ? (
                            <div style={{ padding: 16, fontSize: 11, color: '#5C6480' }}>Loading…</div>
                        ) : error ? (
                            <div style={{ padding: 16, fontSize: 11, color: '#f87171' }}>{error}</div>
                        ) : (
                            <pre style={{
                                margin: 0, padding: '10px 12px',
                                fontSize: 10, lineHeight: 1.55,
                                fontFamily: "'JetBrains Mono', monospace",
                                color: '#9BA3BF', whiteSpace: 'pre', tabSize: 2,
                            }}>
                                {content || '(empty file)'}
                            </pre>
                        )}
                    </div>
                </div>
            )}

            {selected && (
                <div style={{
                    padding: '6px 12px', borderTop: '1px solid #e6e2db', background: '#fff',
                    fontSize: 10, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace",
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {selected} · {lineCount} lines
                </div>
            )}
        </div>
    );
};

export default FixWorkspacePanel;
