import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import SetupProfilePage from './features/auth/pages/SetupProfilePage';
import VerifyEmailPage from './features/auth/pages/VerifyEmailPage';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import HomePage from './features/feed/pages/HomePage';
import ListingDetailPage from './features/listings/pages/ListingDetailPage';
import CreateListingPage from './features/listings/pages/CreateListingPage';
import ProfilePage from './features/profile/pages/ProfilePage';

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
        
        {/* Must be logged in, but might not be verified or profiled */}
        <Route element={<ProtectedRoute requireCompleteProfile={false} requireEmailVerification={false} />}>
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        <Route element={<ProtectedRoute requireCompleteProfile={false} requireEmailVerification={true} />}>
          <Route path="/setup-profile" element={<SetupProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute requireCompleteProfile={true} requireEmailVerification={true} />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<HomePage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/list" element={<CreateListingPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Future routes: /profile, /chats */}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
