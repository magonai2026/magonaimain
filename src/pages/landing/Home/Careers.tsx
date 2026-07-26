import React from 'react';
import './Careers.css';

const whyJoin = [
  { icon: '🎯', title: 'Work on Meaningful Challenges', desc: 'Help protect businesses, institutions, and communities from modern cyber threats using cutting-edge technology and innovative security solutions.' },
  { icon: '🤖', title: 'AI-Driven Innovation', desc: 'Work at the intersection of artificial intelligence, cybersecurity, automation, and advanced threat intelligence.' },
  { icon: '📈', title: 'Growth and Learning', desc: 'We encourage continuous learning, professional development, certification programs, research initiatives, and hands-on experimentation.' },
  { icon: '🤝', title: 'Collaborative Culture', desc: 'Join a team that values creativity, teamwork, transparency, and knowledge sharing.' },
  { icon: '🛡️', title: 'Real Impact', desc: 'Every project contributes to strengthening security and helping organizations build resilience against cyber threats.' },
];

const values = [
  { title: 'Innovation', desc: 'We embrace new ideas, emerging technologies, and creative problem-solving.' },
  { title: 'Security First', desc: 'Security is at the core of everything we build, design, and deliver.' },
  { title: 'Integrity', desc: 'We operate with honesty, accountability, and respect for our customers and colleagues.' },
  { title: 'Excellence', desc: 'We strive for exceptional quality, continuous improvement, and technical excellence.' },
  { title: 'Customer Success', desc: 'Our success is measured by the trust and outcomes we create for our clients.' },
];

const opportunities = [
  { icon: '🛠️', title: 'Cybersecurity Engineering', desc: 'Design and develop security solutions that help organizations identify and mitigate cyber risks.' },
  { icon: '🖥️', title: 'Security Operations (SOC)', desc: 'Monitor threats, investigate incidents, and strengthen security defenses.' },
  { icon: '🧠', title: 'AI & Machine Learning', desc: 'Build intelligent systems that enhance threat detection, risk analysis, and security automation.' },
  { icon: '💻', title: 'Software Engineering', desc: 'Develop scalable, secure, and innovative platforms that power the future of cybersecurity.' },
  { icon: '☁️', title: 'Cloud Security', desc: 'Secure cloud environments and help organizations protect critical digital assets.' },
  { icon: '🔍', title: 'Threat Intelligence', desc: 'Research emerging threats, analyze attacker behavior, and provide actionable intelligence.' },
  { icon: '🎨', title: 'Product & Design', desc: 'Create intuitive experiences that make cybersecurity accessible and effective.' },
  { icon: '📊', title: 'Business & Operations', desc: 'Support company growth through strategy, partnerships, marketing, and customer success.' },
];

const lookingFor = [
  'Are passionate about cybersecurity and technology',
  'Enjoy solving complex problems',
  'Thrive in collaborative environments',
  'Continuously learn and adapt',
  'Take ownership and responsibility',
  'Think creatively and challenge conventional approaches',
];

const internshipTracks = [
  'Cybersecurity', 'Artificial Intelligence', 'Software Development', 'Cloud Security', 'Security Research',
];

