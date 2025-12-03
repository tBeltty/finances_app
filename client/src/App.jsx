import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './views/Layout/Navbar';
import Login from './views/Auth/Login';
import Register from './views/Auth/Register';
import EmailVerification from './views/Auth/EmailVerification';
import ForgotPassword from './views/Auth/ForgotPassword';
import ResetPassword from './views/Auth/ResetPassword';
import Dashboard from './views/Dashboard/Dashboard';
import Onboarding from './views/Onboarding/Onboarding';

function App() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const APP_VERSION = '1.2.4';

  React.useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.version !== APP_VERSION) {
            console.log(`New version found: ${data.version}. Updating...`);
            if ('serviceWorker' in navigator) {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (const registration of registrations) {
                await registration.unregister();
              }
            }
            window.location.reload(true);
          }
        }
      } catch (err) {
        console.error('Version check failed', err);
      }
    };

    // Check immediately and every minute
    checkVersion();
    const interval = setInterval(checkVersion, 60000);
    return () => clearInterval(interval);
  }, []);

  if (authLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register onSwitchToLogin={() => navigate('/login')} />} />
        <Route path="/verify-email/:token" element={<EmailVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Show onboarding if user hasn't completed it
  if (!user.hasCompletedOnboarding) {
    return <Onboarding onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
