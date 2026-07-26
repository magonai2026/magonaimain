import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, GitPullRequest, X, Loader2, Download,
} from 'lucide-react';
import type { Vulnerability } from './scanTypes';
import { safeStr, SEVERITY_CONFIG } from './scanVisualUtils';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FixModalProps {
  vuln: Vulnerability;
  scanId: string;
  repoUrl: string;
  githubToken: string;
  onClose: () => void;
}

type FixState = 'idle' | 'loading' | 'success' | 'error';

// Retry config used by the token-fetch logic inside the component
const MAX_RETRIES  = 3;
const BASE_DELAY   = 1000; // ms

// ─── Component ────────────────────────────────────────────────────────────────

const FixModal: React.FC<FixModalProps> = ({ vuln, scanId, repoUrl, githubToken, onClose }) => {
  // Detect whether this is an uploaded-file scan or a GitHub scan
  const isUploadScan = repoUrl.startsWith('upload://');

  const [branch,       setBranch]       = useState('main');
  const [state,        setState]        = useState<FixState>('idle');
  const [prUrl,        setPrUrl]        = useState<string | null>(null);
  const [errMsg,       setErrMsg]       = useState<string | null>(null);

  // Auto-fetch token from /api/auth/github/token; fallback to manual entry
  const [fetchedToken, setFetchedToken] = useState<string>(githubToken || '');
  const [manualToken,  setManualToken]  = useState('');
  const [tokenLoading, setTokenLoading] = useState(!githubToken && !isUploadScan);
  // Track retry attempt number so we can show it in the loading indicator
  const [retryCount,   setRetryCount]   = useState(0);

  const effectiveToken = fetchedToken || manualToken;

  useEffect(() => {
    // Skip token fetch for upload scans — they use POST /scan/fix/download instead
    if (isUploadScan) return;

    // Token already provided via props — use it directly
    if (githubToken) {
      setFetchedToken(githubToken);
      setTokenLoading(false);
      return;
    }

    let cancelled = false; // guard against state updates after unmount

    const run = async () => {
      setTokenLoading(true);
      setRetryCount(0);

      // Manually retry so we can update retryCount in state for the UI
      let lastError: Error = new Error('Failed to fetch GitHub token');

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (cancelled) return;

        if (attempt > 0) {
          setRetryCount(attempt);
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve =>
            setTimeout(resolve, BASE_DELAY * Math.pow(2, attempt - 1))
          );
        }

        if (cancelled) return;

        try {
          const res = await fetch('/api/auth/github/token', { credentials: 'include' });

          if (res.ok) {
            const data = await res.json();
            const token = data?.token || data?.access_token || data?.github_token || '';
            if (!cancelled) {
              setFetchedToken(token);
              setTokenLoading(false);
            }
            return; // success — exit loop
          }

          // 401 / 404 — not connected, no point retrying
          if (res.status === 401 || res.status === 404) {
            if (!cancelled) {
              setFetchedToken('');
              setTokenLoading(false);
            }
            return;
          }

          lastError = new Error(`HTTP ${res.status}`);
        } catch (err: any) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }

      // All retries exhausted
      if (!cancelled) {
        console.warn('GitHub token fetch failed after retries:', lastError.message);
        setFetchedToken('');
        setTokenLoading(false);
      }
    };

    run();

    return () => { cancelled = true; };
  }, [githubToken, isUploadScan]);

  // ── POST /scan/fix — GitHub PR fix ─────────────────────────────────────────
  const handleCreate = async () => {
    if (!effectiveToken.trim()) return;
    setState('loading');
    setErrMsg(null);
    try {
      const res = await fetch('/api/scan/fix', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_id:      scanId,
          vuln_id:      vuln.id,
          repo_url:     repoUrl,
          github_token: effectiveToken.trim(),
          branch:       branch.trim() || 'main',
        }),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Session expired. Please log in again.');
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail;
        const msg = typeof detail === 'string' ? detail : detail?.message || data?.message || `Request failed (${res.status})`;
        throw new Error(msg);
      }
      const data = await res.json();
      setPrUrl(data.pr_url ?? null);
      setState('success');
    } catch (e: any) {
      setErrMsg(e.message ?? 'Something went wrong.');
      setState('error');
    }
  };

  // ── POST /scan/fix/download — Upload scan surgical fix ─────────────────────
  const handleDownloadFix = async () => {
    setState('loading');
    setErrMsg(null);
    try {
      const res = await fetch('/api/scan/fix/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scan_id: scanId,
          vuln_id: vuln.id,
        }),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Session expired. Please log in again.');
        const data = await res.json().catch(() => ({}));
        const detail = data?.detail;
        const msg = typeof detail === 'string' ? detail : detail?.message || data?.message || `Download failed (${res.status})`;
        throw new Error(msg);
      }
      // Extract filename from Content-Disposition header if present
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const nameMatch   = disposition.match(/filename=([^\s;]+)/);
      const filename    = nameMatch ? nameMatch[1] : `fixed_${vuln.file_path.split('/').pop() ?? 'file'}`;

      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setState('success');
    } catch (e: any) {
      setErrMsg(e.message ?? 'Something went wrong.');
      setState('error');
    }
  };

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      {/* Modal box — stop propagation so clicking inside doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: '#fff', borderRadius: 18,
          boxShadow: '0 24px 64px rgba(0,0,0,0.2), 0 0 0 1.5px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          fontFamily: "'Instrument Sans', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid #e6e2db',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isUploadScan ? <Download size={15} color="#fff" /> : <GitPullRequest size={15} color="#fff" />}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                {isUploadScan ? 'Download Fixed File' : 'Create Fix PR'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                {isUploadScan
                  ? 'Surgically patches only the vulnerable lines'
                  : 'Opens a draft PR with fix guidance'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#f8fafc', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8',
            }}
          >
            <X size={13} />
          </button>
        </div>

        <div style={{ padding: '20px 20px' }}>

          {/* Vuln summary chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 10, marginBottom: 18,
            background: '#faf9f6', border: '1.5px solid #e6e2db',
          }}>
            <span style={{
              fontSize: 9.5, fontWeight: 800, color: '#fff',
              background: SEVERITY_CONFIG[vuln.severity]?.color ?? '#475569',
              padding: '2px 8px', borderRadius: 6,
              textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0,
            }}>
              {vuln.severity}
            </span>
            <span style={{
              fontSize: 12.5, fontWeight: 600, color: '#1e293b',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {safeStr(vuln.title)}
            </span>
          </div>

          {/* ── Upload scan: Download fix flow ─────────────────────────────── */}
          {isUploadScan && state !== 'success' && (
            <>
              <div style={{
                fontSize: 11.5, color: '#64748b', lineHeight: 1.6,
                background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 9, padding: '9px 12px', marginBottom: 18,
              }}>
                Applies a surgical LLM fix directly to{' '}
                <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
                  {safeStr(vuln.file_path)}
                </code>{' '}
                and returns the patched file as a download. Your original files are not modified.
              </div>

              {state === 'error' && errMsg && (
                <div style={{
                  fontSize: 12, color: '#dc2626', background: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8,
                  padding: '8px 12px', marginBottom: 14,
                }}>
                  {errMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                    border: '1px solid #e2e8f0', background: '#fff', color: '#64748b',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadFix}
                  disabled={state === 'loading'}
                  style={{
                    padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                    border: 'none',
                    background: state === 'loading' ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #7c3aed)',
                    color: state === 'loading' ? '#94a3b8' : '#fff',
                    cursor: state === 'loading' ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    transition: 'all .15s',
                  }}
                >
                  {state === 'loading'
                    ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Applying fix…</>
                    : <><Download size={13} /> Download Fixed File</>
                  }
                </button>
              </div>
            </>
          )}

          {/* Upload scan success state */}
          {isUploadScan && state === 'success' && (
            <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <CheckCircle2 size={24} color="#16a34a" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Fix Downloaded!</div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 18 }}>
                The patched file has been saved to your downloads.
              </div>
              <button
                onClick={onClose}
                style={{
                  fontSize: 12, color: '#94a3b8', background: 'none',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Close
              </button>
            </div>
          )}

          {/* ── GitHub scan: Create PR flow ─────────────────────────────────── */}
          {!isUploadScan && state !== 'success' && (
            <>
              {/* Token field — shows loading with retry count, then falls back to manual input */}
              {tokenLoading ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
                  padding: '9px 12px', borderRadius: 9,
                  background: '#f9fafb', border: '1px solid #e2e8f0',
                }}>
                  <Loader2 size={13} style={{ animation: 'spin 1s linear infinite', color: '#7c3aed', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {retryCount > 0
                      ? `Retrying… (attempt ${retryCount + 1} of ${MAX_RETRIES})`
                      : 'Fetching GitHub token…'
                    }
                  </span>
                </div>
              ) : !fetchedToken && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    GitHub Token <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {/* Only shown after all retries failed — subtle hint */}
                  <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>⚠</span>
                    <span>Could not fetch token automatically. Please enter it manually.</span>
                  </div>
                  <input
                    type="password"
                    value={manualToken}
                    onChange={e => setManualToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 9,
                      border: '1px solid #e2e8f0', fontSize: 13, color: '#111827',
                      fontFamily: "'JetBrains Mono', monospace",
                      outline: 'none', background: '#f9fafb', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                    Needs <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>repo</code> scope to create branches and PRs.
                  </div>
                </div>
              )}

              {/* Branch field */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Base Branch
                </label>
                <input
                  type="text"
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  placeholder="main"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 9,
                    border: '1px solid #e2e8f0', fontSize: 13, color: '#111827',
                    fontFamily: 'inherit',
                    outline: 'none', background: '#f9fafb', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Info note */}
              <div style={{
                fontSize: 11.5, color: '#64748b', lineHeight: 1.6,
                background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 9, padding: '9px 12px', marginBottom: 18,
              }}>
                This creates a branch <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>niyantri_code/fix-{vuln.id}</code> and opens a PR with a fix guidance file — it does not modify your source code directly.
              </div>

              {/* Error */}
              {state === 'error' && errMsg && (
                <div style={{
                  fontSize: 12, color: '#dc2626', background: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8,
                  padding: '8px 12px', marginBottom: 14,
                }}>
                  {errMsg}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 500,
                    border: '1px solid #e2e8f0', background: '#fff', color: '#64748b',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!effectiveToken.trim() || tokenLoading || state === 'loading'}
                  style={{
                    padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                    border: 'none',
                    background: (!effectiveToken.trim() || tokenLoading) ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #7c3aed)',
                    color: (!effectiveToken.trim() || tokenLoading) ? '#94a3b8' : '#fff',
                    cursor: (!effectiveToken.trim() || tokenLoading || state === 'loading') ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                    transition: 'all .15s',
                  }}
                >
                  {state === 'loading'
                    ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</>
                    : <><GitPullRequest size={13} /> Create PR</>
                  }
                </button>
              </div>
            </>
          )}

          {/* GitHub scan success state */}
          {!isUploadScan && state === 'success' && (
            <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>
                <CheckCircle2 size={24} color="#16a34a" />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 6 }}>PR Created!</div>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 18 }}>
                Your fix guidance PR is ready on GitHub.
              </div>
              {prUrl && (
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '9px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600,
                    background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                    color: '#fff', textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                  }}
                >
                  <GitPullRequest size={13} /> View PR on GitHub
                </a>
              )}
              <div style={{ marginTop: 14 }}>
                <button
                  onClick={onClose}
                  style={{
                    fontSize: 12, color: '#94a3b8', background: 'none',
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FixModal;