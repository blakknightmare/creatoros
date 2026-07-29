import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireBrandProfile?: boolean;
}

export default function ProtectedRoute({ children, requireBrandProfile }: ProtectedRouteProps) {
  const { user, loading, hasBrandProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireBrandProfile && !hasBrandProfile) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
