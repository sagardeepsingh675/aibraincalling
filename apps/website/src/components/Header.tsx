import { Link } from 'react-router-dom';

function Header() {
    return (
        <header className="header">
            <div className="container header-container">
                <Link to="/" className="logo">
                    <span className="logo-icon">🤖</span>
                    <span className="logo-text">VoiceAI</span>
                </Link>
                <nav className="nav">
                    <Link to="/" className="nav-link">Home</Link>
                    <Link to="/privacy" className="nav-link">Privacy</Link>
                </nav>
            </div>

            <style>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 700;
        }
        
        .logo-icon {
          font-size: 1.75rem;
        }
        
        .logo-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .nav {
          display: flex;
          gap: 2rem;
        }
        
        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 500;
          transition: color var(--transition-fast);
        }
        
        .nav-link:hover {
          color: var(--text-primary);
        }
        
        @media (max-width: 640px) {
          .nav {
            gap: 1rem;
          }
        }
      `}</style>
        </header>
    );
}

export default Header;
