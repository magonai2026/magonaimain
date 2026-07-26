import React, { useState, useEffect, useRef, Component } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import OverviewPage from './OverviewPage';
import ProfilePage from './ProfilePage';
import CreditsPage from './CreditsPage';
import SettingsPage from './SettingsPage';
import NewSessionPage from './Scan/NewSessionPage';
import ScanHistoryPage from './ScanHistoryPage';
import IntegrationsPage from './Integrations/IntegrationsPage';
import Modal from './Modal';
import { usePopups } from './usePopups';
import { ToastProvider } from './Toast';
import './Dashboard.css';
import CliScansPage from './CliScansPage';
import DastScanPage from './Dast/DastScanPage';
import DastResultPage from './Dast/DastResultPage';
import TeamPage from './Team/TeamPage';
import AuditLogsPage from './AuditLogsPage';
import DeveloperCreditsPage from './DeveloperCreditsPage';
import type { DevMembership } from './workspaceTypes';

interface User {
    uuid:      string;
    email:     string;
    name:      string;
    role?:     string;
    industry?: string;
    age?:      number;
    country?:  string;
    createdAt: string;
}

const TAB_LABELS: Record<string, string> = {
    'new-session':  'New Session',
    'overview':     'Overview',
    'history':      'Scan History',
    'history-scan': 'Scan History',
    'integrations': 'Integrations',
    'profile':      'Profile',
    'credits':      'Credits',
    'settings':     'Settings',
    'github':       'GitHub',
    'cli-keys':     'CLI Keys',
    'dast':         'DAST Scan',
    'dast-result':  'DAST Result',
    'team':         'Team',
    'audit-logs':   'Audit Logs',
};

// ── Paths that are standalone pages (open in their own tab).
// Dashboard must never redirect away from these even if somehow mounted there.
const STANDALONE_PATHS = ['/patch-scan', '/cli-confirm'];

