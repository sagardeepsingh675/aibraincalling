import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Calls from './pages/Calls';
import Agents from './pages/Agents';
import AgentConfig from './pages/AgentConfig';
import Outbound from './pages/Outbound';
import Settings from './pages/Settings';
import Login from './pages/Login';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

function AppLayout() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/calls" element={<Calls />} />
                    <Route path="/agents" element={<Agents />} />
                    <Route path="/agent-config" element={<AgentConfig />} />
                    <Route path="/outbound" element={<Outbound />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                    path="/*"
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </AuthProvider>
    );
}

export default App;
