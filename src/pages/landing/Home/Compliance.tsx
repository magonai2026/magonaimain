import React from 'react';
import './Compliance.css';

const COMPLIANCE_LOGOS = [
  {
    id: 'gdpr',
    title: 'GDPR Ready',
    desc: 'Enterprise-grade data privacy workflows',
    image: '/GDPR.png',
  },
  {
    id: 'owasp',
    title: 'OWASP Top 10',
    desc: 'Aligned with modern secure coding standards',
    image: '/owasp.png',
  },
  {
    id: 'nist',
    title: 'NIST Framework',
    desc: 'Cybersecurity controls & governance alignment',
    image: '/Nist.png',
  },
] as const;

const Compliance: React.FC = () => {
  return (
    <section className="compliance-section">

      {/* Ambient Glow */}
      <div className="compliance-bg compliance-bg-1" />
      <div className="compliance-bg compliance-bg-2" />

      <div className="compliance-inner">

        {/* Header */}
        <div className="compliance-header">

          <span className="compliance-eyebrow">
            ENTERPRISE READY
          </span>

          <h2 className="compliance-title">
            Built For Security,
            <br />
            Compliance & Trust
          </h2>

          <p className="compliance-subtitle">
            Designed to align with enterprise-grade security frameworks,
            modern compliance standards, and secure development practices.
          </p>

        </div>

        {/* Cards */}
        <div className="compliance-grid">

          {COMPLIANCE_LOGOS.map((item) => (

            <div
              key={item.id}
              className="compliance-card"
            >

              <div className="compliance-card-glow" />

              <div className="compliance-logo-wrap">

                <img
                  src={item.image}
                  alt={item.title}
                  className="compliance-logo-img"
                />

              </div>

              <h3 className="compliance-card-title">
                {item.title}
              </h3>

              <p className="compliance-card-desc">
                {item.desc}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
};

export default Compliance;