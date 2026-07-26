import { useEffect, useState, useRef, useCallback } from 'react';
import { Github, ChevronDown, CheckCircle2, Loader2, AlertCircle, GitBranch, Upload } from 'lucide-react';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
}

interface FileToPush {
  path: string;
  content: string;
}

interface GitHubPushPanelProps {
  sessionId: string;
  files: FileToPush[];
  folder?: string;
  commitMessage?: string;
  onPushSuccess?: (repoUrl: string) => void;
  onPushError?: (error: string) => void;
}

type PushState = 'idle' | 'loading_repos' | 'ready' | 'pushing' | 'success' | 'error' | 'not_connected';

const GitHubPushPanel = ({
  sessionId,
  files,
  folder,
  commitMessage,
  onPushSuccess,
  onPushError,
}: GitHubPushPanelProps) => {
  const [repos, setRepos]               = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pushState, setPushState]       = useState<PushState>('loading_repos');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pushedUrl, setPushedUrl]       = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');

  const abortRef      = useRef<AbortController | null>(null);
  const dropdownRef   = useRef<HTMLDivElement>(null);

  // Cancel in-flight requests on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => { document.removeEventListener('mousedown', handler); };
  }, [dropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); };
  }, [dropdownOpen]);

  const fetchRepos = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/auth/github/repos', {
        credentials: 'include',
        signal: controller.signal,
      });

      if (res.status === 404 || res.status === 401) {
        setPushState('not_connected');
        return;
      }

      if (!res.ok) throw new Error('Failed to load repositories');

      const data = await res.json();
      const list: Repository[] = data.repositories || [];
      setRepos(list);
      setPushState(list.length === 0 ? 'not_connected' : 'ready');
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      setPushState('not_connected');
    }
  }, []);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const handlePush = async () => {
    if (!selectedRepo || !files?.length) return;

    setPushState('pushing');
    setErrorMessage(null);

    const targetFolder = folder || `spiritai-session-${sessionId.slice(0, 8)}`;
    const [owner]      = selectedRepo.full_name.split('/');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/auth/integrations/github/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          repo: {
            owner,
            name: selectedRepo.name,
          },
          folder: targetFolder,
          files,
          commitMessage: commitMessage || `SpiritAI: session ${sessionId.slice(0, 8)}`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Push failed');
      }

      const result = await res.json();
      const url    = result.repo_url || selectedRepo.html_url;
      setPushedUrl(url);
      setPushState('success');
      onPushSuccess?.(url);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      const msg = (err as Error).message || 'Failed to push to GitHub';
      setErrorMessage(msg);
      setPushState('error');
      onPushError?.(msg);
    }
  };

  const filteredRepos = repos.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── NOT CONNECTED ──────────────────────────────────────────────────────────
  if (pushState === 'not_connected') {
    return (
      <div className="flex flex-col items-center gap-4 py-6 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
          <Github className="w-6 h-6 text-slate-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-slate-300 font-medium text-sm mb-1">GitHub not connected</p>
          <p className="text-slate-500 text-xs">Connect your GitHub account to push generated code.</p>
        </div>
        <ConnectGitHubButton />
      </div>
    );
  }

  // ── LOADING REPOS ──────────────────────────────────────────────────────────
  if (pushState === 'loading_repos') {
    return (
      <div className="flex items-center justify-center gap-3 py-8 text-slate-400 text-sm" role="status" aria-live="polite">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        Loading your repositories...
      </div>
    );
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (pushState === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-6 px-4 text-center" role="status" aria-live="polite">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-green-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-white font-medium text-sm mb-1">Code pushed successfully!</p>
          <p className="text-slate-400 text-xs">
            Files are now in{' '}
            <span className="text-blue-400 font-medium">{selectedRepo?.full_name}</span>
          </p>
        </div>
        {pushedUrl && (
          <a
            href={pushedUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            aria-label={`View ${selectedRepo?.name} on GitHub`}
          >
            <Github className="w-4 h-4" aria-hidden="true" />
            View on GitHub
          </a>
        )}
      </div>
    );
  }

  // ── MAIN UI (ready / pushing / error) ─────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 p-1">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
          <Upload className="w-4 h-4 text-blue-400" aria-hidden="true" />
        </div>
        <div>
          <p className="text-white text-sm font-medium">Push to GitHub</p>
          <p className="text-slate-500 text-xs">Select a repository to push your generated code into</p>
        </div>
      </div>

      {/* Repo selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(v => !v)}
          disabled={pushState === 'pushing'}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
          aria-label={selectedRepo ? `Selected repository: ${selectedRepo.full_name}` : 'Select a repository'}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all
            ${selectedRepo
              ? 'bg-[#0B0C14] border-blue-500/40 text-white'
              : 'bg-[#0B0C14] border-slate-700 text-slate-400'
            }
            ${pushState === 'pushing' ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-600 cursor-pointer'}
          `}
        >
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {selectedRepo ? selectedRepo.full_name : 'Select a repository...'}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div
            className="absolute z-50 top-full mt-1 w-full bg-[#13161f] border border-slate-700 rounded-xl shadow-xl overflow-hidden"
            role="listbox"
            aria-label="Repository list"
          >
            <div className="p-2 border-b border-slate-800">
              <input
                type="text"
                placeholder="Filter repositories..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full bg-[#0B0C14] text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600"
                aria-label="Filter repositories"
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredRepos.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">No repositories found</p>
              ) : (
                filteredRepos.map(repo => (
                  <button
                    key={repo.id}
                    role="option"
                    aria-selected={selectedRepo?.id === repo.id}
                    onClick={() => {
                      setSelectedRepo(repo);
                      setDropdownOpen(false);
                      setSearchTerm('');
                      if (pushState === 'error') setPushState('ready');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-800/60 transition-colors"
                  >
                    <GitBranch className="w-3 h-3 text-slate-600 shrink-0" aria-hidden="true" />
                    <span className="text-slate-200 text-xs truncate">{repo.full_name}</span>
                    {repo.private && (
                      <span className="ml-auto text-[10px] text-yellow-500/70 bg-yellow-500/10 px-1.5 py-0.5 rounded shrink-0">
                        Private
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {pushState === 'error' && errorMessage && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5" role="alert">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-red-400 text-xs">{errorMessage}</p>
        </div>
      )}

      {/* Push button */}
      <button
        onClick={handlePush}
        disabled={!selectedRepo || pushState === 'pushing' || !files?.length}
        aria-busy={pushState === 'pushing'}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all
          ${selectedRepo && pushState !== 'pushing' && files?.length
            ? 'bg-blue-600 hover:bg-blue-500 text-white'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }
        `}
      >
        {pushState === 'pushing' ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Pushing to GitHub...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" aria-hidden="true" />
            Push Generated Code
          </>
        )}
      </button>

      <p className="text-center text-[10px] text-slate-600">
        Files will be pushed into a{' '}
        <span className="text-slate-500">
          {folder || `spiritai-session-${sessionId.slice(0, 8)}`}
        </span>{' '}
        folder
      </p>
    </div>
  );
};

// ── ConnectGitHubButton ────────────────────────────────────────────────────────
const ConnectGitHubButton = () => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/github', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to get GitHub connect URL');
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-60 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
      aria-busy={loading}
    >
      {loading
        ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Connecting…</>
        : <><Github className="w-4 h-4" aria-hidden="true" /> Connect GitHub</>
      }
    </button>
  );
};

export default GitHubPushPanel;