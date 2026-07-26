import { useEffect, useState, useRef, useCallback } from 'react';
import { Github, Search, RefreshCw, ExternalLink, Lock, Globe, Plus, X, Loader2 } from 'lucide-react';

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  language: string | null;
  updated_at: string | null;
}

interface GitHubRepoListProps {
  onSelect?: (repo: Repository) => void;
}

const GitHubRepoList = ({ onSelect }: GitHubRepoListProps) => {
  const [repos, setRepos]       = useState<Repository[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Creation state
  const [isCreating, setIsCreating]           = useState(false);
  const [newRepoName, setNewRepoName]         = useState('');
  const [isPrivate, setIsPrivate]             = useState(false);
  const [creatingLoading, setCreatingLoading] = useState(false);

  const fetchAbortRef = useRef<AbortController | null>(null);

  // Cancel in-flight list fetches on unmount
  useEffect(() => {
    return () => { fetchAbortRef.current?.abort(); };
  }, []);

  const fetchRepos = useCallback(async () => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/github/repos', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 404) throw new Error('GitHub App not installed or connected.');
        throw new Error('Failed to fetch repositories.');
      }

      const data = await response.json();
      setRepos(data.repositories || []);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      console.error(err);
      setError((err as Error).message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepos();
  }, [fetchRepos]);

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewRepoName('');
    setError(null);
  };

  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) return;

    setCreatingLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/github/repos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        newRepoName,
          isPrivate:   isPrivate,
          description: 'Created via Spirit AI',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || 'Failed to create repository');
      }

      const newRepo: Repository = await response.json();

      setRepos((prev) => [newRepo, ...prev]);
      setIsCreating(false);
      setNewRepoName('');

      if (onSelect) {
        onSelect(newRepo);
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message || 'Failed to create repository');
    } finally {
      setCreatingLoading(false);
    }
  };

  const filteredRepos = repos.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatUpdatedAt = (updatedAt: string | null): string => {
    if (!updatedAt) return 'Just now';
    const date = new Date(updatedAt);
    return isNaN(date.getTime()) ? 'Just now' : date.toLocaleDateString();
  };

  return (
    <div className="w-full max-h-[60vh] flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 mb-4">

        {!isCreating ? (
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search your repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B0C14] border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-600"
                aria-label="Search repositories"
              />
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors"
              aria-label="Create new repository"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              New
            </button>
            <button
              onClick={fetchRepos}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-slate-400 hover:text-white transition-colors"
              aria-label="Refresh repository list"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="bg-[#13161f] border border-blue-500/30 rounded-xl p-4 animate-in slide-in-from-top-2" role="region" aria-label="Create new repository">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-white">Create New Repository</h3>
              <button
                onClick={handleCancelCreate}
                className="text-slate-400 hover:text-white"
                aria-label="Cancel creating repository"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Repository Name (e.g., my-awesome-app)"
                value={newRepoName}
                onChange={(e) => setNewRepoName(e.target.value.replace(/\s+/g, '-'))}
                className="w-full bg-[#0B0C14] border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                aria-label="New repository name"
                autoFocus
              />
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  id="private-repo"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-slate-700 bg-[#0B0C14]"
                />
                <label htmlFor="private-repo" className="cursor-pointer select-none">
                  Private Repository
                </label>
              </div>
              <button
                onClick={handleCreateRepo}
                disabled={creatingLoading || !newRepoName.trim()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium flex justify-center items-center gap-2"
                aria-busy={creatingLoading}
              >
                {creatingLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Creating…</>
                  : 'Create & Select'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20 text-center" role="alert">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400" role="status" aria-live="polite">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-blue-500" aria-hidden="true" />
          <p>Syncing repositories from GitHub...</p>
        </div>
      ) : (
        <div className="overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-800" role="list" aria-label="Repositories">
          {filteredRepos.length === 0 && !isCreating ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm
                ? `No repositories found matching "${searchTerm}"`
                : 'No repositories found. Create one or install the GitHub App.'}
            </div>
          ) : (
            filteredRepos.map((repo) => (
              <div
                key={repo.id}
                onClick={onSelect ? () => onSelect(repo) : undefined}
                role={onSelect ? 'button' : 'listitem'}
                tabIndex={onSelect ? 0 : undefined}
                aria-label={onSelect ? `Select ${repo.name} repository` : repo.name}
                onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(repo); } : undefined}
                className={`group p-4 bg-[#0B0C14] border border-slate-800 rounded-xl transition-all duration-200 ${
                  onSelect ? 'cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {repo.private ? (
                      <Lock className="w-3.5 h-3.5 text-yellow-500/70" aria-label="Private repository" />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-slate-500" aria-label="Public repository" />
                    )}
                    <h3 className="font-medium text-slate-200 group-hover:text-blue-400 transition-colors truncate max-w-[200px]">
                      {repo.name}
                    </h3>
                  </div>

                  {onSelect ? (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md">
                        Select
                      </span>
                    </div>
                  ) : (
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-600 hover:text-white transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Open ${repo.name} on GitHub`}
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    </a>
                  )}
                </div>

                <p className="text-xs text-slate-500 mb-3 line-clamp-2 min-h-[2.5em]">
                  {repo.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-600">
                  <div className="flex items-center gap-3">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500/50" aria-hidden="true" />
                        {repo.language}
                      </span>
                    )}
                    <span>Updated {formatUpdatedAt(repo.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
        <span>{filteredRepos.length} {filteredRepos.length === 1 ? 'Repository' : 'Repositories'} accessible</span>
        <div className="flex items-center gap-1">
          <Github className="w-3 h-3" aria-hidden="true" />
          <span>Connected via SpiritAI</span>
        </div>
      </div>
    </div>
  );
};

export default GitHubRepoList;