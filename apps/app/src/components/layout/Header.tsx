import { useLocation } from 'react-router-dom';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';

const pageTitles: Record<string, string> = {
  '/': 'Tableau de bord',
  '/chat': 'Chat',
  '/assistants': 'Assistants IA',
  '/automations': 'Automatisations',
  '/veille': 'Veille',
  '/anonymiseur': 'Anonymiseur',
  '/history': 'Historique',
  '/settings': 'Paramètres',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  if (pathname.startsWith('/chat/')) return 'Chat';
  if (pathname.startsWith('/assistants/')) return 'Assistant IA';
  if (pathname.startsWith('/automations/runs/')) return "Suivi d'exécution";
  if (pathname.startsWith('/automations/')) return 'Automatisation';
  if (pathname.startsWith('/admin/')) return 'Administration';
  return 'Data Ring';
}

export function Header() {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const { theme, setTheme } = useThemeStore();

  const themeOptions = [
    { value: 'light' as const, icon: Sun },
    { value: 'dark' as const, icon: Moon },
    { value: 'system' as const, icon: Monitor },
  ];

  return (
    <header className="flex h-11 items-center justify-between border-b border-border px-5">
      <h1 className="text-[13px] font-medium text-foreground">{title}</h1>

      <div className="flex items-center gap-0.5 rounded-md bg-muted p-0.5">
        {themeOptions.map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex items-center justify-center rounded p-1 transition-all duration-100',
              theme === value
                ? 'bg-card text-foreground shadow-premium-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3 w-3" strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </header>
  );
}
