import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConnectedRepoCard, type Repository } from './NewSessionPage';
import type { GitLabProject } from '../GitLabRepoList';

/**
 * Multi-repo scan — POST /api/scan/github/deep/stream
 *
 * Repo selection reuses ConnectedRepoCard from NewSessionPage: same GitHub /
 * GitLab tabs, same "Repos to scan" stepper (1-5), same search / create /
 * refresh controls. Bumping the stepper to 2+ lets you pick that many repos.
 *
 * What this page adds on top of a normal scan is the per-repo deep-scan
 * toggle. All selected repos share one group_scan_id and run their pipelines
 * in parallel; a repo with deep scan OFF is still cloned, summarised and
 * graphed (so cross-repo calls into it resolve) but is not vulnerability
 * scanned and spends no Phase 3/4 credits.
 *
 * Wire format: DeepScanRequest extends GithubScanRequest where repo_url is a
 * required list, so we send repo_url AND repos — repos carries the per-repo
 * config, and the request would 422 without repo_url present.
 *
 * Stream events are tagged with scan_id + group_scan_id + repo_url, so each
 * repo's progress is routed to its own row.
 */

type RepoPhase = 'queued' | 'running' | 'complete' | 'error';

interface RepoProgress {
    phase: RepoPhase;
    message: string;
    scanId?: string;
    vulnerabilities?: number;
    contextOnly?: boolean;
}

/** A selected repo, normalised across the GitHub and GitLab shapes. */
interface SelectedRepo {
    key: string;
    url: string;
    name: string;
    branch: string;
}

const CSS = `
  @keyframes mr-spin   { to { transform: rotate(360deg); } }
  @keyframes mr-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

  .mr-root * { box-sizing: border-box; }

  .mr-repo-card {
    display: flex; align-items: center; gap: 12px;
    background: #13151F; border: 1px solid rgba(99,102,241,0.14);
    border-radius: 12px; padding: 13px 15px;
    animation: mr-fadein 0.25s ease both;
  }
  .mr-repo-card.running  { border-color: rgba(99,102,241,0.4); }
  .mr-repo-card.complete { border-color: rgba(16,185,129,0.3); }
  .mr-repo-card.error    { border-color: rgba(244,63,94,0.35); }

  .mr-repo-icon {
    width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(145deg, #4f46e5, #7c3aed);
    color: #fff; font-weight: 800; font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
  }

  .mr-input {
    background: #13151F; border: 1.5px solid rgba(99,102,241,0.18);
    border-radius: 8px; color: #E8EEFF; padding: 6px 10px;
    font-size: 11.5px; font-family: 'Instrument Sans', sans-serif; outline: none;
  }
  .mr-input:focus { border-color: rgba(99,102,241,0.45); }

  .mr-ghost {
    display: inline-flex; align-items: center; gap: 7px;
    background: #13151F; border: 1px solid rgba(99,102,241,0.2);
    border-radius: 9px; color: #9BA3BF; padding: 6px 12px; cursor: pointer;
    font-size: 11.5px; font-weight: 600; font-family: 'Instrument Sans', sans-serif;
    transition: all 0.15s;
  }
  .mr-ghost:hover { background: #1a1d2b; border-color: rgba(99,102,241,0.4); color: #E8EEFF; }

  .mr-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px;
    text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0;
  }

  /* Deep-scan toggle */
  .mr-toggle {
    position: relative; width: 34px; height: 19px; border-radius: 20px;
    border: none; cursor: pointer; flex-shrink: 0; padding: 0;
    background: rgba(99,102,241,0.18); transition: background 0.18s;
  }
  .mr-toggle.on { background: linear-gradient(135deg, #7c3aed, #6366f1); }
  .mr-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
  .mr-toggle-knob {
    position: absolute; top: 2.5px; left: 2.5px;
    width: 14px; height: 14px; border-radius: 50%;
    background: #fff; transition: transform 0.18s;
  }
  .mr-toggle.on .mr-toggle-knob { transform: translateX(15px); }

  .mr-spinner {
    width: 13px; height: 13px; flex-shrink: 0;
    border: 2px solid rgba(129,140,248,0.3); border-top-color: #818cf8;
    border-radius: 50%; animation: mr-spin 0.75s linear infinite;
  }

  .mr-inline-error {
    background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.22);
    border-radius: 10px; padding: 12px 16px; color: #f87171; font-size: 13px;
    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
    font-family: 'Instrument Sans', sans-serif;
  }

  .mr-banner {
    background: rgba(99,102,241,0.07); border: 1px solid rgba(99,102,241,0.22);
    border-radius: 12px; padding: 14px 16px; margin-bottom: 18px;
    animation: mr-fadein 0.3s ease both;
  }

  .mr-btn {
    display: inline-flex; align-items: center; gap: 7px;
    border-radius: 9px; padding: 9px 16px; cursor: pointer;
    font-size: 12.5px; font-weight: 700; font-family: 'Instrument Sans', sans-serif;
    background: linear-gradient(135deg, #7c3aed, #6366f1); color: #fff; border: none;
    box-shadow: 0 4px 18px rgba(124,58,237,0.3); transition: opacity 0.15s;
  }
  .mr-btn:hover:not(:disabled) { opacity: 0.92; }
  .mr-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
`;

