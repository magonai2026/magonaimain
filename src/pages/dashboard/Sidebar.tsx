import React from 'react';
import type { DevMembership } from './workspaceTypes';
import './Dashboard.css';

interface User {
    uuid: string;
    email: string;
    name: string;
    role?: string;
    industry?: string;
    age?: number;
    country?: string;
    createdAt: string;
}

/* ── SVG Icons ───────────────────────────────────────────────────────────── */
const IC = {
    newSession: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09z" />
            <path d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456z" />
        </svg>
    ),
    overview: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
    ),
    history: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <polyline points="12,6 12,12 16,14" />
        </svg>
    ),
    profile: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
        </svg>
    ),
    graph: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="18" cy="7" r="2.5" />
            <circle cx="12" cy="17.5" r="2.5" />
            <path d="M7.9 7.6 10.5 15.4" />
            <path d="M16.2 8.9 13.6 15.6" />
            <path d="M8.5 6.3h7" />
        </svg>
    ),
    multiRepo: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2.5" y="3" width="8" height="7" rx="1.5" />
            <rect x="13.5" y="3" width="8" height="7" rx="1.5" />
            <rect x="8" y="14" width="8" height="7" rx="1.5" />
            <path d="M6.5 10v2.5h11V10" />
            <path d="M12 12.5V14" />
        </svg>
    ),
    dependencies: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 3 7v10l9 5 9-5V7z" />
            <path d="m3 7 9 5 9-5" />
            <path d="M12 12v10" />
        </svg>
    ),
    credits: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 6v12" />
            <path d="M15 9.5a3 3 0 0 0-3-2.5c-1.657 0-3 1.12-3 2.5s1.343 2 3 2.5c1.657.5 3 1.12 3 2.5 0 1.38-1.343 2.5-3 2.5a3 3 0 0 1-3-2.5" />
        </svg>
    ),
    integrations: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    settings: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    cli: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 9l3 3-3 3" />
            <path d="M13 15h4" />
        </svg>
    ),
    team: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    auditLogs: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="2" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="13" y2="16" />
        </svg>
    ),
};

interface SidebarProps {
    user:             User;
    activeTab:        string;
    sidebarOpen:      boolean;
    collapsed:        boolean;
    membership?:      DevMembership | null;
    onTabChange:      (tab: string) => void;
    onCloseSidebar:   () => void;
    onToggleCollapse: () => void;
    onLogout:         () => void;
}

const getInitials = (name?: string): string =>
    (name || 'User').trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';

