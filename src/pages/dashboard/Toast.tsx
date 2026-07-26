import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem { id: string; type: ToastType; message: string; }

interface ToastCtx { showToast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastCtx>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

const CFG: Record<ToastType, { icon: string; border: string; iconBg: string; iconColor: string }> = {
    success: { icon: '✓', border: 'rgba(16,185,129,0.35)',  iconBg: 'rgba(16,185,129,0.15)',  iconColor: '#34d399' },
    error:   { icon: '✕', border: 'rgba(244,63,94,0.35)',   iconBg: 'rgba(244,63,94,0.15)',   iconColor: '#f87171' },
    info:    { icon: 'i', border: 'rgba(99,102,241,0.35)',  iconBg: 'rgba(99,102,241,0.15)',  iconColor: '#818cf8' },
    warning: { icon: '!', border: 'rgba(245,158,11,0.35)',  iconBg: 'rgba(245,158,11,0.15)',  iconColor: '#fbbf24' },
};

const TOAST_CSS = `
@keyframes toast-slide-in {
    from { opacity: 0; transform: translateX(24px) scale(0.96); }
    to   { opacity: 1; transform: translateX(0)    scale(1); }
}
@keyframes toast-slide-out {
    from { opacity: 1; transform: translateX(0)    scale(1); max-height: 80px; margin-bottom: 0; }
    to   { opacity: 0; transform: translateX(24px) scale(0.96); max-height: 0; margin-bottom: -8px; }
}
.toast-item {
    display: flex; align-items: center; gap: 11px;
    background: #13151F;
    border-radius: 11px;
    padding: 11px 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset;
    min-width: 270px; max-width: 360px;
    pointer-events: all;
    animation: toast-slide-in 0.22s cubic-bezier(0.16,1,0.3,1) both;
    font-family: 'Instrument Sans', sans-serif;
}
.toast-icon {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800;
}
.toast-msg {
    flex: 1; font-size: 13px; color: #E8EEFF; line-height: 1.45;
}
.toast-close {
    background: none; border: none; color: #52525b; cursor: pointer;
    padding: 2px 4px; font-size: 13px; line-height: 1; flex-shrink: 0;
    border-radius: 4px; transition: color 0.15s;
}
.toast-close:hover { color: #a1a1aa; }
`;

const ToastEl: React.FC<{ t: ToastItem; onClose: (id: string) => void }> = ({ t, onClose }) => {
    const cfg = CFG[t.type];
    return (
        <div className="toast-item" style={{ border: `1px solid ${cfg.border}` }}>
            <div className="toast-icon" style={{ background: cfg.iconBg, color: cfg.iconColor }}>
                {cfg.icon}
            </div>
            <span className="toast-msg">{t.message}</span>
            <button className="toast-close" onClick={() => onClose(t.id)} aria-label="Dismiss">✕</button>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const counter = useRef(0);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = `toast-${++counter.current}`;
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => dismiss(id), 3800);
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            <style>{TOAST_CSS}</style>
            {children}
            {toasts.length > 0 && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    display: 'flex', flexDirection: 'column', gap: 8,
                    pointerEvents: 'none',
                }}>
                    {toasts.map(t => <ToastEl key={t.id} t={t} onClose={dismiss} />)}
                </div>
            )}
        </ToastContext.Provider>
    );
};
