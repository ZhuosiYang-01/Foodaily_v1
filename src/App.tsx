import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';

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
import CategorySettingsPage from './pages/CategorySettingsPage';
import AboutPage from './pages/AboutPage';
import NotFound from './pages/NotFound';
import BottomNav from './components/BottomNav';

function App() {
  return (
    <AppProvider>
      <TooltipProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative shadow-xl">
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
              <Route path="/settings/categories" element={<CategorySettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  );
}

export default App;
