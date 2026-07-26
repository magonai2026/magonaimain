import React, { useState, useRef, useEffect } from 'react';
import { X, CheckCircle2, Loader2, Zap, AlertTriangle, Activity, ArrowUp, Download, ShieldCheck } from 'lucide-react';
import ScanResultsPage from './ScanResultsPage';
import type { ScanPhase, ScanProgress } from './scanTypes';

// ─── Chat types ───────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant' | 'reasoning' | 'thinking' | 'fix_complete';
  content: string;
  prUrl?: string;
  prNumber?: number;
  branch?: string;
  filesFixed?: string[];
}

export type {
  Vulnerability, SeverityCounts, CategoryResult,
  DeepScanResult, ScanPhase, ScanProgress,
} from './scanTypes';

// ─── Phase labels — kept in sync with scan.py's actual emitted messages ───────
//
// scan.py message → phase mapping (handled in NewSessionPage.messageToPhase):
//   "Cloning repository..." / "Loaded N files..."  → cloning  (pre-phase)
//   "Scanning your codebase..."                    → phase1
//   "Digging deeper into your code..."             → phase2
//   "Analyzing patterns and vulnerabilities..."    → phase3
//   "Almost done..."                               → phase3
//   "Almost there, reviewing findings..."          → phase4
//   "Scan complete!"                               → phase4
//
const PHASE_LABELS: Record<number, string> = {
  1: 'Scanning your codebase',
  2: 'Digging deeper into your code',
  3: 'Analyzing patterns and vulnerabilities',
  4: 'Reviewing findings',
};

// ─── Markdown renderer ────────────────────────────────────────────────────────
const renderMarkdown = (text: string, isUser: boolean): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  // Inline parser: bold, italic, code, and VULN-XXX chips
  const parseInline = (str: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Extended regex: adds VULN-\d+ chip pattern
    const regex = /(`[^`]+`)|(VULN-\d+)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)/g;
    let last = 0, m: RegExpExecArray | null;
    while ((m = regex.exec(str)) !== null) {
      if (m.index > last) parts.push(str.slice(last, m.index));
      if (m[1]) {
        // inline code
        parts.push(<code key={m.index} style={{
          background: isUser ? 'rgba(255,255,255,0.2)' : '#ede9fe',
          borderRadius: 4, padding: '1px 6px', fontSize: '0.88em',
          fontFamily: "'JetBrains Mono', monospace",
          color: isUser ? '#fff' : '#5b21b6',
        }}>{m[1].slice(1, -1)}</code>);
      } else if (m[2]) {
        // VULN-XXX chip
        parts.push(<span key={m.index} style={{
          display: 'inline-flex', alignItems: 'center',
          fontSize: '0.78em', fontWeight: 800, letterSpacing: '0.07em',
          background: isUser ? 'rgba(255,255,255,0.25)' : 'linear-gradient(135deg,#7c3aed,#6366f1)',
          color: '#fff', borderRadius: 5, padding: '1px 7px',
          fontFamily: "'JetBrains Mono', monospace",
          boxShadow: isUser ? 'none' : '0 2px 6px rgba(124,58,237,0.3)',
          verticalAlign: 'middle', marginInline: 2,
        }}>{m[2]}</span>);
      } else if (m[3]) {
        // bold
        parts.push(<strong key={m.index} style={{ fontWeight: 800, color: isUser ? '#fff' : '#0f172a' }}>{m[4]}</strong>);
      } else if (m[5]) {
        parts.push(<em key={m.index} style={{ fontStyle: 'italic' }}>{m[6]}</em>);
      } else if (m[7]) {
        parts.push(<em key={m.index} style={{ fontStyle: 'italic' }}>{m[8]}</em>);
      }
      last = m.index + m[0].length;
    }
    if (last < str.length) parts.push(str.slice(last));
    return parts;
  };

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      elements.push(<hr key={i} style={{
        border: 'none',
        borderTop: isUser ? '1px solid rgba(255,255,255,0.25)' : '1px solid #e2e8f0',
        margin: '12px 0',
      }} />);
      i++; continue;
    }

    // H1 — top-level section (e.g. "## Summary")
    const h1 = line.match(/^# (.+)/);
    if (h1) {
      elements.push(
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: i > 0 ? 20 : 0, marginBottom: 8,
        }}>
          <div style={{
            width: 3, height: 18, borderRadius: 2, flexShrink: 0,
            background: isUser ? 'rgba(255,255,255,0.7)' : 'linear-gradient(180deg,#7c3aed,#6366f1)',
          }} />
          <div style={{
            fontSize: 15, fontWeight: 800, color: isUser ? '#fff' : '#0f172a',
            letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>{parseInline(h1[1])}</div>
        </div>
      );
      i++; continue;
    }

    // H2 — vulnerability heading (e.g. "## 1) VULN-003 — Title")
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      const isVulnHeading = /VULN-\d+|^\d+[\).]/.test(h2[1]);
      elements.push(
        <div key={i} style={{
          marginTop: i > 0 ? 18 : 0, marginBottom: 6,
          paddingBottom: 7,
          borderBottom: isUser
            ? '1px solid rgba(255,255,255,0.2)'
            : isVulnHeading ? '1px solid rgba(124,58,237,0.18)' : '1px solid #f1f5f9',
        }}>
          <div style={{
            fontSize: 14, fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.01em', lineHeight: 1.3,
          }}>{parseInline(h2[1])}</div>
        </div>
      );
      i++; continue;
    }

    // H3 — sub-section (e.g. "### What it is")
    const h3 = line.match(/^### (.+)/);
    if (h3) {
      elements.push(
        <div key={i} style={{
          fontSize: 11.5, fontWeight: 700,
          color: isUser ? 'rgba(255,255,255,0.85)' : '#0f172a',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.07em',
          marginTop: 12, marginBottom: 4,
        }}>{parseInline(h3[1])}</div>
      );
      i++; continue;
    }

    // Bullet
    const bullet = line.match(/^[-*] (.+)/);
    if (bullet) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 4 }}>
          <span style={{
            marginTop: 7, width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
            background: isUser ? 'rgba(255,255,255,0.7)' : '#7c3aed',
          }} />
          <span style={{ flex: 1, lineHeight: 1.65 }}>{parseInline(bullet[1])}</span>
        </div>
      );
      i++; continue;
    }

    // Numbered list
    const numbered = line.match(/^(\d+)\. (.+)/);
    if (numbered) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 4 }}>
          <span style={{
            flexShrink: 0, fontWeight: 800, fontSize: 11,
            color: isUser ? 'rgba(255,255,255,0.8)' : '#7c3aed',
            minWidth: 18, marginTop: 2,
            background: isUser ? 'rgba(255,255,255,0.15)' : 'rgba(124,58,237,0.1)',
            borderRadius: 4, padding: '1px 5px', textAlign: 'center' as const,
          }}>{numbered[1]}</span>
          <span style={{ flex: 1, lineHeight: 1.65 }}>{parseInline(numbered[2])}</span>
        </div>
      );
      i++; continue;
    }

    // Empty line — spacer
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }} />);
      i++; continue;
    }

    // Normal paragraph
    elements.push(<div key={i} style={{ lineHeight: 1.65 }}>{parseInline(line)}</div>);
    i++;
  }

  return <>{elements}</>;
};


interface ScanPageProps {
  progress: ScanProgress;
  onClose: () => void;
  githubToken?: string;
  /** Optional badge rendered in the navbar centre column (e.g. "Patch Verification") */
  headerBadge?: React.ReactNode;
}

const ScanPage: React.FC<ScanPageProps> = ({ progress, onClose, githubToken = '', headerBadge }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // ─── Resolved GitHub token ───────────────────────────────────────────────────
  // Mirrors the same self-fetch logic that FixModal uses so the chat panel
  // always has a token even when the parent didn't pass one down explicitly.
  // Auto-retries up to 3 times with exponential backoff (1s → 2s → 4s).
  // Non-fatal — chat still works without live code context if all retries fail.
  const [resolvedGithubToken, setResolvedGithubToken] = useState(githubToken || '');

  useEffect(() => {
    if (githubToken) { setResolvedGithubToken(githubToken); return; }

    const MAX_RETRIES = 3;
    const BASE_DELAY  = 1000; // ms
    let cancelled     = false;

    const run = async () => {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        if (cancelled) return;

        // Exponential backoff before every retry (not before first attempt)
        if (attempt > 0) {
          await new Promise(resolve =>
            setTimeout(resolve, BASE_DELAY * Math.pow(2, attempt - 1))
          );
        }

        if (cancelled) return;

        try {
          const res = await fetch('/api/auth/github/token', { credentials: 'include' });

          if (res.ok) {
            const data = await res.json();
            const t = data?.token || data?.access_token || data?.github_token || '';
            if (!cancelled) setResolvedGithubToken(t);
            return; // success — stop retrying
          }

          // 401 / 404 = not connected — no point retrying
          if (res.status === 401 || res.status === 404) return;

          // 5xx — fall through to retry
        } catch {
          // Network error — fall through to retry
        }
      }
      // All retries exhausted — silently give up (non-fatal)
    };

    run();
    return () => { cancelled = true; };
  }, [githubToken]);

  // ─── Chat state ─────────────────────────────────────────────────────────────
  const [chatMessages, setChatMessages]   = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]         = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [liveStatus, setLiveStatus]       = useState<string>('');
  const chatBottomRef                     = useRef<HTMLDivElement>(null);
  const textareaRef                       = useRef<HTMLTextAreaElement>(null);

  // Tracks the most-recent fix_complete event so we can surface "Scan the Patch"
  const [latestFix, setLatestFix] = useState<{
    repoUrl: string;
    branch:  string;
    vulnId?: string;
  } | null>(null);
  // Tracks which scan ID has already had its history fetched — prevents
  // repeated API calls when the parent re-renders with the same progress object
  const historyFetchedRef                 = useRef<string | null>(null);

  // Auto-scroll chat to bottom whenever messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ─── Load chat history + fix history when a completed scan is shown ────────
  // Guarded by historyFetchedRef so this fires exactly once per scan ID
  useEffect(() => {
    const scanId = progress.result?.scan_id;
    if (!scanId || progress.phase !== 'complete') return;
    if (historyFetchedRef.current === scanId) return; // already fetched
    historyFetchedRef.current = scanId;

    // Restore previous chat messages from server
    fetch(`/api/chat/history/${scanId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.messages?.length) {
          setChatMessages(
            data.messages.map((m: any) => ({ role: m.role, content: m.content }))
          );
        }
      })
      .catch(() => { /* non-fatal — chat just starts empty */ });

    // Pre-fetch fix history so chat_service has full context
    fetch(`/api/scan/fix/history/${scanId}`, { credentials: 'include' })
      .catch(() => { /* non-fatal */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.result?.scan_id, progress.phase]);

  const sendChatMessage = async (messageOverride?: string) => {
    const message = (messageOverride ?? chatInput).trim();
    if (!message || isChatLoading || !progress.result?.scan_id) return;

    const userMsg: ChatMessage = { role: 'user', content: message };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsChatLoading(true);

    // Append an empty assistant message that we'll stream into
    setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_id: progress.result!.scan_id,
          message,
          github_token: resolvedGithubToken || undefined,
          conversation_history: chatMessages, // history before this turn
        }),
      });

      if (res.status === 401) {
        setChatMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = {
            role: 'assistant',
            content: 'Your session has expired. Please [log in again](/login) to continue.',
          };
          return next;
        });
        setIsChatLoading(false);
        setLiveStatus('');
        return;
      }

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';           // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const json = JSON.parse(line.slice(5).trim());
            if (json.event === 'chunk' && json.content) {
              setChatMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: 'assistant',
                  content: next[next.length - 1].content + json.content,
                };
                return next;
              });
            } else if (json.event === 'reasoning' && json.content) {
              // Insert reasoning bubble just before the streaming assistant message
              setChatMessages(prev => {
                const next = [...prev];
                const reasoningMsg: ChatMessage = { role: 'reasoning', content: json.content };
                next.splice(next.length - 1, 0, reasoningMsg);
                return next;
              });
            } else if (json.event === 'thinking' && json.message) {
              setLiveStatus(json.message);
              setChatMessages(prev => {
                const next = [...prev];
                const thinkingMsg: ChatMessage = { role: 'thinking', content: json.message };
                next.splice(next.length - 1, 0, thinkingMsg);
                return next;
              });
            } else if (json.event === 'fix_complete') {
              const fixBranch  = json.branch   || '';
              const fixRepoUrl = json.repo_url || json.repoUrl || progress.result?.repo_url || '';
              if (fixBranch) {
                setLatestFix({ repoUrl: fixRepoUrl, branch: fixBranch, vulnId: json.vuln_id || '' });
              }
              setChatMessages(prev => {
                const next = [...prev];
                const fixMsg: ChatMessage = {
                  role: 'fix_complete',
                  content: json.pr_url || '',
                  prUrl: json.pr_url,
                  prNumber: json.pr_number,
                  branch: json.branch,
                  filesFixed: json.files_fixed || [],
                };
                next.splice(next.length - 1, 0, fixMsg);
                return next;
              });
            } else if (json.event === 'error') {
              const errContent = json.message || json.detail || 'Something went wrong. Please try again.';
              setChatMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: errContent };
                return next;
              });
            }
          } catch {
            // non-JSON line — skip
          }
        }
      }

      // If the stream ended but the assistant bubble is still empty, show a fallback
      setChatMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant' && !last.content) {
          next[next.length - 1] = { role: 'assistant', content: 'Sorry, I didn\'t get a response. Please try again.' };
        }
        return next;
      });
    } catch (err) {
      setChatMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        };
        return next;
      });
    } finally {
      setIsChatLoading(false);
      setLiveStatus('');
    }
  };
  
  const phaseMap: Record<ScanPhase, number> = {
    idle: 0, launching: 0, cloning: 0,
    phase1: 1, phase2: 2, phase3: 3, phase4: 4,
    complete: 5, error: 0,
  };

  const phaseNum   = phaseMap[progress.phase] ?? 0;
  const isRunning  = !['complete', 'error', 'idle'].includes(progress.phase);
  const isComplete = progress.phase === 'complete';
  const isError    = progress.phase === 'error';
  const accent     = isComplete ? '#15803d' : isError ? '#dc2626' : '#7c3aed';

  const handleDownloadReport = async () => {
    if (!progress.result?.scan_id) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/scan/report/${progress.result.scan_id}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        // Surface the actual error from the server instead of a generic message
        let detail = `HTTP ${response.status}`;
        try {
          const contentType = response.headers.get('content-type') ?? '';
          if (contentType.includes('application/json')) {
            const json = await response.json();
            detail = json.detail ?? json.message ?? JSON.stringify(json);
          } else {
            detail = (await response.text()).slice(0, 300);
          }
        } catch { /* ignore parse errors */ }
        throw new Error(`Failed to download report: ${detail}`);
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${progress.result.scan_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert((error as Error).message ?? 'Failed to download report. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };


  const [leftPct, setLeftPct]   = useState(35);           // left panel %
  const isDragging              = useRef(false);
  const containerRef            = useRef<HTMLDivElement>(null);

  const onDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct  = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(65, Math.max(20, pct)));
    };
    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor    = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
  };