// ── Error Boundary ────────────────────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class PageErrorBoundary extends Component<
    { children: React.ReactNode; onReset: () => void },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode; onReset: () => void }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[PageErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="db-error-boundary">
                    <div className="db-error-boundary-icon">⚠</div>
                    <h3>Something went wrong</h3>
                    <p>{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
                    <button
                        className="db-save-btn"
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            this.props.onReset();
                        }}
                    >
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
    const [user, setUser]               = useState<User | null>(null);
    const [isLoading, setIsLoading]     = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed]     = useState(false);
    const [errorBoundaryKey, setErrorBoundaryKey] = useState(0);
    const [membership, setMembership]   = useState<DevMembership | null>(null);
    const [inviteBanner, setInviteBanner] = useState<{ token: string; admin_name: string } | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const abortRef = useRef<AbortController | null>(null);

    // ── Guard: if we somehow land on a standalone path, do nothing.
    // In practice App.tsx routes these to their own components, but this
    // prevents any accidental redirect if routing ever regresses.
    const isStandalonePath = STANDALONE_PATHS.some(p =>
        location.pathname.startsWith(p)
    );

    const pathToTab: Record<string, string> = {
        '/dashboard':    'overview',
        '/overview':     'overview',
        '/new-session':  'new-session',
        '/integrations': 'integrations',
        '/profile':      'profile',
        '/credits':      'credits',
        '/settings':     'settings',
        '/history':      'history',
        '/cli-keys':     'cli-keys',
        '/dast':         'dast',
        '/team':         'team',
        '/audit-logs':   'audit-logs',
    };

    const activeTab = location.pathname.startsWith('/dast/result/')
        ? 'dast-result'
        : (pathToTab[location.pathname] ??
            (location.pathname.startsWith('/scan/') ? 'history-scan' : 'overview'));

    // ── Page title ───────────────────────────────────────────────────────────
    useEffect(() => {
        const label = TAB_LABELS[activeTab] ?? activeTab;
        document.title = label ? `${label} | Magon AI` : 'Magon AI';
    }, [activeTab]);

    // ── Backend-driven popups ─────────────────────────────────────────────────
    const { popup, dismiss, action } = usePopups(activeTab, navigate);

    const handleTabChange = (tab: string) => {
        const tabToPath: Record<string, string> = {
            'overview':     '/overview',
            'new-session':  '/new-session',
            'history':      '/history',
            'integrations': '/integrations',
            'profile':      '/profile',
            'credits':      '/credits',
            'settings':     '/settings',
            'cli-keys':     '/cli-keys',
            'dast':         '/dast',
            'team':         '/team',
            'audit-logs':   '/audit-logs',
        };
        navigate(tabToPath[tab] ?? '/overview');
    };

    useEffect(() => {
        // Never run Dashboard auth logic on standalone pages
        if (isStandalonePath) return;

        fetchProfile();
        return () => {
            abortRef.current?.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStandalonePath]);

    const fetchProfile = async () => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const res = await fetch('/api/profile', {
                credentials: 'include',
                signal: controller.signal,
            });

            if (res.status === 401) {
                // Only redirect to login if we're actually on a dashboard path
                if (!isStandalonePath) navigate('/login');
                return;
            }

            if (!res.ok) {
                throw new Error(`Unexpected response: ${res.status}`);
            }

            const data = await res.json();
            setUser(data);

            // If not admin, try to fetch workspace membership
            if (data.role !== 'admin') {
                try {
                    const wRes = await fetch('/api/workspace/me', { credentials: 'include', signal: controller.signal });
                    if (wRes.ok) {
                        const wData: DevMembership = await wRes.json();
                        setMembership(wData);
                    }
                } catch {
                    // No workspace — that's fine
                }
            }

            // Check for pending invite notifications
            try {
                const nRes = await fetch('/api/workspace/invitations/pending', { credentials: 'include', signal: controller.signal });
                if (nRes.ok) {
                    const nData = await nRes.json();
                    if (nData?.token) setInviteBanner(nData);
                }
            } catch {
                // Silent
            }
        } catch (err) {
            if ((err as Error).name === 'AbortError') return;
            console.error('Failed to fetch profile', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        } catch {
            // Proceed to login regardless
        } finally {
            navigate('/login');
        }
    };

    const getInitials = (name: string) =>
        (name || '')
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';

    if (isLoading) {
        return (
            <div className="db-loading">
                <div className="db-spinner" />
            </div>
        );
    }

    if (!user) return null;

    // If the user has accepted a workspace invitation they become a developer.
    // Everyone else manages their own workspace (admin-like).
    const isDev   = !!membership;
    const isAdmin = !isDev;

    const renderPage = () => {
        // Suspended developer — show a locked screen instead of content
        if (isDev && membership?.status === 'suspended') {
            return (
                <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
                    <div style={{ fontSize: 56, marginBottom: 20, opacity: 0.5 }}>⊘</div>
                    <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#E8EEFF', marginBottom: 10 }}>Account Suspended</h2>
                    <p style={{ fontSize: 14, color: '#5C6480', lineHeight: 1.7 }}>
                        Your access to this workspace has been temporarily suspended by your admin.
                        Please contact <strong style={{ color: '#9BA3BF' }}>{membership.admin_name}</strong> ({membership.admin_email}) to resolve this.
                    </p>
                </div>
            );
        }

        switch (activeTab) {
            case 'new-session':  return <NewSessionPage />;
            case 'history-scan': return <NewSessionPage />;
            case 'overview':     return <OverviewPage user={user} />;
            case 'history':      return <ScanHistoryPage />;
            case 'integrations': return <IntegrationsPage />;
            case 'profile':      return <ProfilePage user={user} onProfileUpdated={fetchProfile} />;
            case 'credits':      return isDev && membership ? <DeveloperCreditsPage membership={membership} /> : <CreditsPage />;
            case 'settings':     return <SettingsPage />;
            case 'cli-keys':     return <CliScansPage />;
            case 'dast':         return <DastScanPage />;
            case 'dast-result':  return <DastResultPage />;
            case 'team':         return isAdmin ? <TeamPage /> : <OverviewPage user={user} />;
            case 'audit-logs':   return isAdmin ? <AuditLogsPage /> : <OverviewPage user={user} />;
            default:             return <OverviewPage user={user} />;
        }
    };

    return (
        <ToastProvider>
        <div className="db-root">
            {sidebarOpen && (
                <div
                    className="db-overlay"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                />
            )}

            <Sidebar
                user={user}
                activeTab={activeTab}
                sidebarOpen={sidebarOpen}
                collapsed={collapsed}
                membership={membership}
                onTabChange={handleTabChange}
                onCloseSidebar={() => setSidebarOpen(false)}
                onToggleCollapse={() => setCollapsed(c => !c)}
                onLogout={handleLogout}
            />

            <main className={`db-main${collapsed ? ' sidebar-collapsed' : ''}`}>
                {/* Invite notification banner */}
                {inviteBanner && (
                    <div style={{
                        background: 'rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(99,102,241,0.2)',
                        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12,
                        fontSize: 13, color: '#a5b4fc',
                    }}>
                        <span>📨</span>
                        <span><strong>{inviteBanner.admin_name}</strong> has invited you to join their workspace.</span>
                        <a
                            href={`/join?token=${inviteBanner.token}`}
                            style={{ marginLeft: 'auto', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)', color: '#a5b4fc', borderRadius: 8, padding: '5px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', textDecoration: 'none' }}
                        >
                            View Invitation →
                        </a>
                        <button
                            onClick={() => setInviteBanner(null)}
                            style={{ background: 'none', border: 'none', color: '#5C6480', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}
                        >×</button>
                    </div>
                )}

                <header className="db-topbar">
                    <button
                        className="db-hamburger"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open navigation menu"
                    >
                        ☰
                    </button>
                    <div className="db-topbar-title">
                        {TAB_LABELS[activeTab] ?? activeTab}
                    </div>
                    <div className="db-topbar-right">
                        <div
                            className="db-avatar-md"
                            aria-label={`Logged in as ${user.name}`}
                        >
                            {getInitials(user.name)}
                        </div>
                    </div>
                </header>

                <div className="db-content">
                    <PageErrorBoundary
                        key={errorBoundaryKey}
                        onReset={() => setErrorBoundaryKey(k => k + 1)}
                    >
                        {renderPage()}
                    </PageErrorBoundary>
                </div>
            </main>

            {/* ── Backend-driven popup modal ── */}
            {popup && (
                <Modal
                    open={true}
                    onClose={dismiss}
                    title={popup.title}
                    subtitle={popup.subtitle}
                    imageUrl={popup.imageUrl || undefined}
                    icon={popup.icon || '📢'}
                    actions={[
                        ...(popup.primaryLabel ? [{
                            label:   popup.primaryLabel,
                            variant: 'primary' as const,
                            onClick: action,
                        }] : []),
                        ...(popup.dismissLabel ? [{
                            label:   popup.dismissLabel,
                            variant: 'ghost' as const,
                            onClick: dismiss,
                        }] : []),
                    ]}
                />
            )}
        </div>
        </ToastProvider>
    );
};

export default Dashboard;