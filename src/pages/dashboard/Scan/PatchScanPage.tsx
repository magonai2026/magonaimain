import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, GitBranch, Loader2, AlertTriangle, ArrowLeft,
  GitPullRequest, FileCode2, CheckCircle2, XCircle, FlaskConical,
  ChevronDown, ChevronRight, ExternalLink, Terminal, Eye,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FixRecord {
  pr_url:     string;
  pr_number:  number;
  branch:     string;
  file_fixed: string[];
  status:     string;
  created_at: string;
}

interface TestResult {
  file:   string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  output: string;
}

interface StaticResult {
  file:             string;
  still_vulnerable: boolean;
  reason:           string;
}

interface GeneratedTest {
  file:      string;
  test_file: string;
  code:      string;
}

type Phase =
  | 'idle'
  | 'loading'
  | 'fetching'
  | 'generating'
  | 'running'
  | 'verifying'
  | 'done'
  | 'error';

interface VerifyState {
  phase:          Phase;
  steps:          string[];
  tests:          GeneratedTest[];
  testResults:    TestResult[];
  staticResults:  StaticResult[];
  verdict:        { passed: boolean; tests_passed: boolean; static_passed: boolean } | null;
  prUrl:          string;
  prNumber:       number;
  branch:         string;
  filesChecked:   string[];
  error:          string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<Phase, string> = {
  idle:       'Idle',
  loading:    'Loading fix info',
  fetching:   'Fetching files',
  generating: 'Generating tests',
  running:    'Running tests',
  verifying:  'Static check',
  done:       'Complete',
  error:      'Error',
};

const PHASE_ORDER: Phase[] = ['loading', 'fetching', 'generating', 'running', 'verifying', 'done'];

const STATUS_COLORS: Record<TestResult['status'], string> = {
  passed:  '#16a34a',
  failed:  '#dc2626',
  skipped: '#d97706',
  error:   '#7c3aed',
};

// ─────────────────────────────────────────────────────────────────────────────
// LeftPanel — fix metadata (loaded from fix history API)
// ─────────────────────────────────────────────────────────────────────────────

const LeftPanel: React.FC<{ fromId: string }> = ({ fromId }) => {
  const [fix,      setFix]      = useState<FixRecord | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState({ pr: true, files: true });

  useEffect(() => {
    if (!fromId) { setLoading(false); return; }
    fetch(`/api/scan/fix/history/${fromId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.fixes?.length) setFix(d.fixes[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [fromId]);

  const toggle = (k: keyof typeof expanded) =>
    setExpanded(p => ({ ...p, [k]: !p[k] }));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', gap: 8, fontSize: 13 }}>
      <Loader2 size={15} style={{ animation: 'ps-spin 1s linear infinite' }} /> Loading…
    </div>
  );

  return (
    <div style={{ padding: '14px 14px 40px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{`@keyframes ps-spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── PR ── */}
      {fix && (
        <div style={{ borderRadius: 12, border: '1px solid #e6e2db', background: '#fff', overflow: 'hidden' }}>
          <div
            onClick={() => toggle('pr')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', background: '#faf9f6', borderBottom: expanded.pr ? '1px solid #e6e2db' : 'none' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
              <GitPullRequest size={13} color="#16a34a" /> Pull Request
            </span>
            {expanded.pr ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />}
          </div>
          {expanded.pr && (
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'rgba(22,163,74,0.1)', color: '#15803d', border: '1px solid rgba(22,163,74,0.2)' }}>
                  PR #{fix.pr_number}
                </span>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>{fix.status}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                <GitBranch size={12} />
                <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>
                  {fix.branch}
                </code>
              </div>
              {fix.pr_url && (
                <a
                  href={fix.pr_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: 'linear-gradient(135deg,#15803d,#16a34a)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', width: 'fit-content', boxShadow: '0 2px 8px rgba(22,163,74,0.28)' }}
                >
                  <ExternalLink size={12} /> View PR on GitHub
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Files fixed ── */}
      {fix?.file_fixed?.length ? (
        <div style={{ borderRadius: 12, border: '1px solid #e6e2db', background: '#fff', overflow: 'hidden' }}>
          <div
            onClick={() => toggle('files')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', background: '#faf9f6', borderBottom: expanded.files ? '1px solid #e6e2db' : 'none' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
              <FileCode2 size={13} color="#7c3aed" /> Files Patched ({fix.file_fixed.length})
            </span>
            {expanded.files ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />}
          </div>
          {expanded.files && (
            <div style={{ padding: '12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {fix.file_fixed.map((f, i) => (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: 11, color: '#334155', fontFamily: "'JetBrains Mono',monospace" }}>
                  <FileCode2 size={10} /> {f}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {!fix && !loading && (
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, paddingTop: 32 }}>
          No fix record found for this scan.
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// RightPanel — live verification stream
// ─────────────────────────────────────────────────────────────────────────────

const RightPanel: React.FC<{ state: VerifyState }> = ({ state }) => {
  const [expandedTests, setExpandedTests]   = useState<Record<string, boolean>>({});
  const [expandedOutput, setExpandedOutput] = useState<Record<string, boolean>>({});

  const toggleTest   = (k: string) => setExpandedTests(p => ({ ...p, [k]: !p[k] }));
  const toggleOutput = (k: string) => setExpandedOutput(p => ({ ...p, [k]: !p[k] }));

  const currentPhaseIdx = PHASE_ORDER.indexOf(state.phase);

  // ── Idle / not started ────────────────────────────────────────────────────
  if (state.phase === 'idle') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, color: '#94a3b8' }}>
        <ShieldCheck size={36} color="#e2e8f0" />
        <span style={{ fontSize: 13 }}>Verification will start automatically…</span>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (state.phase === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, padding: 24 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <XCircle size={22} color="#dc2626" />
        </div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#dc2626' }}>Verification failed</p>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b', textAlign: 'center', maxWidth: 380 }}>{state.error}</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14, fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      <style>{`@keyframes ps-spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Phase stepper ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', padding: '12px 16px', borderRadius: 12, background: '#faf9f6', border: '1px solid #e6e2db' }}>
        {PHASE_ORDER.map((ph, idx) => {
          const done   = idx < currentPhaseIdx;
          const active = idx === currentPhaseIdx;
          return (
            <React.Fragment key={ph}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 999,
                background: done ? 'rgba(22,163,74,0.1)' : active ? 'rgba(99,102,241,0.12)' : 'rgba(148,163,184,0.08)',
                border: `1px solid ${done ? 'rgba(22,163,74,0.25)' : active ? 'rgba(99,102,241,0.3)' : '#e2e8f0'}`,
                fontSize: 11, fontWeight: 700,
                color: done ? '#15803d' : active ? '#4f46e5' : '#94a3b8',
              }}>
                {done   && <CheckCircle2 size={10} />}
                {active && <Loader2 size={10} style={{ animation: 'ps-spin 1s linear infinite' }} />}
                {PHASE_LABELS[ph]}
              </div>
              {idx < PHASE_ORDER.length - 1 && (
                <div style={{ width: 16, height: 1, background: done ? '#bbf7d0' : '#e2e8f0', flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Live steps log ── */}
      {state.steps.length > 0 && (
        <div style={{ borderRadius: 12, border: '1px solid #e6e2db', background: '#fff', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: '#faf9f6', borderBottom: '1px solid #e6e2db', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
            <Terminal size={13} color="#64748b" /> Progress
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
            {state.steps.map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ color: '#94a3b8', fontSize: 10, marginTop: 2, flexShrink: 0 }}>›</span>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Generated tests ── */}
      {state.tests.length > 0 && (
        <div style={{ borderRadius: 12, border: '1px solid #e6e2db', background: '#fff', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: '#faf9f6', borderBottom: '1px solid #e6e2db', fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 7 }}>
            <FlaskConical size={13} color="#0284c7" /> Generated Tests ({state.tests.length})
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {state.tests.map(t => (
              <div key={t.file} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                <div
                  onClick={() => toggleTest(t.file)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer', background: '#f8fafc' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#0f172a' }}>
                    <FileCode2 size={11} color="#0284c7" />
                    {t.test_file}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10.5, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace" }}>{t.file}</span>
                    {expandedTests[t.file] ? <ChevronDown size={13} color="#94a3b8" /> : <Eye size={13} color="#94a3b8" />}
                  </div>
                </div>
                {expandedTests[t.file] && (
                  <pre style={{ margin: 0, padding: 12, background: '#0f172a', color: '#e2e8f0', fontSize: 11, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.6, overflowX: 'auto', maxHeight: 320 }}>
                    {t.code}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Test results ── */}
      {state.testResults.length > 0 && (
        <div style={{ borderRadius: 12, border: '1px solid #e6e2db', background: '#fff', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: '#faf9f6', borderBottom: '1px solid #e6e2db', fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Terminal size={13} color="#64748b" /> Test Results
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {state.testResults.map(r => {
              const col = STATUS_COLORS[r.status];
              return (
                <div key={r.file} style={{ border: `1px solid ${col}30`, borderRadius: 10, overflow: 'hidden', background: `${col}06` }}>
                  <div
                    onClick={() => toggleOutput(r.file)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', cursor: 'pointer' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: '#0f172a' }}>
                      {r.status === 'passed'  && <CheckCircle2 size={13} color={col} />}
                      {r.status === 'failed'  && <XCircle      size={13} color={col} />}
                      {r.status === 'skipped' && <AlertTriangle size={13} color={col} />}
                      {r.status === 'error'   && <XCircle      size={13} color={col} />}
                      {r.file}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800, background: `${col}18`, color: col, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {r.status}
                      </span>
                      {r.output && (expandedOutput[r.file]
                        ? <ChevronDown size={13} color="#94a3b8" />
                        : <ChevronRight size={13} color="#94a3b8" />
                      )}
                    </div>
                  </div>
                  {expandedOutput[r.file] && r.output && (
                    <pre style={{ margin: 0, padding: '8px 12px', background: '#0f172a', color: '#e2e8f0', fontSize: 10.5, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1.55, overflowX: 'auto', maxHeight: 260 }}>
                      {r.output}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Static checks ── */}
      {state.staticResults.length > 0 && (
        <div style={{ borderRadius: 12, border: '1px solid #e6e2db', background: '#fff', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: '#faf9f6', borderBottom: '1px solid #e6e2db', fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 7 }}>
            <Eye size={13} color="#7c3aed" /> Static Vulnerability Check
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {state.staticResults.map(r => {
              const bad = r.still_vulnerable;
              return (
                <div key={r.file} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: bad ? 'rgba(220,38,38,0.05)' : 'rgba(22,163,74,0.05)', border: `1px solid ${bad ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)'}` }}>
                  {bad
                    ? <XCircle      size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                    : <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 1 }} />}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: bad ? '#dc2626' : '#15803d', marginBottom: 3 }}>
                      {r.file}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.5 }}>{r.reason}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Final verdict ── */}
      {state.verdict && (
        <div style={{
          padding: '18px 20px', borderRadius: 14,
          background: state.verdict.passed
            ? 'linear-gradient(135deg,rgba(22,163,74,0.12),rgba(22,163,74,0.06))'
            : 'linear-gradient(135deg,rgba(220,38,38,0.1),rgba(220,38,38,0.05))',
          border: `1px solid ${state.verdict.passed ? 'rgba(22,163,74,0.28)' : 'rgba(220,38,38,0.28)'}`,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: state.verdict.passed ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.12)', border: `1px solid ${state.verdict.passed ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.25)'}` }}>
            {state.verdict.passed
              ? <ShieldCheck size={22} color="#16a34a" />
              : <AlertTriangle size={22} color="#dc2626" />}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: state.verdict.passed ? '#15803d' : '#dc2626', marginBottom: 4 }}>
              {state.verdict.passed ? 'Fix Verified ✓' : 'Fix Not Verified'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: state.verdict.tests_passed ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: state.verdict.tests_passed ? '#15803d' : '#dc2626', border: `1px solid ${state.verdict.tests_passed ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}` }}>
                Tests: {state.verdict.tests_passed ? 'Passed' : 'Failed'}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: state.verdict.static_passed ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: state.verdict.static_passed ? '#15803d' : '#dc2626', border: `1px solid ${state.verdict.static_passed ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}` }}>
                Static Check: {state.verdict.static_passed ? 'Clean' : 'Vulnerable'}
              </span>
            </div>
          </div>
          {state.prUrl && (
            <a href={state.prUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, background: '#fff', border: '1px solid #e6e2db', color: '#0f172a', fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
              <ExternalLink size={12} /> PR #{state.prNumber}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PatchScanPage
// ─────────────────────────────────────────────────────────────────────────────

const PatchScanPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const repoUrl = searchParams.get('repo')   ?? '';
  const branch  = searchParams.get('branch') ?? 'main';
  const fromId  = searchParams.get('from')   ?? '';
  const vulnId  = searchParams.get('vuln')   ?? '';

  const abortRef = useRef<AbortController | null>(null);

  const [state, setState] = useState<VerifyState>({
    phase:         'idle',
    steps:         [],
    tests:         [],
    testResults:   [],
    staticResults: [],
    verdict:       null,
    prUrl:         '',
    prNumber:      0,
    branch:        branch,
    filesChecked:  [],
    error:         '',
  });

  const setPhase = (phase: Phase) =>
    setState(p => ({ ...p, phase }));

  const addStep = (msg: string) =>
    setState(p => ({ ...p, steps: [...p.steps, msg] }));

  const handleSseEvent = useCallback((ev: Record<string, unknown>) => {
    const event = ev.event as string;

    if (event === 'step') {
      const phase = (ev.phase as string) as Phase;
      setState(p => ({ ...p, phase: phase || p.phase }));
      addStep(ev.message as string);
      return;
    }

    if (event === 'test_generated') {
      setState(p => ({
        ...p,
        tests: [...p.tests, {
          file:      ev.file      as string,
          test_file: ev.test_file as string,
          code:      ev.code      as string,
        }],
      }));
      return;
    }

    if (event === 'test_result') {
      setState(p => ({
        ...p,
        testResults: [...p.testResults, {
          file:   ev.file   as string,
          status: ev.status as TestResult['status'],
          output: ev.output as string,
        }],
      }));
      return;
    }

    if (event === 'static_check') {
      setState(p => ({
        ...p,
        staticResults: [...p.staticResults, {
          file:             ev.file             as string,
          still_vulnerable: ev.still_vulnerable as boolean,
          reason:           ev.reason           as string,
        }],
      }));
      return;
    }

    if (event === 'verified') {
      setState(p => ({
        ...p,
        phase:   'done',
        verdict: {
          passed:        ev.passed        as boolean,
          tests_passed:  ev.tests_passed  as boolean,
          static_passed: ev.static_passed as boolean,
        },
        prUrl:        (ev.pr_url    as string) || '',
        prNumber:     (ev.pr_number as number) || 0,
        branch:       (ev.branch    as string) || branch,
        filesChecked: (ev.files_checked as string[]) || [],
      }));
      return;
    }

    if (event === 'error') {
      setState(p => ({
        ...p,
        phase: 'error',
        error: (ev.message as string) || 'An unknown error occurred',
      }));
    }
  }, [branch]);

  // ── Auto-launch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!repoUrl || !fromId) return;

    const launch = async () => {
      abortRef.current = new AbortController();
      setPhase('loading');

      // Auto-fetch github token from gateway
      let githubToken = '';
      try {
        const tr = await fetch('/api/auth/github/token', { credentials: 'include' });
        if (tr.ok) {
          const td = await tr.json();
          githubToken = td.access_token || td.token || '';
        }
      } catch { /* non-fatal */ }

      try {
        const response = await fetch('/api/scan/fix/verify/stream', {
          method:  'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            scan_id:      fromId,
            vuln_id:      vulnId,
            repo_url:     repoUrl,
            branch:       branch,
            github_token: githubToken || undefined,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ detail: 'Verify request failed' }));
          const msg = typeof err?.detail === 'string' ? err.detail : 'Failed to start verification';
          setState(p => ({ ...p, phase: 'error', error: msg }));
          return;
        }

        const reader  = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer    = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try { handleSseEvent(JSON.parse(line.slice(6))); } catch { /* skip */ }
          }
        }

      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setState(p => ({
          ...p, phase: 'error',
          error: err instanceof Error ? err.message : 'Network error',
        }));
      }
    };

    launch();
    return () => { abortRef.current?.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    abortRef.current?.abort();
    window.close();
  };

  // ── Guard — missing repo ──────────────────────────────────────────────────
  if (!repoUrl) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f4f0', fontFamily: "'Instrument Sans',system-ui,sans-serif", gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#fca5a5,#f87171)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(220,38,38,0.25)' }}>
          <AlertTriangle size={24} color="#fff" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Missing repository info</p>
          <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>No repo URL was provided.</p>
        </div>
        <button onClick={() => window.close()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#6366f1)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <ArrowLeft size={14} /> Close tab
        </button>
      </div>
    );
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#f5f4f0', fontFamily: "'Instrument Sans',system-ui,sans-serif" }}>
      <style>{`@keyframes ps-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Navbar */}
      <div style={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'rgba(245,244,240,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e6e2db', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 999, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.22)', fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', color: '#15803d', fontFamily: "'JetBrains Mono',monospace" }}>
            <ShieldCheck size={12} />
            PATCH VERIFICATION
            <span style={{ background: 'rgba(22,163,74,0.12)', borderRadius: 5, padding: '1px 7px', fontSize: 10, fontWeight: 800, color: '#15803d', letterSpacing: '0.04em' }}>
              {state.branch || branch}
            </span>
          </div>
          {fromId && (
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace" }}>
              from {fromId.slice(0, 8)}…
            </span>
          )}
          {state.phase !== 'idle' && state.phase !== 'done' && state.phase !== 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#6366f1', fontWeight: 600 }}>
              <Loader2 size={12} style={{ animation: 'ps-spin 1s linear infinite' }} />
              {PHASE_LABELS[state.phase]}…
            </div>
          )}
          {state.phase === 'done' && state.verdict && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: state.verdict.passed ? '#15803d' : '#dc2626' }}>
              {state.verdict.passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {state.verdict.passed ? 'Fix Verified' : 'Fix Not Verified'}
            </div>
          )}
        </div>
        <button onClick={handleClose} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e6e2db', background: '#fff', fontSize: 12.5, color: '#4a4755', cursor: 'pointer', fontWeight: 600 }}>
          <ArrowLeft size={13} /> Close
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 10, padding: 12 }}>

        {/* Left — PR info + files patched */}
        <div style={{ width: 300, flexShrink: 0, background: '#fff', borderRadius: 16, border: '1px solid #e6e2db', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid #e6e2db', background: '#faf9f6', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>Fix Details</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>PR · files patched</div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <LeftPanel fromId={fromId} />
          </div>
        </div>

        {/* Right — Verification stream */}
        <div style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 16, border: '1px solid #e6e2db', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid #e6e2db', background: '#faf9f6', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>Verification</div>
            <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
              test generation · pytest · static LLM check
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <RightPanel state={state} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatchScanPage;
