import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ZapAlert {
    name:        string;
    url:         string;
    risk:        string;
    param?:      string;
    solution?:   string;
    description?: string;
    cweid?:      string;
    reference?:  string;
    evidence?:   string;
    score?:      number;   // [NEW] priority score from backend (High=40+, Med=20+, etc.)
    pluginId?:   string;
}

interface Coverage {
    urlsDiscovered?:  number;
    urlsScanned?:     number;
    attackJobs?:      number;
    attackCompleted?: number;
    coveragePct?:     number;
}

interface ReportData {
    scanId:       string;
    target:       string;
    scanned_at?:  string;
    completedAt?: string;
    auth?:        { type?: string };
    parallelScan?: boolean;
    useBrowser?:   boolean;
    openApiUrl?:   string;
    summary: {
        High?:          number;
        Medium?:        number;
        Low?:           number;
        Informational?: number;
        totalRiskScore?: number;  // [NEW]
    };
    alerts: {
        High?:          ZapAlert[];
        Medium?:        ZapAlert[];
        Low?:           ZapAlert[];
        Informational?: ZapAlert[];
    };
    coverage?: Coverage;  // [NEW]
}

// [NEW] GraphQL alerts come back with pluginId='GQL'
type SeverityTab = 'all' | 'high' | 'medium' | 'low' | 'informational' | 'graphql';

const SEVERITY_COLORS: Record<string, string> = {
    High: '#ef4444', Medium: '#f59e0b', Low: '#fbbf24', Informational: '#3b82f6',
};
const SEVERITY_CLASS: Record<string, string> = {
    High: 'high', Medium: 'medium', Low: 'low', Informational: 'blue',
};

// ── Security helpers ──────────────────────────────────────────────────────────

function esc(s: unknown): string {
    if (s == null) return '';
    return String(s)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#x27;');
}

function safeHref(url: unknown): string {
    if (!url) return '#';
    const s = String(url).trim();
    try {
        const parsed = new URL(s);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return s;
    } catch { /* not valid absolute URL */ }
    return '#';
}

const MAX_EVIDENCE_DISPLAY = 300;

function truncateEvidence(evidence: string | undefined): string {
    if (!evidence) return '';
    const s = String(evidence);
    if (s.length <= MAX_EVIDENCE_DISPLAY) return s;
    return s.slice(0, MAX_EVIDENCE_DISPLAY) + `… [${s.length - MAX_EVIDENCE_DISPLAY} chars hidden]`;
}

// ── HTML Report Generator ─────────────────────────────────────────────────────

