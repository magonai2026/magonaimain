import React, { useState, useEffect } from 'react';
import { Spinner, StatusMsg } from './IntegrationsShared';

const EmailPanel: React.FC = () => {
    const [emails,  setEmails]  = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving,  setSaving]  = useState(false);
    const [status,  setStatus]  = useState<{ ok: boolean; msg: string } | null>(null);

    // ── Load saved emails on mount so we never show a blank form ─────────────
    // Without this, opening the panel and hitting Save would silently overwrite
    // the user's saved recipient list with an empty array.

    useEffect(() => {
        const loadEmails = async () => {
            try {
                const res = await fetch('/api/profile', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    const saved: string[] = data.notification_emails;
                    // Populate with saved emails, or fall back to one blank row
                    setEmails(Array.isArray(saved) && saved.length > 0 ? saved : ['']);
                } else {
                    setEmails(['']);
                }
            } catch {
                setEmails(['']);
            } finally {
                setLoading(false);
            }
        };
        loadEmails();
    }, []);

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        const validEmails = emails.map(e => e.trim()).filter(Boolean);
        if (validEmails.length === 0) {
            setStatus({ ok: false, msg: 'Please add at least one valid email.' });
            return;
        }
        setSaving(true); setStatus(null);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_emails: validEmails }),
            });
            if (res.ok) {
                // Sync local state with what was actually saved (strips blanks)
                setEmails(validEmails);
                setStatus({ ok: true, msg: 'Email recipients saved!' });
            } else {
                setStatus({ ok: false, msg: 'Failed to save.' });
            }
        } catch {
            setStatus({ ok: false, msg: 'Network error.' });
        } finally { setSaving(false); }
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="db-form-card" style={{ background: 'var(--surface2)', animation: 'ns-fade-up 0.3s var(--ease-out) both' }}>
            {status && <StatusMsg ok={status.ok} msg={status.msg} />}

            {loading ? (
                <div className="ns-loading"><Spinner /><span>Loading email settings…</span></div>
            ) : (
                <div className="db-form">
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-sub)' }}>Configure Global Email Alerts</div>

                    <div className="db-form-group">
                        <label>Recipients <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(max 5)</span></label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
                            {emails.map((email, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        className="ns-input"
                                        value={email}
                                        onChange={e => {
                                            const updated = [...emails];
                                            updated[index] = e.target.value;
                                            setEmails(updated);
                                        }}
                                        placeholder={`user${index + 1}@company.com`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setEmails(emails.filter((_, i) => i !== index))}
                                        className="ns-file-remove"
                                        aria-label="Remove email"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {emails.length < 5 && (
                                <button
                                    type="button"
                                    className="db-action-btn"
                                    onClick={() => setEmails([...emails, ''])}
                                    style={{ alignSelf: 'flex-start', padding: '6px 12px', marginTop: '4px' }}
                                >
                                    <span>＋</span> Add Email
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="db-save-btn" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving…' : 'Save Emails'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailPanel;