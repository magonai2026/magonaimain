import React, { useState, useRef, useEffect } from 'react';

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

interface ProfileForm {
    email: string;
    industry: string;
    age: string;
    country: string;
}

interface ProfilePageProps {
    user: User;
    onProfileUpdated: () => void;
}

const INDUSTRIES = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
    'Legal', 'Consulting', 'E-commerce', 'Media', 'Manufacturing', 'Other',
];

const COUNTRIES = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'Germany', 'France', 'Singapore', 'UAE', 'Other',
];

interface SelectOption { value: string; label: string; }

const CustomSelect: React.FC<{
    id: string;
    value: string;
    onChange: (v: string) => void;
    options: SelectOption[];
    placeholder: string;
    dropUp?: boolean;
}> = ({ id, value, onChange, options, placeholder, dropUp = false }) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    const selected = options.find(o => o.value === value);

    return (
        <div ref={wrapRef} style={{ position: 'relative' }}>
            <button
                id={id}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen(p => !p)}
                style={{
                    width: '100%',
                    padding: '0.72rem 0.9rem',
                    border: `1.5px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                    color: selected ? 'var(--text)' : '#565b78',
                    fontSize: '0.9rem',
                    lineHeight: 1.4,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    boxShadow: open ? '0 0 0 3px rgba(168,85,247,0.14)' : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
            >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg width="12" height="12" viewBox="0 0 12 12"
                    style={{ flexShrink: 0, transition: 'transform 0.18s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path d="M2 4L6 8L10 4" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            </button>

            {open && (
                <div role="listbox" style={{
                    position: 'absolute',
                    ...(dropUp
                        ? { bottom: 'calc(100% + 4px)', top: undefined }
                        : { top: 'calc(100% + 4px)', bottom: undefined }),
                    left: 0, right: 0,
                    zIndex: 200,
                    background: '#13151F',
                    border: '1px solid rgba(99,102,241,0.22)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: dropUp
                        ? '0 -8px 32px rgba(0,0,0,0.5)'
                        : '0 8px 32px rgba(0,0,0,0.5)',
                    maxHeight: 220,
                    overflowY: 'auto',
                }}>
                    {[{ value: '', label: placeholder }, ...options].map(opt => {
                        const isActive = opt.value === value || (opt.value === '' && !value);
                        return (
                            <div
                                key={opt.value}
                                role="option"
                                aria-selected={isActive}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                style={{
                                    padding: '0.6rem 0.9rem',
                                    fontSize: '0.875rem',
                                    color: isActive ? 'var(--text)' : '#9BA3BF',
                                    background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background 0.1s, color 0.1s',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                                        (e.currentTarget as HTMLDivElement).style.color = '#e4e4e7';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                                        (e.currentTarget as HTMLDivElement).style.color = '#9BA3BF';
                                    }
                                }}
                            >
                                {opt.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const buildForm = (user: User): ProfileForm => ({
    email:    user.email    || '',
    industry: user.industry || '',
    age:      user.age      ? String(user.age) : '',
    country:  user.country  || '',
});

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onProfileUpdated }) => {
    const initialForm = useRef<ProfileForm>(buildForm(user));

    const [profileForm, setProfileForm] = useState<ProfileForm>(buildForm(user));
    const [profileStatus, setProfileStatus] = useState<{
        type: 'error' | 'success' | '';
        message: string;
    }>({ type: '', message: '' });
    const [isSaving, setIsSaving] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const savedFormRef = useRef<ProfileForm | null>(null);

    // Keep form in sync when user prop changes. After a successful save, merge API response
    // with what the user just saved — in case the backend omits unchanged fields.
    useEffect(() => {
        const built = buildForm(user);
        if (savedFormRef.current) {
            const saved = savedFormRef.current;
            savedFormRef.current = null;
            const merged: ProfileForm = {
                email:    built.email    || saved.email,
                industry: built.industry || saved.industry,
                age:      built.age      || saved.age,
                country:  built.country  || saved.country,
            };
            initialForm.current = merged;
            setProfileForm(merged);
        } else {
            initialForm.current = built;
            setProfileForm(built);
        }
    }, [user]);

    // Cancel in-flight requests on unmount
    useEffect(() => {
        return () => { abortRef.current?.abort(); };
    }, []);

    const isDirty =
        profileForm.industry !== initialForm.current.industry ||
        profileForm.age      !== initialForm.current.age      ||
        profileForm.country  !== initialForm.current.country;

    const getInitials = (name: string) =>
        (name || '')
            .split(' ')
            .filter(Boolean)
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || '?';

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsSaving(true);
        setProfileStatus({ type: '', message: '' });

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                signal: controller.signal,
                body: JSON.stringify({
                    ...profileForm,
                    age: profileForm.age ? parseInt(profileForm.age) : undefined,
                }),
            });

            if ((res as Response).status === 401) {
                // Session expired mid-form
                window.location.href = '/login';
                return;
            }

            const data = await res.json();

            if (res.ok) {
                setProfileStatus({ type: 'success', message: 'Profile updated successfully.' });
                savedFormRef.current = { ...profileForm };
                onProfileUpdated();
            } else {
                setProfileStatus({ type: 'error', message: data.message || 'Update failed.' });
            }
        } catch (err) {
            if ((err as Error).name === 'AbortError') return;
            setProfileStatus({ type: 'error', message: 'Network error. Please try again.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="db-section">
            <div className="db-section-header">
                <h2>Your Profile</h2>
                <p>Update your personal information.</p>
            </div>

            <div className="db-form-card">
                <div className="db-profile-top">
                    <div className="db-avatar-lg" aria-hidden="true">{getInitials(user.name)}</div>
                    <div>
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                        <span className="db-badge db-badge--purple">{user.role || 'Member'}</span>
                    </div>
                </div>

                {profileStatus.message && (
                    <div
                        className={`db-status ${profileStatus.type}`}
                        role={profileStatus.type === 'error' ? 'alert' : 'status'}
                        aria-live="polite"
                    >
                        {profileStatus.message}
                    </div>
                )}

                <form onSubmit={handleProfileSave} className="db-form" noValidate>
                    <div className="db-form-group">
                        <label htmlFor="profile-email">Email Address</label>
                        <input
                            id="profile-email"
                            type="email"
                            value={profileForm.email}
                            readOnly
                            autoComplete="email"
                            style={{ opacity: 0.55, cursor: 'not-allowed' }}
                        />
                    </div>

                    <div className="db-form-row">
                        <div className="db-form-group">
                            <label htmlFor="profile-industry">Industry</label>
                            <CustomSelect
                                id="profile-industry"
                                value={profileForm.industry}
                                onChange={v => setProfileForm({ ...profileForm, industry: v })}
                                placeholder="Select industry"
                                options={INDUSTRIES.map(i => ({ value: i, label: i }))}
                            />
                        </div>
                        <div className="db-form-group">
                            <label htmlFor="profile-age">Age</label>
                            <input
                                id="profile-age"
                                type="number"
                                value={profileForm.age}
                                onChange={e => setProfileForm({ ...profileForm, age: e.target.value })}
                                min={13}
                                max={120}
                                placeholder="Your age"
                            />
                        </div>
                    </div>

                    <div className="db-form-group">
                        <label htmlFor="profile-country">Country</label>
                        <CustomSelect
                            id="profile-country"
                            value={profileForm.country}
                            onChange={v => setProfileForm({ ...profileForm, country: v })}
                            placeholder="Select country"
                            options={COUNTRIES.map(c => ({ value: c, label: c }))}
                            dropUp
                        />
                    </div>

                    <button
                        type="submit"
                        className="db-save-btn"
                        disabled={isSaving || !isDirty}
                        title={!isDirty ? 'No changes to save' : undefined}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;