const generateHTMLReport = (report: ReportData): string => {
    const high   = report.summary?.High          ?? 0;
    const medium = report.summary?.Medium         ?? 0;
    const low    = report.summary?.Low            ?? 0;
    const info   = report.summary?.Informational  ?? 0;
    const total  = high + medium + low + info;
    const riskScore = Math.min(100, Math.round(high * 10 + medium * 5 + low * 2 + info * 0.5));
    const riskLabel = riskScore >= 70 ? 'High Risk' : riskScore >= 40 ? 'Medium Risk' : riskScore >= 10 ? 'Low Risk' : 'Minimal Risk';
    const riskColor = riskScore >= 70 ? '#ef4444' : riskScore >= 40 ? '#f59e0b' : '#10b981';
    const scanDate  = report.completedAt || report.scanned_at
        ? new Date((report.completedAt || report.scanned_at)!).toLocaleString()
        : '—';

    const allAlerts: (ZapAlert & { severity: string })[] = [
        ...(report.alerts?.High          || []).map(a => ({ ...a, severity: 'High' })),
        ...(report.alerts?.Medium        || []).map(a => ({ ...a, severity: 'Medium' })),
        ...(report.alerts?.Low           || []).map(a => ({ ...a, severity: 'Low' })),
        ...(report.alerts?.Informational || []).map(a => ({ ...a, severity: 'Informational' })),
    ];

    const badge = (sev: string) => {
        const map: Record<string, string> = {
            High: '#fef2f2:#ef4444', Medium: '#fffbeb:#f59e0b',
            Low: '#fefce8:#ca8a04', Informational: '#eff6ff:#3b82f6',
        };
        const [bg, color] = (map[sev] || '#f3f4f6:#6b7280').split(':');
        return `<span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:600;background:${bg};color:${color}">${esc(sev)}</span>`;
    };

    const severityIcon = (sev: string) => ({ High: '🔴', Medium: '🟠', Low: '🟡', Informational: '⚪' }[sev] || '⚪');

    const alertRows = allAlerts.map((a, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb">
                <div style="font-weight:600;font-size:13px;color:#111827">${esc(a.name) || '—'}</div>
                ${a.cweid ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">CWE-${esc(a.cweid)}</div>` : ''}
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb">${badge(a.severity)}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#4b5563;word-break:break-all;max-width:220px">
                <a href="${safeHref(a.url)}" target="_blank" rel="noopener noreferrer"
                   style="color:#4b5563;text-decoration:underline;word-break:break-all">
                    ${esc(a.url) || '—'}
                </a>
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#4b5563">${esc(a.param) || '—'}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6366f1;font-weight:600">${a.score ?? '—'}</td>
        </tr>
        ${(a.description || a.solution || a.evidence || a.reference) ? `
        <tr style="background:#f8faff">
            <td colspan="5" style="padding:0 16px 16px 32px;border-bottom:2px solid #e5e7eb">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-top:10px">
                    ${a.description ? `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px"><div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Description</div><p style="font-size:12px;color:#374151;line-height:1.6;margin:0">${esc(a.description)}</p></div>` : ''}
                    ${a.solution ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px"><div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">🔧 Recommended Fix</div><p style="font-size:12px;color:#374151;line-height:1.6;margin:0">${esc(a.solution)}</p></div>` : ''}
                    ${a.evidence ? `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px"><div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Evidence <span style="font-size:9px;color:#d97706;font-weight:400">(may contain sensitive data)</span></div><code style="font-size:11px;color:#374151;word-break:break-all;white-space:pre-wrap">${esc(truncateEvidence(a.evidence))}</code></div>` : ''}
                    ${a.reference ? `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px"><div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">References</div><div style="font-size:11px;line-height:1.8">${a.reference.split('\n').filter(Boolean).slice(0, 4).map(r => { const href = safeHref(r.trim()); if (href === '#') return ''; return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#4f46e5;display:block;word-break:break-all">${esc(r.trim())}</a>`; }).join('')}</div></div>` : ''}
                </div>
            </td>
        </tr>` : ''}
    `).join('');

    const severitySection = (label: string, sev: string, items: (ZapAlert & { severity: string })[]) => {
        if (!items.length) return '';
        const rows = items.map((a, i) => `
            <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb"><div style="font-weight:600;font-size:13px;color:#111827">${esc(a.name) || '—'}</div>${a.cweid ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">CWE-${esc(a.cweid)}</div>` : ''}</td>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb">${badge(a.severity)}</td>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#4b5563;word-break:break-all;max-width:220px"><a href="${safeHref(a.url)}" target="_blank" rel="noopener noreferrer" style="color:#4b5563;text-decoration:underline;word-break:break-all">${esc(a.url) || '—'}</a></td>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#4b5563">${esc(a.param) || '—'}</td>
                <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#6366f1;font-weight:600">${a.score ?? '—'}</td>
            </tr>
            ${(a.description || a.solution) ? `<tr style="background:#f8faff"><td colspan="5" style="padding:0 16px 16px 32px;border-bottom:2px solid #e5e7eb"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-top:10px">${a.description ? `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px"><div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Description</div><p style="font-size:12px;color:#374151;line-height:1.6;margin:0">${esc(a.description)}</p></div>` : ''}${a.solution ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px"><div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">🔧 Recommended Fix</div><p style="font-size:12px;color:#374151;line-height:1.6;margin:0">${esc(a.solution)}</p></div>` : ''}</div></td></tr>` : ''}
        `).join('');
        return `<div style="margin-bottom:32px"><h3 style="font-size:15px;font-weight:700;color:#111827;margin:0 0 12px;display:flex;align-items:center;gap:8px">${severityIcon(sev)} ${esc(label)} <span style="font-size:12px;font-weight:400;color:#6b7280">(${items.length})</span></h3><table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;font-family:inherit"><thead><tr style="background:#f3f4f6"><th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Vulnerability</th><th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Severity</th><th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Affected URL</th><th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Parameter</th><th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">Score</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    };

    

    const coverageHtml = report.coverage ? `
        <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:12px;font-size:12px;color:#6b7280">
            <span>🌐 URLs discovered: <strong>${report.coverage.urlsDiscovered ?? '—'}</strong></span>
            <span>🔍 URLs scanned: <strong>${report.coverage.urlsScanned ?? '—'}</strong></span>
            <span>⚡ Attack coverage: <strong>${report.coverage.coveragePct ?? '—'}%</strong></span>
        </div>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'self';">
<title>DAST Security Report — ${esc(report.target)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; color: #111827; }
  @media print { body { background: #fff; } .no-print { display: none !important; } .page-break { page-break-before: always; } }
</style>
</head>
<body>
<div style="max-width:1100px;margin:0 auto;padding:40px 24px">
  <div style="background:#fff;border-radius:16px;padding:32px;margin-bottom:24px;border:1px solid #e5e7eb">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
      <div><h1 style="font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.02em">DAST Security Report</h1><p style="color:#6b7280;font-size:14px;margin-top:4px">Generated by Niyantri Security AI</p></div>
      <div style="text-align:right;font-size:12px;color:#9ca3af"><div>${esc(scanDate)}</div><div style="margin-top:4px">Scan ID: ${esc(report.scanId)}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">
      <div style="background:#fef2f2;border-radius:10px;padding:16px;text-align:center"><div style="font-size:11px;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">High</div><div style="font-size:28px;font-weight:800;color:#ef4444">${high}</div></div>
      <div style="background:#fffbeb;border-radius:10px;padding:16px;text-align:center"><div style="font-size:11px;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Medium</div><div style="font-size:28px;font-weight:800;color:#f59e0b">${medium}</div></div>
      <div style="background:#fefce8;border-radius:10px;padding:16px;text-align:center"><div style="font-size:11px;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Low</div><div style="font-size:28px;font-weight:800;color:#ca8a04">${low}</div></div>
      <div style="background:#eff6ff;border-radius:10px;padding:16px;text-align:center"><div style="font-size:11px;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Info</div><div style="font-size:28px;font-weight:800;color:#3b82f6">${info}</div></div>
      <div style="background:#f5f3ff;border-radius:10px;padding:16px;text-align:center"><div style="font-size:11px;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Risk Score</div><div style="font-size:28px;font-weight:800;color:${riskColor}">${riskScore}</div><div style="font-size:10px;color:${riskColor}">${riskLabel}</div></div>
    </div>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;display:flex;gap:24px;flex-wrap:wrap;font-size:12px;color:#6b7280">
      <span>🎯 Target: <a href="${safeHref(report.target)}" style="color:#4f46e5">${esc(report.target)}</a></span>
      <span>🔐 Auth: <strong>${esc(report.auth?.type || 'none')}</strong></span>
      ${report.openApiUrl ? `<span>📄 OpenAPI: <strong>${esc(report.openApiUrl)}</strong></span>` : ''}
      ${report.parallelScan ? `<span>⚡ Parallel scan</span>` : ''}
      ${report.useBrowser   ? `<span>🌐 Playwright browser</span>` : ''}
    </div>
    ${coverageHtml}
  </div>
  ${total > 0 ? `<div style="background:#fff;border-radius:16px;padding:32px;margin-bottom:24px;border:1px solid #e5e7eb"><h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:20px">All Findings (${total})</h2><table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden"><thead><tr style="background:#f3f4f6"><th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase">Vulnerability</th><th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase">Severity</th><th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase">URL</th><th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase">Parameter</th><th style="text-align:left;padding:10px 16px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase">Score</th></tr></thead><tbody>${alertRows}</tbody></table></div>` : '<div style="text-align:center;padding:60px;color:#6b7280;background:#fff;border-radius:14px;border:1px solid #e5e7eb"><div style="font-size:40px;margin-bottom:12px">✅</div><p style="font-size:16px;font-weight:600">No vulnerabilities found</p></div>'}
  ${high > 0 ? `<div class="page-break"></div><h2 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #e5e7eb">Findings by Severity</h2>` : ''}
  ${severitySection('High Severity',   'High',          (report.alerts?.High          || []).map(a => ({ ...a, severity: 'High' })))}
  ${severitySection('Medium Severity', 'Medium',        (report.alerts?.Medium        || []).map(a => ({ ...a, severity: 'Medium' })))}
  ${severitySection('Low Severity',    'Low',           (report.alerts?.Low           || []).map(a => ({ ...a, severity: 'Low' })))}
  ${severitySection('Informational',   'Informational', (report.alerts?.Informational || []).map(a => ({ ...a, severity: 'Informational' })))}
  <div style="margin-top:48px;padding-top:24px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:12px;color:#9ca3af">Generated by Niyantri Security AI · DAST Module</div>
    <div style="font-size:12px;color:#9ca3af">${esc(scanDate)}</div>
  </div>
</div>
</body>
</html>`;
};

const downloadHTMLReport = (report: ReportData) => {
    const html = generateHTMLReport(report);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    const safeId = (report.scanId || 'report').replace(/[^a-zA-Z0-9_-]/g, '');
    a.download = `niyantri_dast_report_${safeId}_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
};

// ── Detail Section ────────────────────────────────────────────────────────────

const DetailSection = ({
    title, children, highlight = false,
}: { title: string; children: React.ReactNode; highlight?: boolean }) => (
    <div style={{
        background: highlight ? 'rgba(16,185,129,0.04)' : 'var(--surface2)',
        border: `1px solid ${highlight ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
        borderRadius: '8px', padding: '0.75rem 1rem',
    }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
            {title}
        </div>
        {children}
    </div>
);

// ── Main Component ────────────────────────────────────────────────────────────

const DastResultPage = () => {
    const location = useLocation();
    const navigate  = useNavigate();

    const [report, setReport]               = useState<ReportData | null>(location.state?.report ?? null);
    const [loading, setLoading]             = useState<boolean>(!location.state?.report);
    const [error, setError]                 = useState<string | null>(null);
    const [activeTab, setActiveTab]         = useState<SeverityTab>('all');
    const [selectedAlert, setSelectedAlert] = useState<(ZapAlert & { severity: string }) | null>(null);
    const [sortByScore, setSortByScore]     = useState<boolean>(true); // [NEW] default sort by priority score

    const fetchReport = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const existingScanId = report?.scanId;
            if (existingScanId) {
                if (!/^[a-f0-9]{24}$/i.test(existingScanId)) throw new Error("Invalid scan ID");
                const res = await fetch(`/api/dast/report/${encodeURIComponent(existingScanId)}`);
                if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `HTTP ${res.status}`); }
                setReport(await res.json());
                return;
            }
            const listRes = await fetch('/api/dast/reports?page=1&limit=1');
            if (!listRes.ok) { const d = await listRes.json().catch(() => ({})); throw new Error(d.error || `HTTP ${listRes.status}`); }
            const listData = await listRes.json();
            const latest = listData.reports?.[0];
            if (!latest) throw new Error('No scan reports found');
            if (!latest.scanId || !/^[a-f0-9]{24}$/i.test(latest.scanId)) throw new Error("Server returned an invalid scan ID");
            const res = await fetch(`/api/dast/report/${encodeURIComponent(latest.scanId)}`);
            if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `HTTP ${res.status}`); }
            setReport(await res.json());
        } catch (err: any) {
            setError(err.message ?? 'Failed to load report');
        } finally {
            setLoading(false);
        }
    }, [report?.scanId]);

    useEffect(() => {
        if (!location.state?.report) fetchReport();
        else setLoading(false);
    }, []);

    // ── Derived values ─────────────────────────────────────────────────────────
    const high   = report?.summary?.High          ?? 0;
    const medium = report?.summary?.Medium         ?? 0;
    const low    = report?.summary?.Low            ?? 0;
    const info   = report?.summary?.Informational  ?? 0;
    const total  = high + medium + low + info;

    // [NEW] Use backend totalRiskScore if available, else compute locally
    const totalRiskScore = report?.summary?.totalRiskScore
        ?? Math.min(100, Math.round(high * 10 + medium * 5 + low * 2 + info * 0.5));

    const riskScore = Math.min(100, Math.round(high * 10 + medium * 5 + low * 2 + info * 0.5));
    const riskLabel = riskScore >= 70 ? 'High Risk' : riskScore >= 40 ? 'Medium Risk' : riskScore >= 10 ? 'Low Risk' : 'Minimal Risk';
    const riskColor = riskScore >= 70 ? '#ef4444' : riskScore >= 40 ? '#f59e0b' : riskScore >= 10 ? '#fbbf24' : '#10b981';

    const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;
    const hP = pct(high), mP = pct(medium), lP = pct(low);
    const donutGradient = total > 0
        ? `conic-gradient(#ef4444 0% ${hP}%, #f59e0b ${hP}% ${hP+mP}%, #fbbf24 ${hP+mP}% ${hP+mP+lP}%, #3b82f6 ${hP+mP+lP}% 100%)`
        : '#e2e8f0';

    const allAlerts: (ZapAlert & { severity: string })[] = report ? [
        ...(report.alerts?.High          || []).map(a => ({ ...a, severity: 'High' })),
        ...(report.alerts?.Medium        || []).map(a => ({ ...a, severity: 'Medium' })),
        ...(report.alerts?.Low           || []).map(a => ({ ...a, severity: 'Low' })),
        ...(report.alerts?.Informational || []).map(a => ({ ...a, severity: 'Informational' })),
    ] : [];

    // [NEW] GraphQL alerts (pluginId='GQL')
    const gqlAlerts = allAlerts.filter(a => a.pluginId === 'GQL');
    const gqlCount  = gqlAlerts.length;

    const filteredAlerts = (() => {
        let list = allAlerts.filter(v => {
            if (activeTab === 'all')           return true;
            if (activeTab === 'high')          return v.severity === 'High';
            if (activeTab === 'medium')        return v.severity === 'Medium';
            if (activeTab === 'low')           return v.severity === 'Low';
            if (activeTab === 'informational') return v.severity === 'Informational';
            if (activeTab === 'graphql')       return v.pluginId === 'GQL';
            return true;
        });
        // [NEW] Sort by score descending if toggle is on
        if (sortByScore) list = [...list].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        return list;
    })();

    const vulnFreq: Record<string, number> = {};
    allAlerts.forEach(a => { vulnFreq[a.name] = (vulnFreq[a.name] || 0) + 1; });
    const topVulns = Object.entries(vulnFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxFreq  = topVulns[0]?.[1] || 1;

    const scanDate = report?.completedAt || report?.scanned_at
        ? new Date((report.completedAt || report.scanned_at)!).toLocaleString()
        : '—';

    const truncUrl = (url: string, max = 52) =>
        url ? (url.length > max ? url.slice(0, max) + '…' : url) : '—';

    const handleDownload = () => {
        if (!report) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
        const safeId = (report.scanId || 'report').replace(/[^a-zA-Z0-9_-]/g, '');
        a.download = `dast_report_${safeId}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const toggleAlert = (v: ZapAlert & { severity: string }) =>
        setSelectedAlert(prev => prev?.url === v.url && prev?.name === v.name ? null : v);

    // ── Loading / error / empty states ─────────────────────────────────────────
    if (loading) return (
        <div className="dast-res-root" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
                <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Loading scan results…</h2>
                <p style={{ fontSize: '0.85rem' }}>Fetching your latest DAST report</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="dast-res-root" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
                <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Failed to load report</h2>
                <p style={{ marginBottom: '1.5rem', color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button className="dast-btn dast-btn-start" onClick={fetchReport}>↩ Retry</button>
                    <button className="dast-btn" style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 1.5rem', height: '46px', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/dast')}>← New Scan</button>
                </div>
            </div>
        </div>
    );

    if (!report) return (
        <div className="dast-res-root" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>No scan results found</h2>
                <p style={{ marginBottom: '1.5rem' }}>Run a DAST scan first to see results here.</p>
                <button className="dast-btn dast-btn-start" onClick={() => navigate('/dast')}>← Back to Scan</button>
            </div>
        </div>
    );

    // ── Full render ────────────────────────────────────────────────────────────
    return (
        <div className="dast-res-root">

            {/* Header */}
            <div className="dast-res-header">
                <h1 className="dast-res-title">DAST Scan Results</h1>
                <div className="dast-res-actions">
                    <button className="ns-btn ns-btn--ghost" onClick={() => downloadHTMLReport(report)}>📄 Download Report</button>
                    <button className="ns-btn ns-btn--ghost" onClick={handleDownload}>📥 JSON</button>
                    <button className="ns-btn ns-btn--ghost" onClick={() => navigate('/dast')}>↩ New Scan</button>
                </div>
            </div>

            {/* Meta bar */}
            <div className="db-card dast-meta-bar">
                <div className="dast-meta-item">
                    <span className="dast-meta-label">Target URL</span>
                    <a href={safeHref(report.target)} target="_blank" rel="noopener noreferrer"
                       className="dast-meta-val link" title={report.target}>
                        🌐 {truncUrl(report.target, 40)} ↗
                    </a>
                </div>
                <div className="dast-meta-item">
                    <span className="dast-meta-label">Auth</span>
                    <span className="dast-meta-val">{report.auth?.type || 'none'}</span>
                </div>
                <div className="dast-meta-item">
                    <span className="dast-meta-label">Completed</span>
                    <span className="dast-meta-val">{scanDate}</span>
                </div>
                <div className="dast-meta-item">
                    <span className="dast-meta-label">Total Findings</span>
                    <span className="dast-meta-val">{total}</span>
                </div>
                {/* [NEW] Show scan mode badges in meta bar */}
                {(report.parallelScan || report.useBrowser || report.openApiUrl) && (
                    <div className="dast-meta-item">
                        <span className="dast-meta-label">Scan modes</span>
                        <span className="dast-meta-val" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {report.parallelScan && <span className="dast-opt-chip">⚡ parallel</span>}
                            {report.useBrowser   && <span className="dast-opt-chip">🌐 playwright</span>}
                            {report.openApiUrl   && <span className="dast-opt-chip">📄 openapi</span>}
                            {gqlCount > 0        && <span className="dast-opt-chip">◈ graphql</span>}
                        </span>
                    </div>
                )}
                <div className="dast-meta-item">
                    <span className="dast-meta-label">Status</span>
                    <span className="dast-meta-val dast-badge-outline green">✓ Completed</span>
                </div>
            </div>

            {/* KPI grid — [NEW] totalRiskScore added */}
            <div className="dast-kpi-grid">
                <div className="db-card dast-kpi-card">
                    <div className="dast-kpi-header">Risk Score</div>
                    <div className="dast-kpi-body row">
                        <div className="dast-donut-sm" style={{ background: `conic-gradient(${riskColor} 0% ${riskScore}%, #f1f5f9 ${riskScore}% 100%)` }}>
                            <div className="dast-donut-hole"></div>
                        </div>
                        <div>
                            <div className="dast-kpi-val">{riskScore}<span className="muted">/100</span></div>
                            <div className="dast-kpi-sub" style={{ color: riskColor }}>{riskLabel}</div>
                        </div>
                    </div>
                </div>
                <div className="db-card dast-kpi-card centered">
                    <div className="dast-kpi-header">Total</div>
                    <div className="dast-kpi-val">{total}</div>
                    <div className="dast-kpi-sub">Vulnerabilities</div>
                </div>
                <div className="db-card dast-kpi-card centered">
                    <div className="dast-kpi-header">High</div>
                    <div className="dast-kpi-val red">{high}</div>
                </div>
                <div className="db-card dast-kpi-card centered">
                    <div className="dast-kpi-header">Medium</div>
                    <div className="dast-kpi-val orange">{medium}</div>
                </div>
                <div className="db-card dast-kpi-card centered">
                    <div className="dast-kpi-header">Low</div>
                    <div className="dast-kpi-val yellow">{low}</div>
                </div>
                {/* [NEW] totalRiskScore KPI replacing plain Info card */}
                <div className="db-card dast-kpi-card centered">
                    <div className="dast-kpi-header">Priority Score</div>
                    <div className="dast-kpi-val" style={{ color: '#6366f1' }}>{totalRiskScore}</div>
                    <div className="dast-kpi-sub">weighted total</div>
                </div>
            </div>

            {/* [NEW] Coverage metrics row */}
            {report.coverage && (
                <div className="db-card dast-coverage-bar">
                    <div className="dast-coverage-item">
                        <span className="dast-coverage-icon">🌐</span>
                        <div>
                            <div className="dast-coverage-val">{report.coverage.urlsDiscovered ?? '—'}</div>
                            <div className="dast-coverage-label">URLs Discovered</div>
                        </div>
                    </div>
                    <div className="dast-coverage-sep" />
                    <div className="dast-coverage-item">
                        <span className="dast-coverage-icon">🔍</span>
                        <div>
                            <div className="dast-coverage-val">{report.coverage.urlsScanned ?? '—'}</div>
                            <div className="dast-coverage-label">URLs Scanned</div>
                        </div>
                    </div>
                    <div className="dast-coverage-sep" />
                    <div className="dast-coverage-item">
                        <span className="dast-coverage-icon">⚡</span>
                        <div>
                            <div className="dast-coverage-val">{report.coverage.attackCompleted ?? '—'}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/{report.coverage.attackJobs ?? '—'}</span></div>
                            <div className="dast-coverage-label">Attack Jobs</div>
                        </div>
                    </div>
                    <div className="dast-coverage-sep" />
                    <div className="dast-coverage-item">
                        <span className="dast-coverage-icon">📊</span>
                        <div>
                            <div className="dast-coverage-val">{report.coverage.coveragePct ?? '—'}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>%</span></div>
                            <div className="dast-coverage-label">Attack Coverage</div>
                        </div>
                    </div>
                    {/* Coverage progress bar */}
                    <div className="dast-coverage-prog-wrap">
                        <div className="dast-bar-bg" style={{ height: 4 }}>
                            <div className="dast-bar-fill purple" style={{ width: `${report.coverage.coveragePct ?? 0}%` }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Mid grid */}
            <div className="dast-mid-grid">
                <div className="db-card dast-mid-card">
                    <h3 className="dast-card-title">By Severity</h3>
                    <div className="dast-donut-container">
                        <div className="dast-donut-lg" style={{ background: donutGradient }}>
                            <div className="dast-donut-hole-lg"></div>
                        </div>
                        <div className="dast-legend">
                            <div className="dast-legend-item"><span className="dot red"></span>High<span className="val">{high} ({pct(high)}%)</span></div>
                            <div className="dast-legend-item"><span className="dot orange"></span>Medium<span className="val">{medium} ({pct(medium)}%)</span></div>
                            <div className="dast-legend-item"><span className="dot yellow"></span>Low<span className="val">{low} ({pct(low)}%)</span></div>
                            <div className="dast-legend-item"><span className="dot blue"></span>Info<span className="val">{info} ({pct(info)}%)</span></div>
                            {gqlCount > 0 && (
                                <div className="dast-legend-item"><span className="dot" style={{ background: '#6366f1' }}></span>GraphQL<span className="val">{gqlCount}</span></div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="db-card dast-mid-card">
                    <h3 className="dast-card-title">Top Vulnerability Types</h3>
                    {topVulns.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {topVulns.map(([name, count]) => (
                                <div key={name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px', color: 'var(--text-sub)' }}>
                                        <span title={name}>{name.length > 36 ? name.slice(0, 36) + '…' : name}</span>
                                        <strong style={{ color: 'var(--text)' }}>{count}</strong>
                                    </div>
                                    <div className="dast-bar-bg">
                                        <div className="dast-bar-fill purple" style={{ width: `${(count / maxFreq) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No vulnerabilities found.</p>
                    )}
                </div>

                <div className="db-card dast-mid-card">
                    <h3 className="dast-card-title">Summary</h3>
                    <div className="dast-summary-list">
                        <div className="dast-summary-row"><span>High Severity</span><strong style={{ color: '#ef4444' }}>{high}</strong></div>
                        <div className="dast-summary-row"><span>Medium Severity</span><strong style={{ color: '#f59e0b' }}>{medium}</strong></div>
                        <div className="dast-summary-row"><span>Low Severity</span><strong style={{ color: '#fbbf24' }}>{low}</strong></div>
                        <div className="dast-summary-row"><span>Informational</span><strong style={{ color: '#3b82f6' }}>{info}</strong></div>
                        {gqlCount > 0 && <div className="dast-summary-row"><span>GraphQL</span><strong style={{ color: '#6366f1' }}>{gqlCount}</strong></div>}
                        <div className="dast-summary-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                            <span>Total</span><strong>{total}</strong>
                        </div>
                        {/* [NEW] weighted score row */}
                        <div className="dast-summary-row" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                            <span>Priority Score</span><strong style={{ color: '#6366f1' }}>{totalRiskScore}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom grid */}
            <div className="dast-bot-grid">
                <div className="db-card dast-bot-main">
                    {/* Tabs — [NEW] GraphQL tab added */}
                    <div className="dast-tabs">
                        {([
                            { key: 'all',           label: `All (${total})` },
                            { key: 'high',          label: `High (${high})` },
                            { key: 'medium',        label: `Medium (${medium})` },
                            { key: 'low',           label: `Low (${low})` },
                            { key: 'informational', label: `Info (${info})` },
                            ...(gqlCount > 0 ? [{ key: 'graphql', label: `◈ GraphQL (${gqlCount})` }] : []),
                        ] as { key: SeverityTab; label: string }[]).map(t => (
                            <button key={t.key}
                                className={`dast-tab ${activeTab === t.key ? 'active' : ''}`}
                                onClick={() => { setActiveTab(t.key); setSelectedAlert(null); }}>
                                {t.label}
                            </button>
                        ))}

                        {/* [NEW] Sort toggle */}
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 1rem', gap: 6 }}>
                            <label className="dast-sort-toggle" title="Sort by priority score (highest first)">
                                <input type="checkbox" checked={sortByScore} onChange={e => setSortByScore(e.target.checked)} />
                                <span style={{ fontSize: '0.75rem', color: sortByScore ? '#6366f1' : 'var(--text-muted)', fontWeight: 600 }}>
                                    ↓ Score
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="dast-table-wrapper">
                        <table className="dast-table">
                            <thead>
                                <tr>
                                    <th>VULNERABILITY</th>
                                    <th>SEVERITY</th>
                                    <th>AFFECTED URL</th>
                                    <th>PARAMETER</th>
                                    <th>STATUS</th>
                                    {/* [NEW] Score column */}
                                    <th style={{ color: '#6366f1' }}>SCORE ↓</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAlerts.length > 0 ? filteredAlerts.map((v, i) => {
                                    const isOpen = selectedAlert?.url === v.url && selectedAlert?.name === v.name;
                                    return (
                                        <>
                                            <tr key={`row-${i}`}
                                                style={{ cursor: 'pointer', background: isOpen ? 'rgba(99,102,241,0.04)' : undefined }}
                                                onClick={() => toggleAlert(v)}
                                            >
                                                <td>
                                                    <div className="vuln-name">{v.name}</div>
                                                    {v.cweid && <div className="vuln-cwe">CWE-{v.cweid}</div>}
                                                    {v.pluginId === 'GQL' && <div className="vuln-cwe" style={{ color: '#6366f1' }}>◈ GraphQL</div>}
                                                </td>
                                                <td><span className={`dast-badge-soft ${SEVERITY_CLASS[v.severity] ?? 'blue'}`}>{v.severity}</span></td>
                                                <td className="vuln-url" title={v.url}>{truncUrl(v.url)}</td>
                                                <td>{v.param || '—'}</td>
                                                <td><span className="dast-badge-soft blue">New</span></td>
                                                {/* [NEW] Score cell */}
                                                <td>
                                                    {v.score != null
                                                        ? <span className="dast-score-chip">{v.score}</span>
                                                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                                </td>
                                                <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
                                                    {isOpen ? '▲' : '▼'}
                                                </td>
                                            </tr>

                                            {isOpen && (
                                                <tr key={`detail-${i}`}>
                                                    <td colSpan={7} style={{ padding: 0, background: 'var(--surface2)' }}>
                                                        <div style={{
                                                            padding: '1.25rem 1.5rem',
                                                            borderLeft: `4px solid ${SEVERITY_COLORS[v.severity] ?? '#6366f1'}`,
                                                            display: 'grid',
                                                            gridTemplateColumns: '1fr 1fr',
                                                            gap: '1rem',
                                                        }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                                <DetailSection title="Affected URL">
                                                                    <a href={safeHref(v.url)} target="_blank" rel="noopener noreferrer"
                                                                       style={{ color: '#6366f1', wordBreak: 'break-all', fontSize: '0.8rem' }}>
                                                                        {v.url} ↗
                                                                    </a>
                                                                </DetailSection>
                                                                {v.param && (
                                                                    <DetailSection title="Parameter">
                                                                        <code style={{ fontSize: '0.8rem', background: 'var(--surface)', padding: '2px 6px', borderRadius: '4px' }}>
                                                                            {v.param}
                                                                        </code>
                                                                    </DetailSection>
                                                                )}
                                                                {v.evidence && (
                                                                    <DetailSection title="Evidence">
                                                                        <code style={{ fontSize: '0.75rem', background: 'var(--surface)', padding: '4px 8px', borderRadius: '4px', display: 'block', wordBreak: 'break-all' }}>
                                                                            {truncateEvidence(v.evidence)}
                                                                        </code>
                                                                        {v.evidence.length > MAX_EVIDENCE_DISPLAY && (
                                                                            <span style={{ fontSize: '0.7rem', color: '#d97706', marginTop: '4px', display: 'block' }}>
                                                                                ⚠ Evidence truncated — may contain sensitive data
                                                                            </span>
                                                                        )}
                                                                    </DetailSection>
                                                                )}
                                                                {v.description && (
                                                                    <DetailSection title="Description">
                                                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: 1.6, margin: 0 }}>
                                                                            {v.description}
                                                                        </p>
                                                                    </DetailSection>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                                {/* [NEW] Score detail */}
                                                                {v.score != null && (
                                                                    <DetailSection title="Priority Score">
                                                                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1' }}>{v.score} pts</span>
                                                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                                                                            (base: {SEVERITY_COLORS[v.severity] === '#ef4444' ? 40 : SEVERITY_COLORS[v.severity] === '#f59e0b' ? 20 : 5} + {v.score - (SEVERITY_COLORS[v.severity] === '#ef4444' ? 40 : SEVERITY_COLORS[v.severity] === '#f59e0b' ? 20 : 5)} duplicates)
                                                                        </span>
                                                                    </DetailSection>
                                                                )}
                                                                {v.cweid && (
                                                                    <DetailSection title="CWE Reference">
                                                                        <a href={`https://cwe.mitre.org/data/definitions/${encodeURIComponent(v.cweid)}.html`}
                                                                           target="_blank" rel="noopener noreferrer"
                                                                           style={{ color: '#6366f1', fontSize: '0.82rem' }}>
                                                                            CWE-{v.cweid} — View on MITRE ↗
                                                                        </a>
                                                                    </DetailSection>
                                                                )}
                                                                {v.solution && (
                                                                    <DetailSection title="🔧 Recommended Fix" highlight>
                                                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-sub)', lineHeight: 1.6, margin: 0 }}>
                                                                            {v.solution}
                                                                        </p>
                                                                    </DetailSection>
                                                                )}
                                                                {v.reference && (
                                                                    <DetailSection title="References">
                                                                        <div style={{ fontSize: '0.78rem', lineHeight: 1.8 }}>
                                                                            {v.reference.split('\n').filter(Boolean).slice(0, 4).map((ref, ri) => {
                                                                                const href = safeHref(ref.trim());
                                                                                if (href === '#') return null;
                                                                                return (
                                                                                    <div key={ri}>
                                                                                        <a href={href} target="_blank" rel="noopener noreferrer"
                                                                                           style={{ color: '#6366f1', wordBreak: 'break-all' }}>
                                                                                            {ref.trim().length > 55 ? ref.trim().slice(0, 55) + '…' : ref.trim()} ↗
                                                                                        </a>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </DetailSection>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                                            ✅ No {activeTab !== 'all' ? activeTab : ''} vulnerabilities found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="dast-bot-side">
                    <div className="db-card dast-mid-card">
                        <h3 className="dast-card-title">Next Steps</h3>
                        <div className="dast-steps-list">
                            {high > 0 && (
                                <button className="dast-step-item" onClick={() => setActiveTab('high')}>
                                    <span>Review {high} high severity finding{high !== 1 ? 's' : ''}</span>
                                    <span className="arrow">❯</span>
                                </button>
                            )}
                            {gqlCount > 0 && (
                                <button className="dast-step-item" onClick={() => setActiveTab('graphql')}>
                                    <span>Review {gqlCount} GraphQL finding{gqlCount !== 1 ? 's' : ''}</span>
                                    <span className="arrow">❯</span>
                                </button>
                            )}
                            <button className="dast-step-item" onClick={() => navigate('/dast')}>
                                <span>Re-scan after fixes</span>
                                <span className="arrow">❯</span>
                            </button>
                            <button className="dast-step-item" onClick={() => downloadHTMLReport(report)}>
                                <span>Download HTML report</span>
                                <span className="arrow">❯</span>
                            </button>
                            <button className="dast-step-item" onClick={handleDownload}>
                                <span>Export JSON data</span>
                                <span className="arrow">❯</span>
                            </button>
                            <button className="dast-step-item" onClick={fetchReport}>
                                <span>↩ Refresh results</span>
                                <span className="arrow">❯</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="dast-footer-note">
                ⓘ Findings are sorted by priority score (High=40pts base, Medium=20pts, Low=5pts, +1 per duplicate occurrence).
                Click "Download Report" for a full HTML report. Re-run the scan anytime to check for new vulnerabilities.
            </div>
        </div>
    );
};

export default DastResultPage;