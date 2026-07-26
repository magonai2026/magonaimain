import React, { useState } from 'react';
import {
  CheckCircle2, ChevronDown, ChevronUp, Shield, FileCode,
  GitBranch, FolderOpen, GitPullRequest, X, Download, Maximize2,
} from 'lucide-react';
import type { ScanPhase, DeepScanResult, Vulnerability } from './scanTypes';
import FixModal from './FixModal';
import { safeStr, SEVERITY_CONFIG } from './scanVisualUtils';

interface ScanVisualProps {
  phase: ScanPhase;
  categoriesComplete: string[];
  result: DeepScanResult | null;
  githubToken?: string;
}

const ScanVisual: React.FC<ScanVisualProps> = ({ phase, categoriesComplete, result, githubToken = '' }) => {
  const [filter,         setFilter]         = useState<string | null>(null);
  const [expanded,       setExpanded]       = useState<string | null>(null);
  const [fixVuln,        setFixVuln]        = useState<Vulnerability | null>(null);
  const [fullscreenVuln, setFullscreenVuln] = useState<Vulnerability | null>(null);

  const isActive   = !['complete', 'error', 'idle'].includes(phase);
  const isComplete = phase === 'complete';
  const isError    = phase === 'error';

  const laserColor  = isComplete ? '#22c55e' : isError ? '#ef4444' : '#6366f1';
  const shieldColor = isComplete ? '#16a34a' : isError ? '#dc2626' : '#6366f1';

  const vulns = result
    ? (filter ? result.vulnerabilities.filter((v: Vulnerability) => v.severity === filter) : result.vulnerabilities)
    : [];

  return (
    <div style={{
      width: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      padding: isComplete ? '28px 28px 100px' : '2rem 2rem',
      gap: 24,
      boxSizing: 'border-box',
    }}>

      {/* Fix PR modal */}
      {fixVuln && result && (
        <FixModal
          vuln={fixVuln}
          scanId={result.scan_id}
          repoUrl={result.repo_url}
          githubToken={githubToken}
          onClose={() => setFixVuln(null)}
        />
      )}

      {/* ── Fullscreen vulnerability preview ─────────────────────────────── */}
      {fullscreenVuln && (() => {
        const v = fullscreenVuln;
        const c = SEVERITY_CONFIG[v.severity] ?? SEVERITY_CONFIG.info;
        const SevIcon = c.icon;
        return (
          <div
            onClick={() => setFullscreenVuln(null)}
            style={{
              position: 'fixed', top: 70, left: 0, right: 0, bottom: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.55)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              padding: '20px 24px 24px',
              overflowY: 'auto',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 980,
                background: '#fff', borderRadius: 22,
                boxShadow: `0 32px 80px rgba(0,0,0,0.22), ${c.glow}`,
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                fontFamily: "'Instrument Sans', system-ui, sans-serif",
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '18px 22px',
                background: c.headerBg,
                borderBottom: `1px solid ${c.glassBorder}`,
                flexShrink: 0,
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                  color: '#fff', textTransform: 'uppercase',
                  background: `linear-gradient(135deg, ${c.color}, ${c.light})`,
                  padding: '4px 11px', borderRadius: 8, flexShrink: 0,
                  boxShadow: `0 2px 8px ${c.color}50`,
                }}>
                  <SevIcon size={9} /> {c.label}
                </span>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                  {safeStr(v.title)}
                </span>
                <button
                  onClick={() => setFullscreenVuln(null)}
                  style={{
                    width: 30, height: 30, borderRadius: 9, border: '1px solid #e2e8f0',
                    background: '#f8fafc', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b',
                  }}
                ><X size={14} /></button>
              </div>

              <div style={{ padding: '22px 24px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
                  <span style={{
                    fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                    color: '#1e293b', background: '#f1f5f9', border: '1px solid #e2e8f0',
                    borderRadius: 7, padding: '4px 10px',
                  }}>📁 {safeStr(v.file_path)}{v.line_number ? `:${v.line_number}` : ''}</span>
                  {v.cwe_id && (
                    <span style={{
                      fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                      color: '#7c3aed', background: 'rgba(124,58,237,0.08)',
                      border: '1px solid rgba(124,58,237,0.2)', borderRadius: 7, padding: '4px 10px',
                    }}>🔖 {safeStr(v.cwe_id)}</span>
                  )}
                  {v.cvss_score != null && (
                    <span style={{
                      fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                      color: c.color, background: c.tint, border: `1px solid ${c.glassBorder}`,
                      borderRadius: 7, padding: '4px 10px',
                    }}>⚠ CVSS {v.cvss_score}</span>
                  )}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: c.color, opacity: 0.8, marginBottom: 8 }}>Description</div>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75, margin: 0 }}>{safeStr(v.description)}</p>
                </div>

                {v.vulnerable_code && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#64748b', marginBottom: 8 }}>Vulnerable Code</div>
                    <pre style={{
                      fontSize: 12.5, background: 'rgba(15,23,42,0.92)', color: '#e2e8f0',
                      padding: '16px 18px', borderRadius: 12, overflow: 'auto',
                      lineHeight: 1.7, fontFamily: "'JetBrains Mono', monospace",
                      border: `1px solid ${c.glassBorder}`,
                      boxShadow: `inset 0 2px 8px rgba(0,0,0,0.3), ${c.glow}`,
                      margin: 0,
                    }}>{safeStr(v.vulnerable_code)}</pre>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: v.cross_file_impact ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 20 }}>
                  {v.fix_suggestion && (
                    <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#15803d', marginBottom: 8 }}>✅ Recommended Fix</div>
                      <div style={{ fontSize: 13.5, color: '#166534', lineHeight: 1.7 }}>{safeStr(v.fix_suggestion)}</div>
                    </div>
                  )}
                  {v.cross_file_impact && (
                    <div style={{ background: 'rgba(234,88,12,0.07)', border: '1px solid rgba(234,88,12,0.22)', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#c2410c', marginBottom: 8 }}>⚡ Cross-File Impact</div>
                      <div style={{ fontSize: 13.5, color: '#9a3412', lineHeight: 1.7 }}>{safeStr(v.cross_file_impact)}</div>
                    </div>
                  )}
                </div>

                {result && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setFullscreenVuln(null); setFixVuln(v); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '9px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 600,
                        background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                        color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                      }}
                    >
                      {result.repo_url.startsWith('upload://')
                        ? <><Download size={14} /> Download Fix</>
                        : <><GitPullRequest size={14} /> Create Fix PR</>
                      }
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Scanner box — shown during scan ──────────────────────────────── */}
      {!isComplete && (
        <div style={{
          position: 'relative',
          width: 320, maxWidth: 400, height: 320,
          background: '#FDFBF7', borderRadius: 20, overflow: 'hidden',
          border: '1px solid #DCD3C6',
          boxShadow: '0 8px 32px rgba(100,80,60,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.45, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(100,80,60,0.09) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }} />
          <div style={{
            position: 'relative', zIndex: 10,
            width: 240, height: 240,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              width: 160, height: 100,
              background: '#EAE3D5', borderRadius: 10, border: '1px solid #DCD3C6',
            }}>
              <div style={{
                position: 'absolute', top: -13, left: -1, width: 60, height: 20,
                background: '#EAE3D5', borderRadius: '6px 6px 0 0',
                border: '1px solid #DCD3C6', borderBottom: 'none',
              }} />
            </div>
            <div style={{
              position: 'absolute', bottom: 44, left: 18,
              width: 72, height: 92, background: '#FDFBF7', borderRadius: 7,
              border: '1px solid #DCD3C6', boxShadow: '0 4px 12px rgba(100,80,60,0.1)',
              padding: '8px 7px',
              animation: isActive ? 'sp-float1 4s ease-in-out infinite' : 'none',
            }}>
              <div style={{ width: '55%', height: 6, background: '#c7d2fe', borderRadius: 3, marginBottom: 6 }} />
              <div style={{ width: '100%', height: 4, background: '#EAE3D5', borderRadius: 2, marginBottom: 4 }} />
              <div style={{ width: '85%',  height: 4, background: '#EAE3D5', borderRadius: 2, marginBottom: 4 }} />
              <div style={{ width: '70%',  height: 4, background: '#EAE3D5', borderRadius: 2 }} />
              <FileCode size={14} color="#C2B8A8" style={{ position: 'absolute', bottom: 7, right: 7 }} />
            </div>
            <div style={{
              position: 'absolute', bottom: 44, right: 18,
              width: 72, height: 92, background: '#FDFBF7', borderRadius: 7,
              border: '1px solid #DCD3C6', boxShadow: '0 4px 12px rgba(100,80,60,0.1)',
              padding: '8px 7px',
              animation: isActive ? 'sp-float2 5s ease-in-out 0.5s infinite' : 'none',
            }}>
              <div style={{
                width: '100%', height: 42, background: '#F4EFE6', borderRadius: 5, marginBottom: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #EAE3D5',
              }}>
                <GitBranch size={16} color="#C2B8A8" />
              </div>
              <div style={{ width: '75%', height: 4, background: '#EAE3D5', borderRadius: 2, marginBottom: 4 }} />
              <div style={{ width: '55%', height: 4, background: '#EAE3D5', borderRadius: 2 }} />
            </div>
            <div style={{
              position: 'absolute', bottom: 54, left: '50%', transform: 'translateX(-50%)',
              width: 88, height: 112, background: '#FDFBF7', borderRadius: 10,
              border: `1px solid ${isComplete ? 'rgba(22,163,74,0.35)' : '#DCD3C6'}`,
              boxShadow: isComplete ? '0 8px 24px rgba(22,163,74,0.15)' : '0 8px 24px rgba(100,80,60,0.15)',
              padding: '10px 10px', zIndex: 5,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              animation: isActive ? 'sp-float3 4.5s ease-in-out 1s infinite' : 'none',
              transition: 'border 0.4s, box-shadow 0.4s',
            }}>
              <div style={{ width: '100%', height: 8, background: shieldColor, borderRadius: 3, marginBottom: 10, opacity: 0.85 }} />
              <div style={{ width: '100%', height: 5, background: '#EAE3D5', borderRadius: 2, marginBottom: 5 }} />
              <div style={{ width: '100%', height: 5, background: '#EAE3D5', borderRadius: 2, marginBottom: 5 }} />
              <div style={{ width: '80%',  height: 5, background: '#EAE3D5', borderRadius: 2, marginBottom: 12 }} />
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: isComplete ? 'rgba(22,163,74,0.12)' : isError ? 'rgba(220,38,38,0.08)' : 'rgba(99,102,241,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Shield size={18} color={shieldColor} />
              </div>
            </div>
            <div style={{
              position: 'absolute', bottom: 16, left: '50%',
              transform: 'translateX(-50%) skewX(-6deg)',
              width: 172, height: 70, background: '#FDFBF7', borderRadius: 10,
              border: '1px solid #DCD3C6', boxShadow: '0 -4px 16px rgba(100,80,60,0.07)',
              zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FolderOpen size={28} color={isComplete ? 'rgba(22,163,74,0.35)' : 'rgba(99,102,241,0.3)'} />
            </div>
          </div>

          {isActive && (
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '40%',
              pointerEvents: 'none', zIndex: 30,
              animation: 'sp-laser 3.5s cubic-bezier(0.4,0,0.2,1) infinite',
            }}>
              <div style={{
                width: '100%', height: '100%',
                background: `linear-gradient(to bottom, transparent, ${laserColor}08, ${laserColor}1a)`,
                borderBottom: `2px solid ${laserColor}`,
                boxShadow: `0 5px 18px ${laserColor}30`,
              }} />
              <div style={{
                position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
                width: '70%', height: 2, background: laserColor, borderRadius: 999,
                boxShadow: `0 0 12px ${laserColor}`,
              }} />
            </div>
          )}
          {isComplete && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 60%, rgba(22,163,74,0.07) 0%, transparent 70%)',
              pointerEvents: 'none', zIndex: 25,
            }} />
          )}
        </div>
      )}

      {/* ── Category progress counter ─────────────────────────────────────── */}
      {!isComplete && categoriesComplete.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 360 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 14px', borderRadius: 999,
            fontSize: 11, fontWeight: 600,
            background: 'rgba(22,163,74,0.1)', color: '#15803d',
            border: '1px solid rgba(22,163,74,0.22)',
            animation: 'sp-fadein 0.3s ease',
          }}>
            <CheckCircle2 size={10} />
            {categoriesComplete.length} {categoriesComplete.length === 1 ? 'check' : 'checks'} complete
          </span>
        </div>
      )}

      {/* ── Results panel ────────────────────────────────────────────────── */}
      {isComplete && result && (
        <div style={{ width: '100%', animation: 'sp-slideup 0.4s ease' }}>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { val: result.total_files,                  lbl: 'Files',   accent: '#6366f1' },
              { val: result.total_lines.toLocaleString(), lbl: 'Lines',   accent: '#0ea5e9' },
              { val: result.vulnerabilities.length,        lbl: 'Vulns',   accent: '#ef4444' },
              { val: result.total_categories,              lbl: 'Domains', accent: '#10b981' },
            ].map(({ val, lbl, accent }) => (
              <div key={lbl} style={{
                padding: '14px 10px', textAlign: 'center',
                background: 'rgba(255,255,255,0.28)',
                border: '1px solid rgba(255,255,255,0.55)',
                borderRadius: 14,
                backdropFilter: 'blur(20px) saturate(200%)',
                WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                boxShadow: `0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8), 0 0 0 1px ${accent}18`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: '14px 14px 0 0', opacity: 0.7 }} />
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', lineHeight: 1, letterSpacing: '-0.03em', marginTop: 4 }}>{val}</div>
                <div style={{ fontSize: 9.5, color: '#9ca3af', marginTop: 5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* Severity filter chips */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {(['critical', 'high', 'medium', 'low', 'info'] as const).map(sev => {
              const n = result.severity_counts[sev];
              if (!n) return null;
              const c  = SEVERITY_CONFIG[sev];
              const on = filter === sev;
              return (
                <button key={sev} onClick={() => setFilter(on ? null : sev)} style={{
                  padding: '5px 14px', borderRadius: 999, cursor: 'pointer',
                  fontSize: 11.5, fontWeight: 700,
                  background: on ? `linear-gradient(135deg, ${c.color}, ${c.light})` : 'rgba(255,255,255,0.45)',
                  color: on ? '#fff' : c.color,
                  border: `1px solid ${on ? 'transparent' : c.glassBorder}`,
                  backdropFilter: on ? 'none' : 'blur(12px)',
                  transition: 'all .18s', fontFamily: 'inherit',
                  boxShadow: on ? `0 4px 14px ${c.color}50` : `inset 0 1px 0 rgba(255,255,255,0.6)`,
                }}>
                  {n} {c.label}
                </button>
              );
            })}
            {filter && (
              <button onClick={() => setFilter(null)} style={{
                padding: '5px 11px', borderRadius: 999, cursor: 'pointer',
                fontSize: 11, fontWeight: 600,
                background: 'rgba(255,255,255,0.3)', color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.4)',
                backdropFilter: 'blur(8px)', fontFamily: 'inherit',
              }}>Clear ✕</button>
            )}
          </div>

          {/* Summary */}
          {(() => {
            const raw = result.summary as unknown;
            const summaryText =
              typeof raw === 'string' ? raw
              : raw && typeof (raw as any).summary === 'string' ? (raw as any).summary
              : null;
            if (!summaryText) return null;
            return (
              <p style={{
                fontSize: 13, color: '#4b5563', lineHeight: 1.7,
                background: 'rgba(255,255,255,0.32)', borderRadius: 12,
                padding: '12px 16px', border: '1px solid rgba(255,255,255,0.55)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.75)',
                margin: 0, marginBottom: 18,
              }}>
                {summaryText}
              </p>
            );
          })()}

          {/* Vulnerability cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vulns.map((vuln: Vulnerability) => {
              const c    = SEVERITY_CONFIG[vuln.severity] ?? SEVERITY_CONFIG.info;
              const open = expanded === vuln.id;
              const SevIcon = c.icon;
              return (
                <div key={vuln.id} style={{
                  borderRadius: 16, overflow: 'hidden',
                  border: `1px solid ${open ? c.glassBorder : 'rgba(255,255,255,0.5)'}`,
                  background: open ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.22)',
                  backdropFilter: 'blur(20px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(200%)',
                  transition: 'all .25s cubic-bezier(0.4,0,0.2,1)',
                  boxShadow: open
                    ? `${c.glow}, 0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)`
                    : '0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}>

                  {/* Card header */}
                  <div
                    onClick={() => setExpanded(open ? null : vuln.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 16px', cursor: 'pointer',
                      background: open ? 'rgba(255,255,255,0.6)' : 'transparent',
                      transition: 'background .2s',
                    }}
                  >
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 9.5, fontWeight: 800, letterSpacing: '0.08em', color: '#fff',
                      background: `linear-gradient(135deg, ${c.color} 0%, ${c.light} 100%)`,
                      padding: '4px 10px', borderRadius: 8, minWidth: 58,
                      textAlign: 'center' as const, justifyContent: 'center',
                      textTransform: 'uppercase' as const, flexShrink: 0,
                      boxShadow: `0 2px 8px ${c.color}50`,
                    }}>
                      <SevIcon size={8} />{c.label}
                    </span>
                    <span style={{ fontSize: 13.5, color: '#1e293b', flex: 1, fontWeight: 600, lineHeight: 1.35 }}>
                      {safeStr(vuln.title)}
                    </span>
                    <span style={{
                      fontSize: 10.5, color: '#1e293b', marginRight: 4,
                      fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                      background: 'rgba(255,255,255,0.85)', padding: '3px 8px',
                      borderRadius: 5, border: '1px solid rgba(0,0,0,0.15)',
                      fontWeight: 600, maxWidth: 160,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {safeStr(vuln.file_path).split('/').pop()}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFullscreenVuln(vuln); }}
                      title="Full preview"
                      style={{
                        width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(0,0,0,0.1)',
                        background: 'rgba(255,255,255,0.7)', cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#64748b', marginRight: 4, transition: 'background .15s, color .15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#7c3aed'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.7)'; (e.currentTarget as HTMLButtonElement).style.color = '#64748b'; }}
                    >
                      <Maximize2 size={11} />
                    </button>
                    <div style={{
                      width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                      background: open ? `${c.color}18` : 'rgba(0,0,0,0.06)',
                      border: `1px solid ${open ? c.glassBorder : 'rgba(0,0,0,0.08)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all .2s',
                    }}>
                      {open ? <ChevronUp size={12} color={c.color} /> : <ChevronDown size={12} color="#94a3b8" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {open && (
                    <div style={{ borderTop: `1px solid ${c.glassBorder}` }}>
                      <div style={{ padding: '16px 18px 0' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: c.color, marginBottom: 6, opacity: 0.8 }}>Details</div>
                        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, margin: 0, marginBottom: 12 }}>{safeStr(vuln.description)}</p>
                      </div>
                      <div style={{ padding: '0 18px', display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                        <span style={{ fontSize: 10.5, color: '#475569', background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 6, padding: '3px 9px', fontFamily: "'JetBrains Mono', monospace" }}>
                          📁 {safeStr(vuln.file_path)}{vuln.line_number ? `:${vuln.line_number}` : ''}
                        </span>
                        {vuln.cwe_id && (
                          <span style={{ fontSize: 10.5, color: '#7c3aed', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, padding: '3px 9px', fontFamily: "'JetBrains Mono', monospace" }}>
                            🔖 {safeStr(vuln.cwe_id)}
                          </span>
                        )}
                        {vuln.cvss_score != null && (
                          <span style={{ fontSize: 10.5, color: c.color, background: c.tint, border: `1px solid ${c.glassBorder}`, borderRadius: 6, padding: '3px 9px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                            ⚠ CVSS {vuln.cvss_score}
                          </span>
                        )}
                      </div>
                      {vuln.vulnerable_code && (
                        <div style={{ padding: '0 18px', marginBottom: 14 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const, color: '#64748b', marginBottom: 7 }}>Vulnerable Code</div>
                          <pre style={{
                            fontSize: 11.5, background: 'rgba(15,23,42,0.88)', color: '#e2e8f0',
                            padding: '14px 16px', borderRadius: 10, overflow: 'auto',
                            lineHeight: 1.65, fontFamily: "'JetBrains Mono', monospace",
                            border: `1px solid ${c.glassBorder}`,
                            boxShadow: `inset 0 2px 8px rgba(0,0,0,0.3), ${c.glow}`,
                            margin: 0,
                          }}>{safeStr(vuln.vulnerable_code)}</pre>
                        </div>
                      )}
                      <div style={{ padding: '0 18px', display: 'grid', gridTemplateColumns: vuln.cross_file_impact ? '1fr 1fr' : '1fr', gap: 10 }}>
                        {vuln.fix_suggestion && (
                          <div style={{ background: 'rgba(22,163,74,0.09)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 10, padding: '12px 14px', backdropFilter: 'blur(8px)' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#15803d', marginBottom: 6 }}>✅ Recommended Fix</div>
                            <div style={{ fontSize: 12.5, color: '#166534', lineHeight: 1.65 }}>{safeStr(vuln.fix_suggestion)}</div>
                          </div>
                        )}
                        {vuln.cross_file_impact && (
                          <div style={{ background: 'rgba(234,88,12,0.07)', border: '1px solid rgba(234,88,12,0.22)', borderRadius: 10, padding: '12px 14px', backdropFilter: 'blur(8px)' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#c2410c', marginBottom: 6 }}>⚡ Cross-File Impact</div>
                            <div style={{ fontSize: 12.5, color: '#9a3412', lineHeight: 1.65 }}>{safeStr(vuln.cross_file_impact)}</div>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '14px 18px 18px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setFixVuln(vuln); }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 600,
                            background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            fontFamily: "'Instrument Sans', system-ui, sans-serif",
                            boxShadow: '0 3px 12px rgba(99,102,241,0.35)',
                            transition: 'transform .15s, box-shadow .15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 5px 18px rgba(99,102,241,0.45)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 3px 12px rgba(99,102,241,0.35)'; }}
                        >
                          {result?.repo_url.startsWith('upload://')
                            ? <><Download size={13} /> Download Fix</>
                            : <><GitPullRequest size={13} /> Create Fix PR</>
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {vulns.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '2.5rem', color: '#9ca3af', fontSize: 13,
                background: 'rgba(255,255,255,0.25)', borderRadius: 14,
                border: '1px dashed rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)',
              }}>
                No vulnerabilities match this filter.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanVisual;