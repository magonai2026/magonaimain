import React, { useState } from 'react';
import WebhookPanel from './WebhookPanel';
import SlackPanel from './SlackPanel';
import TeamsPanel from './TeamsPanel';
import GitLabPanel from './GitLabPanel';
import GitHubPanel from './GitHubPanel';

type ActivePanel = 'github' | 'webhook' | 'slack' | 'teams' | 'gitlab' | null;

const Logo = ({ src, alt, size = 28 }: { src: string; alt: string; size?: number }) => (
    <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        style={{ objectFit: 'contain', display: 'block', flexShrink: 0 }}
        draggable={false}
    />
);

/* SVG data URIs — no external CDN dependency */
const LOGOS = {
    github: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z'/%3E%3C/svg%3E`,

    slack: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z' fill='%23E01E5A'/%3E%3C/svg%3E`,

    teams: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M20.625 7.313a3.375 3.375 0 1 0 0-6.75 3.375 3.375 0 0 0 0 6.75zm0 1.687c-1.219 0-2.531.328-3.469.938-.656-2.156-2.672-3.703-5.063-3.703-2.906 0-5.25 2.344-5.25 5.25 0 .188.016.375.031.563A5.251 5.251 0 0 0 3 17.25c0 2.906 2.344 5.25 5.25 5.25h9c2.906 0 5.25-2.344 5.25-5.25v-6.563c0-1.031-.844-1.687-1.875-1.687zm-7.688 1.5a3.563 3.563 0 1 1 0 7.125 3.563 3.563 0 0 1 0-7.125z' fill='%235059C9'/%3E%3C/svg%3E`,

    gitlab: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 0 0-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 0 0-.867 0L1.386 9.45.044 13.587a.924.924 0 0 0 .331 1.023L12 23.054l11.625-8.443a.924.924 0 0 0 .33-1.024' fill='%23FC6D26'/%3E%3C/svg%3E`,
};

interface IntegrationCardProps {
    logo:        React.ReactNode;
    title:       string;
    description: string;
    badgeLabel:  string;
    badgeColor:  'purple' | 'green' | 'blue' | 'orange';
    iconBg:      string;
    active:      boolean;
    onToggle:    () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
    logo, title, description, badgeLabel, badgeColor, iconBg, active, onToggle,
}) => (
    <div
        className="db-form-card"
        style={{
            borderColor: active ? 'rgba(124,58,237,0.4)' : undefined,
            boxShadow:   active ? '0 4px 24px rgba(124,58,237,0.08)' : undefined,
            transition:  'border-color 0.22s, box-shadow 0.22s',
            padding:     '1.25rem 1.5rem',
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Brand icon */}
            <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.07)',
            }}>
                {logo}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.975rem', color: 'var(--text)' }}>{title}</span>
                    <span className={`db-badge db-badge--${badgeColor === 'orange' ? 'green' : badgeColor}`}
                          style={badgeColor === 'orange' ? { background: 'rgba(251,146,60,0.15)', color: '#fb923c', border: '1px solid rgba(251,146,60,0.3)' } : undefined}>
                        {badgeLabel}
                    </span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{description}</p>
            </div>

            <button
                className={active ? 'db-save-btn' : 'db-settings-cancel-btn'}
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                onClick={onToggle}
            >
                {active ? 'Close' : 'Configure'}
            </button>
        </div>
    </div>
);

const IntegrationsPage: React.FC = () => {
    const [activePanel, setActivePanel] = useState<ActivePanel>(null);
    const toggle = (panel: ActivePanel) =>
        setActivePanel(p => p === panel ? null : panel);

    return (
        <div className="db-section" style={{ animation: 'ns-fade-up 0.45s var(--ease-out) both' }}>
            <div className="db-section-header">
                <h2>Integrations</h2>
                <p>Connect Niyantri Security to your development workflow — auto-scan on push, notify your team, and file tickets automatically.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* GitHub OAuth */}
                <IntegrationCard
                    logo={<Logo src={LOGOS.github} alt="GitHub" />}
                    title="GitHub"
                    description="Connect your GitHub account via OAuth to scan private repositories and open automatic fix pull requests."
                    badgeLabel="OAuth"
                    badgeColor="purple"
                    iconBg="#161b22"
                    active={activePanel === 'github'}
                    onToggle={() => toggle('github')}
                />
                {activePanel === 'github' && <GitHubPanel />}

                {/* GitHub Webhook */}
                <IntegrationCard
                    logo={<Logo src={LOGOS.github} alt="GitHub Webhook" />}
                    title="GitHub Webhook"
                    description="Trigger automatic scans and fixes on every push. Configure your target branches, auto-fix severities, Slack alerts, and Email notifications."
                    badgeLabel="Push events"
                    badgeColor="purple"
                    iconBg="#161b22"
                    active={activePanel === 'webhook'}
                    onToggle={() => toggle('webhook')}
                />
                {activePanel === 'webhook' && <WebhookPanel />}

                {/* Slack */}
                <IntegrationCard
                    logo={<Logo src={LOGOS.slack} alt="Slack" />}
                    title="Slack Bot"
                    description="Chat with Niyantri directly from Slack. Bind a channel to any scan session and ask questions about your vulnerabilities."
                    badgeLabel="Chat"
                    badgeColor="green"
                    iconBg="#1a0d00"
                    active={activePanel === 'slack'}
                    onToggle={() => toggle('slack')}
                />
                {activePanel === 'slack' && <SlackPanel />}

                {/* Microsoft Teams */}
                <IntegrationCard
                    logo={<Logo src={LOGOS.teams} alt="Microsoft Teams" />}
                    title="Microsoft Teams"
                    description="Get scan alerts and interact with Niyantri directly in your Microsoft Teams channels."
                    badgeLabel="Chat & Alerts"
                    badgeColor="blue"
                    iconBg="#0d0f2b"
                    active={activePanel === 'teams'}
                    onToggle={() => toggle('teams')}
                />
                {activePanel === 'teams' && <TeamsPanel />}

                {/* GitLab */}
                <IntegrationCard
                    logo={<Logo src={LOGOS.gitlab} alt="GitLab" />}
                    title="GitLab"
                    description="Connect your GitLab account to scan projects, trigger fixes on push, and pull repository data directly from GitLab via OAuth."
                    badgeLabel="OAuth"
                    badgeColor="orange"
                    iconBg="#1a0a00"
                    active={activePanel === 'gitlab'}
                    onToggle={() => toggle('gitlab')}
                />
                {activePanel === 'gitlab' && <GitLabPanel />}

            </div>
        </div>
    );
};

export default IntegrationsPage;
