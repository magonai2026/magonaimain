import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Upload, FileText, X, CheckCircle2,
  FolderOpen, Loader2, Lock, Globe, Search,
  RefreshCw, Plus, ExternalLink, ArrowRight,
  Shield, Link2, AlertCircle,
} from 'lucide-react';

const GH_LOGO = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z'/%3E%3C/svg%3E`;
const GL_LOGO = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 0 0-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 0 0-.867 0L1.386 9.45.044 13.587a.924.924 0 0 0 .331 1.023L12 23.054l11.625-8.443a.924.924 0 0 0 .33-1.024' fill='%23FC6D26'/%3E%3C/svg%3E`;
const BrandImg = ({ src, alt, size, style }: { src: string; alt: string; size: number; style?: React.CSSProperties }) => (
  <img src={src} alt={alt} width={size} height={size} draggable={false} style={{ display: 'block', objectFit: 'contain', flexShrink: 0, ...style }} />
);
import ScanPage, { type ScanProgress, type ScanPhase } from './ScanPage';
import type { GitLabProject } from '../GitLabRepoList';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedFile {
  id: string;
  file: File;
}


export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  language: string | null;
  updated_at: string | null;
  default_branch: string;
}

// ─── Public Repo URL helpers ──────────────────────────────────────────────────

/**
 * Parses a GitHub URL and returns { owner, repo, branch? } or null if invalid.
 * Accepts formats:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   https://github.com/owner/repo/tree/branch-name
 */
const parseGithubUrl = (
  raw: string,
): { owner: string; repo: string; branch: string | null } | null => {
  try {
    const url = new URL(raw.trim());
    if (url.hostname !== 'github.com') return null;
    // pathname: /owner/repo  or  /owner/repo/tree/branch
    const parts = url.pathname.replace(/^\//, '').replace(/\.git$/, '').split('/');
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;
    const owner = parts[0];
    const repo = parts[1];
    // /owner/repo/tree/branch-name
    const branch = parts[2] === 'tree' && parts[3] ? parts[3] : null;
    return { owner, repo, branch };
  } catch {
    return null;
  }
};

// ─── Public Repo Card ─────────────────────────────────────────────────────────

interface PublicRepoSelection {
  url: string;           // canonical https://github.com/owner/repo
  owner: string;
  repo: string;
  branch: string | null; // null → use repo default
  displayName: string;   // "owner/repo"
}

const PublicRepoCard: React.FC<{
  selection: PublicRepoSelection | null;
  onSelect: (sel: PublicRepoSelection | null) => void;
  onLaunch: () => void;
  canLaunch: boolean;
}> = ({ selection, onSelect, onLaunch, canLaunch }) => {
  const [inputValue, setInputValue]   = useState('');
  const [validating, setValidating]   = useState(false);
  const [inputError, setInputError]   = useState<string | null>(null);
  const [inputValid, setInputValid]   = useState(false);

  // Live parse as user types — show green tick / red error instantly
  useEffect(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) { setInputError(null); setInputValid(false); return; }
    const parsed = parseGithubUrl(trimmed);
    if (!parsed) {
      setInputError('Enter a valid GitHub URL, e.g. https://github.com/owner/repo');
      setInputValid(false);
    } else {
      setInputError(null);
      setInputValid(true);
    }
  }, [inputValue]);

  const handleAdd = async () => {
    const trimmed = inputValue.trim();
    const parsed  = parseGithubUrl(trimmed);
    if (!parsed) return;

    setValidating(true);
    setInputError(null);

    try {
      // Quick HEAD check — confirms the repo is publicly reachable
      const checkUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;
      const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, {
        headers: { Accept: 'application/vnd.github+json' },
      });

      if (res.status === 404) {
        setInputError('Repository not found. Make sure it is public and the URL is correct.');
        setValidating(false);
        return;
      }
      if (!res.ok && res.status !== 403) {
        // 403 = rate-limited but repo likely exists; proceed optimistically
        setInputError('Could not verify the repository. Check the URL and try again.');
        setValidating(false);
        return;
      }

      const meta = res.ok ? await res.json() : null;

      onSelect({
        url:         checkUrl,
        owner:       parsed.owner,
        repo:        parsed.repo,
        branch:      parsed.branch ?? (meta?.default_branch ?? null),
        displayName: `${parsed.owner}/${parsed.repo}`,
      });

      setInputValue('');
      setInputValid(false);
    } catch {
      // Network issue — let the scan itself surface the real error
      const checkUrl = `https://github.com/${parsed.owner}/${parsed.repo}`;
      onSelect({
        url:         checkUrl,
        owner:       parsed.owner,
        repo:        parsed.repo,
        branch:      parsed.branch,
        displayName: `${parsed.owner}/${parsed.repo}`,
      });
      setInputValue('');
      setInputValid(false);
    } finally {
      setValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValid && !validating) handleAdd();
  };

  return (
    <div className="ns-card">
      <div className="ns-card-header">
        <div className="ns-card-icon" style={{ background: 'rgba(14,165,233,0.12)' }}>
          <Globe size={20} color="#38bdf8" />
        </div>
        <div>
          <h2 className="ns-card-title">Public Repository</h2>
          <p className="ns-card-sub">Scan any public GitHub repo — no account needed</p>
        </div>
      </div>

      {/* Selected state */}
      {selection ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="ns-selected-repo" style={{ borderColor: 'rgba(56,189,248,0.35)', background: 'rgba(14,165,233,0.07)' }}>
            <CheckCircle2 size={14} color="#38bdf8" />
            <span className="ns-selected-repo-name">{selection.displayName}</span>
            {selection.branch && (
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 99,
                background: 'rgba(56,189,248,0.12)', color: '#7dd3fc',
                border: '1px solid rgba(56,189,248,0.22)',
              }}>
                {selection.branch}
              </span>
            )}
            <button className="ns-icon-btn" onClick={() => onSelect(null)}><X size={13} /></button>
          </div>

          <a
            href={selection.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, color: '#38bdf8', textDecoration: 'none',
              opacity: 0.8,
            }}
          >
            <ExternalLink size={11} />
            {selection.url}
          </a>
        </div>
      ) : (
        /* Input state */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ position: 'relative', display: 'flex', gap: 7 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Link2
                size={13}
                color={inputError ? '#ef4444' : inputValid ? '#38bdf8' : '#9ca3af'}
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              />
              <input
                type="url"
                placeholder="https://github.com/owner/repository"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="ns-input"
                style={{
                  paddingLeft: 30,
                  borderColor: inputError
                    ? 'rgba(239,68,68,0.45)'
                    : inputValid
                    ? 'rgba(56,189,248,0.45)'
                    : undefined,
                  outline: inputValid ? '1px solid rgba(56,189,248,0.2)' : undefined,
                }}
              />
            </div>

            <button
              className={`ns-btn ns-btn--primary${inputValid && !validating ? '' : ' ns-btn--disabled'}`}
              onClick={handleAdd}
              disabled={!inputValid || validating}
              style={{
                background: inputValid ? 'rgba(14,165,233,0.18)' : undefined,
                borderColor: inputValid ? 'rgba(56,189,248,0.35)' : undefined,
                color: inputValid ? '#38bdf8' : undefined,
                whiteSpace: 'nowrap',
              }}
            >
              {validating
                ? <><Loader2 size={13} className="ns-spin" /> Checking…</>
                : <><CheckCircle2 size={13} /> Add</>}
            </button>
          </div>

          {/* Inline error */}
          {inputError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#f87171' }}>
              <AlertCircle size={12} />
              {inputError}
            </div>
          )}

          {/* Helper hint */}
          {!inputError && !inputValid && (
            <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.32)', margin: 0 }}>
              Paste a GitHub URL — branch optional:&nbsp;
              <code style={{ fontSize: 10, background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>
                /owner/repo/tree/branch
              </code>
            </p>
          )}
        </div>
      )}

      {/* Footer note */}
      <div className="ns-repo-footer" style={{ marginTop: 12 }}>
        <Globe size={11} color="#9ca3af" />
        <span>Public repos only · No GitHub account required</span>
      </div>

      {/* Launch button */}
      <button
        className={`ns-launch-btn ns-card-launch-btn${canLaunch ? ' ns-launch-btn--active' : ''}`}
        onClick={onLaunch}
        disabled={!canLaunch}
        style={{ marginTop: 16, width: '100%' }}
      >
        <Shield size={15} /> Launch Deep Scan <ArrowRight size={15} />
      </button>
    </div>
  );
};

