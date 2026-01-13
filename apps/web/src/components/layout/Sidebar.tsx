import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Zap,
  History,
  Rss,
  Shield,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Assistants', href: '/assistants', icon: Bot },
  { name: 'Automatisations', href: '/automations', icon: Zap },
  { name: 'Veille', href: '/veille', icon: Rss },
  { name: 'Anonymiseur', href: '/anonymiseur', icon: Shield },
  { name: 'Historique', href: '/history', icon: History },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  return (
    <div className="flex h-full w-60 flex-col bg-slate-900">
      {/* Logo Data Ring */}
      <div className="flex items-center justify-center py-8 px-4">
        <img
          src="/assets/logo-dataring.png"
          alt="Data Ring"
          className="h-16 w-auto"
        />
      </div>

      {/* Navigation - Dark theme */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href);

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="my-4 mx-3 border-t border-slate-700" />

        <NavLink
          to="/settings"
          className={cn(
            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
            location.pathname === '/settings'
              ? 'bg-primary text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          )}
        >
          <Settings className="h-4 w-4" strokeWidth={1.5} />
          Paramètres
        </NavLink>
      </ScrollArea>

      {/* User - Dark theme */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-800 transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-slate-400">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            className="h-8 w-8 shrink-0 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
