import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import Hero from './Hero';
import AiTools from './AiTools';
import Features from './Features';
import TimeSavings from './TimeSavings';

//import Archer from './Archer';
import TrustedPartners from './TrustedPartners';
import HowItWorks from './HowItWorks';
import Integrations from './Integrations';
import Services from './Services';
import MobilePocket from './MobilePocket';
import Comparison from './Comparison';
import Compilance from './Compliance';

const STANDALONE_PATHS = ['/patch-scan', '/cli-confirm'];

const Home: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (STANDALONE_PATHS.some(p => window.location.pathname.startsWith(p))) return;

    fetch('/api/auto-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then(async (res) => {
        if (res.ok) {
          navigate('/dashboard');
          return;
        }
        if (res.status === 401) return;
        console.error('Auto-login failed:', await res.text());
      })
      .catch((err) => {
        console.error('Network error:', err);
      });
  }, [navigate]);

  return (
    <main className="landing-page" style={{ paddingTop: '40px' }}>
      <Hero />
      <Features />
      <TimeSavings />
      <AiTools />
      <TrustedPartners />
      <HowItWorks />
      <Integrations />
      <Services />
      <MobilePocket />
      <Comparison />
      <Compilance />
    </main>
  );
};

export default Home;