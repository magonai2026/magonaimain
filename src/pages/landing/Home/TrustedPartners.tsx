import React from 'react';
import './TrustedPartners.css';

const PARTNERS = [
  {
    name: 'TheSpiritAI',
    node: (
      <span className="partner-logo-text">
        <img src="/logot.png" alt="thespiritai logo" className="partner-img" />
        theSpiritAI
      </span>
    ),
  },
  {
    name: 'DigitalOcean',
    node: (
      <span className="partner-logo-text">
        <img src="/Digitalocean.svg" alt="DigitalOcean logo" className="partner-img" />
      </span>
    ),
  },
  {
    name: 'Redis',
    node: (
      <span className="partner-logo-text">
        <img src="/Redis.svg" alt="Redis logo" className="partner-img" />
        
      </span>
    ),
  },
  {
    name: 'MongoDB',
    node: (
      <span className="partner-logo-text">
        <img src="/MongoDb.svg" alt="MongoDB logo" className="partner-img" />
      </span>
    ),
  },
  {
    name: 'Mashsecureai',
    node: (
      <span className="partner-logo-text">
        <img src="/Mashai.png" alt="mash logo" className="partner-img" />
        MashSecureAI
      </span>
    ),
  },
];

const TrustedPartners: React.FC = () => {
  // We duplicate the partners list to create the seamless infinite scroll effect
const marqueeItems = Array(8).fill(PARTNERS).flat();

  return (
    <section className="partners-marquee-section">
      <p className="partners-marquee-label">Supported by trusted partners</p>
      <div className="partners-marquee-track-wrap">
        <div className="partners-marquee-track">
          {marqueeItems.map(({ name, node }, i) => (
            <div key={`${name}-${i}`} className="partner-marquee-item">
              {node}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedPartners;