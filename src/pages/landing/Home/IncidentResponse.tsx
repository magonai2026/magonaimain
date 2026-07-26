import React from 'react';
import './IncidentResponse.css';

const clockNodes = [
  { time: '0 min',  label: 'Alert Received',     accent: 'red' },
  { time: '5 min',  label: 'Triage & Analysis',  accent: 'orange' },
  { time: '15 min', label: 'Containment',        accent: 'amber' },
  { time: '45 min', label: 'Investigation',      accent: 'indigo' },
  { time: '2 hrs',  label: 'Eradication',        accent: 'cyan' },
  { time: '4 hrs',  label: 'Recovery',           accent: 'green' },
];

const statBand = [
  { num: '< 15 min', desc: 'Average time to initial containment' },
  { num: '24/7', desc: 'Continuous AI-powered monitoring' },
  { num: '90%', desc: 'Reduction in incident impact with early detection' },
  { num: '8', desc: 'Industries protected at enterprise scale' },
];

const processSteps = [
  {
    title: 'Preparation',
    desc: 'We help organizations establish incident response plans, communication procedures, security policies, and response playbooks before an incident occurs.',
  },
  {
    title: 'Detection and Analysis',
    desc: 'Our AI-powered monitoring systems continuously analyze security events, logs, user activity, and threat intelligence to identify suspicious behavior and potential attacks.',
  },
  {
    title: 'Containment',
    desc: 'Once an incident is detected, our team rapidly isolates affected systems, blocks malicious activity, and prevents threats from spreading throughout the environment.',
  },
  {
    title: 'Investigation',
    desc: 'Security analysts perform detailed forensic investigations to determine the attack source, affected assets, attack methods, and potential business impact.',
  },
  {
    title: 'Eradication',
    desc: 'We remove malicious files, compromised accounts, unauthorized access points, and other threats from the environment while addressing underlying vulnerabilities.',
  },
  {
    title: 'Recovery',
    desc: 'Systems and services are safely restored to normal operation while maintaining continuous monitoring to ensure threats do not reappear.',
  },
  {
    title: 'Lessons Learned',
    desc: 'After the incident is resolved, we conduct post-incident reviews and provide recommendations to improve future security readiness.',
  },
];

const aiCapabilities = [
  'Automated Threat Detection',
  'Attack Path Analysis',
  'Security Event Correlation',
  'Threat Intelligence Integration',
  'Behavioral Analytics',
  'Automated Investigation Support',
  'Risk Prioritization',
  'Real-Time Alerting',
  'Predictive Threat Analysis',
];

const aiMetricRows = [
  { label: 'Threat Detection Accuracy', value: '98%', width: '98%', delay: 'delay-1' },
  { label: 'Automated Triage Coverage', value: '85%', width: '85%', delay: 'delay-2' },
  { label: 'False Positive Reduction', value: '76%', width: '76%', delay: 'delay-3' },
  { label: 'Response Time Improvement', value: '92%', width: '92%', delay: 'delay-4' },
];

const incidentTypes = [
  { icon: '🔒', title: 'Ransomware Attacks', desc: 'Rapid containment, investigation, and recovery support to minimize operational disruption.' },
  { icon: '🗂️', title: 'Data Breaches', desc: 'Identify compromised data, investigate attack vectors, and support remediation efforts.' },
  { icon: '🦠', title: 'Malware Infections', desc: 'Detect, isolate, and eliminate malicious software across endpoints and networks.' },
  { icon: '👤', title: 'Insider Threats', desc: 'Monitor and investigate suspicious internal activity that may pose security risks.' },
  { icon: '🎯', title: 'Phishing & Social Engineering', desc: 'Analyze attacks, identify affected users, and implement mitigation measures.' },
  { icon: '☁️', title: 'Cloud Security Incidents', desc: 'Respond to unauthorized access, misconfigurations, and cloud-based threats.' },
  { icon: '🌐', title: 'Web Application Attacks', desc: 'Investigate exploitation attempts, unauthorized access, and application-layer threats.' },
];

