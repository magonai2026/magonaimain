import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './auth.css';

type Step = 'email' | 'otp';

const testimonials = [
  {
    id: 1,
    quote:
      "The Spirit has completely transformed our development workflow. It's like having an extra team of senior engineers working around the clock. Reliable and efficient.",
    name: "Dinesh Rao",
    avatar:
      "https://ui-avatars.com/api/?name=Dinesh+Rao&background=3b82f6&color=fff&size=128",
  },
  {
    id: 2,
    quote:
      "Our time-to-market dropped by 60% since adopting this autonomous platform. The quality of the generated iOS and Android code is astounding and always top-notch.",
    name: "Satwik Reddy",
    avatar:
      "https://ui-avatars.com/api/?name=Satwik+Reddy&background=a855f7&color=fff&size=128",
  },
  {
    id: 3,
    quote:
      "SoftQA has completely transformed our testing process. It's reliable, efficient, and ensures our releases are always top-notch.",
    name: "Vamshi Naidu",
    avatar:
      "https://ui-avatars.com/api/?name=Vamshi+Naidu&background=06b6d4&color=fff&size=128",
  },
];

const Login: React.FC = () => {
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [digits, setDigits] = useState(['', '', '', '', '', '']);
    const [status, setStatus] = useState<{ type: 'error' | 'success' | ''; message: string }>({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [csrfToken, setCsrfToken] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const cliToken = searchParams.get('cli_token') || '';

    const [activeTestimonial, setActiveTestimonial] = useState(0);

    // Auto-rotate testimonials every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial(prev => (prev + 1) % testimonials.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const goToTestimonial = (index: number) => {
        setActiveTestimonial(index);
    };

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    useEffect(() => {
        if (step === 'otp') {
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        }
    }, [step]);

    useEffect(() => {
        fetch('/api/csrf-token', { credentials: 'include' })
            .then(res => res.json())
            .then(data => setCsrfToken(data.csrfToken))
            .catch(() => console.error('Failed to get CSRF token'));
    }, []);

    // ── Surface Google OAuth errors from query param ──────────────────────────
    useEffect(() => {
        const error = searchParams.get('error');
        if (!error) return;
        const messages: Record<string, string> = {
            google_failed:       'Google sign-in failed. Please try again.',
            google_no_email:     'Google did not share your email address. Please use OTP login.',
            google_server_error: 'Something went wrong during Google sign-in. Please try again.',
        };
        setStatus({ type: 'error', message: messages[error] || 'Sign-in error. Please try again.' });
    }, []);

    // ── If cli_token is present and user already has a session, skip login ────
    useEffect(() => {
        if (!cliToken) return;
        fetch('/api/profile', { credentials: 'include' })
            .then(res => {
                if (res.ok) {
                    navigate(`/cli-confirm?cli_token=${encodeURIComponent(cliToken)}`, { replace: true });
                }
            })
            .catch(() => { /* network error — stay on page */ });
    }, [cliToken]);

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

    // ── Google OAuth — redirect to backend, preserving cli_token ─────────────
    const handleGoogleLogin = () => {
        const googleUrl = cliToken
            ? `/api/auth/google?cli_token=${encodeURIComponent(cliToken)}`
            : '/api/auth/google';
        window.location.href = googleUrl;
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: '', message: '' });
        try {
            const res = await fetch('/api/request-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setStatus({ type: 'success', message: `OTP sent to ${email}. Check your inbox.` });
                setDigits(['', '', '', '', '', '']);
                setResendCooldown(30);
                setStep('otp');
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to send OTP.' });
            }
        } catch {
            setStatus({ type: 'error', message: 'Network error. Please try again later.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
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
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                credentials: 'include',
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (res.ok) {
                if (data.userExists) {
                    if (cliToken) {
                        setStatus({ type: 'success', message: 'Login successful! Confirming CLI access...' });
                        setTimeout(() => navigate(`/cli-confirm?cli_token=${encodeURIComponent(cliToken)}`), 500);
                    } else {
                        setStatus({ type: 'success', message: 'Login successful!' });
                        setTimeout(() => navigate('/dashboard'), 1500);
                    }
                } else {
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
                <Link to="/" className="btn-back-top">
                    <span>←</span> Back to Home
                </Link>

                <div className="login-content">
                    <div className="login-header">
                        <div className="logo-icon-large">
                            <img src="/mangoai.png" alt="Magon AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>

                        {cliToken && (
                            <div className="cli-badge">
                                <span>🖥️</span> CLI Login Request
                            </div>
                        )}

                        <h2>{step === 'email' ? 'Welcome Back' : 'Check Your Email'}</h2>
                        <p>
                            {step === 'email'
                                ? 'Sign in to your Niyantri Labs account'
                                : <span>We sent a 6-digit code to<br /><strong>{email}</strong></span>}
                        </p>
                    </div>

                    {status.message && (
                        <div className={`status-message ${status.type}`}>
                            {status.message}
                        </div>
                    )}

                    {step === 'email' ? (
                        <>
                            <form onSubmit={handleRequestOtp} className="login-form">
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn-login" disabled={isLoading}>
                                    {isLoading ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </form>

                            <div className="auth-divider">
                                <span>or</span>
                            </div>

                            <button
                                type="button"
                                className="btn-google"
                                onClick={handleGoogleLogin}
                            >
                                <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Continue with Google
                            </button>
                        </>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="login-form">
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

                            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendCooldown > 0}
                                    style={{
                                        background: 'none', border: 'none',
                                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                                        color: resendCooldown > 0 ? '#475569' : '#a855f7',
                                        fontWeight: 600, fontSize: '0.95rem', padding: 0
                                    }}
                                >
                                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                                </button>
                            </div>

                            <button
                                type="button"
                                className="btn-resend"
                                onClick={() => {
                                    setStep('email');
                                    setDigits(['', '', '', '', '', '']);
                                    setStatus({ type: '', message: '' });
                                }}
                            >
                                ← Use a different email
                            </button>
                        </form>
                    )}

                    <div className="login-footer">
                        <p>By continuing, you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.</p>
                    </div>
                </div>
            </section>

            <section className="right-pane">
                <div className="testimonial-content">
                    <div className="testimonial-track-wrapper">
                        <div
                            className="testimonial-track"
                            style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
                        >
                            {testimonials.map((t) => (
                                <div key={t.id} className="testimonial-slide">
                                    <blockquote>"{t.quote}"</blockquote>
                                    <div className="testimonial-author">
                                        <div className="author-avatar">
                                            <img src={t.avatar} alt={t.name} />
                                        </div>
                                        <div className="author-info">
                                            <strong>{t.name}</strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="testimonial-dots">
                        {testimonials.map((_, i) => (
                            <button
                                key={i}
                                className={`testimonial-dot ${i === activeTestimonial ? 'active' : ''}`}
                                onClick={() => goToTestimonial(i)}
                                aria-label={`Go to testimonial ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Login;