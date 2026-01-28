import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
    const { user, signIn, loading } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await signIn(email, password);
            navigate('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        }

        setIsSubmitting(false);
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <span className="login-logo">📞</span>
                    <h1>InCall AI</h1>
                    <p>User Dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="login-footer">
                    Need access? Contact your administrator.
                </p>
            </div>

            <style>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, var(--bg-main), #1a1a3a);
                }

                .login-card {
                    background: var(--bg-card);
                    border-radius: 24px;
                    padding: 3rem;
                    width: 100%;
                    max-width: 400px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .login-logo {
                    font-size: 3rem;
                    display: block;
                    margin-bottom: 1rem;
                }

                .login-header h1 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .login-header p {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                }

                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .error-message {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    font-size: 0.875rem;
                }

                .login-btn {
                    width: 100%;
                    margin-top: 1rem;
                    padding: 1rem;
                }

                .login-footer {
                    text-align: center;
                    margin-top: 1.5rem;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
}
