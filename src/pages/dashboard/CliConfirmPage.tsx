import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface User {
    email: string;
    name?: string;
}

type PageState = 'fetching' | 'prompt' | 'loading' | 'success' | 'error' | 'cancelled' | 'invalid';

const CliConfirmPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const cliToken = searchParams.get('cli_token') || '';

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [pageState, setPageState] = useState<PageState>('fetching');
    const [errorMessage, setErrorMessage] = useState('');
    const [countdown, setCountdown] = useState(5);

    // On mount: validate token, then fetch the session user
    useEffect(() => {
        if (!cliToken) {
            setPageState('invalid');
            return;
        }

        fetch('/api/profile', { credentials: 'include' })
            .then(res => {
                if (res.status === 401) {
                    navigate(`/login?cli_token=${encodeURIComponent(cliToken)}`);
                    return null;
                }
                if (!res.ok) throw new Error('Profile fetch failed');
                return res.json();
            })
            .then((data: User | null) => {
                if (data) {
                    setCurrentUser(data);
                    setPageState('prompt');
                }
            })
            .catch(() => {
                setErrorMessage('Could not load your session. Please try again.');
                setPageState('error');
            });
    }, [cliToken]);

    // Auto-redirect to dashboard after success
    useEffect(() => {
        if (pageState !== 'success') return;
        if (countdown <= 0) {
            navigate('/dashboard');
            return;
        }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [pageState, countdown]);

    const handleAllow = async () => {
        setPageState('loading');
        try {
            const res = await fetch('/api/cli/auth/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token: cliToken }),
            });
            const data = await res.json();

            if (res.ok) {
                setPageState('success');
            } else {
                setErrorMessage(data.message || 'CLI authentication failed.');
                setPageState('error');
            }
        } catch {
            setErrorMessage('Network error. Please try again.');
            setPageState('error');
        }
    };

    const handleCancel = () => {
        setPageState('cancelled');
        setTimeout(() => navigate('/dashboard'), 2000);
    };

    // ─── Render states ────────────────────────────────────────────────────────

    if (pageState === 'fetching') {
        return (
            <PageShell>
                <div style={styles.spinner} />
                <h2 style={styles.heading}>Loading...</h2>
                <p style={styles.sub}>Verifying your session.</p>
            </PageShell>
        );
    }

    if (pageState === 'invalid') {
        return (
            <PageShell>
                <IconBadge>⚠️</IconBadge>
                <h2 style={styles.heading}>Invalid Request</h2>
                <p style={styles.sub}>No CLI token found. This link may have expired.</p>
                <p style={styles.hint}>Run <code style={styles.code}>niyantri login</code> again to get a fresh link.</p>
                <button style={styles.btnSecondary} onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                </button>
            </PageShell>
        );
    }

    if (pageState === 'prompt') {
        return (
            <PageShell>
                <div style={styles.cliBadge}>🖥️ CLI Access Request</div>
                <h2 style={styles.heading}>Allow Terminal Access?</h2>
                <p style={styles.sub}>
                    The <strong>Niyantri CLI</strong> on your machine is requesting access to your account.
                </p>

                <div style={styles.infoBox}>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Account</span>
                        <span style={styles.infoValue}>{currentUser?.email ?? '—'}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Access</span>
                        <span style={styles.infoValue}>Run security scans via CLI</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Expires</span>
                        <span style={styles.infoValue}>90 days (revocable anytime)</span>
                    </div>
                </div>

                <p style={styles.securityNote}>
                    🔒 Only allow this if you just ran <code style={styles.code}>niyantri login</code> in your terminal.
                </p>

                <div style={styles.btnGroup}>
                    <button style={styles.btnAllow} onClick={handleAllow}>
                        ✅ Allow Access
                    </button>
                    <button style={styles.btnCancel} onClick={handleCancel}>
                        Cancel
                    </button>
                </div>
            </PageShell>
        );
    }

    if (pageState === 'loading') {
        return (
            <PageShell>
                <div style={styles.spinner} />
                <h2 style={styles.heading}>Authenticating...</h2>
                <p style={styles.sub}>Linking your CLI session. This only takes a second.</p>
            </PageShell>
        );
    }

    if (pageState === 'success') {
        return (
            <PageShell>
                <IconBadge>✅</IconBadge>
                <h2 style={styles.heading}>CLI Authenticated!</h2>
                <p style={styles.sub}>
                    Your terminal is now connected as <strong>{currentUser?.email ?? 'your account'}</strong>.
                </p>
                <p style={styles.hint}>You can close this tab and return to your terminal.</p>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '1.5rem' }}>
                    Redirecting to dashboard in {countdown}s...
                </p>
            </PageShell>
        );
    }

    if (pageState === 'cancelled') {
        return (
            <PageShell>
                <IconBadge>🚫</IconBadge>
                <h2 style={styles.heading}>Access Cancelled</h2>
                <p style={styles.sub}>No CLI key was issued. Your account is unchanged.</p>
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '1.5rem' }}>
                    Redirecting to dashboard...
                </p>
            </PageShell>
        );
    }

    // error state
    return (
        <PageShell>
            <IconBadge>❌</IconBadge>
            <h2 style={styles.heading}>Authentication Failed</h2>
            <p style={styles.sub}>{errorMessage}</p>
            <p style={styles.hint}>
                This token may have expired (5 min limit). Run{' '}
                <code style={styles.code}>niyantri login</code> again to retry.
            </p>
            <button style={styles.btnSecondary} onClick={() => navigate('/dashboard')}>
                Back to Dashboard
            </button>
        </PageShell>
    );
};

