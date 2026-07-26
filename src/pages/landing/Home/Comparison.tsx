import React from 'react';
import './Comparison.css';

const COMPARISON_ROWS = [
  { feature: 'Context-aware analysis',      values: ['yes','no','no','yes','no','no'] },
  { feature: 'Function-level blast radius', values: ['yes','no','no','no','no','no'] },
  { feature: 'Taint source tracking',       values: ['yes','partial','partial','no','no','partial'] },
  { feature: 'Cross-file data flow',        values: ['yes','partial','partial','yes','no','partial'] },
  { feature: 'Confidence scores',           values: ['yes','no','no','yes','no','no'] },
  { feature: 'LLM injection detection',     values: ['yes','no','no','no','no','no'] },
  { feature: 'Multi-file PR',               values: ['yes','no','no','no','no','no'] },
  { feature: 'Autonomous PR fix',           values: ['yes','no','no','yes','partial','no'] },
  { feature: 'PDF report',                  values: ['yes','partial','yes','no','partial','yes'] },
  { feature: '15+ languages',               values: ['yes','yes','yes','yes','yes','yes'] },
  { feature: 'No rules needed',             values: ['yes','no','no','no','no','no'] },
] as const;

const COMPARISON_TOOLS = ['MagonAI', 'Semgrep', 'Sonar', 'Claude Code', 'Snyk', 'Checkmarx'] as const;

const ComparisonCell: React.FC<{ value: string; isMagonAI: boolean }> = ({ value, isMagonAI }) => (
  <td className={`comparison-cell${isMagonAI ? ' comparison-cell-niyantri' : ''}`}>
    {value === 'yes'     && <span className="cmp-yes">✓</span>}
    {value === 'no'      && <span className="cmp-no">✗</span>}
    {value === 'partial' && <span className="cmp-partial">~</span>}
    {!['yes', 'no', 'partial'].includes(value) && <span className="cmp-price">{value}</span>}
  </td>
);

const Comparison: React.FC = () => {
  return (
    <section className="comparison-section">
      <div className="comparison-inner">
        <span className="comparison-eyebrow">Why Magon AI</span>
        <h2 className="comparison-title">How we stack up against the competition</h2>
        <p className="comparison-sub">
          Most tools find surface-level bugs. Magon AI Code goes deeper — context-aware, cross-file, and built for real attack scenarios.
        </p>

        <div className="comparison-table-wrap">
          <table className="comparison-table">
            <thead>
              <tr>
                <th className="comparison-feature-col">Feature</th>
                {COMPARISON_TOOLS.map(tool => (
                  <th
                    key={tool}
                    className={tool === 'MagonAI' ? 'comparison-th comparison-th-niyantri' : 'comparison-th'}
                  >
                    {tool === 'MagonAI' ? <><span className="niyantri-badge">★</span> {tool}</> : tool}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map(({ feature, values }) => (
                <tr key={feature} className="comparison-row">
                  <td className="comparison-feature">{feature}</td>
                  {values.map((v, i) => (
                    <ComparisonCell key={i} value={v} isMagonAI={i === 0} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="comparison-legend">
          <span className="cmp-yes">✓</span> Full support &nbsp;&nbsp;
          <span className="cmp-partial">~</span> Partial support &nbsp;&nbsp;
          <span className="cmp-no">✗</span> Not supported
        </p>
      </div>
    </section>
  );
};

export default Comparison;