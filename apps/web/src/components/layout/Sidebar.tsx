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
    <div className="flex h-full w-60 flex-col bg-background">
      {/* Logo - Premium minimalist */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
          <span className="text-sm font-bold text-primary-foreground">D</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold tracking-tight text-foreground">Data Ring</span>
          <span className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">Ai lab</span>
        </div>
      </div>

      {/* Navigation - Premium styling */}
      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="space-y-0.5">
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
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-primary/[0.03] hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  !isActive && 'group-hover:scale-105'
                )} strokeWidth={1.5} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="my-4 mx-3 border-t border-primary/[0.04]" />

        <NavLink
          to="/settings"
          className={cn(
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
            location.pathname === '/settings'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-primary/[0.03] hover:text-foreground'
          )}
        >
          <Settings className={cn(
            'h-4 w-4 transition-transform duration-200',
            location.pathname !== '/settings' && 'group-hover:scale-105'
          )} strokeWidth={1.5} />
          Paramètres
        </NavLink>
      </ScrollArea>

      {/* User - Refined design */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-primary/[0.02] transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/[0.06] text-xs font-semibold text-foreground">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logout()}
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground hover:bg-primary/[0.04]"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
