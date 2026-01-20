import { Link } from 'react-router-dom';

function ThankYou() {
    return (
        <section className="thank-you">
            <div className="container">
                <div className="thank-you-card card">
                    <div className="success-icon">✅</div>
                    <h1>Thank You!</h1>
                    <p className="message">
                        Your request has been received successfully. Our AI assistant will call you
                        at the provided number within the next few minutes.
                    </p>

                    <div className="what-to-expect">
                        <h3>What to Expect:</h3>
                        <ul>
                            <li>📞 You'll receive a call from our AI assistant</li>
                            <li>🗣️ The conversation will be in natural Hindi-English</li>
                            <li>⏱️ The call typically lasts 2-5 minutes</li>
                            <li>🔒 Your data is secure and never shared</li>
                        </ul>
                    </div>

                    <Link to="/" className="btn btn-secondary">
                        ← Back to Home
                    </Link>
                </div>
            </div>

            <style>{`
        .thank-you {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 100px 0 50px;
        }
        
        .thank-you-card {
          max-width: 600px;
          text-align: center;
          animation: fadeIn 0.6s ease;
        }
        
        .success-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
        }
        
        .thank-you-card h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .message {
          color: var(--text-secondary);
          font-size: 1.125rem;
          margin-bottom: 2rem;
        }
        
        .what-to-expect {
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
        }
        
        .what-to-expect h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          color: var(--color-primary-light);
        }
        
        .what-to-expect ul {
          list-style: none;
        }
        
        .what-to-expect li {
          padding: 0.5rem 0;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
      `}</style>
        </section>
    );
}

export default ThankYou;
