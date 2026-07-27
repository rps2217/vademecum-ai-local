import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RouteError } from '@/components/feedback/RouteError';
import { PageLoader } from '@/components/feedback/PageLoader';

const SearchPage = lazy(() => import('@/pages/SearchPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const SynergiesPage = lazy(() => import('@/pages/SynergiesPage'));
const ProtocolsPage = lazy(() => import('@/pages/ProtocolsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));

const wrap = (el: React.ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

export const router = createBrowserRouter([
  { path: '/login', element: wrap(<LoginPage />) },
  { path: '/onboarding', element: wrap(<OnboardingPage />) },
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: wrap(<SearchPage />) },
      { path: 'products', element: wrap(<ProductsPage />) },
      { path: 'products/:sku', element: wrap(<ProductDetailPage />) },
      { path: 'synergies', element: wrap(<SynergiesPage />) },
      { path: 'protocols', element: wrap(<ProtocolsPage />) },
      { path: 'admin/*', element: wrap(<AdminPage />) },
      { path: 'settings/*', element: wrap(<SettingsPage />) },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
