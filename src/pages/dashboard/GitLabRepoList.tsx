import { useEffect, useState, useRef, useCallback } from 'react';
import { Search, RefreshCw, ExternalLink, Lock, Globe, Loader2 } from 'lucide-react';

export interface GitLabProject {
  id: number;
  name: string;
  full_name: string;         // pathWithNamespace
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  updated_at: string | null;
}

interface GitLabRepoListProps {
  onSelect?: (project: GitLabProject) => void;
}

const GitLabRepoList = ({ onSelect }: GitLabRepoListProps) => {
  const [repos, setRepos]           = useState<GitLabProject[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAbortRef = useRef<AbortController | null>(null);

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
      const response = await fetch('/api/auth/gitlab/repos', {
        credentials: 'include',
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('GitLab not connected.');
        throw new Error('Failed to fetch GitLab projects.');
      }

      const data = await response.json();
      setRepos(data.repositories || []);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      setError((err as Error).message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRepos(); }, [fetchRepos]);

  const filteredRepos = repos.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formatDate = (d: string | null) => {
    if (!d) return 'Just now';
    const date = new Date(d);
    return isNaN(date.getTime()) ? 'Just now' : date.toLocaleDateString();
  };

  return (
    <div className="w-full max-h-[60vh] flex flex-col">
      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search your projects…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0B0C14] border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-orange-500/50 placeholder:text-slate-600"
          />
        </div>
        <button
          onClick={fetchRepos}
          disabled={loading}
          className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20 text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-orange-500" />
          <p>Syncing projects from GitLab…</p>
        </div>
      ) : (
        <div className="overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredRepos.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchTerm
                ? `No projects matching "${searchTerm}"`
                : 'No GitLab projects found.'}
            </div>
          ) : (
            filteredRepos.map((repo) => (
              <div
                key={repo.id}
                onClick={onSelect ? () => onSelect(repo) : undefined}
                role={onSelect ? 'button' : 'listitem'}
                tabIndex={onSelect ? 0 : undefined}
                onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(repo); } : undefined}
                className={`group p-4 bg-[#0B0C14] border border-slate-800 rounded-xl transition-all duration-200 ${
                  onSelect ? 'cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {repo.private
                      ? <Lock className="w-3.5 h-3.5 text-yellow-500/70" />
                      : <Globe className="w-3.5 h-3.5 text-slate-500" />}
                    <h3 className="font-medium text-slate-200 group-hover:text-orange-400 transition-colors truncate max-w-[200px]">
                      {repo.name}
                    </h3>
                  </div>
                  {onSelect ? (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded-md">Select</span>
                    </div>
                  ) : (
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-600 hover:text-white transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <p className="text-xs text-slate-500 mb-3 line-clamp-2 min-h-[2.5em]">
                  {repo.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500/50" />
                    {repo.full_name}
                  </span>
                  <span>Updated {formatDate(repo.updated_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
        <span>{filteredRepos.length} {filteredRepos.length === 1 ? 'Project' : 'Projects'} accessible</span>
        <span>Connected via GitLab OAuth</span>
      </div>
    </div>
  );
};

export default GitLabRepoList;
