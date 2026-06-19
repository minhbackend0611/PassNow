import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import SetupProfilePage from './features/auth/pages/SetupProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

// Placeholder Home component
const Home = () => {
  const { user } = useAuthStore();
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to PassNow</h1>
      <p>Hello, {user?.displayName || user?.email}!</p>
      <button 
        onClick={() => import('./lib/firebase').then(m => m.auth.signOut())}
        className="mt-4 px-4 py-2 bg-error text-on-error rounded-md"
      >
        Sign Out
      </button>
    </div>
  );
};

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
          <Route path="/" element={<Home />} />
          {/* Add more protected routes here */}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
