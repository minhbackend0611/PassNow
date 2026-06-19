import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
  requireCompleteProfile?: boolean;
}

export default function ProtectedRoute({ requireCompleteProfile = false }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireCompleteProfile && !user.isProfileComplete) {
    return <Navigate to="/setup-profile" replace />;
  }

  return <Outlet />;
}
