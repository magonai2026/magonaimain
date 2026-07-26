
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ModalAction {
    label:    string;
    onClick:  () => void;
    variant?: 'primary' | 'ghost';
}

interface ModalProps {
    open:        boolean;
    onClose:     () => void;
    title:       string;
    subtitle?:   string;
    icon?:       React.ReactNode;
    actions?:    ModalAction[];
    children?:   React.ReactNode;
    imageUrl?:   string;
    /** Prevent closing when clicking the backdrop */
    persistent?: boolean;
    width?:      number | string;
}

const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    title,
    subtitle,
    icon,
    imageUrl,
    actions = [],
    children,
    persistent = false,
    width = 440,
}) => {
    const panelRef = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !persistent) onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, persistent, onClose]);

    // Lock body scroll
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div
            className="db-modal-backdrop"
            onClick={persistent ? undefined : onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="db-modal-title"
        >
            <div
                ref={panelRef}
                className="db-modal-panel"
                style={{ maxWidth: width }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                {!persistent && (
                    <button className="db-modal-close" onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                )}

                {/* Image */}
                {imageUrl && (
                    <div className="db-modal-image">
                        <img
                            src={imageUrl}
                            alt=""
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>
                )}

                {/* Icon — only show if no image */}
                {!imageUrl && icon && <div className="db-modal-icon">{icon}</div>}

                {/* Heading */}
                <h2 className="db-modal-title" id="db-modal-title">{title}</h2>
                {subtitle && <p className="db-modal-subtitle">{subtitle}</p>}

                {/* Body */}
                {children && <div className="db-modal-body">{children}</div>}

                {/* Actions */}
                {actions.length > 0 && (
                    <div className="db-modal-actions">
                        {actions.map((action, i) => (
                            <button
                                key={i}
                                className={
                                    action.variant === 'ghost'
                                        ? 'db-modal-btn db-modal-btn--ghost'
                                        : 'db-modal-btn db-modal-btn--primary'
                                }
                                onClick={action.onClick}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>,
        document.body,
    );
};

export default Modal;