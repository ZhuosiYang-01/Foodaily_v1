import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { AuthProvider, useAuth } from './store/AuthContext';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import SplashScreen from './components/SplashScreen';

import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import WorkDetailPage from './pages/WorkDetailPage';
import RecordDetailPage from './pages/RecordDetailPage';
import NewRecordPage from './pages/NewRecordPage';
import EditRecordPage from './pages/EditRecordPage';
import EditWorkPage from './pages/EditWorkPage';
import CalendarPage from './pages/CalendarPage';
import DayRecordsPage from './pages/DayRecordsPage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import BatchImportPage from './pages/BatchImportPage';
import CategorySettingsPage from './pages/CategorySettingsPage';
import AboutPage from './pages/AboutPage';
import AccountPage from './pages/AccountPage';
import NotFound from './pages/NotFound';
import BottomNav from './components/BottomNav';
import UndoBar from './components/UndoBar';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

import { useApp } from './store/AppContext';

// Redirects unauthenticated users to /login
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading } = useAuth();
  if (isAuthLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Redirects authenticated users away from auth pages
function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { user, isAuthLoading } = useAuth();
  if (isAuthLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function MainContent() {
  const { isLoading } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [splashTimerFinished, setSplashTimerFinished] = useState(false);

  const handleSplashFinish = () => setSplashTimerFinished(true);

  useEffect(() => {
    if (!isLoading && splashTimerFinished) setShowSplash(false);
  }, [isLoading, splashTimerFinished]);

  const location = useLocation();
  const isBatchImport = location.pathname === '/batch-import';
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative shadow-xl overflow-hidden">
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      {!showSplash && (
        <>
          <Routes>
            <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
            <Route path="/categories" element={<RequireAuth><CategoriesPage /></RequireAuth>} />
            <Route path="/category/:id" element={<RequireAuth><CategoryDetailPage /></RequireAuth>} />
            <Route path="/work/:id" element={<RequireAuth><WorkDetailPage /></RequireAuth>} />
            <Route path="/record/:id" element={<RequireAuth><RecordDetailPage /></RequireAuth>} />
            <Route path="/new-record" element={<RequireAuth><NewRecordPage /></RequireAuth>} />
            <Route path="/edit-record/:id" element={<RequireAuth><EditRecordPage /></RequireAuth>} />
            <Route path="/edit-work/:id" element={<RequireAuth><EditWorkPage /></RequireAuth>} />
            <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
            <Route path="/day-records" element={<RequireAuth><DayRecordsPage /></RequireAuth>} />
            <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
            <Route path="/batch-import" element={<RequireAuth><BatchImportPage /></RequireAuth>} />
            <Route path="/settings/categories" element={<RequireAuth><CategorySettingsPage /></RequireAuth>} />
            <Route path="/about" element={<RequireAuth><AboutPage /></RequireAuth>} />
            <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
            <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
            <Route path="/register" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
            <Route path="/forgot-password" element={<RedirectIfAuth><ForgotPasswordPage /></RedirectIfAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {!isBatchImport && !isAuthPage && <BottomNav />}
          {!isBatchImport && !isAuthPage && <UndoBar />}
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <MainContent />
            <Toaster />
          </HashRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