// ─── Layout wrapper ───────────────────────────────────────────────────────────
const PageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={styles.shell}>
        <div style={styles.card}>{children}</div>
    </div>
);

const IconBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div style={styles.iconBadge}>{children}</div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
    shell: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f1a',
        padding: '1rem',
    },
    card: {
        background: '#1a1a2e',
        border: '1px solid #2d2d4e',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
        color: '#e2e8f0',
    },
    cliBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: '#1e1b4b',
        border: '1px solid #6366f1',
        borderRadius: '20px',
        padding: '4px 14px',
        fontSize: '0.8rem',
        color: '#a5b4fc',
        marginBottom: '1rem',
    },
    heading: {
        fontSize: '1.5rem',
        fontWeight: 700,
        margin: '0 0 0.5rem',
        color: '#f1f5f9',
    },
    sub: {
        color: '#94a3b8',
        fontSize: '0.95rem',
        margin: '0 0 1.25rem',
        lineHeight: 1.6,
    },
    hint: {
        color: '#64748b',
        fontSize: '0.85rem',
        margin: '0.5rem 0 1.25rem',
    },
    infoBox: {
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '1.25rem',
        textAlign: 'left',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.4rem 0',
        borderBottom: '1px solid #1e293b',
        fontSize: '0.9rem',
    },
    infoLabel: {
        color: '#64748b',
        fontWeight: 500,
    },
    infoValue: {
        color: '#cbd5e1',
        fontWeight: 500,
    },
    securityNote: {
        background: '#1c1917',
        border: '1px solid #292524',
        borderRadius: '8px',
        padding: '0.6rem 1rem',
        fontSize: '0.82rem',
        color: '#a8a29e',
        marginBottom: '1.5rem',
        textAlign: 'left',
    },
    btnGroup: {
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'center',
    },
    btnAllow: {
        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '0.75rem 1.75rem',
        fontSize: '0.95rem',
        fontWeight: 600,
        cursor: 'pointer',
        flex: 1,
    },
    btnCancel: {
        background: 'transparent',
        color: '#94a3b8',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '0.75rem 1.25rem',
        fontSize: '0.95rem',
        cursor: 'pointer',
    },
    btnSecondary: {
        background: 'transparent',
        color: '#a855f7',
        border: '1px solid #6366f1',
        borderRadius: '8px',
        padding: '0.65rem 1.5rem',
        fontSize: '0.9rem',
        cursor: 'pointer',
        marginTop: '0.5rem',
    },
    code: {
        background: '#1e293b',
        borderRadius: '4px',
        padding: '1px 6px',
        fontFamily: 'monospace',
        fontSize: '0.9em',
        color: '#a5b4fc',
    },
    iconBadge: {
        fontSize: '2.5rem',
        marginBottom: '0.75rem',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid #1e293b',
        borderTop: '3px solid #a855f7',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 1.25rem',
    },
};

export default CliConfirmPage;