const Careers: React.FC = () => {
  return (
    <div className="cr-page">
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="cr-hero">
        <div className="cr-hero-glow-l" />
        <div className="cr-hero-glow-r" />
        <div className="cr-hero-inner">
          <div className="cr-badge">
            <span className="cr-badge-dot" />
            We're Hiring
          </div>

          <div className="cr-hero-grid">
            <div>
              <h1>
                Build the Future of <span className="cr-hero-grad">AI-Powered Cybersecurity</span>
              </h1>
              <p>
                At Magon AI, we're on a mission to transform cybersecurity through artificial
                intelligence, automation, and innovation. We believe the future of security lies
                in intelligent systems that help organizations detect threats faster, respond
                smarter, and stay ahead of an ever-evolving threat landscape.
              </p>
              <p>
                We're building a team of passionate engineers, security researchers, AI
                specialists, analysts, and innovators who are excited about solving some of the
                world's most challenging cybersecurity problems. If you're driven by curiosity,
                innovation, and a desire to make a real impact, we'd love to hear from you.
              </p>
              <div className="cr-hero-cta">
                <a href="#contact" className="btn-cr-primary">Send Your Resume</a>
                <a href="#opportunities" className="btn-cr-ghost">Explore Opportunities</a>
              </div>
            </div>

            {/* Signature: Orbiting opportunities constellation */}
            <div className="cr-orbit-wrap">
              <div className="cr-orbit-ring r1" />
              <div className="cr-orbit-ring r2" />
              <div className="cr-orbit-ring r3" />

              <div className="cr-orbit-spin r1">
                <div className="cr-orbit-node">Security Eng.</div>
                <div className="cr-orbit-node">Threat Intel</div>
                <div className="cr-orbit-node">SOC</div>
              </div>
              <div className="cr-orbit-spin r2 reverse">
                <div className="cr-orbit-node">Cloud Security</div>
                <div className="cr-orbit-node">Software Eng.</div>
                <div className="cr-orbit-node">Product &amp; Design</div>
              </div>
              <div className="cr-orbit-spin r3">
                <div className="cr-orbit-node">AI / ML</div>
              </div>

              <div className="cr-orbit-core">
                <span className="cr-orbit-core-label">Magon AI<br/>Careers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="cr-divider" />

      {/* ── WHY JOIN ──────────────────────────────────────────────────── */}
      <section className="cr-section">
        <div className="cr-eyebrow">Why Magon AI</div>
        <h2 className="cr-section-title">Why Join Magon AI?</h2>
        <p className="cr-section-sub">
          We're building more than a product &mdash; we're building a team and a culture that values
          curiosity, ownership, and meaningful impact.
        </p>
        <div className="cr-why-grid">
          {whyJoin.map((item) => (
            <div className="cr-why-card" key={item.title}>
              <span className="cr-why-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="cr-divider" />

      {/* ── VALUES ────────────────────────────────────────────────────── */}
      <section className="cr-section">
        <div className="cr-eyebrow">Our Values</div>
        <h2 className="cr-section-title">What We Stand For</h2>
        <p className="cr-section-sub">
          These principles guide how we build, collaborate, and deliver for our customers.
        </p>
        <div className="cr-values-band">
          {values.map((value, i) => (
            <div className="cr-value-cell" key={value.title}>
              <div className="cr-value-num">{String(i + 1).padStart(2, '0')}</div>
              <h4>{value.title}</h4>
              <p>{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="cr-divider" />

      {/* ── OPPORTUNITIES ─────────────────────────────────────────────── */}
      <section className="cr-section" id="opportunities">
        <div className="cr-eyebrow">Opportunities</div>
        <h2 className="cr-section-title">Areas We're Hiring</h2>
        <p className="cr-section-sub">
          We are always interested in connecting with talented professionals across the following
          areas.
        </p>
        <div className="cr-opps-grid">
          {opportunities.map((opp) => (
            <div className="cr-opp-card" key={opp.title}>
              <span className="cr-opp-icon">{opp.icon}</span>
              <h3>{opp.title}</h3>
              <p>{opp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="cr-divider" />

      {/* ── WHAT WE'RE LOOKING FOR + INTERNSHIPS ─────────────────────────── */}
      <section className="cr-section">
        <div className="cr-eyebrow">What We're Looking For</div>
        <h2 className="cr-section-title">People Who Share Our Vision</h2>
        <p className="cr-section-sub">
          Whether you're an experienced professional, a recent graduate, a researcher, or a
          student seeking opportunities to grow, Magon AI welcomes talented individuals who share
          our vision.
        </p>
        <div className="cr-looking-wrap">
          <div className="cr-checklist">
            {lookingFor.map((item) => (
              <div className="cr-checklist-item" key={item}>
                <span className="cr-checklist-icon">✓</span>
                {item}
              </div>
            ))}
          </div>

          <div className="cr-internship-card">
            <div className="cr-internship-card-glow" />
            <div className="cr-internship-tag">Internships</div>
            <h3>Internship Opportunities</h3>
            <p>
              Magon AI provides internship opportunities for students and aspiring professionals
              interested in cybersecurity, artificial intelligence, software development, cloud
              security, and security research.
            </p>
            <p>
              Interns gain practical experience by working on real-world projects, collaborating
              with experienced professionals, and contributing to innovative solutions that
              address modern security challenges.
            </p>
            <div className="cr-internship-tracks">
              {internshipTracks.map((track) => (
                <div className="cr-internship-track" key={track}>{track}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="cr-divider" />

      {/* ── DIVERSITY ─────────────────────────────────────────────────── */}
      <section className="cr-section">
        <div className="cr-diversity">
          <span className="cr-diversity-icon">🌍</span>
          <div>
            <h3>Diversity and Inclusion</h3>
            <p>
              We believe diverse perspectives drive innovation. Magon AI is committed to building
              an inclusive workplace where everyone is respected, valued, and empowered to
              succeed.
            </p>
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────────── */}
      <section className="cr-section" id="contact">
        <div className="cr-cta">
          <div className="cr-cta-grid" />
          <div className="cr-cta-glow" />
          <div className="cr-cta-tagline">
            Join Our Mission <span>·</span> Shape the Future <span>·</span> Make an Impact
          </div>
          <h2>Ready to Make an Impact?</h2>
          <p>
            Cyber threats continue to evolve, and so do we. Together, we can build intelligent
            security solutions that help organizations operate with confidence in a connected
            world. Become part of a team that is shaping the future of AI-powered cybersecurity.
          </p>
          <div className="cr-cta-contact-card">
            <span className="cr-cta-contact-label">Send Your Application</span>
            <a href="mailto:careers@magon.ai" className="cr-cta-contact-email">
              careers@magon.ai
            </a>
            <p className="cr-cta-contact-note">
              Send your resume, portfolio, or professional profile. We look forward to hearing
              from you.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Careers;