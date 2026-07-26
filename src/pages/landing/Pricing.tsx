import React, { useState } from 'react';
import { Check, Zap, Shield, Building2, ArrowRight } from 'lucide-react';
import './Pricing.css';

// ─── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = [
  {
    id:          'free',
    name:        'Free',
    price:       0,
    period:      '',
    description: 'Get started with AI-powered security scanning at no cost.',
    badge:       null,
    Icon:        Shield,
    cta:         'Get Started Free',
    ctaHref:     '/signup',
    features: [
      '3 GitHub repository scans / month',
      'Up to 10 vulnerabilities detected per scan',
      'Basic vulnerability report (PDF download)',
      'CVSS severity scoring & CWE tagging',
      'Single file upload scanning',
      'Community support',
    ],
    limits: [
      'No AI fix automation',
      'No GitHub PR creation',
      'No chat-based fixing',
    ],
  },
  {
    id:          'pro',
    name:        'Pro',
    price:       20,
    period:      '/mo',
    description: 'Full AI fix automation for solo developers and small teams.',
    badge:       'Most Popular',
    Icon:        Zap,
    cta:         'Start Pro',
    ctaHref:     '/signup?plan=pro',
    features: [
      'Unlimited GitHub repository scans',
      'Deep 5-phase vulnerability pipeline',
      'AI agentic fix — auto-creates GitHub PRs',
      'Chat-based vulnerability fixing',
      'Automated test case generation',
      '"Scan the Patch" fix verification',
      'Cross-file & dependency impact analysis',
      'Attack path tracing (Phase 5)',
      'Up to 10 repositories',
      'Email & chat priority support',
    ],
    limits: [],
  },
  {
    id:          'enterprise',
    name:        'Enterprise',
    price:       99,
    period:      '/mo',
    description: 'Security at scale for engineering teams and organisations.',
    badge:       null,
    Icon:        Building2,
    cta:         'Contact Sales',
    ctaHref:     'mailto:info@magonai.com',
    features: [
      'Everything in Pro',
      'Unlimited repositories',
      'Team seats & role-based access',
      'Slack integration & webhook support',
      'CISO dashboard & board-level reports',
      'SOC 2 / ISO 27001 compliance exports',
      'API access for CI/CD pipelines',
      'Custom scan rules & policy gates',
      'Dedicated security consultant',
      '99.9 % uptime SLA + 24 / 7 support',
    ],
    limits: [],
  },
] as const;

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Can I upgrade or downgrade at any time?',
    a: 'Yes. Upgrades apply immediately; downgrades take effect at the end of your billing cycle. No contracts, no lock-in.',
  },
  {
    q: 'How does the AI fix agent work?',
    a: 'Our ReAct agent fetches the vulnerable file from GitHub, edits only the affected lines, runs syntax verification, generates test cases, and opens a PR — all without human intervention.',
  },
  {
    q: 'Is my code stored or used for training?',
    a: 'Never. Code is processed in isolated ephemeral environments and deleted after each scan. We do not use your code to train any AI model.',
  },
  {
    q: 'What languages are supported?',
    a: 'Python, JavaScript, TypeScript, Go, Java, Ruby, and more. Our scanner is language-agnostic at the pattern level and LLM-powered for semantic analysis.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Due to the digital nature of the service we do not offer refunds on used credits. See our Refund Policy for full details.',
  },
  {
    q: 'What is "Scan the Patch"?',
    a: 'After an AI fix PR is created, "Scan the Patch" runs lightweight test generation + static LLM verification on the patched branch to confirm the vulnerability is resolved — not a full re-scan.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const Pricing: React.FC = () => {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const annualDiscount = 0.2; // 20 % off annual

  return (
    <main className="pr-root">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pr-hero">
        <div className="pr-hero-eyebrow">Pricing</div>
        <h1 className="pr-hero-title">
          Security that pays<br />for itself on day one
        </h1>
        <p className="pr-hero-sub">
          Start free. When AI fixes your first critical CVE in under 10 minutes
          instead of 8 hours, the maths is obvious.
        </p>

        {/* Billing toggle */}
        <div className="pr-toggle">
          <button
            className={`pr-toggle-btn ${billing === 'monthly' ? 'active' : ''}`}
            onClick={() => setBilling('monthly')}
          >
            Monthly
          </button>
          <button
            className={`pr-toggle-btn ${billing === 'annual' ? 'active' : ''}`}
            onClick={() => setBilling('annual')}
          >
            Annual
            <span className="pr-save-badge">Save 20%</span>
          </button>
        </div>
      </section>

      {/* ── Cards ─────────────────────────────────────────────────────────── */}
      <section className="pr-cards-wrap">
        <div className="pr-cards">
          {PLANS.map((plan) => {
            const isPopular    = plan.id === 'pro';
            const isEnterprise = plan.id === 'enterprise';
            const displayPrice =
              plan.price === 0
                ? 0
                : billing === 'annual'
                ? Math.round(plan.price * (1 - annualDiscount))
                : plan.price;

            return (
              <div
                key={plan.id}
                className={`pr-card${isPopular ? ' pr-card--popular' : ''}${isEnterprise ? ' pr-card--enterprise' : ''}`}
              >
                {plan.badge && (
                  <div className="pr-badge">{plan.badge}</div>
                )}

                {/* Header */}
                <div className="pr-card-head">
                  <div className={`pr-plan-icon pr-icon--${plan.id}`}>
                    <plan.Icon size={20} strokeWidth={1.8} />
                  </div>
                  <div className="pr-plan-name">{plan.name}</div>
                  <p className="pr-plan-desc">{plan.description}</p>

                  <div className="pr-price-row">
                    {plan.price === 0 ? (
                      <span className="pr-price-amount">Free</span>
                    ) : (
                      <>
                        <span className="pr-price-currency">$</span>
                        <span className="pr-price-amount">{displayPrice}</span>
                        <span className="pr-price-period">{plan.period}</span>
                      </>
                    )}
                  </div>

                  {billing === 'annual' && plan.price > 0 && (
                    <div className="pr-annual-note">
                      Billed ${displayPrice * 12} / year&nbsp;
                      <s>${plan.price * 12}</s>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <a href={plan.ctaHref} className={`pr-cta${isPopular ? ' pr-cta--popular' : ''}`}>
                  {plan.cta}
                  <ArrowRight size={14} />
                </a>

                <div className="pr-divider" />

                {/* Features */}
                <ul className="pr-features">
                  {plan.features.map((f) => (
                    <li key={f} className="pr-feat pr-feat--yes">
                      <Check size={13} strokeWidth={2.5} className="pr-feat-icon pr-feat-icon--yes" />
                      {f}
                    </li>
                  ))}
                  {plan.limits.map((f) => (
                    <li key={f} className="pr-feat pr-feat--no">
                      <span className="pr-feat-icon pr-feat-icon--no">–</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Feature comparison strip ───────────────────────────────────────── */}
      <section className="pr-compare-wrap">
        <h2 className="pr-compare-title">Everything you get</h2>
        <div className="pr-compare-grid">
          {[
            { label: 'Deep 5-phase scan pipeline',       free: false, pro: true,  ent: true  },
            { label: 'AI agentic fix + GitHub PR',       free: false, pro: true,  ent: true  },
            { label: 'Chat-based vulnerability fixing',  free: false, pro: true,  ent: true  },
            { label: 'Automated test generation',        free: false, pro: true,  ent: true  },
            { label: '"Scan the Patch" verification',    free: false, pro: true,  ent: true  },
            { label: 'Attack path tracing',              free: false, pro: true,  ent: true  },
            { label: 'Dependency impact analysis',       free: false, pro: true,  ent: true  },
            { label: 'Slack integration',                free: false, pro: false, ent: true  },
            { label: 'SOC 2 / ISO 27001 exports',        free: false, pro: false, ent: true  },
            { label: 'API access for CI/CD',             free: false, pro: false, ent: true  },
            { label: 'Dedicated security consultant',    free: false, pro: false, ent: true  },
            { label: 'Custom scan rules & policy gates', free: false, pro: false, ent: true  },
          ].map(({ label, free, pro, ent }) => (
            <div className="pr-compare-row" key={label}>
              <span className="pr-compare-label">{label}</span>
              <Tick val={free} />
              <Tick val={pro} />
              <Tick val={ent} />
            </div>
          ))}
        </div>
        <div className="pr-compare-headers">
          <span />
          <span>Free</span>
          <span>Pro</span>
          <span>Enterprise</span>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="pr-faq-wrap">
        <h2 className="pr-faq-title">Frequently asked questions</h2>
        <div className="pr-faq-grid">
          {FAQS.map(({ q, a }) => (
            <div className="pr-faq-item" key={q}>
              <h4 className="pr-faq-q">{q}</h4>
              <p className="pr-faq-a">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="pr-bottom-cta">
        <div className="pr-bottom-inner">
          <h2>Still deciding?</h2>
          <p>Start on the Free plan — no credit card required. Upgrade in one click when you're ready.</p>
          <div className="pr-bottom-btns">
            <a href="/signup" className="pr-bottom-btn pr-bottom-btn--primary">
              Start for free <ArrowRight size={15} />
            </a>
            <a href="mailto:info@magonai.com" className="pr-bottom-btn pr-bottom-btn--ghost">
              Talk to sales
            </a>
          </div>
        </div>
      </section>

    </main>
  );
};

// Tick helper used in comparison table
const Tick: React.FC<{ val: boolean }> = ({ val }) =>
  val
    ? <span className="pr-tick pr-tick--yes"><Check size={13} strokeWidth={3} /></span>
    : <span className="pr-tick pr-tick--no">–</span>;

export default Pricing;
