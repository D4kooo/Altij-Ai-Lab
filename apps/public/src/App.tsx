import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { CitizenLayout } from '@/components/layout/CitizenLayout';
import { OrganisationLayout } from '@/components/layout/OrganisationLayout';

// Public pages
import { Landing } from '@/pages/Landing';
import { CitizenLogin } from '@/pages/CitizenLogin';
import { CitizenRegister } from '@/pages/CitizenRegister';

// Citizen pages (protected)
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

// Organisation pages (protected)
import { OrgDashboard } from '@/pages/organisation/OrgDashboard';
import { OrgFormation } from '@/pages/organisation/OrgFormation';
import { OrgTools } from '@/pages/organisation/OrgTools';
import { OrgEquipe } from '@/pages/organisation/OrgEquipe';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Route de login citoyen (redirige si déjà connecté)
function CitizenAuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#57C5B6]"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    const accountType = user?.accountType || 'particulier';
    return <Navigate to={accountType === 'organisation' ? '/org' : '/school'} replace />;
  }

  return <>{children}</>;
}

// Route protégée pour les citoyens
function CitizenRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

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

  const accountType = user?.accountType || 'particulier';
  const isOrgRoute = location.pathname.startsWith('/org');
  const isParticulierRoute = !isOrgRoute;

  // Redirect organisation users away from particulier routes
  if (accountType === 'organisation' && isParticulierRoute) {
    return <Navigate to="/org" replace />;
  }

  // Redirect particulier users away from org routes
  if (accountType === 'particulier' && isOrgRoute) {
    return <Navigate to="/school" replace />;
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
      {/* Landing page */}
      <Route path="/" element={<Landing />} />

      {/* Citizen Auth */}
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

      {/* Citizen Routes (protected) */}
      <Route
        element={
          <CitizenRoute>
            <CitizenLayout />
          </CitizenRoute>
        }
      >
        <Route path="/school" element={<School />} />
        <Route path="/school/juniors" element={<SchoolJuniors />} />
        <Route path="/school/adultes" element={<SchoolAdults />} />
        <Route path="/school/seniors" element={<SchoolSeniors />} />
        <Route path="/school/:audience/module/:moduleId" element={<ModuleViewer />} />

        <Route path="/outils" element={<CitizenTools />}>
          <Route path="gdpr" element={<GDPRGenerator />} />
          <Route path="cgu" element={<CGUAnalyzer />} />
          <Route path="alertes" element={<DataBreachAlerts />} />
        </Route>

        <Route path="/actions" element={<CollectiveActions />} />
      </Route>

      {/* Organisation Routes (protected) */}
      <Route
        element={
          <CitizenRoute>
            <OrganisationLayout />
          </CitizenRoute>
        }
      >
        <Route path="/org" element={<OrgDashboard />} />
        <Route path="/org/formation" element={<OrgFormation />} />
        <Route path="/org/formation/:courseId" element={<OrgFormation />} />
        <Route path="/org/formation/:courseId/module/:moduleId" element={<ModuleViewer />} />
        <Route path="/org/outils" element={<OrgTools />}>
          <Route path="gdpr" element={<GDPRGenerator />} />
          <Route path="cgu" element={<CGUAnalyzer />} />
          <Route path="alertes" element={<DataBreachAlerts />} />
        </Route>
        <Route path="/org/equipe" element={<OrgEquipe />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
