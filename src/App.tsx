/**
 * Vademecum AI - Aplicación Principal
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageLoader } from '@/ui/PageLoader';
import { RouteError } from '@/ui/RouteError';
import { ErrorBoundary } from '@/ui/ErrorBoundary';
import { useE2EE } from '@/app/E2EEAuthProvider';
import { useDb } from '@/app/DbProvider';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { SearchPage } from '@/pages/SearchPage';
import { KnowledgePage } from '@/pages/KnowledgePage';
import { SynergiesPage } from '@/pages/SynergiesPage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { AdminPage } from '@/pages/AdminPage';
import { SettingsPage } from '@/pages/SettingsPage';

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
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/onboarding" element={<AuthRoute><OnboardingPage /></AuthRoute>} />
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index element={<SearchPage />} />
        <Route path="search" element={<Navigate to="/" replace />} />
        <Route path="knowledge" element={<KnowledgePage />} />
        <Route path="synergies" element={<SynergiesPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="admin" element={<AdminPage />} />
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
