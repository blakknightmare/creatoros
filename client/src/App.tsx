import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Direct imports — smaller pages kept eager for instant navigation
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import BrandProfile from './pages/BrandProfile';
import ProjectDetail from './pages/ProjectDetail';
import Onboarding from './pages/Onboarding';
import Pricing from './pages/Pricing';
import Landing from './Landing';

// Lazy-loaded pages — larger bundles (>15KB) loaded on demand
const Batch = lazy(() => import('./pages/Batch'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Generate = lazy(() => import('./pages/Generate'));

/** Minimal spinner shown while a lazy page chunk loads. */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        <span className="text-sm text-slate-400">Loading...</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireBrandProfile>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/brand-profile"
            element={
              <ProtectedRoute requireBrandProfile>
                <BrandProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/generate"
            element={
              <ProtectedRoute requireBrandProfile>
                <Suspense fallback={<PageLoader />}>
                  <Generate />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute requireBrandProfile>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/batch"
            element={
              <ProtectedRoute requireBrandProfile>
                <Suspense fallback={<PageLoader />}>
                  <Batch />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute requireBrandProfile>
                <Suspense fallback={<PageLoader />}>
                  <Calendar />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute requireBrandProfile>
                <Suspense fallback={<PageLoader />}>
                  <Analytics />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}
