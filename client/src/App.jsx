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
import ThemeDebug from './components/ThemeDebug';
import BackupNotification from './components/BackupNotification/BackupNotification';
import Loans from './views/Loans/Loans';

import WhatsNewModal from './components/WhatsNew/WhatsNewModal';
import SettingsModal from './components/Settings/SettingsModal';
import useFinances from './hooks/useFinances';
import { useUI } from './context/UIContext';

import { useTranslation } from 'react-i18next';

import { APP_VERSION } from './config';

function App() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { settingsOpen, closeSettings } = useUI();
  const [showWhatsNew, setShowWhatsNew] = React.useState(false);
  const { t } = useTranslation();

  // Update document title based on language
  React.useEffect(() => {
    document.title = t('app.title');
  }, [t]);

  // Use finances hook at App level to provide data to SettingsModal
  const finances = useFinances();
  const {
    categories,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
    addTemplateCategories,
    household,
    updateHouseholdSettings
  } = finances;

  React.useEffect(() => {
    // Check for version update to show What's New
    const lastSeenVersion = localStorage.getItem('lastSeenVersion');

    if (user && lastSeenVersion !== APP_VERSION) {
      // Only show for major or minor updates (not patches)
      // e.g. 1.4.0 -> 1.4.1 (Hidden), 1.4.1 -> 1.5.0 (Shown)
      const [currentMajor, currentMinor] = APP_VERSION.split('.');
      const [lastMajor, lastMinor] = (lastSeenVersion || '0.0.0').split('.');

      if (currentMajor !== lastMajor || currentMinor !== lastMinor) {
        setShowWhatsNew(true);
      } else {
        // If it's just a patch update, silently update the lastSeenVersion
        localStorage.setItem('lastSeenVersion', APP_VERSION);
      }
    }
  }, [user]);

  const handleCloseWhatsNew = () => {
    setShowWhatsNew(false);
    localStorage.setItem('lastSeenVersion', APP_VERSION);
  };

  React.useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.version !== APP_VERSION) {
            // Unregister SWs to ensure fresh load
            if ('serviceWorker' in navigator) {
              const registrations = await navigator.serviceWorker.getRegistrations();
              for (const registration of registrations) {
                await registration.unregister();
              }
            }

            // Reload to fetch new version (Server headers now prevent caching loop)
            console.log('Reloading for update...');
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

  if (authLoading) return <div className="min-h-screen bg-surface flex items-center justify-center text-main">Cargando...</div>;

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
    <div className="min-h-screen bg-surface text-on-surface font-sans selection:bg-primary/30">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <BackupNotification />
      <WhatsNewModal
        isOpen={showWhatsNew}
        onClose={handleCloseWhatsNew}
        version={APP_VERSION}
      />
      {user && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={closeSettings}
          categories={categories}
          handleAddCategory={handleAddCategory}
          handleDeleteCategory={handleDeleteCategory}
          handleEditCategory={handleEditCategory}
          handleAddTemplateCategories={addTemplateCategories}
          user={user}
          refreshUser={refreshUser}
          household={household}
          updateHouseholdSettings={updateHouseholdSettings}
        />
      )}
    </div>
  );
}

export default App;
