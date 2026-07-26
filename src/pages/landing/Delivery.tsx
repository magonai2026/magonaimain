import React from 'react';
import './Terms.css'; 

const Delivery: React.FC = () => {
    const lastUpdated = "October 24, 2023"; // Update this to today's date

    return (
        <main style={{ paddingTop: '90px' }}>
            <section className="hero legal-hero">
                <h1>Delivery <span className="highlight">Policy</span></h1>
                <p>Information regarding the delivery of our digital services and API access.</p>
            </section>

            <section className="section">
                <div className="legal-container">
                    <div className="legal-content">
                        <p className="last-updated">Last Updated: {lastUpdated}</p>

                        <h2>1. Digital Delivery Overview</h2>
                        <p>
                            <strong>Niyantri</strong> (trading as Niyantri Labs) provides digital software-as-a-service (SaaS) products, including the Niyantri Code security scanner and the Shoretic API. 
                            We do not ship any physical goods or hardware. All services, subscriptions, and API credits are delivered entirely electronically.
                        </p>

                        <h2>2. Delivery Timeline</h2>
                        <p>
                            Upon successful authorization and processing of your payment, delivery of your digital services is typically instantaneous.
                        </p>
                        <ul>
                            <li><strong>API Keys & Credits:</strong> Immediately provisioned and accessible via your user dashboard.</li>
                            <li><strong>Subscription Upgrades:</strong> Account limits and features are unlocked instantly.</li>
                            <li><strong>Code Scans & Reports:</strong> Delivered digitally to your dashboard or via GitHub Pull Requests upon completion of the automated scanning process.</li>
                        </ul>

                        <h2>3. Access and Confirmation</h2>
                        <p>
                            Once a transaction is complete, you will receive a confirmation email at the address associated with your account. This email serves as your digital receipt and confirms that your services have been successfully provisioned. 
                        </p>
                        <p>
                            You can verify your current subscription status, API usage, and billing history at any time by logging into the dashboard on our platform.
                        </p>

                        <h2>4. Delivery Delays or Issues</h2>
                        <p>
                            In rare cases, there may be a slight delay in provisioning due to payment gateway processing times or temporary system maintenance. If your account is not updated within <strong>15 minutes</strong> of a successful charge, please reach out to our support team immediately so we can manually verify and provision your access.
                        </p>

                        <h2>5. Contact Us</h2>
                        <p>
                            If you experience any issues accessing the services you have purchased, please contact our support team:
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

export default Delivery;