const Sidebar: React.FC<SidebarProps> = ({
    user, activeTab, sidebarOpen, collapsed,
    membership, onTabChange, onCloseSidebar, onToggleCollapse, onLogout,
}) => {
    // Developer = accepted a workspace invitation. Everyone else acts as workspace owner.
    const isDev   = !!membership;
    const isAdmin = !isDev;
    const perms   = membership?.permissions;

    // Decide which regular nav items to show
    const regularItems = [
        { id: 'overview',     label: 'Overview',     icon: IC.overview,      show: true },
        { id: 'history',      label: 'History',      icon: IC.history,       show: !isDev || !!perms?.scan },
        { id: 'multi-repo',   label: 'Multi-Repo',   icon: IC.multiRepo,     show: !isDev || !!perms?.scan },
        { id: 'graph',        label: 'Graph',        icon: IC.graph,         show: !isDev || !!perms?.scan },
        { id: 'dependencies', label: 'Dependencies', icon: IC.dependencies,  show: !isDev || !!perms?.scan },
        { id: 'credits',      label: 'Credits',      icon: IC.credits,       show: true },
        { id: 'integrations', label: 'Integrations', icon: IC.integrations,  show: true },
        { id: 'profile',      label: 'Profile',      icon: IC.profile,       show: true },
        { id: 'settings',     label: 'Settings',     icon: IC.settings,      show: true },
        // Admin-only
        { id: 'team',         label: 'Team',         icon: IC.team,          show: isAdmin },
        { id: 'audit-logs',   label: 'Audit Logs',   icon: IC.auditLogs,     show: isAdmin },
    ].filter(i => i.show);

    const showNewSession = !isDev || !!perms?.scan;
    const showCli        = isAdmin;

    return (
        <aside
            className={`db-sidebar ${sidebarOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}
            aria-label="Main navigation"
        >
            {/* Logo */}
            <div className="db-sidebar-logo">
                <img
                    src="/mangoai.png"
                    alt="Niyantri Security"
                    style={{ width: '46px', height: '46px', objectFit: 'contain' }}
                    aria-hidden="true"
                />
                <span className="db-brand">Magon AI</span>
                <button
                    className="db-collapse-btn"
                    onClick={onToggleCollapse}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <span className="db-collapse-icon" aria-hidden="true">
                        <span /><span /><span />
                    </span>
                </button>
            </div>

            {/* Nav */}
            <nav className="db-nav" aria-label="Sidebar navigation">

                {showNewSession && (
                    <button
                        className={`db-nav-item db-nav-new-session ${activeTab === 'new-session' ? 'active' : ''}`}
                        onClick={() => { onTabChange('new-session'); onCloseSidebar(); }}
                        aria-current={activeTab === 'new-session' ? 'page' : undefined}
                    >
                        <span className="db-nav-icon" aria-hidden="true">{IC.newSession}</span>
                        <span>New Session</span>
                    </button>
                )}

                {showNewSession && <div className="db-nav-divider" role="separator" />}

                {regularItems.map(item => (
                    <button
                        key={item.id}
                        className={`db-nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => { onTabChange(item.id); onCloseSidebar(); }}
                        aria-current={activeTab === item.id ? 'page' : undefined}
                    >
                        <span className="db-nav-icon" aria-hidden="true">{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}

                {showCli && (
                    <>
                        <div className="db-nav-divider" role="separator" />
                        <button
                            className={`db-nav-item db-nav-cli ${activeTab === 'cli-keys' ? 'active' : ''}`}
                            onClick={() => { onTabChange('cli-keys'); onCloseSidebar(); }}
                            aria-current={activeTab === 'cli-keys' ? 'page' : undefined}
                            title="Manage CLI API keys"
                        >
                            <span className="db-nav-icon" aria-hidden="true">{IC.cli}</span>
                            <span>CLI</span>
                            <span className="db-cli-badge" aria-hidden="true">CLI</span>
                        </button>
                    </>
                )}

            </nav>

            {/* Footer */}
            <div className="db-sidebar-footer">
                {/* Role badge */}
                {(isAdmin || isDev) && (
                    <div style={{
                        marginBottom: 8,
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 8,
                        background: isAdmin ? 'rgba(124,58,237,0.1)' : 'rgba(99,102,241,0.08)',
                        border: `1px solid ${isAdmin ? 'rgba(124,58,237,0.25)' : 'rgba(99,102,241,0.15)'}`,
                    }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: isAdmin ? '#c084fc' : '#818cf8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                            {isAdmin ? '⚡ Admin' : '👤 Developer'}
                        </span>
                        {isDev && membership?.admin_name && (
                            <span style={{ fontSize: 10, color: '#5C6480', marginLeft: 'auto' }}>
                                via {membership.admin_name.split(' ')[0]}
                            </span>
                        )}
                    </div>
                )}

                <div className="db-user-chip" aria-label={`Signed in as ${user.name}`}>
                    <div className="db-avatar-sm" aria-hidden="true">{getInitials(user.name)}</div>
                    <div className="db-user-chip-info">
                        <span className="db-user-chip-name">{user.name}</span>
                        <span className="db-user-chip-email">{user.email}</span>
                    </div>
                </div>
                <button
                    className="db-logout-btn"
                    onClick={onLogout}
                    aria-label="Sign out of your account"
                >
                    Sign out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
