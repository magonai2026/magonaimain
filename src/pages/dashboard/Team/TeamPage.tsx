import React, { useState } from 'react';
import MembersTab     from './MembersTab';
import InvitationsTab from './InvitationsTab';
import CreditsTab     from './CreditsTab';

type Tab = 'members' | 'invitations' | 'credits';

const TABS: { id: Tab; label: string }[] = [
    { id: 'members',     label: 'Members'     },
    { id: 'invitations', label: 'Invitations' },
    { id: 'credits',     label: 'Credits'     },
];

const TeamPage: React.FC = () => {
    const [active, setActive] = useState<Tab>('members');

    return (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 2px' }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontWeight: 800, fontSize: '1.55rem', color: '#E8EEFF', letterSpacing: '-0.02em', marginBottom: 6 }}>
                    Workspace
                </h1>
                <p style={{ fontSize: 14, color: '#5C6480' }}>
                    Manage your team, invitations, and credit distribution.
                </p>
            </div>

            {/* Tab bar */}
            <div style={{
                display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(99,102,241,0.12)', borderRadius: 12,
                padding: 4, marginBottom: 24, width: 'fit-content',
            }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActive(tab.id)}
                        style={{
                            padding: '8px 20px', borderRadius: 9, border: 'none',
                            background: active === tab.id ? 'rgba(99,102,241,0.18)' : 'transparent',
                            color: active === tab.id ? '#a5b4fc' : '#5C6480',
                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                            fontFamily: 'inherit', transition: 'all 0.15s',
                            boxShadow: active === tab.id ? '0 1px 6px rgba(99,102,241,0.15)' : 'none',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {active === 'members'     && <MembersTab     />}
            {active === 'invitations' && <InvitationsTab />}
            {active === 'credits'     && <CreditsTab     />}
        </div>
    );
};

export default TeamPage;
