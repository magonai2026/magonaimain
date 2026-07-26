import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './auth.css';

const INDUSTRIES = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
    'Legal', 'Consulting', 'E-commerce', 'Media', 'Manufacturing', 'Other'
];

const COUNTRIES = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
    'Germany', 'France', 'Singapore', 'UAE', 'Other'
];

const SignupOTP: React.FC = () => {
    const [form, setForm] = useState({ name: '', industry: '', age: '', country: '' });
    const [status, setStatus] = useState<{ type: 'error' | 'success' | ''; message: string }>({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email: string = searchParams.get('email') || '';
    const isGoogleSignup = searchParams.get('google') === '1';

    useEffect(() => {
        if (!email) navigate('/login');
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setStatus({ type: 'error', message: 'Full name is required.' });
            return;
        }
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const endpoint = isGoogleSignup ? '/api/signup/google' : '/api/signup';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, ...form, age: form.age ? parseInt(form.age) : undefined }),
            });
            const data = await res.json();

            if (res.ok) {
                setStatus({ type: 'success', message: 'Account created! Redirecting to dashboard...' });
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                setStatus({ type: 'error', message: data.message || 'Signup failed. Please try again.' });
            }
        } catch {
            setStatus({ type: 'error', message: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="split-screen-container">
            <section className="left-pane">
                <Link to="/login" className="btn-back-top">
                    <span>←</span> Back
                </Link>

                <div className="login-content" style={{ maxWidth: 460 }}>
                    <div className="login-header">
                        <div className="logo-icon-large">
                            <img src="/mangoai.png" alt="Magon AI" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <h2>Create Your Account</h2>
                        <p>Signing up as <strong>{email}</strong></p>
                    </div>

                    {status.message && (
                        <div className={`status-message ${status.type}`}>{status.message}</div>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="name">Full Name <span style={{ color: '#f87171' }}>*</span></label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Your full name"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="industry">Industry</label>
                                <select id="industry" name="industry" value={form.industry} onChange={handleChange} className="form-select">
                                    <option value="">Select industry</option>
                                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="age">Age</label>
                                <input
                                    type="number"
                                    id="age"
                                    name="age"
                                    value={form.age}
                                    onChange={handleChange}
                                    placeholder="Your age"
                                    min={13}
                                    max={120}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="country">Country</label>
                            <select id="country" name="country" value={form.country} onChange={handleChange} className="form-select">
                                <option value="">Select country</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="signup-terms">
                            By creating an account you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
                        </div>

                        <button type="submit" className="btn-login" disabled={isLoading}>
                            {isLoading ? 'Creating account...' : 'Create Account →'}
                        </button>
                    </form>
                </div>
            </section>

            <section className="right-pane">
                <div className="testimonial-content">
                    <div className="signup-perks">
                        <div className="perk-item">
                            <div className="perk-icon">✦</div>
                            <div>
                                <strong>100 Welcome Credits</strong>
                                <p>Start exploring immediately with free credits on signup.</p>
                            </div>
                        </div>
                        <div className="perk-item">
                            <div className="perk-icon">⬡</div>
                            <div>
                                <strong>Instant Access</strong>
                                <p>No waiting period. Your workspace is ready in seconds.</p>
                            </div>
                        </div>
                        <div className="perk-item">
                            <div className="perk-icon">◈</div>
                            <div>
                                <strong>Secure by Design</strong>
                                <p>OTP-only authentication — no passwords to manage or leak.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default SignupOTP;