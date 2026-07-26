import React from 'react';
import { motion } from 'framer-motion';
import './Features.css';

interface Feature {
  number: string;
  icon: string;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    number: '01',
    icon: 'ti-scan',
    title: 'Cross-microservice vulnerability scanning',
    desc: 'Polyglot scanning across every service in your stack — Python, Node, Go, Java, and more detected in a single pass.',
  },
  {
    number: '02',
    icon: 'ti-file-diff',
    title: 'Automated cross-file patch generation',
    desc: 'Context-aware fixes that span multiple files — no partial patches, no broken imports, no manual stitching.',
  },
  {
    number: '03',
    icon: 'ti-test-pipe',
    title: 'Compiler + unit + integration test runner',
    desc: 'Every auto-fix is validated end-to-end — compile checks, unit tests, and integration suites run before any PR is opened.',
  },
  {
    number: '04',
    icon: 'ti-lock',
    title: 'AES-256 encryption on all reports and diffs',
    desc: 'Every vulnerability report and diff is wrapped in an AES-256 encryption envelope — your findings never leave your control.',
  },
  {
    number: '05',
    icon: 'ti-git-pull-request',
    title: 'Multi-repo PR creation per service',
    desc: 'Automatically opens targeted pull requests in each affected repo, keeping changes scoped and reviewable per service.',
  },
  {
    number: '06',
    icon: 'ti-hierarchy-2',
    title: 'Dependency graph traversal across services',
    desc: 'Traces transitive dependencies across service boundaries to surface hidden vulnerabilities that flat scanners miss.',
  },
];

const Features: React.FC = () => {
  return (
    <section className="features-section">

      {/* Background Glow */}
      <div className="features-bg-glow" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.7,
          ease: [0.22, 1, 0.36, 1],
        }}
        viewport={{ once: true }}
      >
        <p className="features-label">
          PLATFORM CAPABILITIES
        </p>

        <h2 className="features-heading">
          Security for AI-Native Systems
        </h2>

        <p className="features-subheading">
          Every layer of your stack secured —
          across services, repos, and runtimes.
        </p>
      </motion.div>

      {/* Features Grid */}
      <div className="features-grid">

        {features.map((feature, index) => (

          <motion.div
            key={feature.number}
            className="fcard"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.55,
              delay: index * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            viewport={{ once: true }}
          >

            {/* Inner Glass Highlight */}
            <div className="fcard-inner-highlight" />

            {/* Shimmer Sweep */}
            <div className="fcard-shimmer" />

            {/* Card Number */}
            <span className="fcard-number">
              {feature.number}
            </span>

            {/* Icon */}
            <div className="fcard-icon-wrap">
              <i
                className={`ti ${feature.icon}`}
                aria-hidden="true"
              />
            </div>

            {/* Title */}
            <h3 className="fcard-title">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="fcard-desc">
              {feature.desc}
            </p>

          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Features;