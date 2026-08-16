/**
 * Vademecum AI - Aplicación Principal
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/ui/PageLoader';
import { RouteError } from '@/ui/RouteError';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { AdminGate } from '@/ui/AdminGate';
import { useE2EE } from '@/app/E2EEAuthProvider';
import { useDb } from '@/app/DbProvider';

// SearchPage es la página principal (index) → carga estática para evitar
// flash de Suspense en el primer render del mostrador.
import { SearchPage } from '@/pages/SearchPage';

// Páginas secundarias → lazy-loaded para reducir el bundle inicial.
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const KnowledgePage = lazy(() => import('@/pages/KnowledgePage').then((m) => ({ default: m.KnowledgePage })));
const ProductsPage = lazy(() => import('@/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const SynergiesPage = lazy(() => import('@/pages/SynergiesPage').then((m) => ({ default: m.SynergiesPage })));
const AnalysisPage = lazy(() => import('@/pages/AnalysisPage').then((m) => ({ default: m.AnalysisPage })));
const AdminPage = lazy(() => import('@/pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const ProtocolsPage = lazy(() => import('@/pages/ProtocolsPage').then((m) => ({ default: m.ProtocolsPage })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useE2EE();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useE2EE();

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
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<SearchPage />} />
        <Route path="search" element={<Navigate to="/" replace />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="synergies" element={<SynergiesPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="protocols" element={<ProtocolsPage />} />
        <Route path="admin" element={<AdminGate><AdminPage /></AdminGate>} />
        <Route path="settings" element={<SettingsPage />} />
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
