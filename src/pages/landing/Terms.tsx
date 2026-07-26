import React from 'react';
import './Terms.css'; 

const Terms: React.FC = () => {
    const lastUpdated = "March 26, 2026"; 

    return (
        <main style={{ paddingTop: '90px' }}>
            <section className="hero legal-hero">
                <h1>Terms & <span className="highlight">Conditions</span></h1>
                <p>Please read these terms carefully before using our services.</p>
            </section>

            <section className="section">
                <div className="legal-container">
                    <div className="legal-content">
                        <p className="last-updated">Effective Date: {lastUpdated}</p>

                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using <strong>Niyantri Security</strong> (the "Service"), operated by{" "}
                            <strong>Niyantri Labs (Niyantri)</strong>, you ("User", "you", or "your") agree to be bound by
                            these Terms and Conditions ("Terms"). These Terms apply to all users — individual
                            developers, startups, and enterprise organisations alike.
                        </p>
                        <p>
                            If you are accepting on behalf of a company or organisation, you represent and warrant
                            that you have authority to bind that entity to these Terms. If you do not agree, you must
                            discontinue use of the Service immediately.
                        </p>
                        <p style={{ padding: '15px', background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', borderRadius: '4px' }}>
                            <strong>Important:</strong> These Terms constitute a legally binding agreement under the laws of India. 
                            Please read them carefully before using the Service.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            Niyantri Security AI is a multi-source vulnerability scanning platform that analyses software
                            projects for known security vulnerabilities using sources including Trivy (NVD), npm/pip
                            audit, OSV (Google), RetireJS, and the GitHub Advisory Database.
                        </p>
                        <p>The Service is offered in two tiers:</p>
                        
                        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1.5rem 0', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '0.75rem' }}>Feature</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Free</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Paid</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem' }}>Vulnerability Scanning</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>✓</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>✓</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem' }}>Multi-source (Trivy, OSV, npm, pip)</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>✓</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>✓</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem' }}>Exploitability Risk Scoring</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>✓</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>✓</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem' }}>Advanced Reporting & Audit Logs</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>—</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>✓</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem' }}>Team / Org Management</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>—</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>✓</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem' }}>SSO / Enterprise Auth</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>—</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>✓</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.75rem' }}>Priority Support & SLA</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>—</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>✓</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '0.75rem' }}>Custom Integrations & API</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>—</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>✓</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <p>
                            Features available under each tier are subject to change. Niyantri Labs (Niyantri) will provide
                            reasonable advance notice of material changes to paid tier features.
                        </p>

                        <h2>3. Accounts & Registration</h2>
                        <p>
                            To access certain features you must register for an account. You agree to provide
                            accurate, current, and complete information during registration and to keep your account
                            credentials confidential.
                        </p>
                        <ul>
                            <li>You are responsible for all activity that occurs under your account.</li>
                            <li>You must notify us immediately at support@niyantri.in of any unauthorised use.</li>
                            <li>Enterprise accounts may designate one or more administrators who manage team access.</li>
                            <li>Accounts are non-transferable without prior written consent from Niyantri Labs.</li>
                            <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
                        </ul>

                        <h2>4. Freemium Model & Subscriptions</h2>
                        <p>
                            The Service operates on a freemium basis. The Free tier is provided at no cost with
                            limited capabilities. Paid tiers unlock advanced features including priority support,
                            audit logs, SSO, team management, and custom integrations.
                        </p>
                        
                        <h3>4.1 Billing & Renewal</h3>
                        <p>
                            Paid subscriptions are billed in advance on a monthly or annual cycle.{" "}
                            <strong>Subscriptions renew automatically</strong> at the end of each billing period
                            unless cancelled at least 48 hours before the renewal date. By subscribing, you
                            authorise Niyantri Labs (Niyantri) to charge your payment method on a recurring basis.
                        </p>

                        <h3>4.2 Cancellation & Refunds</h3>
                        <p>
                            You may cancel your subscription at any time through your account dashboard. Cancellation
                            takes effect at the end of the current billing period. Refunds are issued at our
                            discretion except where required by applicable law. Annual plan refunds within 14 days
                            of purchase will be considered on request.
                        </p>

                        <h3>4.3 Price Changes</h3>
                        <p>
                            We reserve the right to modify pricing with at least 30 days' prior notice via email
                            or in-app notification. Continued use after the effective date constitutes acceptance
                            of the new pricing.
                        </p>

                        <h2>5. Acceptable Use</h2>
                        <p>You agree to use the Service only for lawful purposes and in compliance with these Terms. You must not:</p>
                        <ul>
                            <li>Use the Service to scan systems or networks you do not own or have explicit authorisation to test.</li>
                            <li>Attempt to reverse engineer, decompile, disassemble, or derive source code from any part of the Service.</li>
                            <li>Resell, sublicense, or redistribute the Service without written authorisation.</li>
                            <li>Use the Service to develop a competing product or benchmark the Service for public disclosure without consent.</li>
                            <li>Circumvent, disable, or interfere with security features or access controls.</li>
                            <li>Transmit malware, ransomware, or any code designed to harm systems.</li>
                            <li>Violate any applicable export control laws or regulations (see Section 9).</li>
                        </ul>
                        <p style={{ padding: '15px', background: '#e0f2fe', borderLeft: '4px solid #0284c7', color: '#0369a1', borderRadius: '4px' }}>
                            <strong>Note:</strong> Violation of acceptable use policies may result in immediate account suspension and
                            potential legal action.
                        </p>

                        <h2>6. Intellectual Property</h2>
                        <p>
                            All content, software, algorithms, interfaces, and branding within the Service are the
                            exclusive intellectual property of Niyantri Labs (Niyantri) or its licensors, protected under
                            applicable copyright, trademark, and trade secret laws.
                        </p>

                        <h3>6.1 License Grant</h3>
                        <p>
                            Subject to your compliance with these Terms, Niyantri Labs (Niyantri) grants you a limited,
                            non-exclusive, non-transferable, revocable licence to access and use the Service for
                            your internal business or development purposes.
                        </p>

                        <h3>6.2 No Reverse Engineering</h3>
                        <p>
                            You shall not reverse engineer, decompile, disassemble, translate, reconstruct, or
                            discover any source code, algorithms, or underlying ideas of the Service. This
                            restriction applies whether the Service is provided as software, API, CLI binary, or
                            web application.
                        </p>

                        <h3>6.3 Feedback</h3>
                        <p>
                            Any feedback, suggestions, or ideas you provide regarding the Service may be used by
                            Niyantri Labs (Niyantri) without restriction or compensation to you.
                        </p>

                        <h2>7. Data & Privacy</h2>
                        
                        <h3>7.1 Data You Submit</h3>
                        <p>
                            When you scan a project, metadata about your dependency graph (package names, versions,
                            vulnerability IDs) may be processed by our servers. We do not access, store, or
                            transmit your source code.
                        </p>

                        <h3>7.2 Data Retention</h3>
                        <p>
                            Scan results and account data are retained for the duration of your subscription plus
                            90 days after termination, after which they are permanently deleted. Enterprise
                            customers may request custom retention schedules via a Data Processing Agreement (DPA).
                        </p>

                        <h3>7.3 Data Deletion</h3>
                        <p>
                            You may request deletion of your account and associated data at any time by emailing{" "}
                            <a href="mailto:support@niyantri.in">support@niyantri.in</a>. Deletion requests are
                            processed within 30 days.
                        </p>

                        <h3>7.4 Privacy Policy</h3>
                        <p>
                            Our collection and use of personal data is governed by our Privacy Policy, available
                            at <a href="https://security.niyantrilabs.com/" target="_blank" rel="noopener noreferrer">security.niyantrilabs.com</a>. By using
                            the Service you consent to data practices described therein.
                        </p>

                        <h2>8. Confidentiality</h2>
                        <p>
                            Each party may have access to confidential information of the other party. "Confidential
                            Information" means any information disclosed that is designated as confidential or that
                            reasonably should be understood to be confidential given the nature of the information.
                        </p>
                        <ul>
                            <li>Each party agrees to protect the other's confidential information with at least the same degree of care used for its own confidential information, but no less than reasonable care.</li>
                            <li>Confidential information may only be used for the purpose of fulfilling obligations under these Terms.</li>
                            <li>Enterprise customers requiring a formal NDA may contact us at support@niyantri.in to execute a standalone Non-Disclosure Agreement.</li>
                            <li>Confidentiality obligations survive termination of the agreement for a period of three (3) years.</li>
                        </ul>

                        <h2>9. Export Compliance</h2>
                        <p>
                            Niyantri Security is a cybersecurity tool subject to applicable export control laws and
                            regulations, including but not limited to the Indian Foreign Trade Policy, and where
                            applicable, the U.S. Export Administration Regulations (EAR).
                        </p>
                        <ul>
                            <li>You represent that you are not located in, under the control of, or a national or resident of any country subject to applicable trade sanctions or embargoes.</li>
                            <li>You agree not to export, re-export, or transfer the Service to any prohibited country, entity, or individual.</li>
                            <li>You shall not use the Service in connection with the development of biological, chemical, nuclear, or radiological weapons.</li>
                            <li>You are solely responsible for compliance with all applicable export laws in your jurisdiction.</li>
                        </ul>
                        <p style={{ padding: '15px', background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', borderRadius: '4px' }}>
                            <strong>Warning:</strong> Misuse of vulnerability data for offensive cyber operations is strictly prohibited and
                            may violate national and international law.
                        </p>

                        <h2>10. Disclaimer of Warranties</h2>
                        <p>
                            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
                            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
                            FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                        </p>

                        <h3>10.1 No Liability for Missed Vulnerabilities</h3>
                        <p>
                            Vulnerability scanning is inherently probabilistic. Niyantri Labs (Niyantri) does not warrant
                            that the Service will detect all vulnerabilities present in your software, that scan
                            results are complete, accurate, or current, or that your software will be secure after
                            acting on scan results. The Service aggregates data from third-party databases (NVD,
                            OSV, GitHub Advisory) and cannot guarantee the accuracy or timeliness of those sources.
                        </p>

                        <h3>10.2 Security Responsibility</h3>
                        <p>
                            You remain solely responsible for the security of your systems and software. Niyantri
                            Security is a tool to assist — not replace — professional security review, penetration
                            testing, and secure development practices.
                        </p>

                        <h2>11. Limitation of Liability</h2>
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL NIYANTRI LABS (NIYANTRI),
                            ITS DIRECTORS, EMPLOYEES, PARTNERS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, GOODWILL,
                            OR BUSINESS INTERRUPTION.
                        </p>
                        <p>
                            OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIMS ARISING UNDER THESE TERMS SHALL NOT
                            EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID FOR THE SERVICE IN THE TWELVE (12) MONTHS
                            PRECEDING THE CLAIM, OR (B) INR 5,000.
                        </p>

                        <h2>12. Enterprise Features</h2>
                        <p>
                            Enterprise tier subscribers receive access to additional features subject to these Terms
                            and any applicable Order Form or Enterprise Agreement:
                        </p>
                        <ul>
                            <li><strong>Team & Organisation Management:</strong> Administrators may add/remove team members, assign roles, and manage permissions across projects.</li>
                            <li><strong>SSO / Enterprise Auth:</strong> SAML 2.0 and OIDC-based single sign-on is available. Configuration must comply with your identity provider's security requirements.</li>
                            <li><strong>Advanced Reporting & Audit Logs:</strong> Tamper-evident audit logs of all scan activity, user actions, and configuration changes are retained for 12 months.</li>
                            <li><strong>Priority Support & SLA:</strong> Enterprise customers receive a target first-response SLA of 4 business hours for critical issues.</li>
                            <li><strong>Custom Integrations:</strong> API access and webhook support are provided. You are responsible for the security of integrations you develop.</li>
                        </ul>

                        <h2>13. Termination</h2>
                        <p>
                            Either party may terminate this agreement at any time. Niyantri Labs (Niyantri) may suspend or
                            terminate your access immediately, without notice, if:
                        </p>
                        <ul>
                            <li>You breach any provision of these Terms.</li>
                            <li>We are required to do so by law or court order.</li>
                            <li>We reasonably believe your use poses a security risk to the Service or other users.</li>
                            <li>You fail to pay applicable subscription fees.</li>
                        </ul>
                        <p>
                            Upon termination, your right to use the Service immediately ceases. Sections 6, 7, 8,
                            10, 11, and 15 survive termination.
                        </p>

                        <h2>14. Governing Law & Disputes</h2>
                        <p>
                            These Terms are governed by and construed in accordance with the laws of{" "}
                            <strong>India</strong>, without regard to conflict of law principles. Any
                            dispute arising out of or relating to these Terms shall be subject to the exclusive
                            jurisdiction of the courts located in India.
                        </p>

                        <h3>14.1 Dispute Resolution</h3>
                        <p>
                            Before initiating formal legal proceedings, parties agree to attempt resolution through
                            good-faith negotiation for a period of 30 days. If unresolved, disputes shall be
                            submitted to binding arbitration under the Arbitration and Conciliation Act, 1996
                            (India), with proceedings conducted in English.
                        </p>

                        <h2>15. Changes to Terms</h2>
                        <p>
                            Niyantri Labs (Niyantri) reserves the right to modify these Terms at any time. We will notify
                            you of material changes via email to your registered address or a prominent in-app
                            notice at least 14 days before the changes take effect.
                        </p>
                        <p>
                            Your continued use of the Service after the effective date of revised Terms constitutes
                            acceptance of those changes. If you do not agree with the revised Terms, you must
                            discontinue use and may cancel your subscription.
                        </p>

                        <h2>16. Contact</h2>
                        <p>
                            For questions, concerns, or legal notices regarding these Terms, please contact:
                        </p>
                        <ul>
                            <li><strong>Company:</strong> Niyantri Labs (Niyantri)</li>
                            <li><strong>Product:</strong> Niyantri Security AI</li>
                            <li><strong>Email:</strong> <a href="mailto:support@niyantri.in">support@niyantri.in</a></li>
                            <li><strong>Website:</strong> <a href="https://security.niyantrilabs.com/" target="_blank" rel="noopener noreferrer">security.niyantrilabs.com</a></li>
                            <li><strong>Jurisdiction:</strong> India</li>
                        </ul>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Terms;