// AFTER
const handleScanPatch = () => {
  if (!latestFix) return;
  const repoUrl = latestFix.repoUrl || progress.result?.repo_url || '';
  if (!repoUrl) {
    console.error('[PatchScan] repo_url is empty — cannot open patch scan');
    return;
  }
  const params: Record<string, string> = {
    repo:   repoUrl,
    branch: latestFix.branch,
    from:   progress.result?.scan_id ?? '',
  };
  if (latestFix.vulnId) params.vuln = latestFix.vulnId;
  window.open(`/patch-scan?${new URLSearchParams(params).toString()}`, '_blank');
};

  return (
    <>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap");

        /* ── Scrollbars ─────────────────────────────────── */
        .sp-left-body::-webkit-scrollbar        { width: 4px; }
        .sp-left-body::-webkit-scrollbar-track  { background: transparent; }
        .sp-left-body::-webkit-scrollbar-thumb  { background: #e6e2db; border-radius: 4px; }
        .sp-left-body::-webkit-scrollbar-thumb:hover { background: #d8d3ca; }
        .sp-chat-messages::-webkit-scrollbar        { width: 3px; }
        .sp-chat-messages::-webkit-scrollbar-track  { background: transparent; }
        .sp-chat-messages::-webkit-scrollbar-thumb  { background: #e6e2db; border-radius: 4px; }
        .sp-right-body::-webkit-scrollbar       { width: 4px; }
        .sp-right-body::-webkit-scrollbar-track { background: transparent; }
        .sp-right-body::-webkit-scrollbar-thumb { background: #e6e2db; border-radius: 4px; }
        .sp-chatbox-input::-webkit-scrollbar       { width: 3px; }
        .sp-chatbox-input::-webkit-scrollbar-thumb { background: #e6e2db; border-radius: 4px; }

        /* ── Keyframes ──────────────────────────────────── */
        @keyframes sp-spin     { to { transform: rotate(360deg); } }
        @keyframes sp-breathe  { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes sp-slideup  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sp-float1   { 0%,100%{transform:translateY(0) rotate(-10deg)} 50%{transform:translateY(-14px) rotate(-6deg)} }
        @keyframes sp-float2   { 0%,100%{transform:translateY(0) rotate(7deg)} 50%{transform:translateY(-11px) rotate(11deg)} }
        @keyframes sp-float3   { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-18px)} }
        @keyframes sp-laser    { 0%,100%{top:-10%;opacity:0} 10%{opacity:1} 45%{top:105%;opacity:1} 50%{top:105%;opacity:0} 55%{top:-10%;opacity:0} 60%{opacity:1} 95%{top:105%;opacity:1} }
        @keyframes sp-thinkdot { 0%,80%,100%{transform:scale(0.6);opacity:.3} 40%{transform:scale(1);opacity:1} }
        @keyframes sp-welcome  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sp-pulse-ring { 0%{box-shadow:0 0 0 0 rgba(124,58,237,0.35)} 70%{box-shadow:0 0 0 8px rgba(124,58,237,0)} 100%{box-shadow:0 0 0 0 rgba(124,58,237,0)} }
        @keyframes sp-patch-pop { from{opacity:0;transform:translateY(-6px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }

        /* ── Chatbox ─────────────────────────────────────── */
        .sp-chatbox {
          background: #faf9f6;
          border: 1.5px solid #e6e2db;
          border-radius: 16px;
          overflow: hidden;
          transition: border-color .2s, box-shadow .2s;
        }
        .sp-chatbox:focus-within {
          border-color: #c4b5fd;
          box-shadow: 0 0 0 3px rgba(124,58,237,.08), 0 4px 16px rgba(0,0,0,0.06);
        }
        .sp-chatbox-input {
          width: 100%; background: transparent; border: none; outline: none;
          resize: none; font-family: "Instrument Sans",system-ui,sans-serif;
          font-size: 13.5px; color: #111118; line-height: 1.6;
          padding: 13px 16px 4px; min-height: 44px; max-height: 96px;
          overflow-y: auto; box-sizing: border-box; display: block;
        }
        .sp-chatbox-input::placeholder { color: #c4c1d0; }
        .sp-chatbox-toolbar { display:flex; align-items:center; justify-content:space-between; padding:5px 8px 8px 10px; }
        .sp-chatbox-left-tools { display:flex; align-items:center; gap:2px; }

        /* Tool buttons */
        .sp-tool-btn {
          display:flex; align-items:center; justify-content:center;
          width:28px; height:28px; border-radius:7px; border:none;
          background:transparent; cursor:pointer; color:#c4c1d0;
          transition:background .15s,color .15s;
        }
        .sp-tool-btn:hover { background:#f0ede8; color:#6b6880; }

        /* Visual chip */
        .sp-visual-chip {
          display:flex; align-items:center; gap:5px;
          padding:4px 10px; border-radius:8px;
          border:1px solid #e6e2db; background:#fff;
          font-size:11.5px; font-weight:500; color:#6b6880;
          cursor:pointer; font-family:"Instrument Sans",system-ui,sans-serif;
          transition:all .15s;
        }
        .sp-visual-chip:hover {
          background:#faf9f6; border-color:#d8d3ca; color:#4a4755;
          transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        /* Send button */
        .sp-send-btn {
          display:flex; align-items:center; justify-content:center;
          width:32px; height:32px; border-radius:10px; border:none;
          background: linear-gradient(135deg,#7c3aed,#6366f1);
          color:#fff; cursor:pointer; flex-shrink:0;
          transition:transform .17s cubic-bezier(0.16,1,0.3,1), box-shadow .17s;
          box-shadow: 0 2px 10px rgba(124,58,237,0.3);
        }
        .sp-send-btn:hover {
          transform:scale(1.08) translateY(-1px);
          box-shadow: 0 5px 18px rgba(124,58,237,0.42);
        }
        .sp-send-btn:active { transform:scale(0.95); box-shadow:none; }

        /* Thinking */
        .sp-thinking-row { display:flex; align-items:center; gap:7px; margin-bottom:8px; flex-shrink:0; }
        .sp-thinking-bubble {
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 14px;
          background: linear-gradient(135deg,rgba(124,58,237,0.06),rgba(99,102,241,0.04));
          border:1px solid rgba(124,58,237,0.14); border-radius:999px;
        }
        .sp-dot {
          width:5px; height:5px; border-radius:50%; background:#7c3aed;
          animation:sp-thinkdot 1.4s ease-in-out infinite;
        }
        .sp-dot:nth-child(2){animation-delay:.2s} .sp-dot:nth-child(3){animation-delay:.4s}

        /* Quick-action chips */
        .sp-chip-row { display:flex; flex-wrap:nowrap; gap:5px; margin-bottom:8px; overflow-x:auto; overflow-y:hidden; flex-shrink:0; }
        .sp-chip-row::-webkit-scrollbar { display:none; }
        .sp-chip {
          display:flex; align-items:center; padding:5px 12px;
          border-radius:999px;
          border:1.5px solid #e6e2db; background:#fff;
          font-size:11px; font-weight:600; color:#6b6880;
          white-space:nowrap; flex-shrink:0; cursor:pointer;
          font-family:"Instrument Sans",system-ui,sans-serif;
          transition:all .17s cubic-bezier(0.16,1,0.3,1);
          letter-spacing: 0.01em;
        }
        .sp-chip:hover {
          background:#f5f4f0; color:#7c3aed;
          border-color:rgba(124,58,237,0.35);
          transform:translateY(-1px);
          box-shadow: 0 3px 10px rgba(124,58,237,0.12);
        }

        /* Resize divider */
        .sp-divider { width:10px; flex-shrink:0; display:flex; align-items:center; justify-content:center; cursor:col-resize; position:relative; z-index:10; }
        .sp-divider:hover .sp-divider-pill, .sp-divider:active .sp-divider-pill { background:#7c3aed; box-shadow:0 0 10px rgba(124,58,237,0.4); }
        .sp-divider-pill { width:3px; height:36px; border-radius:4px; background:#e6e2db; transition:background .15s, box-shadow .15s; }

        /* ── Navbar ──────────────────────────────────────── */
        .sp-navbar-slot {
          position: fixed;
          top: 0; left: 0; right: 0; height: 64px;
          background: rgba(245,244,240,0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid #e6e2db;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          z-index: 50;
          padding: 0 24px 0 90px;
          box-sizing: border-box;
          pointer-events: none;
        }
        .sp-navbar-slot > * { pointer-events: all; }
        .sp-navbar-back {
          justify-self: end;
          display: flex; align-items: center; gap: 6px;
          padding: 7px 16px; border-radius: 9px;
          border: 1.5px solid #e6e2db; background: #fff;
          font-size: 13px; color: #4a4755; cursor: pointer;
          font-family: "Instrument Sans",system-ui,sans-serif; font-weight: 600;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          transition: all .17s cubic-bezier(0.16,1,0.3,1);
        }
        .sp-navbar-back:hover {
          background:#f5f4f0; border-color:#d8d3ca;
          transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        }
        .sp-navbar-center { justify-self: center; display: flex; align-items: center; }
        .sp-navbar-right  { justify-self: end; display: flex; align-items: center; }

        /* ── Scan the Patch button ───────────────────────── */
        .sp-patch-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 8px 18px; border-radius: 10px; border: none;
          background: linear-gradient(135deg,#15803d,#16a34a);
          font-size: 13px; color: #fff; cursor: pointer;
          font-family: "'Instrument Sans',system-ui,sans-serif"; font-weight: 700;
          box-shadow: 0 3px 14px rgba(22,163,74,0.38);
          transition: all 0.2s ease;
          animation: sp-patch-pop 0.3s cubic-bezier(0.16,1,0.3,1) both;
          white-space: nowrap;
        }
        .sp-patch-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 20px rgba(22,163,74,0.52);
        }
        .sp-patch-btn:active { transform: scale(0.97); }
      `}</style>

      {/* ── Navbar slot ── */}
      <div className="sp-navbar-slot">
        {/* Left column — empty spacer */}
        <div />

        {/* Centre column — optional badge (e.g. "Patch Verification") */}
        <div className="sp-navbar-center">
          {headerBadge ?? null}
        </div>

        {/* Right column — Scan the Patch + Download Report + Back */}
        <div className="sp-navbar-right" style={{ gap: 8 }}>

          {/* "Scan the Patch" — appears once a fix_complete event has fired */}
          {latestFix && (
            <button
              className="sp-patch-btn"
              onClick={handleScanPatch}
              title={`Re-scan patched branch: ${latestFix.branch}`}
            >
              <ShieldCheck size={14} />
              Scan the Patch
            </button>
          )}

          {isComplete && progress.result?.scan_id && (
            <button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 18px', borderRadius: 10, border: 'none',
                background: isDownloading ? '#e5e7eb' : 'linear-gradient(135deg,#7c3aed,#6366f1)',
                fontSize: 13, color: isDownloading ? '#9ca3af' : '#fff',
                cursor: isDownloading ? 'not-allowed' : 'pointer',
                fontFamily: "'Instrument Sans',system-ui,sans-serif", fontWeight: 700,
                boxShadow: isDownloading ? 'none' : '0 3px 14px rgba(124,58,237,0.38)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (!isDownloading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 5px 20px rgba(124,58,237,0.52)'; }}
              onMouseLeave={e => { if (!isDownloading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 14px rgba(124,58,237,0.38)'; }}
            >
              {isDownloading
                ? <><Loader2 size={14} style={{ animation: 'sp-spin 1s linear infinite' }} /> Downloading…</>
                : <><Download size={14} /> Download Report</>
              }
            </button>
          )}
          <button className="sp-navbar-back" onClick={onClose}>
            <X size={13} strokeWidth={2.5} /> Back
          </button>
        </div>
      </div>

      {/* ── Main two-panel layout ── */}
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 64, left: 60, right: 0, bottom: 0,
          display: 'flex',
          fontFamily: "'Instrument Sans', system-ui, sans-serif",
          padding: '10px', boxSizing: 'border-box', gap: 0, overflow: 'hidden',
        }}
      >

        {/* ══ LEFT PANEL ══════════════════════════════════════════════════ */}
        <div style={{
          width: `${leftPct}%`,
          flexShrink: 0,
          background: '#ffffff', borderRadius: 18,
          border: '1.5px solid #e6e2db',
          boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', height: '100%',
          minWidth: 0,
        }}>

          {/* LEFT PANEL — UNIFIED SCROLLABLE CHAT THREAD */}
          <div className="sp-left-body" style={{
            flex: '1 1 0',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '26px 28px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>

            {/* ── COMPLETE: chatbot-style welcome ── */}
            {isComplete ? (
              <div style={{ animation: 'sp-welcome 0.4s ease', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Bot greeting bubble */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                  }}>
                    <CheckCircle2 size={15} color="#fff" />
                  </div>
                  <div style={{
                    background: '#f5f4f0', borderRadius: '14px 14px 14px 4px',
                    padding: '11px 14px', fontSize: 13.5, color: '#111118', lineHeight: 1.65, border: '1px solid #ece9e2',
                    maxWidth: '85%',
                  }}>
                    🎉 <strong>Scan complete!</strong> I've finished analysing your codebase and found{' '}
                    <strong style={{ color: '#0f172a', fontSize: 14.5, fontWeight: 800 }}>{progress.result?.vulnerabilities.length ?? 0} vulnerabilities</strong> across{' '}
                    <strong style={{ color: '#0f172a', fontWeight: 800 }}>{progress.result?.total_files ?? 0} files</strong>.
                  </div>
                </div>

                {/* Follow-up bot message */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                  }}>
                    <Activity size={14} color="#fff" />
                  </div>
                  <div style={{
                    background: '#f5f4f0', borderRadius: '14px 14px 14px 4px',
                    padding: '11px 14px', fontSize: 13.5, color: '#111118', lineHeight: 1.65, border: '1px solid #ece9e2',
                    maxWidth: '85%',
                  }}>
                    Browse the vulnerability cards on the right, or ask me anything — I can explain findings, suggest fixes, or show you which files are most affected.
                  </div>
                </div>

                {/* Tip bot message */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                  }}>
                    <Zap size={13} color="#fff" />
                  </div>
                  <div style={{
                    background: '#f5f4f0', borderRadius: '14px 14px 14px 4px',
                    padding: '11px 14px', fontSize: 13.5, color: '#111118', lineHeight: 1.65, border: '1px solid #ece9e2',
                    maxWidth: '85%',
                  }}>
                    💡 <strong>Tip:</strong> Use the <em>quick chips below</em> to get started fast, or download the full PDF report from above.
                  </div>
                </div>

              </div>

            ) : (
              <>
                {/* Status heading — scan in progress / error */}
                {isError ? (
                  <div style={{
                    marginBottom: 20,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #fff5f5 0%, #fff1f0 100%)',
                    border: '1.5px solid rgba(220,38,38,0.15)',
                    padding: '16px 18px',
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    boxShadow: '0 2px 16px rgba(220,38,38,0.07)',
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                      background: 'linear-gradient(135deg,#fca5a5,#f87171)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 3px 10px rgba(220,38,38,0.25)',
                    }}>
                      <AlertTriangle size={17} color="#fff" />
                    </div>
                    <div>
                      <h1 style={{
                        margin: '0 0 3px', fontSize: 15.5, fontWeight: 800, letterSpacing: '-0.02em',
                        color: '#b91c1c',
                      }}>Scan Failed</h1>
                      <p style={{ margin: 0, fontSize: 12.5, color: '#f87171', lineHeight: 1.5 }}>
                        Something went wrong during the scan
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: '#ede9fe',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Activity size={13} color="#7c3aed" style={{ animation: 'sp-breathe 1.4s infinite' }} />
                      </div>
                      <h1 style={{
                        margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a',
                      }}>Scanning Repository</h1>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5, paddingLeft: 30 }}>
                      Deep security analysis is in progress
                    </p>
                  </div>
                )}

                {/* Phase tracker */}
                <div style={{
                  background: isError ? 'rgba(254,242,242,0.6)' : '#faf9f6',
                  border: '1.5px solid ' + (isError ? 'rgba(220,38,38,0.1)' : '#e6e2db'),
                  borderRadius: 16, padding: '16px 18px', marginBottom: 18,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  display: 'flex', flexDirection: 'column', gap: 13,
                }}>
                  {[1, 2, 3, 4].map(n => {
                    const done   = phaseNum > n;
                    const active = phaseNum === n && isRunning;
                    const failed = isError && phaseNum === n;
                    const idle   = !done && !active && !failed;
                    return (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: done ? '#dcfce7' : active ? '#ede9fe' : failed ? '#fee2e2' : '#f3f4f6',
                          border: '1.5px solid ' + (done ? '#86efac' : active ? '#c4b5fd' : failed ? '#fca5a5' : '#e5e7eb'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {done
                            ? <CheckCircle2 size={13} color="#16a34a" />
                            : active
                            ? <Loader2 size={12} color="#7c3aed" style={{ animation: 'sp-spin 1s linear infinite' }} />
                            : failed
                            ? <AlertTriangle size={11} color="#dc2626" />
                            : <span style={{ fontSize: 10, fontWeight: 700, color: '#d1d5db' }}>{n}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.2, color: done ? '#15803d' : active ? '#7c3aed' : failed ? '#dc2626' : '#d1d5db' }}>
                            Phase {n}
                          </div>
                          <div style={{ fontSize: 11, marginTop: 1, lineHeight: 1.3, color: idle ? '#e5e7eb' : '#94a3b8' }}>
                            {PHASE_LABELS[n]}
                          </div>
                        </div>
                        {active && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 999, background: 'rgba(124,58,237,0.09)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.18)', animation: 'sp-breathe 1.4s infinite' }}>LIVE</span>}
                        {done  && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 999, background: 'rgba(22,163,74,0.08)', color: '#15803d', border: '1px solid rgba(22,163,74,0.18)' }}>DONE</span>}
                        {failed && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 999, background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}>FAILED</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Live message ticker */}
                {isRunning && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 9,
                    padding: '10px 14px', borderRadius: 10, marginBottom: 18,
                    background: accent + '0c', border: '1px solid ' + accent + '28',
                    animation: 'sp-slideup .3s ease',
                  }}>
                    <Zap size={13} color={accent} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12.5, color: accent, lineHeight: 1.45 }}>{progress.message}</span>
                  </div>
                )}

                {/* Error detail */}
                {isError && progress.error && (() => {
                  const errStr = typeof progress.error === 'string' ? progress.error : JSON.stringify(progress.error);
                  const isLowBal = errStr.startsWith('__LOW_BALANCE__');
                  const errMsg   = isLowBal ? errStr.replace('__LOW_BALANCE__', '') : errStr;

                  if (isLowBal) {
                    return (
                      <div style={{
                        borderRadius: 16, marginBottom: 18, overflow: 'hidden',
                        border: '1px solid rgba(245,158,11,0.25)',
                        background: 'linear-gradient(135deg, rgba(254,252,232,0.95) 0%, rgba(255,237,213,0.85) 100%)',
                        boxShadow: '0 4px 24px rgba(245,158,11,0.12)',
                      }}>
                        {/* Header strip */}
                        <div style={{
                          padding: '14px 18px 10px',
                          borderBottom: '1px solid rgba(245,158,11,0.18)',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                            background: 'linear-gradient(135deg,#f59e0b,#f97316)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 10px rgba(245,158,11,0.35)',
                            fontSize: 16,
                          }}>💳</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e', letterSpacing: '-0.01em' }}>
                              Insufficient Credits
                            </div>
                            <div style={{ fontSize: 11, color: '#b45309', marginTop: 1 }}>
                              Top up your wallet to run scans
                            </div>
                          </div>
                        </div>
                        {/* Body */}
                        <div style={{ padding: '12px 18px 16px' }}>
                          <p style={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.6, margin: '0 0 14px' }}>
                            {errMsg}
                          </p>
                          {/* Credit packages */}
                          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                            {[
                              { label: 'Starter', credits: '50', price: '₹99' },
                              { label: 'Pro',     credits: '200', price: '₹299', highlight: true },
                              { label: 'Scale',   credits: '600', price: '₹799' },
                            ].map(pkg => (
                              <div key={pkg.label} style={{
                                flex: 1, borderRadius: 10, padding: '10px 8px',
                                textAlign: 'center', cursor: 'default',
                                border: pkg.highlight
                                  ? '1.5px solid rgba(245,158,11,0.6)'
                                  : '1px solid rgba(245,158,11,0.2)',
                                background: pkg.highlight
                                  ? 'linear-gradient(135deg,rgba(251,191,36,0.22),rgba(249,115,22,0.12))'
                                  : 'rgba(255,255,255,0.55)',
                                boxShadow: pkg.highlight ? '0 2px 10px rgba(245,158,11,0.18)' : 'none',
                              }}>
                                {pkg.highlight && (
                                  <div style={{
                                    fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                                    color: '#d97706', marginBottom: 4, textTransform: 'uppercase',
                                  }}>Popular</div>
                                )}
                                <div style={{ fontSize: 17, fontWeight: 800, color: '#92400e' }}>{pkg.credits}</div>
                                <div style={{ fontSize: 10, color: '#b45309', marginBottom: 2 }}>credits</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed' }}>{pkg.price}</div>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => { window.location.href = '/credits'; }}
                            style={{
                              width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
                              background: 'linear-gradient(135deg,#f59e0b,#f97316)',
                              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
                              letterSpacing: '-0.01em',
                              fontFamily: "inherit",
                            }}
                          >
                            ⚡ Top Up Credits →
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Generic error
                  return (
                    <div style={{ padding: '12px 14px', borderRadius: 10, marginBottom: 18, background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.18)' }}>
                      <strong style={{ display: 'block', fontSize: 12, color: '#dc2626', marginBottom: 3 }}>Error</strong>
                      <span style={{ fontSize: 12.5, color: '#dc2626', lineHeight: 1.5 }}>{errStr}</span>
                    </div>
                  );
                })()}
              </>
            )}

            {/* ── Chat messages continue in the same scroll thread ── */}
            {chatMessages.map((msg, i) => {
              // -- Reasoning bubble --
              if (msg.role === 'reasoning') {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                      background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                    }}>
                      <Activity size={12} color="#7c3aed" />
                    </div>
                    <div style={{
                      maxWidth: '92%', padding: '8px 13px',
                      borderRadius: '4px 14px 14px 14px',
                      background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.12)',
                      fontSize: 12, color: '#374151', lineHeight: 1.55,
                      fontStyle: 'italic', fontFamily: "'Instrument Sans', system-ui, sans-serif",
                    }}>
                      {msg.content}
                    </div>
                  </div>
                );
              }

              // -- Thinking pill --
              if (msg.role === 'thinking') {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, paddingLeft: 36 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 11px', borderRadius: 999,
                      background: '#f3f0ff', border: '1px solid #e9e3ff',
                      fontSize: 11.5, color: '#7c3aed', fontWeight: 500,
                      fontFamily: "'Instrument Sans', system-ui, sans-serif",
                    }}>
                      <Loader2 size={11} style={{ animation: 'sp-spin 1s linear infinite', flexShrink: 0 }} />
                      {msg.content}
                    </div>
                  </div>
                );
              }

              // -- Fix complete card --
              if (msg.role === 'fix_complete') {
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                      background: 'linear-gradient(135deg,#15803d,#16a34a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(22,163,74,0.3)', marginTop: 2,
                    }}>
                      <CheckCircle2 size={13} color="#fff" />
                    </div>
                    <div style={{
                      maxWidth: '92%', padding: '12px 14px',
                      borderRadius: '4px 16px 16px 16px',
                      background: 'linear-gradient(135deg,rgba(22,163,74,0.06),rgba(21,128,61,0.04))',
                      border: '1px solid rgba(22,163,74,0.2)',
                      fontSize: 13, fontFamily: "'Instrument Sans', system-ui, sans-serif",
                    }}>
                      <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 6, fontSize: 13 }}>
                        {msg.prUrl ? `PR Created${msg.prNumber ? ` #${msg.prNumber}` : ''}` : 'Code Committed'}
                      </div>
                      {msg.branch && (
                        <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 4 }}>
                          Branch: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, fontFamily: "'JetBrains Mono',monospace" }}>{msg.branch}</code>
                        </div>
                      )}
                      {msg.filesFixed && msg.filesFixed.length > 0 && (
                        <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 8 }}>
                          Files: {msg.filesFixed.join(', ')}
                        </div>
                      )}
                      {msg.prUrl && (
                        <a
                          href={msg.prUrl} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 8,
                            background: '#15803d', color: '#fff',
                            fontSize: 12, fontWeight: 600, textDecoration: 'none',
                            boxShadow: '0 2px 8px rgba(22,163,74,0.25)',
                          }}
                        >
                          View PR on GitHub
                        </a>
                      )}
                    </div>
                  </div>
                );
              }

              // -- Normal user / assistant bubble --
              return (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: 8,
                }}>
                  {msg.role === 'assistant' && (
                    <div style={{
                      width: 28, height: 28, borderRadius: 9, flexShrink: 0,
                      background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(124,58,237,0.28)',
                      marginTop: 2,
                    }}>
                      <Zap size={13} color="#fff" />
                    </div>
                  )}
                  <div style={{
                    maxWidth: msg.role === 'user' ? '80%' : '92%',
                    padding: msg.role === 'user' ? '9px 14px' : '12px 16px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg,#7c3aed,#6366f1)' : '#ffffff',
                    color: msg.role === 'user' ? '#fff' : '#111118',
                    fontSize: 13,
                    lineHeight: 1.6,
                    fontFamily: "'Instrument Sans', system-ui, sans-serif",
                    wordBreak: 'break-word',
                    border: msg.role === 'user' ? 'none' : '1px solid #ece9e2',
                    boxShadow: msg.role === 'user' ? '0 2px 10px rgba(124,58,237,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    {msg.content
                      ? renderMarkdown(msg.content, msg.role === 'user')
                      : (
                        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                          <span className="sp-dot" />
                          <span className="sp-dot" />
                          <span className="sp-dot" />
                        </span>
                      )
                    }
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* LEFT PANEL — FIXED FOOTER (chips + chatbox only, never grows) */}
          <div style={{
            flexShrink: 0,
            padding: '8px 20px 20px',
            background: '#fff',
            borderTop: '1px solid #f0f3f6',
          }}>
            {isChatLoading && liveStatus && (
              <div className="sp-thinking-row" style={{ marginBottom: 8 }}>
                <div className="sp-thinking-bubble">
                  <div className="sp-dot" /><div className="sp-dot" /><div className="sp-dot" />
                  <span style={{
                    fontSize: 11.5, color: '#7c3aed', marginLeft: 3,
                    fontWeight: 500, fontFamily: "'DM Sans',system-ui,sans-serif",
                  }}>{liveStatus}</span>
                </div>
              </div>
            )}
            {isRunning && (
              <div className="sp-thinking-row" style={{ marginBottom: 8 }}>
                <div className="sp-thinking-bubble">
                  <div className="sp-dot" /><div className="sp-dot" /><div className="sp-dot" />
                  <span style={{
                    fontSize: 11.5, color: '#7c3aed', marginLeft: 3,
                    fontWeight: 500, fontFamily: "'DM Sans',system-ui,sans-serif",
                  }}>Analyzing…</span>
                </div>
              </div>
            )}
            {!isRunning && (
              <div className="sp-chip-row">
                {(isComplete
                  ? ['Explain findings', 'Generate fix', 'Export report', 'Show by file']
                  : ['Retry scan', 'View logs', 'Change repo']
                ).map(chip => (
                  <button
                    key={chip}
                    className="sp-chip"
                    onClick={() => sendChatMessage(chip)}
                    disabled={isChatLoading || !progress.result?.scan_id}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
            <div className="sp-chatbox">
              <textarea
                ref={textareaRef}
                className="sp-chatbox-input"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder={
                  isRunning
                    ? 'Ask about the scan…'
                    : isComplete
                    ? 'Ask about vulnerabilities, request fixes…'
                    : 'Ask a question…'
                }
                rows={1}
                disabled={isChatLoading || !progress.result?.scan_id}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 96) + 'px';
                }}
              />
              <div className="sp-chatbox-toolbar">
                <div className="sp-chatbox-left-tools">
                  <button className="sp-visual-chip">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 9.5L4 6.5L6.5 9L9.5 5.5L11 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="9.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                    Visual edits
                  </button>
                </div>
                <button
                  className="sp-send-btn"
                  title="Send"
                  onClick={() => sendChatMessage()}
                  disabled={isChatLoading || !chatInput.trim() || !progress.result?.scan_id}
                  style={{ opacity: (isChatLoading || !chatInput.trim()) ? 0.45 : 1 }}
                >
                  {isChatLoading
                    ? <Loader2 size={13} style={{ animation: 'sp-spin 1s linear infinite' }} />
                    : <ArrowUp size={14} strokeWidth={2.5} />
                  }
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* ══ DRAG DIVIDER ══════════════════════════════════════════════════ */}
        <div
          className="sp-divider"
          onMouseDown={onDividerMouseDown}
          style={{ margin: '8px 0' }}
        >
          <div className="sp-divider-pill" />
        </div>

        {/* ══ RIGHT PANEL — rendered by ScanResultsPage ══════════════════ */}
        <ScanResultsPage
          progress={progress}
          githubToken={resolvedGithubToken}
        />

      </div>
    </>
  );
};

export default ScanPage;

// ─────────────────────────────────────────────────────────────────────────────
// Scan API helpers — importable by any component
// ─────────────────────────────────────────────────────────────────────────────

/** GET /scan/history/{scan_id} — full scan result */
export const fetchScanById = async (scanId: string) => {
  const res = await fetch(`/api/scan/history/${scanId}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch scan (${res.status})`);
  return res.json();
};

/** GET /scan/history/{scan_id}/vulnerabilities?severity=&file= */
export const fetchScanVulnerabilities = async (
  scanId: string,
  severity?: string,
  file?: string,
) => {
  const params = new URLSearchParams();
  if (severity) params.set('severity', severity);
  if (file)     params.set('file', file);
  const query = params.toString() ? `?${params}` : '';
  const res = await fetch(`/api/scan/history/${scanId}/vulnerabilities${query}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to fetch vulnerabilities (${res.status})`);
  return res.json(); // { scan_id, total, filters, vulnerabilities }
};

/** GET /scan/history/user/{user_id} — lightweight scan metadata list */
export const fetchUserScans = async (userId: string) => {
  const res = await fetch(`/api/scan/history/user/${userId}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch user scans (${res.status})`);
  return res.json();
};

/** DELETE /scan/history/{scan_id} — delete scan + uploaded files */
export const deleteScan = async (scanId: string) => {
  const res = await fetch(`/api/scan/history/${scanId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`Failed to delete scan (${res.status})`);
  return res.json();
};