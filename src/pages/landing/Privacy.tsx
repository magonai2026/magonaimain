import React from 'react';
import './Terms.css'; 

const Privacy: React.FC = () => {
    const lastUpdated = "October 24, 2023"; // Update this to today's date

    return (
        <main style={{ paddingTop: '90px' }}>
            <section className="hero legal-hero">
                <h1>Privacy <span className="highlight">Policy</span></h1>
                <p>How we collect, use, and protect your data.</p>
            </section>

            <section className="section">
                <div className="legal-container">
                    <div className="legal-content">
                        <p className="last-updated">Last Updated: {lastUpdated}</p>

                        <h2>1. Introduction</h2>
                        <p>
                            At <strong>Niyantri</strong> (trading as Niyantri Labs), accessible from niyantrilabs.com, 
                            one of our main priorities is the privacy of our visitors and customers. This Privacy Policy 
                            document contains types of information that is collected and recorded by Niyantri Labs and how we use it.
                        </p>
                        <p>
                            This policy applies to our website and our products, including Niyantri Code and the Shoretic API.
                        </p>

                        <h2>2. Information We Collect</h2>
                        <p>We collect several different types of information for various purposes to provide and improve our Service to you:</p>
                        <ul>
                            <li><strong>Personal Data:</strong> When you register for an account, we may ask for your name, email address, and company details.</li>
                            <li><strong>Source Code & Repositories:</strong> When using Niyantri Code, you may grant us access to your GitHub repositories or upload code archives. We temporarily process this data solely for the purpose of identifying vulnerabilities and generating fixes.</li>
                            <li><strong>Usage Data:</strong> We collect data on how our APIs and services are accessed and used. This includes your IP address, browser type, pages visited, and the time and date of your visit.</li>
                            <li><strong>Payment Information:</strong> For paid subscriptions, our payment processors (e.g., Cashfree) collect and process your payment details securely. We do not store full credit card numbers on our servers.</li>
                        </ul>

                        <h2>3. How We Use Your Information</h2>
                        <p>Niyantri Labs uses the collected data for various purposes:</p>
                        <ul>
                            <li>To provide, maintain, and secure our services.</li>
                            <li>To notify you about changes to our services or security alerts.</li>
                            <li>To provide customer support.</li>
                            <li>To detect, prevent, and address technical issues and fraud.</li>
                        </ul>
                        
                        <h3>A Note on AI and Your Source Code</h3>
                        <p>
                            We understand that your codebase is your most valuable asset. <strong>We do not use your private source code to train our public artificial intelligence models.</strong> Code analyzed by Niyantri Code is processed securely in isolated environments and is not permanently retained after the scanning and reporting lifecycle is complete, unless explicitly required for compliance or user-requested history.
                        </p>

                        <h2>4. Data Security</h2>
                        <p>
                            The security of your data is critical to us. We implement industry-standard security measures, including encryption in transit (HTTPS/TLS) and at rest, to protect your personal information and code. However, remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure.
                        </p>

                        <h2>5. Third-Party Services</h2>
                        <p>
                            We may employ third-party companies and individuals to facilitate our Service (e.g., cloud hosting providers, payment gateways like Cashfree). These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
                        </p>

                        <h2>6. Your Data Protection Rights</h2>
                        <p>
                            Depending on your location, you may have rights under data protection laws (such as GDPR) to access, update, or delete the information we have on you. If you wish to exercise these rights, please contact us.
                        </p>

                        <h2>7. Changes to This Privacy Policy</h2>
                        <p>
                            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                        </p>

                        <h2>8. Contact Us</h2>
                        <p>
                            If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us:
                            <br />
                            <strong>Email:</strong> <a href="mailto:contact@niyantrilabs.com">contact@niyantrilabs.com</a>
                            <br />
                            <strong>Address:</strong> Hyderabad, Telangana, India
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default Privacy;