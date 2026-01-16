import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { Layout } from '@/components/layout/Layout';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { TooltipProvider } from '@/components/ui/tooltip';

// Public pages
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/Login';
import { CitizenLogin } from '@/pages/CitizenLogin';
import { CitizenRegister } from '@/pages/CitizenRegister';

// Citizen pages (protected for citizens)
import { School } from '@/pages/citizen/School';
import { SchoolJuniors } from '@/pages/citizen/SchoolJuniors';
import { SchoolAdults } from '@/pages/citizen/SchoolAdults';
import { SchoolSeniors } from '@/pages/citizen/SchoolSeniors';
import { ModuleViewer } from '@/pages/citizen/ModuleViewer';
import { CitizenTools } from '@/pages/citizen/CitizenTools';
import { GDPRGenerator } from '@/pages/citizen/GDPRGenerator';
import { CGUAnalyzer } from '@/pages/citizen/CGUAnalyzer';
import { DataBreachAlerts } from '@/pages/citizen/DataBreachAlerts';
import { CollectiveActions } from '@/pages/citizen/CollectiveActions';

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Route protégée pour le staff Data Ring uniquement
function StaffRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const { organization, isLoading: orgLoading, fetchOrganization } = useOrganizationStore();

  useEffect(() => {
    if (isAuthenticated && !organization) {
      fetchOrganization();
    }
  }, [isAuthenticated, organization, fetchOrganization]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-landing-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Vérifier que l'utilisateur est staff
  const isStaff = user?.isStaff ?? false;
  if (!isStaff) {
    // Utilisateur connecté mais pas staff -> rediriger vers l'espace citoyen
    return <Navigate to="/school" replace />;
  }

  // Attendre le chargement de l'organisation si besoin
  if (orgLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-landing-accent"></div>
      </div>
    );
  }

  return <>{children}</>;
}

// Route de login (redirige si déjà connecté)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-landing-accent"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Staff va au dashboard, non-staff va à l'espace citoyen
    const isStaff = user?.isStaff ?? false;
    return <Navigate to={isStaff ? "/" : "/school"} replace />;
  }

  return <>{children}</>;
}

// Route de login citoyen (redirige si déjà connecté)
function CitizenAuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#57C5B6]"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Staff va au dashboard, non-staff va à l'espace citoyen
    const isStaff = user?.isStaff ?? false;
    return <Navigate to={isStaff ? "/" : "/school"} replace />;
  }

  return <>{children}</>;
}

// Route protégée pour les citoyens (non-staff connectés)
function CitizenRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#57C5B6]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/citizen/login" replace />;
  }

  // Si l'utilisateur est staff, le rediriger vers le dashboard
  const isStaff = user?.isStaff ?? false;
  if (isStaff) {
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
      {/* ===== PUBLIC ROUTES ===== */}

      {/* Landing page */}
      <Route path="/welcome" element={<Landing />} />

      {/* Login Staff */}
      <Route
        path="/login"
        element={
          <AuthRoute>
            <Login />
          </AuthRoute>
        }
      />

      {/* ===== CITIZEN AUTH ROUTES ===== */}
      <Route
        path="/citizen/login"
        element={
          <CitizenAuthRoute>
            <CitizenLogin />
          </CitizenAuthRoute>
        }
      />
      <Route
        path="/citizen/register"
        element={
          <CitizenAuthRoute>
            <CitizenRegister />
          </CitizenAuthRoute>
        }
      />

      {/* ===== CITIZEN ROUTES (PROTECTED) ===== */}
      <Route
        element={
          <CitizenRoute>
            <CitizenLayout />
          </CitizenRoute>
        }
      >
        {/* School / Academy */}
        <Route path="/school" element={<School />} />
        <Route path="/school/juniors" element={<SchoolJuniors />} />
        <Route path="/school/adultes" element={<SchoolAdults />} />
        <Route path="/school/seniors" element={<SchoolSeniors />} />
        <Route path="/school/:audience/module/:moduleId" element={<ModuleViewer />} />

        {/* Citizen Tools */}
        <Route path="/outils" element={<CitizenTools />} />
        <Route path="/outils/gdpr" element={<GDPRGenerator />} />
        <Route path="/outils/cgu" element={<CGUAnalyzer />} />
        <Route path="/outils/alertes" element={<DataBreachAlerts />} />

        {/* Collective Actions */}
        <Route path="/actions" element={<CollectiveActions />} />
      </Route>

      {/* ===== STAFF ROUTES (PROTECTED) ===== */}
      <Route
        element={
          <StaffRoute>
            <Layout />
          </StaffRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
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
        <Route path="/admin/permissions" element={<AdminPermissions />} />

        {/* Admin CMS Routes */}
        <Route path="/admin/courses" element={<CourseManager />} />
        <Route path="/admin/courses/new" element={<CourseEditor />} />
        <Route path="/admin/courses/:id" element={<CourseEditor />} />
        <Route path="/admin/campaigns" element={<CampaignManager />} />
        <Route path="/admin/templates" element={<TemplateManager />} />
      </Route>

      {/* ===== FALLBACK ===== */}
      {/* Redirect unknown routes to welcome page */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
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
