import React from 'react';

export interface GitHubRepo {
    id: number;
    full_name: string;
    name: string;
    private: boolean;
}

export const Spinner = () => (
    <div className="db-spinner--sm" style={{ margin: '0 auto' }} />
);

export const StatusMsg = ({ ok, msg }: { ok: boolean; msg: string }) => (
    <div className={`db-status ${ok ? 'success' : 'error'}`}>{msg}</div>
);

export const ToggleSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
    <button
        type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        style={{
            width: 36, height: 20, borderRadius: 999, flexShrink: 0, padding: 0,
            border: 'none', cursor: 'pointer', position: 'relative',
            background: checked ? 'var(--accent)' : 'var(--border2)',
            transition: 'background 0.2s',
            boxShadow: checked ? '0 0 0 3px rgba(124,58,237,0.15)' : 'none',
        }}
    >
        <span style={{
            position: 'absolute', top: 2, left: checked ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%',
            background: '#fff', transition: 'left 0.18s var(--ease-out)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
    </button>
);