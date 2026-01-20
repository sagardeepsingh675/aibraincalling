import { useAuth } from '../../hooks/useAuth';

function Header() {
    const { user } = useAuth();

    return (
        <header className="admin-header">
            <div className="search-box">
                <span className="search-icon">🔍</span>
                <input type="text" placeholder="Search leads, calls..." className="search-input" />
            </div>

            <div className="header-right">
                <button className="notification-btn">
                    <span>🔔</span>
                    <span className="notification-badge">3</span>
                </button>

                <div className="user-info">
                    <div className="user-avatar">
                        {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <span className="user-email">{user?.email || 'admin@example.com'}</span>
                </div>
            </div>

            <style>{`
        .admin-header {
          height: var(--header-height);
          background: var(--bg-sidebar);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
        }
        
        .search-box {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--bg-input);
          padding: 0.625rem 1rem;
          border-radius: 8px;
          width: 300px;
        }
        
        .search-icon {
          opacity: 0.5;
        }
        
        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
        }
        
        .search-input::placeholder {
          color: var(--text-muted);
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .notification-btn {
          position: relative;
          background: transparent;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.5rem;
        }
        
        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: var(--color-error);
          color: white;
          font-size: 0.625rem;
          font-weight: 600;
          padding: 0.125rem 0.375rem;
          border-radius: 100px;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }
        
        .user-email {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      `}</style>
        </header>
    );
}

export default Header;
