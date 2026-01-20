function Privacy() {
    return (
        <section className="privacy">
            <div className="container">
                <div className="privacy-content card">
                    <h1>Privacy Policy</h1>
                    <p className="last-updated">Last updated: January 2024</p>

                    <div className="section">
                        <h2>1. Information We Collect</h2>
                        <p>
                            When you use our AI Voice Calling service, we collect:
                        </p>
                        <ul>
                            <li><strong>Contact Information:</strong> Name, phone number, and optional email address</li>
                            <li><strong>Call Recordings:</strong> Audio recordings of your conversation with our AI assistant</li>
                            <li><strong>Transcripts:</strong> Text transcriptions of the call for quality improvement</li>
                            <li><strong>Usage Data:</strong> Call duration, timestamps, and technical logs</li>
                        </ul>
                    </div>

                    <div className="section">
                        <h2>2. How We Use Your Information</h2>
                        <p>Your information is used to:</p>
                        <ul>
                            <li>Initiate and conduct AI-powered voice calls</li>
                            <li>Improve our AI conversation quality</li>
                            <li>Provide customer support</li>
                            <li>Ensure compliance with legal requirements</li>
                        </ul>
                    </div>

                    <div className="section">
                        <h2>3. Call Recording Consent</h2>
                        <p>
                            By submitting your information through our website, you explicitly consent to:
                        </p>
                        <ul>
                            <li>Receiving an automated AI-powered phone call</li>
                            <li>The recording of this call for quality assurance</li>
                            <li>The use of call data to improve our services</li>
                        </ul>
                        <p>
                            You may withdraw consent at any time by contacting us. Withdrawal of
                            consent will result in deletion of your data within 30 days.
                        </p>
                    </div>

                    <div className="section">
                        <h2>4. Data Security</h2>
                        <p>
                            We implement industry-standard security measures including:
                        </p>
                        <ul>
                            <li>Encryption of data in transit (TLS 1.3)</li>
                            <li>Encryption of data at rest (AES-256)</li>
                            <li>Regular security audits</li>
                            <li>Access controls and authentication</li>
                        </ul>
                    </div>

                    <div className="section">
                        <h2>5. Data Retention</h2>
                        <p>
                            We retain your personal data for:
                        </p>
                        <ul>
                            <li><strong>Contact Information:</strong> 2 years from last interaction</li>
                            <li><strong>Call Recordings:</strong> 90 days</li>
                            <li><strong>Transcripts:</strong> 1 year</li>
                        </ul>
                    </div>

                    <div className="section">
                        <h2>6. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access your personal data</li>
                            <li>Request correction of inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt-out of future calls</li>
                            <li>Withdraw consent at any time</li>
                        </ul>
                    </div>

                    <div className="section">
                        <h2>7. Contact Us</h2>
                        <p>
                            For any privacy-related questions or to exercise your rights, contact us at:
                        </p>
                        <p className="contact-info">
                            📧 Email: privacy@example.com<br />
                            📞 Phone: +91-XXXXXXXXXX
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
        .privacy {
          padding: 120px 0 50px;
        }
        
        .privacy-content {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .privacy-content h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .last-updated {
          color: var(--text-muted);
          margin-bottom: 2rem;
          font-size: 0.875rem;
        }
        
        .section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        
        .section h2 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }
        
        .section p {
          color: var(--text-secondary);
          margin-bottom: 1rem;
          line-height: 1.7;
        }
        
        .section ul {
          list-style: disc;
          padding-left: 1.5rem;
          color: var(--text-secondary);
        }
        
        .section li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }
        
        .section strong {
          color: var(--text-primary);
        }
        
        .contact-info {
          background: rgba(99, 102, 241, 0.05);
          border-radius: 8px;
          padding: 1rem;
          line-height: 2;
        }
      `}</style>
        </section>
    );
}

export default Privacy;
