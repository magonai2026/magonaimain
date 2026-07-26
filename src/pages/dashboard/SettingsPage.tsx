import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type DeleteState = 'idle' | 'confirming' | 'deleting' | 'error';

interface AccountInfo {
    email: string;
    createdAt: string;
    name: string;
}

const SettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [deleteState, setDeleteState] = useState<DeleteState>('idle');
    const [deleteError, setDeleteError] = useState<string>('');
    const [account, setAccount] = useState<AccountInfo | null>(null);

    useEffect(() => {
        fetch('/api/profile', { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(d => d && setAccount({ email: d.email, createdAt: d.createdAt, name: d.name }))
            .catch(() => {});
    }, []);

    const handleDeleteClick   = () => { setDeleteError(''); setDeleteState('confirming'); };
    const handleDeleteCancel  = () => { setDeleteState('idle'); setDeleteError(''); };

    const handleDeleteConfirm = async () => {
        setDeleteState('deleting');
        setDeleteError('');
        try {
            const res = await fetch('/api/account', { method: 'DELETE', credentials: 'include' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data as any).message || `Request failed (${res.status})`);
            }
            navigate('/login');
        } catch (err) {
            setDeleteError((err as Error).message || 'Failed to delete account. Please try again.');
            setDeleteState('error');
        }
    };

    const formatDate = (iso?: string) => {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    return (
        <div className="db-section">
            <div className="db-section-header">
                <h2>Account Settings</h2>
                <p>Manage your account preferences and security.</p>
            </div>

            {/* ── Security ── */}
            <div className="db-form-card" style={{ marginBottom: '1rem' }}>
                <div className="db-settings-group">
                    <h3>Security</h3>
                    <div className="db-settings-row">
                        <div>
                            <strong>Authentication Method</strong>
                            <p>OTP via Email — no password required. A one-time code is sent to your inbox each time you sign in.</p>
                        </div>
                        <span className="db-badge db-badge--green">Active</span>
                    </div>
                    <div className="db-settings-row" style={{ marginTop: '0.75rem' }}>
                        <div>
                            <strong>Session</strong>
                            <p>You are currently signed in. Sessions expire automatically after 30 days of inactivity.</p>
                        </div>
                        <span className="db-badge db-badge--purple">Active</span>
                    </div>
                </div>
            </div>

            {/* ── Account Info ── */}
            <div className="db-form-card" style={{ marginBottom: '1rem' }}>
                <div className="db-settings-group">
                    <h3>Account Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {[
                            { label: 'Name',          value: account?.name     ?? '—' },
                            { label: 'Email',         value: account?.email    ?? '—' },
                            { label: 'Member Since',  value: formatDate(account?.createdAt) },
                            { label: 'Data Region',   value: 'India (ap-south-1)' },
                            { label: 'Data Stored',   value: 'Scan results, profile info, API keys' },
                        ].map(({ label, value }) => (
                            <div key={label} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 0',
                                borderBottom: '1px solid rgba(99,102,241,0.08)',
                            }}>
                                <span style={{ fontSize: '0.84rem', color: 'var(--text-sub)', fontWeight: 600 }}>{label}</span>
                                <span style={{ fontSize: '0.84rem', color: 'var(--text)', fontFamily: label === 'Email' ? "'JetBrains Mono', monospace" : undefined }}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                    <p style={{ marginTop: '0.85rem', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        Your data is encrypted at rest and in transit. Scan results are stored for 90 days after which they are automatically purged. You can delete your account at any time from the Danger Zone below.
                    </p>
                </div>
            </div>

            {/* ── Danger Zone ── */}
            <div className="db-form-card">
                <div className="db-settings-group db-settings-group--danger">
                    <h3>Danger Zone</h3>

                    {(deleteState === 'idle' || deleteState === 'error') && (
                        <>
                            <div className="db-settings-row">
                                <div>
                                    <strong>Delete Account</strong>
                                    <p>Permanently remove your account, all scan history, API keys, and associated data. This cannot be undone.</p>
                                </div>
                                <button className="db-danger-btn" onClick={handleDeleteClick}>
                                    Delete
                                </button>
                            </div>
                            {deleteState === 'error' && deleteError && (
                                <div className="db-status error" role="alert" aria-live="assertive" style={{ marginTop: '0.75rem' }}>
                                    {deleteError}
                                </div>
                            )}
                        </>
                    )}

                    {deleteState === 'confirming' && (
                        <div className="db-delete-confirm" role="alertdialog" aria-modal="false" aria-labelledby="delete-confirm-title">
                            <div className="db-delete-confirm-body">
                                <p id="delete-confirm-title" className="db-delete-confirm-title">Are you absolutely sure?</p>
                                <p className="db-delete-confirm-sub">
                                    This will permanently delete your account and all associated data including scan history, API keys, and profile.
                                    This action <strong>cannot</strong> be undone.
                                </p>
                            </div>
                            <div className="db-delete-confirm-actions">
                                <button className="db-settings-cancel-btn" onClick={handleDeleteCancel} autoFocus>Cancel</button>
                                <button className="db-danger-btn" onClick={handleDeleteConfirm}>Yes, delete my account</button>
                            </div>
                        </div>
                    )}

                    {deleteState === 'deleting' && (
                        <div className="db-delete-confirm">
                            <div className="db-delete-confirm-body">
                                <p className="db-delete-confirm-title">Deleting your account…</p>
                                <p className="db-delete-confirm-sub">Please wait, do not close this page.</p>
                            </div>
                            <div className="db-delete-confirm-actions">
                                <div className="db-spinner db-spinner--sm" aria-label="Loading" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
