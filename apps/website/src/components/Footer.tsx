import { Link } from 'react-router-dom';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container footer-container">
                <div className="footer-brand">
                    <span className="footer-logo">🤖 VoiceAI</span>
                    <p className="footer-tagline">AI-powered voice calling platform</p>
                </div>

                <div className="footer-links">
                    <Link to="/privacy">Privacy Policy</Link>
                    <a href="mailto:support@example.com">Contact</a>
                </div>

                <p className="footer-copyright">
                    © {currentYear} VoiceAI. All rights reserved.
                </p>
            </div>

            <style>{`
        .footer {
          background: var(--bg-dark-secondary);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding: 3rem 0 2rem;
          margin-top: auto;
        }
        
        .footer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          text-align: center;
        }
        
        .footer-logo {
          font-size: 1.25rem;
          font-weight: 700;
        }
        
        .footer-tagline {
          color: var(--text-muted);
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        
        .footer-links {
          display: flex;
          gap: 2rem;
        }
        
        .footer-links a {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          transition: color var(--transition-fast);
        }
        
        .footer-links a:hover {
          color: var(--color-primary-light);
        }
        
        .footer-copyright {
          color: var(--text-muted);
          font-size: 0.75rem;
        }
      `}</style>
        </footer>
    );
}

export default Footer;
