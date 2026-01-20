import LeadForm from '../components/LeadForm';

function Home() {
    return (
        <section className="hero">
            <div className="container hero-container">
                <div className="hero-content">
                    <div className="hero-badge fade-in">
                        <span>🚀</span> AI-Powered Calls
                    </div>
                    <h1 className="hero-title fade-in">
                        Get a Free <span className="gradient-text">AI Consultation</span> Call
                    </h1>
                    <p className="hero-description fade-in">
                        Submit your details and our intelligent AI assistant will call you within
                        minutes. Experience natural conversations in Hindi-English with cutting-edge
                        voice technology.
                    </p>

                    <div className="hero-features fade-in">
                        <div className="feature">
                            <span className="feature-icon">⚡</span>
                            <span>Instant Callback</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🗣️</span>
                            <span>Hindi-English Mix</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🔒</span>
                            <span>100% Secure</span>
                        </div>
                    </div>
                </div>

                <div className="hero-form fade-in">
                    <LeadForm />
                </div>
            </div>

            <style>{`
        .hero {
          padding-top: 100px;
        }
        
        .hero-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          align-items: center;
          min-height: calc(100vh - 100px);
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--gradient-glow);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }
        
        .hero-title {
          margin-bottom: 1.5rem;
          line-height: 1.1;
        }
        
        .gradient-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hero-description {
          color: var(--text-secondary);
          font-size: 1.125rem;
          margin-bottom: 2rem;
          max-width: 500px;
        }
        
        .hero-features {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }
        
        .feature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
        
        .feature-icon {
          font-size: 1.25rem;
        }
        
        .hero-form {
          animation-delay: 0.3s;
        }
        
        @media (max-width: 1024px) {
          .hero-container {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: center;
          }
          
          .hero-description {
            margin-left: auto;
            margin-right: auto;
          }
          
          .hero-features {
            justify-content: center;
          }
        }
        
        @media (max-width: 640px) {
          .hero-features {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
        }
      `}</style>
        </section>
    );
}

export default Home;
