import React, { useEffect, useState, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  transactionId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  timestamp: string;
}

interface WalletData {
  credits: number;
  balance: number;
  currency: string;
  transactions: Transaction[];
}

interface Plan {
  id: string;
  label: string;
  amount: number;
  originalPrice: number;
  discountPercent: number;
  currency: string;
  currencySymbol: string;
  credits: number;
  description: string;
  popular: boolean;
  features: string[];
}

type PurchaseStatus = "idle" | "loading" | "success" | "error";

// ─── Cashfree SDK ─────────────────────────────────────────────────────────────

declare global {
  interface Window {
    Cashfree?: any;
  }
}

function loadCashfreeSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) return resolve();
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.head.appendChild(s);
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return (
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 18, color = "currentColor" }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2.5"
    style={{ animation: "cp-spin 0.75s linear infinite", display: "block", flexShrink: 0 }}
    aria-hidden="true"
  >
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

// ─── PlanCard ─────────────────────────────────────────────────────────────────

const PlanCard: React.FC<{
  plan: Plan;
  onBuy: (p: Plan) => void;
  purchasing: boolean;
  selectedId: string | null;
}> = ({ plan, onBuy, purchasing, selectedId }) => {
  const busy = purchasing && selectedId === plan.id;

  return (
    <div className={`cp2-plan${plan.popular ? " cp2-plan--popular" : ""}`}>
      {plan.popular && (
        <div className="cp2-popular-ribbon" aria-label="Most popular plan">
          <span>★ Most Popular</span>
        </div>
      )}

      <div className="cp2-plan-left">
        <div className="cp2-plan-name">{plan.label}</div>
        <div className="cp2-plan-desc">{plan.description}</div>

        <div className="cp2-plan-credit-chip" aria-label={`${plan.credits.toLocaleString("en-IN")} credits included`}>
          ✦ {plan.credits.toLocaleString("en-IN")} credits
        </div>

        <div className="cp2-plan-divider" />

        <ul className="cp2-plan-features">
          {plan.features.map((f) => (
            <li key={f}>
              <span className="cp2-plan-feature-icon" aria-hidden="true">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="cp2-plan-right">
        <div className="cp2-plan-price-wrap">
          <div className="cp2-plan-price" aria-label={`Price: ${plan.currencySymbol}${plan.amount}`}>
            {plan.currencySymbol}{plan.amount}
          </div>
          <div className="cp2-plan-price-row">
            <div className="cp2-plan-original" aria-label={`Original price: ${plan.currencySymbol}${plan.originalPrice}`}>{plan.currencySymbol}{plan.originalPrice}</div>
            <div className="cp2-plan-discount-badge">{plan.discountPercent}% off</div>
          </div>
        </div>
        <button
          className={`cp2-buy-btn${plan.popular ? " cp2-buy-btn--accent" : ""}`}
          onClick={() => onBuy(plan)}
          disabled={purchasing}
          aria-busy={busy}
          style={{ opacity: purchasing && selectedId !== plan.id ? 0.45 : 1 }}
        >
          {busy
            ? <><Spinner size={14} color={plan.popular ? "#fff" : "currentColor"} /> Processing…</>
            : `Buy ${plan.label}`}
        </button>
      </div>
    </div>
  );
};

// ─── Transaction row ──────────────────────────────────────────────────────────

const TxRow: React.FC<{ tx: Transaction; index: number }> = ({ tx, index }) => {
  const isCredit = tx.type === "credit";
  return (
    <div
      className="cp2-tx-row"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className={`cp2-tx-icon ${isCredit ? "cp2-tx-icon--credit" : "cp2-tx-icon--debit"}`} aria-hidden="true">
        {isCredit ? "↑" : "↓"}
      </div>
      <div className="cp2-tx-info">
        <div className="cp2-tx-desc">{tx.description || (isCredit ? "Credit Added" : "Credits Used")}</div>
        <div className="cp2-tx-time">{fmt(tx.timestamp)}</div>
      </div>
      <div
        className={`cp2-tx-amount ${isCredit ? "cp2-tx-amount--credit" : "cp2-tx-amount--debit"}`}
        aria-label={`${isCredit ? "Added" : "Used"} ${tx.amount.toLocaleString("en-IN")} credits`}
      >
        {isCredit ? "+" : "−"}{tx.amount.toLocaleString("en-IN")}
        <span className="cp2-tx-unit">cr</span>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const CreditsPage: React.FC = () => {
  const [wallet, setWallet]                 = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading]   = useState(true);
  const [walletError, setWalletError]       = useState<string | null>(null);
  const [plans, setPlans]                   = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading]     = useState(true);
  const [purchasing, setPurchasing]         = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>("idle");
  const [purchaseError, setPurchaseError]   = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Cancel in-flight requests on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const fetchWallet = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setWalletLoading(true);
    setWalletError(null);
    try {
      const res = await fetch("/api/wallet", { credentials: "include", signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setWallet(await res.json());
    } catch (e: any) {
      if (e.name === "AbortError") return;
      setWalletError(e.message || "Failed to load wallet");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await fetch("/api/pricing/me", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPlans(data.plans || []);
    } catch { /* silent — plans section shows empty state */ }
    finally { setPlansLoading(false); }
  }, []);

  useEffect(() => { fetchWallet(); fetchPlans(); }, [fetchWallet, fetchPlans]);

  const handleBuy = async (plan: Plan) => {
    setPurchasing(true);
    setSelectedPlanId(plan.id);
    setPurchaseStatus("loading");
    setPurchaseError(null);
    try {
      await loadCashfreeSDK();

      const orderRes = await fetch("/api/create-order", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, amount: plan.amount }),
      });
      if (!orderRes.ok) {
        const e = await orderRes.json().catch(() => ({}));
        throw new Error(e.message || "Failed to create order");
      }
      const orderData = await orderRes.json();
      const paymentSessionId =
        orderData.payment_session_id ||
        orderData.cf_payment_session_id ||
        orderData.paymentSessionId;
      if (!paymentSessionId) throw new Error("No payment session ID returned");

      const cashfree = await window.Cashfree({ mode: "production" });
      const result   = await cashfree.checkout({ paymentSessionId, redirectTarget: "_modal" });
      if (result.error) throw new Error(result.error.message || "Payment failed");

      // Verify payment — surface errors rather than silently swallowing them
      const verifyRes = await fetch("/api/verify-payment", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.order_id }),
      });
      if (!verifyRes.ok) {
        // Payment succeeded with Cashfree but verification failed on our side.
        // Show a specific message rather than a false success.
        const ve = await verifyRes.json().catch(() => ({}));
        throw new Error(ve.message || "Payment recorded but verification is pending. Your credits will be applied shortly.");
      }

      setPurchaseStatus("success");
      setTimeout(() => {
        fetchWallet();
        setPurchaseStatus("idle");
        setSelectedPlanId(null);
      }, 2500);
    } catch (e: any) {
      setPurchaseStatus("error");
      setPurchaseError(e.message || "Something went wrong");
    } finally {
      setPurchasing(false);
    }
  };

  const totalAdded  = wallet?.transactions.filter(t => t.type === "credit").reduce((s, t) => s + t.amount, 0) ?? 0;
  const totalUsed   = wallet?.transactions.filter(t => t.type === "debit").reduce((s, t) => s + t.amount, 0) ?? 0;
  const creditCount = wallet?.credits ?? 0;

  return (
    <div style={{ width: "100%", maxWidth: "100%", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes cp-spin    { to { transform: rotate(360deg); } }
        @keyframes cp2-fadein { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cp2-pulse  { 0%,100% { box-shadow: 0 0 0 0 rgba(168,85,247,0.35); } 60% { box-shadow: 0 0 0 18px rgba(168,85,247,0); } }
        @keyframes cp2-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes cp2-countup { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }

        /* ── Balance hero card ── */
        .cp2-hero-card {
          background: #0f0f0f;
          border-radius: 20px;
          padding: 2rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          margin-bottom: 1.5rem;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .cp2-hero-card::before {
          content: '';
          position: absolute;
          top: -60px; right: -60px;
          width: 260px; height: 260px;
          background: radial-gradient(circle, rgba(168,85,247,0.22) 0%, transparent 70%);
          pointer-events: none;
        }
        .cp2-hero-card::after {
          content: '';
          position: absolute;
          bottom: -40px; left: 30%;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .cp2-balance-section { display:flex; flex-direction:column; gap:0.5rem; z-index:1; }
        .cp2-balance-eyebrow {
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: rgba(255,255,255,0.35);
        }
        .cp2-balance-number {
          font-size: 4rem; font-weight: 800; color: #fff;
          font-family: 'DM Mono', monospace; line-height: 1;
          animation: cp2-countup 0.5s ease both;
          letter-spacing: -0.03em;
        }
        .cp2-balance-number--loading {
          background: linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 100%);
          background-size: 400px 100%;
          animation: cp2-shimmer 1.4s ease infinite;
          border-radius: 8px;
          width: 180px; height: 56px;
          display: block;
        }
        .cp2-balance-label {
          font-size: 0.82rem; color: rgba(255,255,255,0.4); margin-top: 2px;
        }

        .cp2-hero-stats { display: flex; gap: 1.5rem; z-index: 1; }
        .cp2-hero-stat {
          display: flex; flex-direction: column; gap: 3px;
          padding: 0.9rem 1.2rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; min-width: 110px;
        }
        .cp2-hero-stat-label {
          font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em;
          text-transform: uppercase; color: rgba(255,255,255,0.3);
        }
        .cp2-hero-stat-value {
          font-size: 1.3rem; font-weight: 700;
          font-family: 'DM Mono', monospace; line-height: 1;
        }
        .cp2-hero-stat-value--green { color: #4ade80; }
        .cp2-hero-stat-value--red   { color: #f87171; }
        .cp2-hero-stat-value--muted { color: rgba(255,255,255,0.55); }

        .cp2-refresh-btn {
          display: flex; align-items: center; gap: 6px; z-index: 1;
          padding: 0.55rem 1rem; border-radius: 10px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5); font-size: 0.8rem; font-weight: 600;
          font-family: 'DM Sans', sans-serif; cursor: pointer;
          transition: all 0.15s; white-space: nowrap;
        }
        .cp2-refresh-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.12); color: #fff;
          border-color: rgba(255,255,255,0.18);
        }
        .cp2-refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .cp2-banner {
          padding: 0.85rem 1.2rem; border-radius: 12px; font-size: 0.85rem;
          margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.7rem;
          font-weight: 500; animation: cp2-fadein 0.3s ease both;
        }
        .cp2-banner-icon {
          width: 28px; height: 28px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; flex-shrink: 0; font-weight: 700;
        }
        .cp2-banner--success {
          background: rgba(16,185,129,0.08); color: #10b981;
          border: 1px solid rgba(16,185,129,0.2);
        }
        .cp2-banner--success .cp2-banner-icon { background: rgba(16,185,129,0.15); }
        .cp2-banner--error {
          background: rgba(239,68,68,0.08); color: #ef4444;
          border: 1px solid rgba(239,68,68,0.2);
        }
        .cp2-banner--error .cp2-banner-icon { background: rgba(239,68,68,0.15); }

        .cp2-section-heading {
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-muted);
          margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;
        }
        .cp2-section-heading::after {
          content: ''; flex: 1; height: 1px; background: var(--border);
        }

        .cp2-plan {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2rem 2rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          animation: cp2-fadein 0.35s ease both;
          overflow: hidden;
          height: 100%;
          width: 100%;
        }
        .cp2-plan::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(168,85,247,0.04) 0%, transparent 55%);
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }
        .cp2-plan:hover {
          border-color: rgba(168,85,247,0.45);
          box-shadow: 0 12px 40px rgba(168,85,247,0.1);
          transform: translateY(-2px);
        }
        .cp2-plan:hover::before { opacity: 1; }

        .cp2-plan--popular {
          border-color: var(--accent);
          background: linear-gradient(160deg, rgba(168,85,247,0.05) 0%, var(--surface) 50%);
          box-shadow: 0 8px 32px rgba(168,85,247,0.14);
        }
        .cp2-plan--popular::before { opacity: 1; }

        .cp2-popular-ribbon {
          position: absolute; top: 0; right: 0;
          background: linear-gradient(135deg, #a855f7, #6366f1);
          color: #fff; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase;
          padding: 5px 16px 5px 12px;
          border-radius: 0 20px 0 14px;
        }

        .cp2-plan--popular::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, #a855f7, #6366f1, #06b6d4);
          border-radius: 20px 20px 0 0;
        }

        .cp2-plan-left { display: flex; flex-direction: column; gap: 0; flex: 1; min-width: 0; }
        .cp2-plan-name {
          font-size: 1.4rem; font-weight: 800; color: var(--text);
          letter-spacing: -0.02em; margin-bottom: 0.35rem;
        }
        .cp2-plan-desc { font-size: 0.84rem; color: var(--text-muted); margin-bottom: 1.25rem; }

        .cp2-plan-credit-chip {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.9rem; font-weight: 700; color: var(--accent);
          background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.22);
          border-radius: 24px; padding: 5px 14px; align-self: flex-start;
          margin-bottom: 1.25rem;
        }

        .cp2-plan-divider { height: 1px; background: var(--border); margin: 0 0 1.25rem; }

        .cp2-plan-features {
          list-style: none; padding: 0; margin: 0 0 1.75rem;
          display: flex; flex-direction: column; gap: 10px;
        }
        .cp2-plan-features li {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.84rem; color: var(--text-muted);
        }
        .cp2-plan-feature-icon {
          width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0;
          background: rgba(16,185,129,0.1);
          display: flex; align-items: center; justify-content: center;
        }
        .cp2-plan-feature-icon svg { color: var(--green); }

        .cp2-plan-right {
          display: flex; align-items: center; justify-content: space-between;
          gap: 1rem; margin-top: auto;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border);
        }
        .cp2-plan-price-wrap { display: flex; flex-direction: column; gap: 2px; }
        .cp2-plan-price {
          font-size: 2.6rem; font-weight: 800; color: var(--text);
          font-family: 'DM Mono', monospace; line-height: 1; letter-spacing: -0.03em;
        }
        .cp2-plan-price-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
        .cp2-plan-original {
          font-size: 0.78rem; color: var(--text-muted); text-decoration: line-through;
        }
        .cp2-plan-discount-badge {
          display: inline-block; font-size: 0.68rem; font-weight: 700;
          color: #065f46; background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.25); border-radius: 20px;
          padding: 2px 8px;
        }
        .cp2-buy-btn {
          padding: 0.75rem 2rem; border-radius: 12px;
          background: var(--bg); border: 1px solid var(--border);
          font-size: 0.9rem; font-weight: 700; color: var(--text);
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; gap: 7px; white-space: nowrap;
          transition: all 0.18s; letter-spacing: 0.01em;
        }
        .cp2-buy-btn:hover:not(:disabled) {
          background: #0f0f0f; color: #fff; border-color: #0f0f0f;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        }
        .cp2-buy-btn--accent {
          background: linear-gradient(135deg, #a855f7, #6366f1);
          color: #fff; border-color: transparent;
          box-shadow: 0 4px 20px rgba(168,85,247,0.35);
          padding: 0.75rem 2.2rem;
        }
        .cp2-buy-btn--accent:hover:not(:disabled) {
          background: linear-gradient(135deg, #9333ea, #4f46e5);
          box-shadow: 0 8px 28px rgba(168,85,247,0.45);
          transform: translateY(-1px);
        }
        .cp2-buy-btn:disabled { cursor: not-allowed; }

        .cp2-tx-row {
          display: flex; align-items: center; gap: 12px;
          padding: 0.9rem 1rem; border-radius: 12px;
          transition: background 0.15s;
          animation: cp2-fadein 0.3s ease both;
        }
        .cp2-tx-row:hover { background: var(--bg); }
        .cp2-tx-icon {
          width: 34px; height: 34px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 700; flex-shrink: 0;
        }
        .cp2-tx-icon--credit { background: rgba(16,185,129,0.1); color: #10b981; }
        .cp2-tx-icon--debit  { background: rgba(239,68,68,0.08); color: #ef4444; }
        .cp2-tx-info { flex: 1; min-width: 0; }
        .cp2-tx-desc {
          font-size: 0.88rem; font-weight: 600; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .cp2-tx-time { font-size: 0.73rem; color: var(--text-muted); margin-top: 2px; }
        .cp2-tx-amount {
          font-size: 0.95rem; font-weight: 700;
          font-family: 'DM Mono', monospace; flex-shrink: 0;
          display: flex; align-items: baseline; gap: 3px;
        }
        .cp2-tx-amount--credit { color: #10b981; }
        .cp2-tx-amount--debit  { color: #ef4444; }
        .cp2-tx-unit { font-size: 0.65rem; font-weight: 600; opacity: 0.6; }

        .cp2-tx-divider { height: 1px; background: var(--border); margin: 0 1rem; }

        .cp2-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; padding: 3rem 1rem; color: var(--text-muted);
          text-align: center;
        }
        .cp2-empty-icon {
          width: 52px; height: 52px; border-radius: 16px;
          border: 2px dashed var(--border);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; color: var(--border);
        }
        .cp2-empty-text { font-size: 0.85rem; max-width: 240px; }

        .cp2-plans-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin-bottom: 2rem;
          align-items: stretch;
          width: 100%;
        }

        @media (max-width: 820px) {
          .cp2-hero-card { flex-direction: column; align-items: flex-start; }
          .cp2-hero-stats { flex-wrap: wrap; }
          .cp2-plans-grid { grid-template-columns: 1fr; }
          .cp2-balance-number { font-size: 2.8rem; }
        }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", margin: 0 }}>
          Credits
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: 4 }}>
          Your usage balance, plans, and transaction history.
        </p>
      </div>

      {/* ── Banners ── */}
      <div aria-live="polite" aria-atomic="true">
        {purchaseStatus === "success" && (
          <div className="cp2-banner cp2-banner--success" role="status">
            <div className="cp2-banner-icon" aria-hidden="true">✓</div>
            Payment successful! Credits are being added — balance updates shortly.
          </div>
        )}
        {purchaseStatus === "error" && purchaseError && (
          <div className="cp2-banner cp2-banner--error" role="alert">
            <div className="cp2-banner-icon" aria-hidden="true">✗</div>
            {purchaseError}
          </div>
        )}
        {walletError && (
          <div className="cp2-banner cp2-banner--error" role="alert">
            <div className="cp2-banner-icon" aria-hidden="true">!</div>
            Could not load wallet: {walletError}
          </div>
        )}
      </div>

      {/* ── Balance hero card ── */}
      <div className="cp2-hero-card">
        <div className="cp2-balance-section">
          <div className="cp2-balance-eyebrow">Available Balance</div>
          {walletLoading ? (
            <span className="cp2-balance-number--loading" role="status" aria-label="Loading balance…" />
          ) : (
            <div className="cp2-balance-number" aria-label={`${creditCount.toLocaleString("en-IN")} credits remaining`}>
              {creditCount.toLocaleString("en-IN")}
            </div>
          )}
          <div className="cp2-balance-label">credits remaining</div>
        </div>

        {!walletLoading && wallet && (
          <div className="cp2-hero-stats">
            <div className="cp2-hero-stat">
              <div className="cp2-hero-stat-label">Total Txns</div>
              <div className="cp2-hero-stat-value cp2-hero-stat-value--muted">
                {wallet.transactions.length}
              </div>
            </div>
            <div className="cp2-hero-stat">
              <div className="cp2-hero-stat-label">Added</div>
              <div className="cp2-hero-stat-value cp2-hero-stat-value--green">
                +{totalAdded.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="cp2-hero-stat">
              <div className="cp2-hero-stat-label">Used</div>
              <div className="cp2-hero-stat-value cp2-hero-stat-value--red">
                −{totalUsed.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        )}

        <button
          className="cp2-refresh-btn"
          onClick={fetchWallet}
          disabled={walletLoading}
          aria-label="Refresh wallet balance"
        >
          {walletLoading ? <Spinner size={13} color="currentColor" /> : <span aria-hidden="true">↻</span>}
          Refresh
        </button>
      </div>

      {/* ── Buy Credits ── */}
      <div className="cp2-section-heading">Buy Credits</div>

      <div className="cp2-plans-grid">
        {plansLoading ? (
          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "center", alignItems: "center", gap: 10, padding: "2.5rem", color: "var(--text-muted)", fontSize: "0.88rem" }} role="status" aria-live="polite">
            <Spinner size={22} /> Loading plans…
          </div>
        ) : plans.length === 0 ? (
          <div className="cp2-empty" style={{ gridColumn: "1 / -1" }}>
            <div className="cp2-empty-icon" aria-hidden="true">✦</div>
            <div className="cp2-empty-text">Pricing plans are unavailable right now. Please try again later.</div>
          </div>
        ) : (
          plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onBuy={handleBuy}
              purchasing={purchasing}
              selectedId={selectedPlanId}
            />
          ))
        )}
      </div>

      {/* ── Transaction History ── */}
      <div className="cp2-section-heading">Transaction History</div>

      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
      }}>
        {walletLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, padding: "2rem", color: "var(--text-muted)", fontSize: "0.88rem" }} role="status" aria-live="polite">
            <Spinner size={20} /> Loading transactions…
          </div>
        ) : !wallet || wallet.transactions.length === 0 ? (
          <div className="cp2-empty">
            <div className="cp2-empty-icon" aria-hidden="true">◷</div>
            <div className="cp2-empty-text">No transactions yet. Purchase credits or start using the app to see activity here.</div>
          </div>
        ) : (
          wallet.transactions.map((tx, i) => (
            <React.Fragment key={tx.transactionId}>
              <TxRow tx={tx} index={i} />
              {i < wallet.transactions.length - 1 && <div className="cp2-tx-divider" role="separator" />}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};

export default CreditsPage;