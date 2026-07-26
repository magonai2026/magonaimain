import React, { useEffect, useState, useCallback } from 'react';
import { validateAndNormalizeRedirect } from './lib/safeRedirect';

export const prior_fixes_summary = 'Sidebar updated to validate server-provided redirect URLs before navigation.';

export interface BackendPopup {
    _id:           string;
    title:         string;
    subtitle?:     string;
    icon?:         string;
    imageUrl?:     string;
    primaryLabel?: string;
    primaryUrl?:   string;
    primaryTab?:   string;
    dismissLabel?: string;
    frequency:     'once' | 'session' | 'always';
    pages:         string[];
    priority:      number;
    triggerType:   'none' | 'credits_below';
    triggerValue:  number;
}

const SESSION_SEEN_KEY = 'niyantri_popups_seen_session';
const LOCAL_SEEN_KEY   = 'niyantri_popups_seen_ever';

function getSeenSession(): Set<string> {
    try {
        const raw = sessionStorage.getItem(SESSION_SEEN_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
}

function getSeenEver(): Set<string> {
    try {
        const raw = localStorage.getItem(LOCAL_SEEN_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
}

function markSeen(id: string, frequency: BackendPopup['frequency']) {
    if (frequency === 'session') {
        const s = getSeenSession();
        s.add(id);
        sessionStorage.setItem(SESSION_SEEN_KEY, JSON.stringify([...s]));
    } else if (frequency === 'once') {
        const s = getSeenEver();
        s.add(id);
        localStorage.setItem(LOCAL_SEEN_KEY, JSON.stringify([...s]));
    }
}

function shouldShow(popup: BackendPopup): boolean {
    if (popup.frequency === 'always')  return true;
    if (popup.frequency === 'session') return !getSeenSession().has(popup._id);
    return !getSeenEver().has(popup._id);
}

function passesTrigger(popup: BackendPopup, credits: number): boolean {
    if (popup.triggerType === 'none')          return true;
    if (popup.triggerType === 'credits_below') return credits < popup.triggerValue;
    return true;
}

interface UsePopupsReturn {
    popup:   BackendPopup | null;
    dismiss: () => void;
    action:  () => void;
}

export function usePopups(page: string, navigate: (path: string) => void): UsePopupsReturn {
    const queueRef    = React.useRef<BackendPopup[]>([]);
    const creditsRef  = React.useRef<number | null>(null);  // null = not loaded yet
    const [current, setCurrent] = useState<BackendPopup | null>(null);

    // Evaluate queue and pick first popup that passes all filters
    const evaluate = useCallback(() => {
        const credits = creditsRef.current;
        if (credits === null) return; // wait until wallet loaded

        const visible = queueRef.current.filter(
            p => shouldShow(p) && passesTrigger(p, credits)
        );
        setCurrent(visible[0] ?? null);
    }, []);

    // Fetch wallet balance ONCE on mount
    useEffect(() => {
        fetch('/api/wallet', { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                const bal = data?.balance ?? data?.credits ?? 0;
                creditsRef.current = bal;
                evaluate(); // re-evaluate now that we have credits
            })
            .catch(() => {
                creditsRef.current = 0; // treat as 0 on error
                evaluate();
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch popups whenever page changes
    useEffect(() => {
        let cancelled = false;

        setCurrent(null);
        queueRef.current = [];

        const fetchPopups = async () => {
            try {
                const res = await fetch(
                    `/api/popups/active?page=${encodeURIComponent(page)}`,
                    { credentials: 'include' }
                );
                if (!res.ok) return;

                const data: { popups: BackendPopup[] } = await res.json();
                if (cancelled) return;

                queueRef.current = data.popups;
                evaluate(); // evaluate immediately (credits may already be loaded)
            } catch (err) {
                console.error('[usePopups] fetch error:', err);
            }
        };

        fetchPopups();
        return () => { cancelled = true; };
    }, [page, evaluate]);

    const dismiss = useCallback(() => {
        if (!current) return;
        markSeen(current._id, current.frequency);
        queueRef.current = queueRef.current.filter(p => p._id !== current._id);
        evaluate();
    }, [current, evaluate]);

    const action = useCallback(() => {
        if (!current) return;
        markSeen(current._id, current.frequency);
        if (current.primaryUrl) {
            const target = validateAndNormalizeRedirect(current.primaryUrl);
            if (target) {
                window.location.href = target;
            } else {
                console.warn('Invalid redirect URL from popup:', current.primaryUrl);
                if (current.primaryTab) {
                    navigate(`/${current.primaryTab}`);
                }
            }
        } else if (current.primaryTab) {
            navigate(`/${current.primaryTab}`);
        }
        queueRef.current = queueRef.current.filter(p => p._id !== current._id);
        evaluate();
    }, [current, evaluate, navigate]);

    return { popup: current, dismiss, action };
}