import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './auth.css';

const VerifyOTP: React.FC = () => {
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [status, setStatus] = useState<{ type: 'error' | 'success' | ''; message: string }>({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email: string = searchParams.get('email') || '';
    const cliToken: string = searchParams.get('cli_token') || '';  // ← read once here

    useEffect(() => {
        if (!email) navigate('/login');
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleDigitChange = (index: number, value: string) => {
        const clean = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = clean;
        setDigits(next);
        if (clean && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = ['', '', '', '', '', ''];
        pasted.split('').forEach((ch, i) => { next[i] = ch; });
        setDigits(next);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    // ─── Confirm CLI token after successful login ────────────────────────────
    // Called only when ?cli_token is present in the URL.
    // The browser sends the session cookie automatically (credentials: 'include'),
    // so the backend uses authenticateJWT to verify the user — no admin secret needed.
    const confirmCliAuth = async (): Promise<boolean> => {
        try {
            const res = await fetch('/api/cli/auth/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',          // sends session cookie
                body: JSON.stringify({
                    token: cliToken,
                    email,                        // ← was missing in old code (caused 400)
                }),
            });
            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: '✅ CLI authenticated! You can return to your terminal.' });
                return true;
            } else {
                setStatus({ type: 'error', message: data.message || 'CLI authentication failed.' });
                return false;
            }
        } catch {
            setStatus({ type: 'error', message: 'Network error during CLI authentication.' });
            return false;
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const otp = digits.join('');
        if (otp.length < 6) {
            setStatus({ type: 'error', message: 'Please enter the 6-digit code.' });
            return;
        }

        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const res = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();

            if (res.ok) {
                if (data.userExists) {
                    // ── Existing user logged in ──────────────────────────────
                    if (cliToken) {
                        // CLI flow: confirm token, then redirect after short delay
                        const ok = await confirmCliAuth();
                        if (ok) {
                            setTimeout(() => navigate('/dashboard'), 2000);
                        }
                        // If failed, stay on page so user sees the error — don't redirect
                    } else {
                        // Normal web login
                        setStatus({ type: 'success', message: 'Login successful!' });
                        setTimeout(() => navigate('/dashboard'), 1500);
                    }
                } else {
                    // ── New user — go to signup ──────────────────────────────
                    // Preserve cli_token in the signup URL so the flow can complete
                    // after account creation if needed
                    setStatus({ type: 'success', message: 'Email verified! Taking you to sign up...' });
                    const signupUrl = cliToken
                        ? `/signup?email=${encodeURIComponent(email)}&cli_token=${encodeURIComponent(cliToken)}`
                        : `/signup?email=${encodeURIComponent(email)}`;
                    setTimeout(() => navigate(signupUrl), 1500);
                }
            } else {
                setStatus({ type: 'error', message: data.message || 'Invalid OTP. Try again.' });
                setDigits(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch {
            setStatus({ type: 'error', message: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        setStatus({ type: '', message: '' });
        try {
            const res = await fetch('/api/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setStatus({ type: 'success', message: 'New code sent!' });
                setResendCooldown(30);
                setDigits(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to resend.' });
            }
        } catch {
            setStatus({ type: 'error', message: 'Network error.' });
        }
    };

    return (
        <main className="split-screen-container">
            <section className="left-pane">
                <Link to="/login" className="btn-back-top">
                    <span>←</span> Back to Login
                </Link>

                <div className="login-content">
                    <div className="login-header">
                        <div className="logo-icon-large">
                            <img src="/mangoai.png" alt="Magon AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>

                        {/* Show a CLI badge if this is a CLI login flow */}
                        {cliToken && (
                            <div className="cli-badge">
                                <span>🖥️</span> CLI Login Request
                            </div>
                        )}

                        <h2>Check Your Email</h2>
                        <p>We sent a 6-digit code to<br /><strong>{email}</strong></p>

                        {cliToken && (
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                After verification, your terminal will be authenticated automatically.
                            </p>
                        )}
                    </div>

                    {status.message && (
                        <div className={`status-message ${status.type}`}>{status.message}</div>
                    )}

                    <form onSubmit={handleVerify} className="login-form">
                        <div className="otp-inputs" onPaste={handlePaste}>
                            {digits.map((d, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={d}
                                    onChange={e => handleDigitChange(i, e.target.value)}
                                    onKeyDown={e => handleKeyDown(i, e)}
                                    className="otp-digit"
                                    autoComplete="off"
                                />
                            ))}
                        </div>

                        <button type="submit" className="btn-login" disabled={isLoading}>
                            {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                    </form>

                    <div className="login-footer" style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <p>
                            Didn't receive a code?{' '}
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendCooldown > 0}
                                style={{
                                    background: 'none', border: 'none',
                                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                                    color: resendCooldown > 0 ? '#475569' : '#a855f7',
                                    fontWeight: 600,
                                    fontSize: '0.95rem', padding: 0
                                }}
                            >
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                            </button>
                        </p>
                    </div>
                </div>
            </section>

            <section className="right-pane">
                <div className="testimonial-content">
                    <blockquote>
                        "Niyantri Labs has completely transformed our development workflow..."
                    </blockquote>
                    <div className="testimonial-author">
                        <div className="author-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#f0f4ff' }}>DR</div>
                        <div className="author-info"><strong>Dinesh Rao</strong></div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default VerifyOTP;