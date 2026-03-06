import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { Layout } from '@/components/layout/Layout';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Auth pages
import { Login } from '@/pages/Login';

// Staff pages (protected)
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

// Admin CMS pages (staff only)
import { CourseManager } from '@/pages/admin/CourseManager';
import { CourseEditor } from '@/pages/admin/CourseEditor';
import { CampaignManager } from '@/pages/admin/CampaignManager';
import { TemplateManager } from '@/pages/admin/TemplateManager';
import { Chat } from '@/pages/Chat';
import { Supervision } from '@/pages/admin/Supervision';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Route protégée pour le staff
function StaffRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { organization, isLoading: orgLoading, fetchOrganization } = useOrganizationStore();

  useEffect(() => {
    if (isAuthenticated && !organization) {
      fetchOrganization();
    }
  }, [isAuthenticated, organization, fetchOrganization]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-turquoise"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (orgLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-turquoise"></div>
      </div>
    );
  }

  return <>{children}</>;
}

// Route protégée pour les admins uniquement
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Route de login (redirige si déjà connecté)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-turquoise"></div>
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
      {/* Login */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />

      {/* Staff Routes (protected) */}
      <Route
        element={
          <StaffRoute>
            <Layout />
          </StaffRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:conversationId" element={<Chat />} />
        <Route path="/assistants" element={<Assistants />} />
        <Route path="/assistants/:id" element={<AssistantDetail />} />
        <Route path="/assistants/:id/chat/:conversationId" element={<AssistantDetail />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/automations/:id" element={<AutomationDetail />} />
        <Route path="/automations/runs/:id" element={<AutomationRun />} />
        <Route path="/veille" element={<Veille />} />
        <Route path="/anonymiseur" element={<Anonymiseur />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        {/* Admin Routes (protected by role) */}
        <Route path="/admin/permissions" element={<AdminRoute><AdminPermissions /></AdminRoute>} />
        <Route path="/admin/courses" element={<AdminRoute><CourseManager /></AdminRoute>} />
        <Route path="/admin/courses/new" element={<AdminRoute><CourseEditor /></AdminRoute>} />
        <Route path="/admin/courses/:id" element={<AdminRoute><CourseEditor /></AdminRoute>} />
        <Route path="/admin/campaigns" element={<AdminRoute><CampaignManager /></AdminRoute>} />
        <Route path="/admin/templates" element={<AdminRoute><TemplateManager /></AdminRoute>} />
        <Route path="/admin/supervision" element={<AdminRoute><Supervision /></AdminRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
