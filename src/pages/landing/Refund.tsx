import React from 'react';
import './Terms.css'; 

const Refund: React.FC = () => {
    const lastUpdated = "October 24, 2023"; // Update this to today's date

    return (
        <main style={{ paddingTop: '90px' }}>
            <section className="hero legal-hero">
                <h1>Refund & <span className="highlight">Cancellation</span></h1>
                <p>Understanding our billing, cancellation, and refund processes.</p>
            </section>

            <section className="section">
                <div className="legal-container">
                    <div className="legal-content">
                        <p className="last-updated">Last Updated: {lastUpdated}</p>

                        <h2>1. Digital Goods Policy</h2>
                        <p>
                            <strong>Niyantri</strong> (trading as Niyantri Labs) provides digital services, including API access (Shoretic) and automated codebase security scanning (Niyantri Code). 
                            Due to the immediate and digital nature of these services, all sales are considered final once access is granted, API keys are utilized, or a scan is initiated.
                        </p>

                        <h2>2. Subscription Cancellations</h2>
                        <p>
                            You may cancel your recurring subscription at any time through your dashboard settings. 
                        </p>
                        <ul>
                            <li><strong>Effective Date:</strong> Cancellations take effect at the end of your current paid billing cycle.</li>
                            <li><strong>Continued Access:</strong> You will retain full access to your plan's features and remaining credits until that billing cycle concludes.</li>
                            <li>We do not prorate or refund partial months or unused API credits upon cancellation.</li>
                        </ul>

                        <h2>3. Refund Eligibility</h2>
                        <p>
                            While our general policy is strictly "No Refunds" for digital goods, we may grant exceptions at our sole discretion under the following limited circumstances:
                        </p>
                        <ul>
                            <li><strong>Duplicate Billing:</strong> If a technical error causes you to be charged multiple times for a single billing cycle or credit package.</li>
                            <li><strong>Prolonged Service Outages:</strong> If our APIs or scanning services experience significant, documented downtime that prevents you from using the service you paid for, and our engineering team cannot resolve the issue.</li>
                        </ul>
                        <p>
                            Refunds will <strong>not</strong> be granted for a lack of usage, a change of mind, or if your account is terminated due to a violation of our Terms & Conditions.
                        </p>

                        <h2>4. How to Request a Refund</h2>
                        <p>
                            If you believe you meet the criteria for an exception, you must submit a request within <strong>7 days</strong> of the disputed charge. 
                        </p>
                        <p>
                            Please email us with your account details, the transaction ID, and a detailed explanation of the issue. Our billing team will review your request and respond within 2-3 business days.
                        </p>

                        <h2>5. Refund Processing Timeline</h2>
                        <p>
                            If a refund is approved by our team, it will be processed immediately. However, depending on your bank, credit card issuer, or payment gateway (e.g., Cashfree), it may take <strong>5 to 7 business days</strong> for the funds to appear in your account. Refunds will only be issued to the original payment method used for the purchase.
                        </p>

                        <h2>6. Contact Us</h2>
                        <p>
                            For any billing inquiries, cancellation assistance, or refund requests, please reach out to us:
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

export default Refund;