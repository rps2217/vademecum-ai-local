/**
 * Vademecum AI - Aplicación Principal
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/ui/PageLoader';
import { RouteError } from '@/ui/RouteError';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { useAppAuth } from '@/app/AppAuthProvider';
import { useDb } from '@/app/DbProvider';

// SinglePageWorkspace integra todas las herramientas en una sola página sin complicaciones.
import { SinglePageWorkspace } from '@/pages/SinglePageWorkspace';

// Páginas de autenticación → lazy-loaded
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAppAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAppAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/login" element={<AuthRoute><Suspense fallback={<PageLoader />}><LoginPage /></Suspense></AuthRoute>} />
      <Route path="/onboarding" element={<AuthRoute><Suspense fallback={<PageLoader />}><OnboardingPage /></Suspense></AuthRoute>} />
      
      {/* Protected routes - Página Única Unificada */}
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<SinglePageWorkspace />} />
        <Route path="info" element={<SinglePageWorkspace />} />
        <Route path="search" element={<SinglePageWorkspace />} />
        <Route path="knowledge" element={<SinglePageWorkspace />} />
        <Route path="products" element={<SinglePageWorkspace />} />
        <Route path="synergies" element={<SinglePageWorkspace />} />
        <Route path="analysis" element={<SinglePageWorkspace />} />
        <Route path="protocols" element={<SinglePageWorkspace />} />
        <Route path="homeopathy" element={<SinglePageWorkspace />} />
        <Route path="homeopatia" element={<SinglePageWorkspace />} />
        <Route path="admin" element={<SinglePageWorkspace />} />
        <Route path="settings" element={<SinglePageWorkspace />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<RouteError />} />
    </Routes>
  );
}

export function App() {
  const { isReady } = useDb();
  
  if (!isReady) {
    return <PageLoader message="Inicializando base de datos..." />;
  }
  
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  );
}
