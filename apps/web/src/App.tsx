import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Layout } from '@/components/layout/Layout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Assistants } from '@/pages/Assistants';
import { AssistantDetail } from '@/pages/AssistantDetail';
import { Automations } from '@/pages/Automations';
import { AutomationDetail } from '@/pages/AutomationDetail';
import { AutomationRun } from '@/pages/AutomationRun';
import { History } from '@/pages/History';
import { Veille } from '@/pages/Veille';
import { Anonymiseur } from '@/pages/Anonymiseur';
import { Settings } from '@/pages/Settings';
import { AdminPermissions } from '@/pages/AdminPermissions';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/assistants" element={<Assistants />} />
        <Route path="/assistants/:id" element={<AssistantDetail />} />
        <Route path="/assistants/:id/chat/:conversationId" element={<AssistantDetail />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/automations/:id" element={<AutomationDetail />} />
        <Route path="/automations/runs/:id" element={<AutomationRun />} />
        <Route path="/history" element={<History />} />
        <Route path="/veille" element={<Veille />} />
        <Route path="/anonymiseur" element={<Anonymiseur />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin/permissions" element={<AdminPermissions />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
