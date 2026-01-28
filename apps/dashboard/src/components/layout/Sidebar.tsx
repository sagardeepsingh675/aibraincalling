import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/calls', label: 'Call History', icon: '📞' },
    { path: '/agent-config', label: 'AI Agent', icon: '🤖' },
    { path: '/outbound', label: 'Make Calls', icon: '📤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
    const { user, signOut, callingLimits } = useAuth();

    const dailyPercent = callingLimits
        ? Math.min((callingLimits.calls_today / callingLimits.daily_call_limit) * 100, 100)
        : 0;

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <span className="logo-icon">📞</span>
                <span className="logo-text">InCall AI</span>
            </div>

            {user && (
                <div className="user-info">
                    <div className="user-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                    <div className="user-details">
                        <div className="user-name">{user.name || 'User'}</div>
                        <div className="user-company">{user.company || ''}</div>
                    </div>
                </div>
            )}

            {callingLimits && (
                <div className="usage-stats">
                    <div className="usage-header">
                        <span>Today's Calls</span>
                        <span>{callingLimits.calls_today} / {callingLimits.daily_call_limit}</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${dailyPercent}%` }}></div>
                    </div>
                </div>
            )}

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        end={item.path === '/'}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <button className="logout-btn" onClick={signOut}>
                <span>🚪</span>
                <span>Logout</span>
            </button>

            <style>{`
                .sidebar {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: var(--sidebar-width);
                    height: 100vh;
                    background: var(--bg-sidebar);
                    backdrop-filter: blur(20px);
                    border-right: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem;
                    z-index: 40;
                }

                .sidebar-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 2rem;
                }

                .logo-icon { 
                    font-size: 1.5rem; 
                }

                .logo-text {
                    font-size: 1.25rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: var(--radius-md);
                    margin-bottom: 1rem;
                }

                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: var(--radius-sm);
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 1rem;
                }

                .user-name {
                    font-weight: 600;
                    font-size: 0.875rem;
                }

                .user-company {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .usage-stats {
                    padding: 1rem;
                    background: var(--color-primary-light);
                    border-radius: var(--radius-md);
                    margin-bottom: 1.5rem;
                }

                .usage-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    margin-bottom: 0.5rem;
                    color: var(--text-secondary);
                }

                .sidebar-nav {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.375rem;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    border-radius: var(--radius-sm);
                    color: var(--text-secondary);
                    text-decoration: none;
                    transition: all 0.15s ease;
                }

                .nav-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-primary);
                }

                .nav-item.active {
                    background: var(--color-primary-light);
                    color: var(--color-primary);
                }

                .nav-icon { 
                    font-size: 1.125rem; 
                }
                
                .nav-label { 
                    font-size: 0.875rem;
                    font-weight: 500;
                }

                .logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    border: 1px solid var(--color-error-light);
                    border-radius: var(--radius-sm);
                    color: var(--color-error);
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.15s ease;
                }

                .logout-btn:hover {
                    background: var(--color-error-light);
                }

                @media (max-width: 768px) {
                    .sidebar {
                        display: none;
                    }
                }
            `}</style>
        </aside>
    );
}
