import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Tableau de bord',
  '/assistants': 'Assistants IA',
  '/automations': 'Automatisations',
  '/veille': 'Veille',
  '/anonymiseur': 'Anonymiseur',
  '/history': 'Historique',
  '/settings': 'Paramètres',
};

function getPageTitle(pathname: string): string {
  // Exact match
  if (pageTitles[pathname]) {
    return pageTitles[pathname];
  }

  // Check for pattern matches
  if (pathname.startsWith('/assistants/')) {
    return 'Assistant IA';
  }
  if (pathname.startsWith('/automations/runs/')) {
    return 'Suivi d\'exécution';
  }
  if (pathname.startsWith('/automations/')) {
    return 'Automatisation';
  }

  return 'Data Ring AI Lab';
}

export function Header() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header className="flex h-14 items-center border-b border-primary/[0.04] bg-white px-6">
      <h1 className="text-base font-semibold tracking-tight text-foreground">{title}</h1>
    </header>
  );
}
