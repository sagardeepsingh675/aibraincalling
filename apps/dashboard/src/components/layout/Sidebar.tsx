import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/calls', label: 'Call History', icon: '📞' },
    { path: '/agents', label: 'AI Agents', icon: '🤖' },
    { path: '/agent-config', label: 'Agent Config', icon: '🎛️' },
    { path: '/outbound', label: 'Make Calls', icon: '📤' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
    const { user, signOut, callingLimits } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <span className="logo-icon">📞</span>
                <span className="logo-text">InCall AI</span>
            </div>

            {user && (
                <div className="user-info">
                    <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                    <div className="user-details">
                        <div className="user-name">{user.name}</div>
                        <div className="user-company">{user.company || 'No company'}</div>
                    </div>
                </div>
            )}

            {callingLimits && (
                <div className="usage-stats">
                    <div className="usage-item">
                        <span>Today's Calls</span>
                        <span>{callingLimits.calls_today} / {callingLimits.daily_call_limit}</span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${Math.min((callingLimits.calls_today / callingLimits.daily_call_limit) * 100, 100)}%` }}
                        ></div>
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
                    border-right: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    padding: 1.5rem;
                }

                .sidebar-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }

                .logo-icon { font-size: 1.5rem; }

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
                    border-radius: 12px;
                    margin-bottom: 1rem;
                }

                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 1.125rem;
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
                    background: rgba(99, 102, 241, 0.1);
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                }

                .usage-item {
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
                    gap: 0.5rem;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    color: var(--text-secondary);
                    text-decoration: none;
                    transition: all 150ms ease;
                }

                .nav-item:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-primary);
                }

                .nav-item.active {
                    background: rgba(99, 102, 241, 0.15);
                    color: var(--color-primary);
                }

                .nav-icon { font-size: 1.125rem; }
                .nav-label { font-size: 0.875rem; }

                .logout-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    border-radius: 10px;
                    color: #ef4444;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 150ms ease;
                }

                .logout-btn:hover {
                    background: rgba(239, 68, 68, 0.1);
                }
            `}</style>
        </aside>
    );
}
