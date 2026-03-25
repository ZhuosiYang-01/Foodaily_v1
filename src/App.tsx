import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
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
import NotFound from './pages/NotFound';
import BottomNav from './components/BottomNav';
import UndoBar from './components/UndoBar';

import { useApp } from './store/AppContext';

function MainContent() {
  const { isLoading } = useApp();
  const [showSplash, setShowSplash] = useState(true);
  const [splashTimerFinished, setSplashTimerFinished] = useState(false);

  // Keep splash screen visible until both its own timer and data loading are finished
  const handleSplashFinish = () => {
    setSplashTimerFinished(true);
  };

  // If both are finished, hide splash
  useEffect(() => {
    if (!isLoading && splashTimerFinished) {
      setShowSplash(false);
    }
  }, [isLoading, splashTimerFinished]);

  const location = useLocation();
  const isBatchImport = location.pathname === '/batch-import';

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative shadow-xl overflow-hidden">
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      
      {!showSplash && (
        <>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:id" element={<CategoryDetailPage />} />
            <Route path="/work/:id" element={<WorkDetailPage />} />
            <Route path="/record/:id" element={<RecordDetailPage />} />
            <Route path="/new-record" element={<NewRecordPage />} />
            <Route path="/edit-record/:id" element={<EditRecordPage />} />
            <Route path="/edit-work/:id" element={<EditWorkPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/day-records" element={<DayRecordsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/batch-import" element={<BatchImportPage />} />
            <Route path="/settings/categories" element={<CategorySettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {!isBatchImport && <BottomNav />}
          {!isBatchImport && <UndoBar />}
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <TooltipProvider>
        <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <MainContent />
          <Toaster />
        </HashRouter>
      </TooltipProvider>
    </AppProvider>
  );
}

export default App;
