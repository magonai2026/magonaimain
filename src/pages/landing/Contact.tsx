import React, { useState } from 'react';
import './Contact.css';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface StatusState {
  type: 'success' | 'error' | '';
  message: string;
}

const Contact: React.FC = () => {

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<StatusState>({
    type: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setIsSubmitting(true);

    setStatus({
      type: '',
      message: '',
    });

    try {

      const res = await fetch('/api/contact', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (json.success) {

        setStatus({
          type: 'success',
          message:
            "✓ Message sent successfully! We'll get back to you soon.",
        });

        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });

      } else {

        setStatus({
          type: 'error',
          message:
            `⚠ ${json.message || 'Failed to send message.'}`,
        });

      }

    } catch {

      setStatus({
        type: 'error',
        message:
          '⚠ Server error. Please try again.',
      });

    } finally {

      setIsSubmitting(false);

      setTimeout(() => {

        setStatus({
          type: '',
          message: '',
        });

      }, 3000);

    }

  };

  return (

    <main className="contact-page">

      {/* Background */}
      <div className="contact-grid-bg" />
      <div className="contact-center-glow" />

      <div className="contact-edge-light contact-edge-left" />
      <div className="contact-edge-light contact-edge-right" />

      {/* Status */}
      {status.message && (

        <div
          className={`${status.type}-message show`}
          style={{
            position: 'fixed',
            top: '100px',
            right: '20px',

            padding: '1rem 1.2rem',

            background:
              status.type === 'success'
                ? '#10b981'
                : '#ef4444',

            color: 'white',

            borderRadius: '14px',

            zIndex: 2000,
          }}
        >
          {status.message}
        </div>

      )}

      {/* HERO */}
      <section className="contact-hero">

        <div className="contact-badge">
          ✦ Contact & Partnerships
        </div>

        <h1 className="contact-title">

          <span className="contact-title-line">
            Let’s Build Secure
          </span>

          <span className="contact-title-accent">
            AI Together
          </span>

        </h1>

        <p className="contact-description">
          Reach out to discuss AI security, partnerships,
          research collaborations, or enterprise vulnerability
          scanning solutions.
        </p>

      </section>

      {/* MARQUEE */}
      <div className="waitlist-marquee-wrapper">

        <div className="waitlist-marquee-track">

          {[...Array(3)].map((_, i) => (

            <span
              key={i}
              className="waitlist-marquee-content"
            >

              <span className="marquee-dot">
                ✦
              </span>

              Join the Waitlist — Secure Early Access &nbsp;

              <span className="marquee-dot">
                ✦
              </span>

              AI-Powered Code Security &nbsp;

              <span className="marquee-dot">
                ✦
              </span>

              Enterprise Vulnerability Detection &nbsp;

              <span className="marquee-dot">
                ✦
              </span>

              Autonomous Security Agents &nbsp;

            </span>

          ))}

        </div>

      </div>

      {/* CONTENT */}
      <div className="contact-container">

        {/* LEFT */}
        <div className="contact-info">

          <div className="info-card">

            <h3>

              <svg
                className="icon"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  strokeWidth="2"
                />

                <polyline
                  points="22,6 12,13 2,6"
                  strokeWidth="2"
                />

              </svg>

              Reach Out

            </h3>

            <p>
              Have questions about Magon AI Security,
              enterprise integrations, or AI research?
            </p>

            <p style={{ marginTop: '1rem' }}>

              <strong>Email:</strong>{' '}

              <a href="mailto:support@niyantri.in">
                support@niyantri.in
              </a>

            </p>

          </div>

          <div className="info-card">

            <h3>

              <svg
                className="icon"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
                  strokeWidth="2"
                />

                <circle
                  cx="12"
                  cy="10"
                  r="3"
                  strokeWidth="2"
                />

              </svg>

              Our Location

            </h3>

            <p>
              Kavuri Hills, Madhapur,
              Hyderabad, Telangana, India.
            </p>

            <p
              style={{
                marginTop: '1rem',
                fontSize: '0.95rem',
              }}
            >
              We collaborate remotely with
              teams and enterprises worldwide.
            </p>

          </div>

          <div className="info-card">

            <h3>

              <svg
                className="icon"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  strokeWidth="2"
                />

                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  strokeWidth="2"
                />

              </svg>

              Connect With Us

            </h3>

            <p>
              Follow our journey in AI security,
              autonomous systems, and code intelligence.
            </p>

            <p style={{ marginTop: '1rem' }}>

              <a
                href="https://twitter.com/niyantrilabs"
                target="_blank"
                rel="noreferrer"
              >
                Twitter
              </a>

              {' · '}

              <a
                href="https://linkedin.com/company/niyantrilabs"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>

              {' · '}

              <a
                href="https://github.com/niyantrilabs"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>

            </p>

          </div>

        </div>

        {/* FORM */}
        <div className="contact-form-section">

          <h2>
            Send us a Message
          </h2>

          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <label htmlFor="name">
                Full Name *
              </label>

              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-group">

              <label htmlFor="email">
                Email Address *
              </label>

              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-group">

              <label htmlFor="subject">
                Subject
              </label>

              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
              >

                <option value="">
                  Select a subject
                </option>

                <option value="general">
                  General Inquiry
                </option>

                <option value="security">
                  Security Scanning
                </option>

                <option value="partnership">
                  Partnership
                </option>

                <option value="research">
                  Research Collaboration
                </option>

                <option value="support">
                  Technical Support
                </option>

              </select>

            </div>

            <div className="form-group">

              <label htmlFor="message">
                Message *
              </label>

              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
              />

            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={isSubmitting}
            >

              {isSubmitting
                ? 'Sending...'
                : 'Send Message'}

            </button>

          </form>

        </div>

      </div>

    </main>
  );
};

export default Contact;