const MultiRepoScanPage: React.FC = () => {
    const navigate = useNavigate();

    // Selection state owned here, driven by ConnectedRepoCard
    const [githubRepos, setGithubRepos] = useState<Repository[]>([]);
    const [gitlabRepos, setGitlabRepos] = useState<GitLabProject[]>([]);

    // Per-repo config keyed by repo url — deep scan on by default
    const [deepScan, setDeepScan] = useState<Record<string, boolean>>({});
    const [branches, setBranches] = useState<Record<string, string>>({});

    const [running, setRunning]   = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [groupId, setGroupId]   = useState<string | null>(null);
    const [progress, setProgress] = useState<Record<string, RepoProgress>>({});

    const abortRef = useRef<AbortController | null>(null);
    useEffect(() => () => abortRef.current?.abort(), []);

    // ── Normalise both providers into one list ────────────────────────────────
    const selected: SelectedRepo[] = useMemo(() => [
        ...githubRepos.map(r => ({
            key:    `gh-${r.id}`,
            url:    `https://github.com/${r.full_name}`,
            name:   r.full_name,
            branch: r.default_branch || 'main',
        })),
        ...gitlabRepos.map(r => ({
            key:    `gl-${r.id}`,
            url:    `https://gitlab.com/${r.full_name}`,
            name:   r.full_name,
            branch: r.default_branch || 'main',
        })),
    ], [githubRepos, gitlabRepos]);

    const isDeep     = (url: string) => deepScan[url] !== false;   // default ON
    const branchFor  = (r: SelectedRepo) => branches[r.url] ?? r.branch;

    const deepCount = selected.filter(r => isDeep(r.url)).length;

    // Backend guard: a single-repo request must be deep — there is nothing for
    // a lone context-only repo to provide context to.
    const singleRepoContextOnly = selected.length === 1 && deepCount === 0;
    const canLaunch = selected.length > 0 && deepCount > 0 && !singleRepoContextOnly && !running;

    // ── Launch ────────────────────────────────────────────────────────────────
    const startScan = useCallback(async () => {
        if (selected.length === 0) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setRunning(true);
        setError(null);
        setGroupId(null);
        setProgress(Object.fromEntries(
            selected.map(r => [r.url, { phase: 'queued' as RepoPhase, message: 'Queued…' }]),
        ));

        // Private repos need the stored token; public ones scan without it.
        let token: string | undefined;
        try {
            const tRes = await fetch('/api/auth/github/token', { credentials: 'include' });
            if (tRes.ok) {
                const tData = await tRes.json();
                token = tData?.access_token || tData?.token || undefined;
            }
        } catch {
            // Non-fatal
        }

        try {
            const res = await fetch('/api/scan/github/deep/stream', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repo_url: selected.map(r => r.url),
                    repos: selected.map(r => ({
                        url:       r.url,
                        branch:    branchFor(r),
                        deep_scan: isDeep(r.url),
                    })),
                    branch:     branchFor(selected[0]),
                    batch_size: 10,
                    ...(token ? { access_token: token } : {}),
                }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error((d as any).detail || `Scan failed to start (${res.status})`);
            }
            if (!res.body) throw new Error('Scan stream unavailable');

            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer    = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const frames = buffer.split('\n\n');
                buffer = frames.pop() ?? '';

                for (const frame of frames) {
                    const line = frame.split('\n').find(l => l.startsWith('data:'));
                    if (!line) continue;
                    let evt: any;
                    try { evt = JSON.parse(line.slice(5).trim()); } catch { continue; }

                    if (evt.group_scan_id) setGroupId(evt.group_scan_id);

                    const key = evt.repo_url;
                    if (!key) continue;

                    setProgress(prev => {
                        const cur = prev[key] ?? { phase: 'queued' as RepoPhase, message: '' };
                        if (evt.event === 'status' || evt.event === 'progress') {
                            return { ...prev, [key]: { ...cur, phase: 'running', message: evt.message || cur.message, scanId: evt.scan_id ?? cur.scanId } };
                        }
                        if (evt.event === 'complete') {
                            return {
                                ...prev,
                                [key]: {
                                    ...cur,
                                    phase:   'complete',
                                    message: evt.deep_scan === false ? 'Context only — summarised and graphed' : 'Scan complete',
                                    scanId:  evt.scan_id ?? cur.scanId,
                                    vulnerabilities: evt.result?.vulnerabilities?.length ?? cur.vulnerabilities,
                                    contextOnly: evt.deep_scan === false,
                                },
                            };
                        }
                        if (evt.event === 'error') {
                            return { ...prev, [key]: { ...cur, phase: 'error', message: evt.message || 'Scan failed' } };
                        }
                        return prev;
                    });
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') setError(err.message || 'Multi-repo scan failed');
        } finally {
            setRunning(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, deepScan, branches]);

    const cancel = () => { abortRef.current?.abort(); setRunning(false); };

    const allSettled = selected.length > 0 && selected.every(r => {
        const p = progress[r.url];
        return p && (p.phase === 'complete' || p.phase === 'error');
    });
    const completedCount = selected.filter(r => progress[r.url]?.phase === 'complete').length;

    return (
        <div className="mr-root" style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto', fontFamily: "'Instrument Sans', sans-serif" }}>
            <style>{CSS}</style>

            <div style={{ marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#E8EEFF', letterSpacing: '-0.03em' }}>Multi-Repo Scan</h2>
                <p style={{ margin: '4px 0 0', color: '#5C6480', fontSize: 13.5, lineHeight: 1.6 }}>
                    Set <strong style={{ color: '#818cf8' }}>Repos to scan</strong> to 2 or more, then pick the services.
                    They share one workspace, so calls between them are linked and a single knowledge graph is built across the set.
                </p>
            </div>

            {error && <div className="mr-inline-error"><span>⚠</span> {error}</div>}

            {/* ── Group result banner ── */}
            {groupId && (
                <div className="mr-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#E8EEFF' }}>
                                {allSettled ? 'Scan group finished' : 'Scan group running'}
                                {' · '}
                                <span style={{ color: '#818cf8' }}>{completedCount}/{selected.length} repos</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#5C6480', marginTop: 3, fontFamily: "'JetBrains Mono', monospace", wordBreak: 'break-all' }}>
                                {groupId}
                            </div>
                        </div>
                        <button
                            className="mr-btn"
                            onClick={() => navigate(`/graph/${groupId}`)}
                            disabled={!allSettled}
                            title={allSettled ? 'Open the knowledge graph for this group' : 'Available once every repo finishes'}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="7" r="2.5" /><circle cx="12" cy="17.5" r="2.5" />
                                <path d="M7.9 7.6 10.5 15.4" /><path d="M16.2 8.9 13.6 15.6" /><path d="M8.5 6.3h7" />
                            </svg>
                            View knowledge graph
                        </button>
                    </div>
                </div>
            )}

            {/* ── The same picker used on New Session ── */}
            <div style={{ maxWidth: 520, marginBottom: 22 }}>
                <ConnectedRepoCard
                    selectedGithubRepos={githubRepos}
                    onSelectGithub={setGithubRepos}
                    selectedGitlabRepos={gitlabRepos}
                    onSelectGitlab={setGitlabRepos}
                    onLaunch={startScan}
                    canLaunch={canLaunch}
                />
            </div>

            {/* ── Per-repo scan mode ── */}
            {selected.length > 0 && (
                <>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#5C6480', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            Scan mode per repo
                        </span>
                        <span style={{ fontSize: 11.5, color: '#5C6480' }}>
                            {deepCount} deep · {selected.length - deepCount} context-only
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                        {selected.map(repo => {
                            const p = progress[repo.url];
                            const phase = p?.phase ?? 'queued';
                            const deep = isDeep(repo.url);
                            return (
                                <div key={repo.key} className={`mr-repo-card ${phase}`}>
                                    <div className="mr-repo-icon">
                                        {repo.name.split('/').pop()?.charAt(0).toUpperCase() || '?'}
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EEFF', wordBreak: 'break-all' }}>
                                            {repo.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#5C6480', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {phase === 'running' && <span className="mr-spinner" />}
                                            {p?.message || `branch ${branchFor(repo)}`}
                                            {typeof p?.vulnerabilities === 'number' && (
                                                <span style={{ color: p.vulnerabilities > 0 ? '#f87171' : '#34d399', fontWeight: 700 }}>
                                                    · {p.vulnerabilities} vuln{p.vulnerabilities === 1 ? '' : 's'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {!running && phase === 'queued' && (
                                        <input
                                            className="mr-input"
                                            style={{ width: 110 }}
                                            value={branchFor(repo)}
                                            onChange={e => setBranches(prev => ({ ...prev, [repo.url]: e.target.value }))}
                                            aria-label={`Branch for ${repo.name}`}
                                        />
                                    )}

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                                        <span style={{
                                            fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                                            color: deep ? '#818cf8' : '#5C6480',
                                        }}>
                                            {deep ? 'Deep scan' : 'Context'}
                                        </span>
                                        <button
                                            className={`mr-toggle${deep ? ' on' : ''}`}
                                            onClick={() => setDeepScan(prev => ({ ...prev, [repo.url]: !deep }))}
                                            disabled={running}
                                            title={deep
                                                ? 'Full vulnerability scan for this repo'
                                                : 'Summarised and graphed only — no vulnerability scan, no Phase 3/4 credits'}
                                            aria-label={`Toggle deep scan for ${repo.name}`}
                                        >
                                            <span className="mr-toggle-knob" />
                                        </button>
                                    </div>

                                    {phase === 'complete' && p?.scanId && !p.contextOnly && (
                                        <button className="mr-ghost" onClick={() => navigate(`/scan/${p.scanId}`)}>Results</button>
                                    )}
                                    {phase === 'complete' && (
                                        <span className="mr-chip" style={{ color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.28)' }}>✓</span>
                                    )}
                                    {phase === 'error' && (
                                        <span className="mr-chip" style={{ color: '#f87171', background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.28)' }}>failed</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {singleRepoContextOnly && (
                        <div style={{ fontSize: 11.5, color: '#fbbf24', marginBottom: 12 }}>
                            A single repo must be deep-scanned — turn it on, or raise “Repos to scan” and pick another service.
                        </div>
                    )}
                    {!singleRepoContextOnly && deepCount === 0 && selected.length > 1 && (
                        <div style={{ fontSize: 11.5, color: '#fbbf24', marginBottom: 12 }}>
                            At least one repo must be deep-scanned.
                        </div>
                    )}

                    {/* Own launch control. The picker's own button only enables
                        when one tab's selection exactly matches the stepper, so
                        a mixed GitHub + GitLab set could not start from it. */}
                    {running ? (
                        <button className="mr-ghost" onClick={cancel}>Stop watching</button>
                    ) : (
                        <button className="mr-btn" onClick={startScan} disabled={!canLaunch}>
                            Start scan · {selected.length} repo{selected.length === 1 ? '' : 's'}
                        </button>
                    )}
                </>
            )}

            {selected.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#5C6480', fontSize: 13.5, lineHeight: 1.7 }}>
                    No repositories selected yet.<br />
                    Raise “Repos to scan” to 2 or more and select services that talk to each other to see cross-repo calls in the graph.
                </div>
            )}
        </div>
    );
};

export default MultiRepoScanPage;