const benefits = [
  { title: 'Faster Threat Detection', desc: 'AI-driven monitoring spots suspicious activity before it escalates.' },
  { title: 'Reduced Incident Impact', desc: 'Rapid containment limits the scope and cost of any breach.' },
  { title: 'Improved Security Visibility', desc: 'Continuous insight into events, logs, and behavioral patterns.' },
  { title: 'Enhanced Business Continuity', desc: 'Minimize disruption to critical operations during an incident.' },
  { title: 'Reduced Downtime', desc: 'Streamlined recovery processes get systems back online faster.' },
  { title: 'AI-Powered Investigations', desc: 'Automated analysis accelerates root-cause identification.' },
  { title: 'Regulatory Compliance Support', desc: 'Documentation and processes aligned with regulatory requirements.' },
  { title: 'Continuous Security Improvement', desc: 'Post-incident reviews strengthen long-term resilience.' },
];

const sectors = [
  'Healthcare', 'Financial Services', 'Government', 'Education',
  'Technology', 'Manufacturing', 'Retail', 'Critical Infrastructure',
];

const IncidentResponse: React.FC = () => {
  return (
    <div className="ir-page">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="ir-hero">
        <div className="ir-hero-glow-l" />
        <div className="ir-hero-glow-r" />
        <div className="ir-hero-inner">
          <div className="ir-hero-text">
            <div className="ir-alert-badge">
              <span className="ir-alert-dot" />
              Active Threat Response
            </div>
            <h1>
              Incident Response: <span className="ir-hero-grad">Rapid Detection, Containment &amp; Recovery</span>
            </h1>
            <p>
              Cyber incidents can occur at any time, disrupting operations, compromising sensitive
              data, and damaging organizational reputation. Magon AI's Incident Response service
              helps organizations rapidly identify, investigate, contain, and recover from security
              incidents before they escalate into major business disruptions.
            </p>
            <p>
              Our incident response experts combine advanced AI-driven threat intelligence,
              automated analysis, and proven response methodologies to minimize the impact of
              cyberattacks &mdash; whether facing ransomware, data breaches, insider threats, malware
              infections, phishing campaigns, or advanced persistent threats.
            </p>
            <div className="ir-hero-cta">
              <a href="#contact" className="btn-ir-primary">Get Incident Support</a>
              <a href="#process" className="btn-ir-ghost">View Our Process</a>
            </div>
          </div>

          {/* Signature: Response Clock Timeline */}
          <div className="ir-clock-strip">
            <div className="ir-clock-label">Typical Incident Response Timeline</div>
            <div className="ir-clock-track">
              <div className="ir-clock-track-bg" />
              <div className="ir-clock-line" />
              <div className="ir-clock-nodes">
                {clockNodes.map((node) => (
                  <div className="ir-clock-node" key={node.label}>
                    <div className="ir-node-dot" />
                    <div className="ir-node-time">{node.time}</div>
                    <div className="ir-node-label">{node.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="ir-divider" />

      {/* ── WHY IT MATTERS ────────────────────────────────────────────── */}
      <section className="ir-section">
        <div className="ir-eyebrow">Why It Matters</div>
        <h2 className="ir-section-title">Speed Determines the Outcome</h2>
        <p className="ir-section-sub">
          Modern cyber threats evolve faster than traditional security defenses. Organizations
          need the ability to detect suspicious activity early, understand the scope of an attack,
          and take immediate action to prevent further damage. A well-executed incident response
          program helps organizations minimize disruption, reduce losses, protect sensitive
          information, maintain trust, and meet regulatory requirements.
        </p>
        <div className="ir-stat-band">
          {statBand.map((stat) => (
            <div className="ir-stat-cell" key={stat.desc}>
              <div className="ir-stat-num">{stat.num}</div>
              <div className="ir-stat-desc">{stat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="ir-divider" />

      {/* ── PROCESS ───────────────────────────────────────────────────── */}
      <section className="ir-section" id="process">
        <div className="ir-eyebrow">Our Process</div>
        <h2 className="ir-section-title">Our Incident Response Process</h2>
        <p className="ir-section-sub">
          A structured, sequential methodology &mdash; from preparation through lessons learned &mdash;
          ensures every incident is handled with discipline and precision.
        </p>
        <div className="ir-process">
          {processSteps.map((step, i) => (
            <div className="ir-step" key={step.title}>
              <div className="ir-step-num">{String(i + 1).padStart(2, '0')}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="ir-divider" />

      {/* ── AI CAPABILITIES ───────────────────────────────────────────── */}
      <section className="ir-section">
        <div className="ir-eyebrow">AI-Powered Capabilities</div>
        <h2 className="ir-section-title">AI-Powered Incident Response</h2>
        <div className="ir-ai-wrap">
          <div className="ir-ai-body">
            <p>
              Magon AI enhances traditional incident response through intelligent automation and
              advanced analytics &mdash; correlating security events, mapping attack paths, and
              prioritizing risk so analysts can focus on what matters most.
            </p>
            <div className="ir-ai-pills">
              {aiCapabilities.map((cap) => (
                <div className="ir-ai-pill" key={cap}>
                  <span className="ir-ai-pill-dot" />
                  {cap}
                </div>
              ))}
            </div>
          </div>

          <div className="ir-ai-card">
            <div className="ir-ai-card-glow" />
            <div className="ir-ai-metric">
              <span className="ir-ai-metric-num">98%</span>
              <span className="ir-ai-metric-unit">DETECTION ACCURACY</span>
            </div>
            <div className="ir-ai-metric-label">Across monitored environments</div>
            <div className="ir-ai-rows">
              {aiMetricRows.map((row) => (
                <div className="ir-ai-row" key={row.label}>
                  <span className="ir-ai-row-label">{row.label}</span>
                  <div className="ir-ai-row-bar-wrap">
                    <div
                      className={`ir-ai-row-bar ${row.delay}`}
                      style={{ '--w': row.width } as React.CSSProperties}
                    />
                  </div>
                  <span className="ir-ai-row-val">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="ir-divider" />

      {/* ── INCIDENT TYPES ────────────────────────────────────────────── */}
      <section className="ir-section">
        <div className="ir-eyebrow">Coverage</div>
        <h2 className="ir-section-title">Types of Incidents We Handle</h2>
        <p className="ir-section-sub">
          From ransomware to cloud misconfigurations, our team is equipped to respond across the
          full spectrum of modern cyber threats.
        </p>
        <div className="ir-types-grid">
          {incidentTypes.map((type) => (
            <div className="ir-type-card" key={type.title}>
              <span className="ir-type-icon">{type.icon}</span>
              <h3>{type.title}</h3>
              <p>{type.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="ir-divider" />

      {/* ── BENEFITS ──────────────────────────────────────────────────── */}
      <section className="ir-section">
        <div className="ir-eyebrow">Benefits</div>
        <h2 className="ir-section-title">Benefits of Magon AI Incident Response</h2>
        <div className="ir-benefits">
          {benefits.map((benefit) => (
            <div className="ir-benefit" key={benefit.title}>
              <div className="ir-benefit-check">✓</div>
              <div>
                <h4>{benefit.title}</h4>
                <p>{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="ir-divider" />

      {/* ── SECTORS ───────────────────────────────────────────────────── */}
      <section className="ir-section">
        <div className="ir-eyebrow">Industries</div>
        <h2 className="ir-section-title">Industries We Protect</h2>
        <p className="ir-section-sub">
          We deliver tailored incident response capabilities across critical sectors with unique
          regulatory and operational demands.
        </p>
        <div className="ir-sectors">
          {sectors.map((sector) => (
            <div className="ir-sector" key={sector}>{sector}</div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────── */}
      <section className="ir-section" id="contact">
        <div className="ir-cta">
          <div className="ir-cta-grid" />
          <div className="ir-cta-glow" />
          <div className="ir-cta-tagline">
            Respond Faster <span>·</span> Recover Smarter <span>·</span> Stay Resilient
          </div>
          <h2>Protect Your Organization from Modern Cyber Threats</h2>
          <p>
            When every second matters, organizations need a trusted partner capable of responding
            quickly and effectively. Magon AI delivers expert-led, AI-powered incident response
            services that help businesses contain threats, recover operations, and emerge stronger
            from security incidents.
          </p>
          <div className="ir-cta-btns">
            <a href="#" className="btn-ir-primary">Request Incident Support</a>
            <a href="#" className="btn-ir-ghost">Talk to Our Team</a>
          </div>
          <div className="ir-cta-contacts">
            <div className="ir-cta-contact">
              Email: <a href="mailto:incident-response@magonai.com">incident-response@magonai.com</a>
            </div>
            <div className="ir-cta-contact">
              Hotline: <a href="tel:+10000000000">+1 (000) 000-0000</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default IncidentResponse;