import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireBrandProfile?: boolean;
}

export default function ProtectedRoute({ children, requireBrandProfile }: ProtectedRouteProps) {
  const { user, loading, hasBrandProfile, authError, retryAuth } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (authError && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-100 via-brand-50 to-white px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-4">🔌</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Connection issue
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {authError}
          </p>
          <button
            onClick={retryAuth}
            className="px-6 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
          >
            Retry connection
          </button>
        </div>
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
