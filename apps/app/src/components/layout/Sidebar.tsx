import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  MessageCircle,
  Zap,
  History,
  Rss,
  Shield,
  Settings,
  LogOut,
  Briefcase,
  GraduationCap,
  Megaphone,
  FileText,
  ExternalLink,
  BarChart3,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useThemeStore } from '@/stores/themeStore';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  workOnly?: boolean;
  familyOnly?: boolean;
  comingSoon?: boolean;
}

const allNavigation: NavItem[] = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Chat', href: '/chat', icon: MessageCircle },
  { name: 'Assistants', href: '/assistants', icon: Bot },
  { name: 'Automatisations', href: '/automations', icon: Zap, workOnly: true },
  { name: 'Veille', href: '/veille', icon: Rss, workOnly: true },
  { name: 'Anonymiseur', href: '/anonymiseur', icon: Shield, workOnly: true, comingSoon: true },
  { name: 'Historique', href: '/history', icon: History },
];

const adminNavigation: NavItem[] = [
  { name: 'Cours', href: '/admin/courses', icon: GraduationCap },
  { name: 'Campagnes', href: '/admin/campaigns', icon: Megaphone },
  { name: 'Templates', href: '/admin/templates', icon: FileText },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { organization } = useOrganizationStore();
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();

  const isFamily = organization?.type === 'family';
  const isLegacyMode = !organization;

  const navigation = allNavigation.filter((item) => {
    if (isLegacyMode) return true;
    if (item.workOnly && isFamily) return false;
    if (item.familyOnly && !isFamily) return false;
    return true;
  });

  const navItemClass = (isActive: boolean) =>
    cn(
      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-100',
      isActive
        ? 'bg-sidebar-border/60 text-sidebar-foreground dark:bg-sidebar-border'
        : 'text-sidebar-muted hover:bg-sidebar-border/40 hover:text-sidebar-foreground'
    );

  const themeOptions = [
    { value: 'light' as const, icon: Sun },
    { value: 'dark' as const, icon: Moon },
    { value: 'system' as const, icon: Monitor },
  ];

  return (
    <div className="flex h-full w-[240px] flex-col bg-sidebar">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <NavLink to="/" className="flex justify-center">
          <img
            src={`${import.meta.env.BASE_URL}assets/logo-dataring-icon.png`}
            alt="Data Ring"
            className="h-10 w-auto dark:invert"
          />
        </NavLink>
      </div>

      {/* Organization badge */}
      {organization && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 dark:bg-muted/30">
            <Briefcase className="h-4 w-4 text-sidebar-muted shrink-0" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="text-[11px] text-sidebar-muted uppercase tracking-wider font-medium">
                {isFamily ? 'Family' : 'Workspace'}
              </p>
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {organization.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-0.5">
          {navigation.map((item) => {
            const isActive =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href);

            if (item.comingSoon) {
              return (
                <span key={item.name} className={cn(navItemClass(false), 'opacity-40 cursor-not-allowed pointer-events-none')}>
                  <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                  {item.name}
                  <span className="ml-auto text-[9px] font-medium tracking-wider uppercase text-muted-foreground">Soon</span>
                </span>
              );
            }

            return (
              <NavLink key={item.name} to={item.href} className={navItemClass(isActive)} aria-current={isActive ? 'page' : undefined}>
                <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Admin CMS Section */}
        {user?.role === 'admin' && (
          <>
            <div className="my-4 mx-2 border-t border-sidebar-border" />
            <p className="px-3 py-1.5 text-[11px] font-semibold text-sidebar-muted/60 uppercase tracking-wider">
              Espace Citoyen
            </p>
            <nav className="space-y-0.5 mt-1">
              {adminNavigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <NavLink key={item.name} to={item.href} className={navItemClass(isActive)} aria-current={isActive ? 'page' : undefined}>
                    <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </>
        )}

        <div className="my-4 mx-2 border-t border-sidebar-border" />

        <nav className="space-y-0.5">
          <NavLink to="/settings" className={navItemClass(location.pathname === '/settings')}>
            <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            Paramètres
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink to="/admin/supervision" className={navItemClass(location.pathname === '/admin/supervision')}>
              <BarChart3 className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
              Supervision
            </NavLink>
          )}

          <a
            href={import.meta.env.VITE_PUBLIC_URL || '/'}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-muted hover:bg-sidebar-border/40 hover:text-sidebar-foreground transition-colors duration-100"
          >
            <ExternalLink className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
            Site public
          </a>
        </nav>
      </ScrollArea>

      {/* Bottom bar — user + theme toggle */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-2.5">
        {/* Theme toggle */}
        <div className="flex items-center justify-center gap-0.5 rounded-lg bg-sidebar-border/40 dark:bg-sidebar-border/60 p-0.5 mx-1">
          {themeOptions.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                'flex-1 flex items-center justify-center rounded-md py-1 transition-all duration-100',
                theme === value
                  ? 'bg-card text-sidebar-foreground shadow-premium-sm dark:bg-muted'
                  : 'text-sidebar-muted hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          ))}
        </div>

        {/* User */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-sidebar-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-sidebar-muted truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-muted hover:bg-sidebar-border/60 hover:text-sidebar-foreground transition-colors shrink-0"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