// ─── File Upload Card ─────────────────────────────────────────────────────────

const FileUploadCard: React.FC<{
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onLaunch: () => void;
  canLaunch: boolean;
}> = ({ files, onFilesChange, onLaunch, canLaunch }) => {
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles: UploadedFile[] = Array.from(incoming).map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
    }));
    onFilesChange([...files, ...newFiles]);
  };

  const removeFile = (id: string) => onFilesChange(files.filter(f => f.id !== id));

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [files]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileColor = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const colors: Record<string, string> = {
      js: '#f7df1e', ts: '#3178c6', tsx: '#61dafb', jsx: '#61dafb',
      py: '#3776ab', css: '#264de4', html: '#e34c26', json: '#cbcb41',
      md: '#083fa1', txt: '#888', pdf: '#e74c3c',
    };
    return colors[ext || ''] || '#6b7280';
  };

  return (
    <div className="ns-card">
      <div className="ns-card-header">
        <div className="ns-card-icon ns-card-icon--purple">
          <Upload size={20} color="#818cf8" />
        </div>
        <div>
          <h2 className="ns-card-title">Upload Files</h2>
          <p className="ns-card-sub">Drag & drop or browse files to include in your session</p>
        </div>
      </div>

      <div
        className={`ns-dropzone${dragging ? ' ns-dropzone--active' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('ns-file-input')?.click()}
      >
        <input
          id="ns-file-input"
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
        <FolderOpen size={32} color={dragging ? '#818cf8' : '#9ca3af'} />
        <p className="ns-dropzone-text">
          {dragging ? 'Drop files here' : 'Click to browse or drag files here'}
        </p>
        <p className="ns-dropzone-hint">Supports all file types · No size limit</p>
      </div>

      {files.length > 0 ? (
        <div className="ns-file-list">
          <p className="ns-file-list-label">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
          <div className="ns-file-items">
            {files.map(f => (
              <div key={f.id} className="ns-file-item">
                <span className="ns-file-dot" style={{ background: getFileColor(f.file.name) }} />
                <div className="ns-file-info">
                  <span className="ns-file-name">{f.file.name}</span>
                  <span className="ns-file-size">{formatSize(f.file.size)}</span>
                </div>
                <button className="ns-file-remove" onClick={() => removeFile(f.id)}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="ns-empty-hint">
          <FileText size={14} color="#9ca3af" />
          <span>No files selected yet</span>
        </div>
      )}

      {/* Launch button */}
      <button
        className={`ns-launch-btn ns-card-launch-btn${canLaunch ? ' ns-launch-btn--active' : ''}`}
        onClick={onLaunch}
        disabled={!canLaunch}
        style={{ marginTop: 16, width: '100%' }}
      >
        <Shield size={15} /> Launch Deep Scan <ArrowRight size={15} />
      </button>
    </div>
  );
};

// ─── Connected Repo Card (GitHub + GitLab tabs) ───────────────────────────────

// Exported so the Multi-Repo page can reuse the exact same picker (tabs,
// "Repos to scan" stepper, search, create, selection chips) rather than
// re-implementing a second, divergent repo selector.
export const ConnectedRepoCard: React.FC<{
  selectedGithubRepos: Repository[];
  onSelectGithub: (repos: Repository[]) => void;
  selectedGitlabRepos: GitLabProject[];
  onSelectGitlab: (repos: GitLabProject[]) => void;
  onLaunch: () => void;
  canLaunch: boolean;
}> = ({ selectedGithubRepos, onSelectGithub, selectedGitlabRepos, onSelectGitlab, onLaunch, canLaunch }) => {
  const [tab, setTab]           = useState<'github' | 'gitlab'>('github');
  const [repoLimit, setRepoLimit] = useState(1);

  // ── GitHub state ──────────────────────────────────────────────────────────
  const [ghRepos, setGhRepos]                     = useState<Repository[]>([]);
  const [ghLoading, setGhLoading]                 = useState(true);
  const [ghError, setGhError]                     = useState<string | null>(null);
  const [ghNotConnected, setGhNotConnected]       = useState(false);
  const [ghSearch, setGhSearch]                   = useState('');
  const [ghCreating, setGhCreating]               = useState(false);
  const [ghNewName, setGhNewName]                 = useState('');
  const [ghPrivate, setGhPrivate]                 = useState(false);
  const [ghCreatingLoading, setGhCreatingLoading] = useState(false);

  const fetchGhRepos = async () => {
    setGhLoading(true);
    setGhError(null);
    try {
      const res = await fetch('/api/auth/github/repos', { credentials: 'include' });
      if (res.status === 401 || res.status === 404) { setGhNotConnected(true); setGhLoading(false); return; }
      if (!res.ok) throw new Error('Failed to fetch repositories');
      const data = await res.json();
      setGhRepos(data.repositories || []);
    } catch (err: any) {
      setGhError(err.message || 'Unexpected error');
    } finally {
      setGhLoading(false);
    }
  };

  React.useEffect(() => { fetchGhRepos(); }, []);

  const handleGhConnect = async () => {
    try {
      const res = await fetch('/api/auth/github', { credentials: 'include' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { /* noop */ }
  };

  const handleCreateRepo = async () => {
    if (!ghNewName.trim()) return;
    setGhCreatingLoading(true);
    setGhError(null);
    try {
      const res = await fetch('/api/auth/github/repos', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ghNewName, isPrivate: ghPrivate, description: 'Created via Niyantri' }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.details || 'Failed to create repository'); }
      const newRepo = await res.json();
      setGhRepos(prev => [newRepo, ...prev]);
      setGhCreating(false);
      setGhNewName('');
      onSelectGithub(newRepo);
    } catch (err: any) {
      setGhError(err.message);
    } finally {
      setGhCreatingLoading(false);
    }
  };

  const ghFiltered = ghRepos.filter(r => r.name.toLowerCase().includes(ghSearch.toLowerCase()));

  // ── GitLab state ──────────────────────────────────────────────────────────
  const [glRepos, setGlRepos]               = useState<GitLabProject[]>([]);
  const [glLoading, setGlLoading]           = useState(false);
  const [glError, setGlError]               = useState<string | null>(null);
  const [glNotConnected, setGlNotConnected] = useState(false);
  const [glSearch, setGlSearch]             = useState('');
  const glFetchedRef                        = useRef(false);

  const fetchGlRepos = async () => {
    setGlLoading(true);
    setGlError(null);
    try {
      const res = await fetch('/api/auth/gitlab/repos', { credentials: 'include' });
      if (res.status === 401 || res.status === 404) { setGlNotConnected(true); setGlLoading(false); return; }
      if (!res.ok) throw new Error('Failed to fetch GitLab projects');
      const data = await res.json();
      setGlRepos(data.repositories || []);
    } catch (err: any) {
      setGlError(err.message || 'Unexpected error');
    } finally {
      setGlLoading(false);
    }
  };

  // Lazy-fetch GitLab repos on first tab switch
  React.useEffect(() => {
    if (tab === 'gitlab' && !glFetchedRef.current) {
      glFetchedRef.current = true;
      fetchGlRepos();
    }
  }, [tab]);

  const handleGlConnect = async () => {
    try {
      const res = await fetch('/api/auth/gitlab', { credentials: 'include' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { /* noop */ }
  };

  const glFiltered = glRepos.filter(r => r.name.toLowerCase().includes(glSearch.toLowerCase()));

  // ─────────────────────────────────────────────────────────────────────────

  const activeHasSelection = tab === 'github'
    ? selectedGithubRepos.length === repoLimit
    : selectedGitlabRepos.length === repoLimit;

  const handleGhRepoClick = (repo: Repository) => {
    const isSelected = selectedGithubRepos.some(r => r.id === repo.id);
    if (isSelected) {
      onSelectGithub(selectedGithubRepos.filter(r => r.id !== repo.id));
    } else if (selectedGithubRepos.length < repoLimit) {
      onSelectGithub([...selectedGithubRepos, repo]);
    }
  };

  const handleGlRepoClick = (repo: GitLabProject) => {
    const isSelected = selectedGitlabRepos.some(r => r.id === repo.id);
    if (isSelected) {
      onSelectGitlab(selectedGitlabRepos.filter(r => r.id !== repo.id));
    } else if (selectedGitlabRepos.length < repoLimit) {
      onSelectGitlab([...selectedGitlabRepos, repo]);
    }
  };

  const handleLimitChange = (delta: number) => {
    const next = Math.min(5, Math.max(1, repoLimit + delta));
    setRepoLimit(next);
    // trim selections if limit shrinks
    if (next < selectedGithubRepos.length) onSelectGithub(selectedGithubRepos.slice(0, next));
    if (next < selectedGitlabRepos.length) onSelectGitlab(selectedGitlabRepos.slice(0, next));
  };

  return (
    <div className="ns-card">
      <div className="ns-card-header">
        <div
          className={tab === 'github' ? 'ns-card-icon ns-card-icon--green' : 'ns-card-icon'}
          style={tab === 'gitlab' ? { background: 'rgba(251,146,60,0.1)', boxShadow: 'inset 0 0 0 1px rgba(251,146,60,0.2)' } : undefined}
        >
          {tab === 'github' ? <BrandImg src={GH_LOGO} alt="GitHub" size={20} /> : <BrandImg src={GL_LOGO} alt="GitLab" size={20} />}
        </div>
        <div>
          <h2 className="ns-card-title">Connected Repository</h2>
          <p className="ns-card-sub">
            {tab === 'github' ? 'Select or create a GitHub repository' : 'Select a GitLab project to scan'}
          </p>
        </div>
      </div>

      {/* Tab toggle */}
      <div style={{
        display: 'flex', gap: 4, padding: '3px',
        background: 'var(--border)', borderRadius: 9, marginBottom: 10,
      }}>
        {(['github', 'gitlab'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 600,
              background: tab === t ? 'var(--surface)' : 'transparent',
              color: tab === t ? (t === 'github' ? '#4ade80' : '#fb923c') : 'var(--text-muted)',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.18s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            {t === 'github' ? <BrandImg src={GH_LOGO} alt="GitHub" size={13} /> : <BrandImg src={GL_LOGO} alt="GitLab" size={13} />}
            {t === 'github' ? 'GitHub' : 'GitLab'}
          </button>
        ))}
      </div>

      {/* Repo count stepper */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        padding: '7px 12px', background: 'rgba(99,102,241,0.06)',
        borderRadius: 8, border: '1px solid rgba(99,102,241,0.14)',
      }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>
          Repos to scan
          {repoLimit > 1 && (
            <span style={{ marginLeft: 6, color: '#6366f1', fontWeight: 600 }}>
              ({(tab === 'github' ? selectedGithubRepos.length : selectedGitlabRepos.length)}/{repoLimit} selected)
            </span>
          )}
        </span>
        <button
          onClick={() => handleLimitChange(-1)}
          disabled={repoLimit <= 1}
          style={{
            width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(99,102,241,0.25)',
            background: 'var(--surface)', color: 'var(--text)', cursor: repoLimit <= 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: repoLimit <= 1 ? 0.4 : 1, fontSize: '0.9rem', fontWeight: 700,
          }}
        >−</button>
        <span style={{ fontWeight: 700, fontSize: '0.92rem', minWidth: 18, textAlign: 'center', color: 'var(--text)' }}>
          {repoLimit}
        </span>
        <button
          onClick={() => handleLimitChange(1)}
          disabled={repoLimit >= 5}
          style={{
            width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(99,102,241,0.25)',
            background: 'var(--surface)', color: 'var(--text)', cursor: repoLimit >= 5 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: repoLimit >= 5 ? 0.4 : 1, fontSize: '0.9rem', fontWeight: 700,
          }}
        >+</button>
      </div>

      {/* ── GitHub content ── */}
      {tab === 'github' && (
        ghNotConnected ? (
          <div className="ns-not-connected">
            <BrandImg src={GH_LOGO} alt="GitHub" size={36} style={{ opacity: 0.35 }} />
            <p className="ns-not-connected-title">GitHub not connected</p>
            <p className="ns-not-connected-sub">Connect your GitHub account to browse and select repositories.</p>
            <button className="ns-connect-btn" onClick={handleGhConnect}>
              <BrandImg src={GH_LOGO} alt="" size={15} /> Connect GitHub
            </button>
          </div>
        ) : (
          <>
            {selectedGithubRepos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {selectedGithubRepos.map((repo, i) => (
                  <div key={repo.id} className="ns-selected-repo" style={{ gap: 5 }}>
                    <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 700, minWidth: 14 }}>{i + 1}</span>
                    <CheckCircle2 size={12} color="#4ade80" />
                    <span className="ns-selected-repo-name">{repo.name}</span>
                    <button className="ns-icon-btn" onClick={() => onSelectGithub(selectedGithubRepos.filter(r => r.id !== repo.id))}><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
            {!ghCreating ? (
              <div className="ns-repo-controls">
                <div className="ns-repo-search">
                  <Search size={13} color="#9ca3af" />
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={ghSearch}
                    onChange={e => setGhSearch(e.target.value)}
                    className="ns-repo-search-input"
                  />
                </div>
                <button className="ns-btn ns-btn--primary" onClick={() => setGhCreating(true)}>
                  <Plus size={13} /> New
                </button>
                <button className="ns-btn ns-btn--ghost" onClick={fetchGhRepos} title="Refresh">
                  <RefreshCw size={13} />
                </button>
              </div>
            ) : (
              <div className="ns-create-form">
                <div className="ns-create-form-header">
                  <span>Create New Repository</span>
                  <button className="ns-icon-btn" onClick={() => setGhCreating(false)}><X size={14} /></button>
                </div>
                <input
                  type="text"
                  placeholder="repository-name"
                  value={ghNewName}
                  onChange={e => setGhNewName(e.target.value.replace(/\s+/g, '-'))}
                  className="ns-input"
                />
                <label className="ns-create-private">
                  <input type="checkbox" checked={ghPrivate} onChange={e => setGhPrivate(e.target.checked)} />
                  Private repository
                </label>
                <button
                  className="ns-btn ns-btn--primary ns-btn--full"
                  onClick={handleCreateRepo}
                  disabled={ghCreatingLoading || !ghNewName}
                >
                  {ghCreatingLoading ? <><Loader2 size={13} className="ns-spin" /> Creating…</> : 'Create & Select'}
                </button>
              </div>
            )}
            {ghError && <div className="ns-error">{ghError}</div>}
            {ghLoading ? (
              <div className="ns-loading">
                <Loader2 size={20} color="#6366f1" className="ns-spin" />
                <span>Syncing repositories…</span>
              </div>
            ) : (
              <div className="ns-repo-list">
                {ghFiltered.length === 0
                  ? <p className="ns-repo-empty">No repositories found</p>
                  : ghFiltered.map(repo => {
                    const ghIdx = selectedGithubRepos.findIndex(r => r.id === repo.id);
                    const ghSelected = ghIdx >= 0;
                    const ghAtLimit = !ghSelected && selectedGithubRepos.length >= repoLimit;
                    return (
                      <div
                        key={repo.id}
                        className={`ns-repo-item${ghSelected ? ' ns-repo-item--selected' : ''}`}
                        onClick={() => handleGhRepoClick(repo)}
                        style={ghAtLimit ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                        title={ghAtLimit ? `Limit reached — increase repo count to add more` : undefined}
                      >
                        <div className="ns-repo-item-left">
                          {repo.private ? <Lock size={11} color="#eab308" /> : <Globe size={11} color="#9ca3af" />}
                          <div>
                            <p className="ns-repo-item-name">{repo.name}</p>
                            {repo.description && <p className="ns-repo-item-desc">{repo.description}</p>}
                          </div>
                        </div>
                        <div className="ns-repo-item-right">
                          {repo.language && <span className="ns-repo-lang">{repo.language}</span>}
                          {ghSelected
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span style={{ fontSize: '0.65rem', color: '#6366f1', fontWeight: 700 }}>#{ghIdx + 1}</span>
                                <CheckCircle2 size={14} color="#4ade80" />
                              </span>
                            : <a href={repo.html_url} target="_blank" rel="noreferrer" className="ns-icon-btn" onClick={e => e.stopPropagation()}><ExternalLink size={12} /></a>
                          }
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
            <div className="ns-repo-footer">
              <BrandImg src={GH_LOGO} alt="GitHub" size={11} style={{ opacity: 0.5 }} />
              <span>{ghFiltered.length} repositories accessible</span>
            </div>
          </>
        )
      )}

      {/* ── GitLab content ── */}
      {tab === 'gitlab' && (
        glNotConnected ? (
          <div className="ns-not-connected">
            <BrandImg src={GL_LOGO} alt="GitLab" size={36} style={{ opacity: 0.6 }} />
            <p className="ns-not-connected-title">GitLab not connected</p>
            <p className="ns-not-connected-sub">Connect your GitLab account to browse and select projects.</p>
            <button
              className="ns-connect-btn"
              onClick={handleGlConnect}
              style={{ background: 'rgba(251,146,60,0.15)', borderColor: 'rgba(251,146,60,0.35)', color: '#fb923c' }}
            >
              <BrandImg src={GL_LOGO} alt="" size={15} /> Connect GitLab
            </button>
          </div>
        ) : (
          <>
            {selectedGitlabRepos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                {selectedGitlabRepos.map((repo, i) => (
                  <div key={repo.id} className="ns-selected-repo" style={{ borderColor: 'rgba(251,146,60,0.35)', background: 'rgba(251,146,60,0.07)', gap: 5 }}>
                    <span style={{ fontSize: '0.7rem', color: '#fb923c', fontWeight: 700, minWidth: 14 }}>{i + 1}</span>
                    <CheckCircle2 size={12} color="#fb923c" />
                    <span className="ns-selected-repo-name">{repo.name}</span>
                    <button className="ns-icon-btn" onClick={() => onSelectGitlab(selectedGitlabRepos.filter(r => r.id !== repo.id))}><X size={11} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="ns-repo-controls">
              <div className="ns-repo-search">
                <Search size={13} color="#9ca3af" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={glSearch}
                  onChange={e => setGlSearch(e.target.value)}
                  className="ns-repo-search-input"
                />
              </div>
              <button className="ns-btn ns-btn--ghost" onClick={fetchGlRepos} title="Refresh">
                <RefreshCw size={13} />
              </button>
            </div>
            {glError && <div className="ns-error">{glError}</div>}
            {glLoading ? (
              <div className="ns-loading">
                <Loader2 size={20} color="#fb923c" className="ns-spin" />
                <span>Syncing GitLab projects…</span>
              </div>
            ) : (
              <div className="ns-repo-list">
                {glFiltered.length === 0
                  ? <p className="ns-repo-empty">No projects found</p>
                  : glFiltered.map(repo => {
                    const glIdx = selectedGitlabRepos.findIndex(r => r.id === repo.id);
                    const glSelected = glIdx >= 0;
                    const glAtLimit = !glSelected && selectedGitlabRepos.length >= repoLimit;
                    return (
                      <div
                        key={repo.id}
                        className={`ns-repo-item${glSelected ? ' ns-repo-item--selected' : ''}`}
                        onClick={() => handleGlRepoClick(repo)}
                        style={glAtLimit ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                        title={glAtLimit ? `Limit reached — increase repo count to add more` : undefined}
                      >
                        <div className="ns-repo-item-left">
                          {repo.private ? <Lock size={11} color="#eab308" /> : <Globe size={11} color="#9ca3af" />}
                          <div>
                            <p className="ns-repo-item-name">{repo.name}</p>
                            {repo.description && <p className="ns-repo-item-desc">{repo.description}</p>}
                          </div>
                        </div>
                        <div className="ns-repo-item-right">
                          {glSelected
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span style={{ fontSize: '0.65rem', color: '#fb923c', fontWeight: 700 }}>#{glIdx + 1}</span>
                                <CheckCircle2 size={14} color="#fb923c" />
                              </span>
                            : <a href={repo.html_url} target="_blank" rel="noreferrer" className="ns-icon-btn" onClick={e => e.stopPropagation()}><ExternalLink size={12} /></a>
                          }
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
            <div className="ns-repo-footer">
              <BrandImg src={GL_LOGO} alt="GitLab" size={11} style={{ opacity: 0.6 }} />
              <span>{glFiltered.length} projects accessible</span>
            </div>
          </>
        )
      )}

      {/* Launch button */}
      <button
        className={`ns-launch-btn ns-card-launch-btn${canLaunch && activeHasSelection ? ' ns-launch-btn--active' : ''}`}
        onClick={onLaunch}
        disabled={!canLaunch || !activeHasSelection}
        style={{ marginTop: 16, width: '100%' }}
      >
        <Shield size={15} /> Launch Deep Scan <ArrowRight size={15} />
      </button>
    </div>
  );
};

// ─── New Session Page ─────────────────────────────────────────────────────────

const NewSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { scanId: urlScanId } = useParams<{ scanId?: string }>();

  const [uploadedFiles, setUploadedFiles]             = useState<UploadedFile[]>([]);
  const [selectedRepos, setSelectedRepos]             = useState<Repository[]>([]);
  const [selectedGitLabRepos, setSelectedGitLabRepos] = useState<GitLabProject[]>([]);
  const [publicRepo, setPublicRepo]               = useState<PublicRepoSelection | null>(null);
  const [githubToken, setGithubToken]             = useState<string>('');
  const [scanProgress, setScanProgress]           = useState<ScanProgress>({
    phase: 'idle',
    message: '',
    categoriesComplete: [],
    result: null,
    error: null,
  });
  const [restoringFromUrl, setRestoringFromUrl]   = useState<boolean>(Boolean(urlScanId));
  const [groupScanId, setGroupScanId]             = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail]             = useState('');
  const [notifyOpen, setNotifyOpen]               = useState(false);
  const [notifyStatus, setNotifyStatus]           = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const abortRef        = useRef<AbortController | null>(null);
  const tempScanIdRef   = useRef<string | null>(null);
  const liveCompleteRef = useRef<boolean>(false);

  // ─── Mutual exclusion: selecting one source clears the others ────────────
  const handleSelectRepos = (repos: Repository[]) => {
    setSelectedRepos(repos);
    if (repos.length > 0) { setPublicRepo(null); setUploadedFiles([]); setSelectedGitLabRepos([]); }
  };

  const handleSelectGitLabRepos = (repos: GitLabProject[]) => {
    setSelectedGitLabRepos(repos);
    if (repos.length > 0) { setSelectedRepos([]); setPublicRepo(null); setUploadedFiles([]); }
  };

  const handleSelectPublicRepo = (sel: PublicRepoSelection | null) => {
    setPublicRepo(sel);
    if (sel) { setSelectedRepos([]); setUploadedFiles([]); setSelectedGitLabRepos([]); }
  };

  const handleFilesChange = (files: UploadedFile[]) => {
    setUploadedFiles(files);
    if (files.length > 0) { setSelectedRepos([]); setPublicRepo(null); setSelectedGitLabRepos([]); }
  };

  // ─── Restore scan from URL param ─────────────────────────────────────────
  useEffect(() => {
    if (!urlScanId) return;
    if (liveCompleteRef.current) {
      liveCompleteRef.current = false;
      setRestoringFromUrl(false);
      return;
    }

    const fetchHistoricScan = async () => {
      try {
        const res = await fetch(`/api/scan/history/${urlScanId}`, { credentials: 'include' });
        if (!res.ok) {
          setRestoringFromUrl(false);
          return;
        }
        const data = await res.json();
        setScanProgress({
          phase: 'complete',
          message: `Scan complete — ${data.vulnerabilities?.length ?? 0} vulnerabilities found`,
          categoriesComplete: (data.category_results ?? []).map((c: any) => c.category),
          result: data,
          error: null,
        });
      } catch {
        // Network error — fall back to idle new-session form
      } finally {
        setRestoringFromUrl(false);
      }
    };

    fetchHistoricScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlScanId]);

  const genUUID = () =>
    crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });

  const canLaunch =
    (selectedRepos.length > 0 || uploadedFiles.length > 0 || publicRepo !== null || selectedGitLabRepos.length > 0) &&
    scanProgress.phase === 'idle';

  // ─── Map scan.py message text → ScanPhase ────────────────────────────────
  const messageToPhase = (message: string): ScanPhase => {
    if (
      message.startsWith('Cloning') ||
      message.startsWith('Loaded')
    ) return 'cloning';

    if (message === 'Scanning your codebase...')
      return 'phase1';

    if (message === 'Digging deeper into your code...')
      return 'phase2';

    if (
      message === 'Analyzing patterns and vulnerabilities...' ||
      message === 'Almost done...'
    ) return 'phase3';

    if (
      message === 'Almost there, reviewing findings...' ||
      message === 'Scan complete!' ||
      message === 'Tracing attack paths...'
    ) return 'phase4';

    return 'phase4';
  };

  // ─── SSE event handler ────────────────────────────────────────────────────
  const handleSseEvent = (event: any) => {
    // Capture group_scan_id from the very first event that carries it
    if (event.group_scan_id) {
      setGroupScanId((prev) => prev ?? event.group_scan_id);
    }

    switch (event.event) {

      case 'status':
        setScanProgress((p: ScanProgress) => ({
          ...p,
          phase: messageToPhase(event.message),
          message: event.message,
        }));
        break;

      case 'progress':
        setScanProgress((p: ScanProgress) => ({
          ...p,
          phase: messageToPhase(event.message),
          message: event.message,
          ...(event.category
            ? { categoriesComplete: [...p.categoriesComplete, event.category] }
            : {}),
        }));
        break;

      case 'complete': {
        const scanId = event.result?.scan_id;
        if (scanId) {
          liveCompleteRef.current = true;
          navigate(`/scan/${scanId}`, { replace: true });
          tempScanIdRef.current = null;
        }
        setScanProgress((p: ScanProgress) => ({
          ...p,
          phase: 'complete',
          message: `Scan complete — ${event.result?.vulnerabilities?.length ?? 0} vulnerabilities found`,
          result: event.result ?? null,
        }));
        break;
      }

      case 'error':
        setScanProgress((p: ScanProgress) => ({
          ...p,
          phase: event.message === 'A scan segment failed. Continuing...'
            ? p.phase
            : 'error',
          error: event.message,
          message: event.message,
        }));
        break;
    }
  };

  // ─── SSE stream reader (shared by all scan paths) ────────────────────────
  const readSseStream = async (response: Response) => {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          handleSseEvent(event);
        } catch {
          // malformed SSE line — skip
        }
      }
    }
  };

  // ─── Upload scan ──────────────────────────────────────────────────────────
  const handleUploadScan = async () => {
    const formData = new FormData();
    for (const { file } of uploadedFiles) {
      formData.append('files', file, file.name);
    }
    formData.append('batch_size', '10');

    const response = await fetch('/api/scan/upload/deep/stream', {
      method: 'POST',
      credentials: 'include',
      body: formData,
      signal: abortRef.current!.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Upload scan request failed' }));
      setScanProgress((p: ScanProgress) => ({
        ...p,
        phase: 'error',
        error: extractErrorDetail(err, 'Failed to start upload scan'),
      }));
      return;
    }

    await readSseStream(response);
  };

  // ─── Connected GitHub repo scan ───────────────────────────────────────────
  const handleRepoScan = async () => {
    let token: string | undefined;
    try {
      const tokenRes = await fetch('/api/auth/github/token', { credentials: 'include' });
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        token = tokenData.access_token;
        setGithubToken(tokenData.access_token);
      }
    } catch {
      // non-fatal — scan will attempt without token (public repos may still work)
    }

    const response = await fetch('/api/scan/github/deep/stream', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo_url:     selectedRepos.map(r => `https://github.com/${r.full_name}`),
        branch:       selectedRepos[0]?.default_branch ?? 'main',
        batch_size:   10,
        ...(token ? { access_token: token } : {}),
      }),
      signal: abortRef.current!.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Scan request failed' }));
      setScanProgress((p: ScanProgress) => ({
        ...p,
        phase: 'error',
        error: extractErrorDetail(err, 'Failed to start scan'),
      }));
      return;
    }

    await readSseStream(response);
  };

  // ─── Public repo scan (no GitHub auth required) ───────────────────────────
  const handlePublicRepoScan = async () => {
    const response = await fetch('/api/scan/github/deep/stream', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo_url:   [publicRepo!.url],
        branch:     publicRepo!.branch ?? 'main',
        batch_size: 10,
      }),
      signal: abortRef.current!.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Scan request failed' }));
      setScanProgress((p: ScanProgress) => ({
        ...p,
        phase: 'error',
        error: extractErrorDetail(err, 'Failed to start public repo scan'),
      }));
      return;
    }

    await readSseStream(response);
  };

  // ─── Connected GitLab repo scan ──────────────────────────────────────────────
  const handleGitLabRepoScan = async () => {
    let token: string | undefined;
    try {
      const tokenRes = await fetch('/api/auth/gitlab/token', { credentials: 'include' });
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        token = tokenData.access_token;
      }
    } catch {
      // non-fatal — scan will attempt unauthenticated
    }

    const response = await fetch('/api/scan/github/deep/stream', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo_url:     selectedGitLabRepos.map(r => `https://gitlab.com/${r.full_name}`),
        branch:       selectedGitLabRepos[0]?.default_branch ?? 'main',
        batch_size:   10,
        ...(token ? { access_token: token } : {}),
      }),
      signal: abortRef.current!.signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Scan request failed' }));
      setScanProgress((p: ScanProgress) => ({
        ...p,
        phase: 'error',
        error: extractErrorDetail(err, 'Failed to start GitLab scan'),
      }));
      return;
    }

    await readSseStream(response);
  };

  // ─── Normalize API error detail (detail can be a string OR an object like {error,message,balance}) ──
  const extractErrorDetail = (err: any, fallback: string): string => {
    const detail = err?.detail;
    if (!detail) return fallback;
    if (typeof detail === 'string') return detail;
    if (typeof detail === 'object') {
      // Balance-insufficient shape: { error: 'insufficient_balance', message: '...', balance: N }
      if (detail.error === 'insufficient_balance' || detail.error === 'insufficient_credits') {
        const bal = detail.balance !== undefined ? ` (current balance: ${detail.balance})` : '';
        return `__LOW_BALANCE__${detail.message || 'Insufficient credits to run a scan.'}${bal}`;
      }
      return detail.message || JSON.stringify(detail);
    }
    return fallback;
  };

  // ─── Launch handler ───────────────────────────────────────────────────────
  const handleLaunch = async () => {
    if (!canLaunch) return;

    abortRef.current = new AbortController();

    const tempId = genUUID();
    tempScanIdRef.current = tempId;
    navigate(`/scan/${tempId}`, { replace: true });

    setGroupScanId(null);
    setNotifyStatus('idle');
    setNotifyOpen(false);
    setScanProgress({
      phase: 'launching',
      message: 'Initiating deep scan pipeline…',
      categoriesComplete: [],
      result: null,
      error: null,
    });

    try {
      if (uploadedFiles.length > 0) {
        await handleUploadScan();
      } else if (selectedRepos.length > 0) {
        await handleRepoScan();
      } else if (selectedGitLabRepos.length > 0) {
        await handleGitLabRepoScan();
      } else if (publicRepo !== null) {
        await handlePublicRepoScan();
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setScanProgress((p: ScanProgress) => ({ ...p, phase: 'error', error: err.message || 'Network error' }));
    }
  };

  const handleClosePanel = () => {
    abortRef.current?.abort();
    setScanProgress({ phase: 'idle', message: '', categoriesComplete: [], result: null, error: null });
    navigate('/new-session', { replace: true });
  };

  const isScanning = scanProgress.phase !== 'idle';

  if (restoringFromUrl) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 28, height: 28, border: '2px solid #e8e4de', borderTopColor: '#a855f7', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const handleNotify = async () => {
    if (!groupScanId || !notifyEmail.trim()) return;
    setNotifyStatus('sending');
    try {
      const res = await fetch(`/api/scan/group/${groupScanId}/notify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: notifyEmail.trim() }),
      });
      setNotifyStatus(res.ok ? 'sent' : 'error');
    } catch {
      setNotifyStatus('error');
    }
  };

  const isActivelyScanning = isScanning && !['complete', 'error'].includes(scanProgress.phase);

  if (isScanning) {
    return (
      <div style={{ position: 'relative', height: '100%' }}>
        <ScanPage progress={scanProgress} onClose={handleClosePanel} githubToken={githubToken} />

        {/* ── "Notify me when done" floating panel ── */}
        {groupScanId && isActivelyScanning && (
          <div style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 200,
            background: '#13151F', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
            minWidth: 240, maxWidth: 320, overflow: 'hidden',
          }}>
            {/* header row */}
            <button
              onClick={() => setNotifyOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', background: 'none', border: 'none',
                cursor: 'pointer', color: '#a5b4fc', fontSize: 13, fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 16 }}>🔔</span>
              <span>Notify me when done</span>
              <span style={{ marginLeft: 'auto', color: '#5C6480', fontSize: 11 }}>
                {notifyOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* expandable body */}
            {notifyOpen && (
              <div style={{ padding: '0 16px 14px' }}>
                {notifyStatus === 'sent' ? (
                  <p style={{ margin: 0, fontSize: 12, color: '#6ee7b7' }}>
                    ✓ You'll receive an email when the scan completes.
                  </p>
                ) : (
                  <>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={notifyEmail}
                      onChange={e => setNotifyEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleNotify()}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: 8, padding: '8px 10px', color: '#E8EEFF',
                        fontSize: 12, outline: 'none', marginBottom: 8,
                      }}
                    />
                    <button
                      onClick={handleNotify}
                      disabled={notifyStatus === 'sending' || !notifyEmail.trim()}
                      style={{
                        width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                        background: notifyStatus === 'sending' ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.7)',
                        color: '#fff', fontSize: 12, fontWeight: 700, cursor: notifyStatus === 'sending' ? 'default' : 'pointer',
                      }}
                    >
                      {notifyStatus === 'sending' ? 'Registering…' : notifyStatus === 'error' ? 'Failed — retry' : 'Notify me'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ns-root">
      <div className="ns-cards-grid">
        <FileUploadCard
          files={uploadedFiles}
          onFilesChange={handleFilesChange}
          onLaunch={handleLaunch}
          canLaunch={canLaunch && uploadedFiles.length > 0}
        />
        <ConnectedRepoCard
          selectedGithubRepos={selectedRepos}
          onSelectGithub={handleSelectRepos}
          selectedGitlabRepos={selectedGitLabRepos}
          onSelectGitlab={handleSelectGitLabRepos}
          onLaunch={handleLaunch}
          canLaunch={canLaunch}
        />
        <PublicRepoCard
          selection={publicRepo}
          onSelect={handleSelectPublicRepo}
          onLaunch={handleLaunch}
          canLaunch={canLaunch && publicRepo !== null}
        />
      </div>
    </div>
  );
};

export default NewSessionPage;