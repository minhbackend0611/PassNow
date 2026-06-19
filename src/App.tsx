import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import SetupProfilePage from './features/auth/pages/SetupProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import HomePage from './features/feed/pages/HomePage';
import ListingDetailPage from './features/listings/pages/ListingDetailPage';

function App() {
  const { initializeAuthListener, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, [initializeAuthListener]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface">Loading PassNow...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route element={<ProtectedRoute requireCompleteProfile={false} />}>
          <Route path="/setup-profile" element={<SetupProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute requireCompleteProfile={true} />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<HomePage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            {/* Future routes: /profile, /list, /chats */}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
