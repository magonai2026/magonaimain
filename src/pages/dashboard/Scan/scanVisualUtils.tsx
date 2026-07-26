import { AlertTriangle, Info, Flame, Zap } from 'lucide-react';

// ─── Safe string coercion ─────────────────────────────────────────────────────
// LLM pipeline phases occasionally return objects instead of plain strings.
// Rendering an object as a React child throws "Objects are not valid as a React
// child" and unmounts the entire tree. This helper guarantees a string is always
// returned so every field render is crash-proof.
export const safeStr = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value == null) return fallback;
  if (typeof value === 'object') {
    // e.g. { summary: "...", affected_files: [...], data_flow: {...} }
    for (const key of ['summary', 'text', 'content', 'description', 'value']) {
      const v = (value as Record<string, unknown>)[key];
      if (typeof v === 'string') return v;
    }
    try { return JSON.stringify(value); } catch { return fallback; }
  }
  return String(value);
};

// ─── Per-severity rich color config with glass tints ─────────────────────────
export const SEVERITY_CONFIG = {
  critical: {
    color: '#dc2626', light: '#ff4444',
    bg: 'linear-gradient(135deg, rgba(220,38,38,0.13) 0%, rgba(239,68,68,0.07) 100%)',
    glassBorder: 'rgba(220,38,38,0.35)',
    headerBg: 'linear-gradient(90deg, rgba(220,38,38,0.18) 0%, rgba(220,38,38,0.04) 100%)',
    tint: 'rgba(220,38,38,0.06)',
    label: 'Critical',
    icon: Flame,
    glow: '0 0 24px rgba(220,38,38,0.25)',
  },
  high: {
    color: '#ea580c', light: '#fb923c',
    bg: 'linear-gradient(135deg, rgba(234,88,12,0.13) 0%, rgba(251,146,60,0.07) 100%)',
    glassBorder: 'rgba(234,88,12,0.32)',
    headerBg: 'linear-gradient(90deg, rgba(234,88,12,0.15) 0%, rgba(234,88,12,0.03) 100%)',
    tint: 'rgba(234,88,12,0.06)',
    label: 'High',
    icon: AlertTriangle,
    glow: '0 0 24px rgba(234,88,12,0.2)',
  },
  medium: {
    color: '#d97706', light: '#fbbf24',
    bg: 'linear-gradient(135deg, rgba(217,119,6,0.13) 0%, rgba(251,191,36,0.07) 100%)',
    glassBorder: 'rgba(217,119,6,0.3)',
    headerBg: 'linear-gradient(90deg, rgba(217,119,6,0.14) 0%, rgba(217,119,6,0.03) 100%)',
    tint: 'rgba(217,119,6,0.05)',
    label: 'Medium',
    icon: Zap,
    glow: '0 0 20px rgba(217,119,6,0.18)',
  },
  low: {
    color: '#2563eb', light: '#60a5fa',
    bg: 'linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(96,165,250,0.06) 100%)',
    glassBorder: 'rgba(37,99,235,0.28)',
    headerBg: 'linear-gradient(90deg, rgba(37,99,235,0.13) 0%, rgba(37,99,235,0.03) 100%)',
    tint: 'rgba(37,99,235,0.05)',
    label: 'Low',
    icon: Info,
    glow: '0 0 18px rgba(37,99,235,0.16)',
  },
  info: {
    color: '#475569', light: '#94a3b8',
    bg: 'linear-gradient(135deg, rgba(71,85,105,0.1) 0%, rgba(148,163,184,0.05) 100%)',
    glassBorder: 'rgba(71,85,105,0.22)',
    headerBg: 'linear-gradient(90deg, rgba(71,85,105,0.1) 0%, rgba(71,85,105,0.02) 100%)',
    tint: 'rgba(71,85,105,0.04)',
    label: 'Info',
    icon: Info,
    glow: '0 0 14px rgba(71,85,105,0.12)',
  },
};