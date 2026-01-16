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
  Heart,
  Briefcase,
  GraduationCap,
  Megaphone,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  workOnly?: boolean;
  familyOnly?: boolean;
}

const allNavigation: NavItem[] = [
  { name: 'Tableau de bord', href: '/', icon: LayoutDashboard },
  { name: 'Assistants', href: '/assistants', icon: Bot },
  { name: 'Automatisations', href: '/automations', icon: Zap, workOnly: true },
  { name: 'Veille', href: '/veille', icon: Rss, workOnly: true },
  { name: 'Anonymiseur', href: '/anonymiseur', icon: Shield, workOnly: true },
  { name: 'Historique', href: '/history', icon: History },
];

// Admin CMS navigation (staff only)
const adminNavigation: NavItem[] = [
  { name: 'Cours', href: '/admin/courses', icon: GraduationCap },
  { name: 'Campagnes', href: '/admin/campaigns', icon: Megaphone },
  { name: 'Templates', href: '/admin/templates', icon: FileText },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { organization } = useOrganizationStore();
  const location = useLocation();

  const isFamily = organization?.type === 'family';
  const isLegacyMode = !organization; // Pas d'organisation = mode legacy (tout afficher)
  const accentColor = isFamily ? 'bg-emerald-500' : 'bg-primary';

  // Filtrer la navigation selon le type d'organisation
  // En mode legacy (pas d'organisation), on affiche tout
  const navigation = allNavigation.filter((item) => {
    if (isLegacyMode) return true; // Mode legacy: tout afficher
    if (item.workOnly && isFamily) return false;
    if (item.familyOnly && !isFamily) return false;
    return true;
  });

  return (
    <div className="flex h-full w-60 flex-col bg-slate-900">
      {/* Logo & Organization */}
      <div className="py-6 px-4">
        <NavLink to="/welcome" className="flex items-center justify-center mb-4 hover:opacity-80 transition-opacity">
          <img
            src="/assets/logo-dataring.png"
            alt="Data Ring"
            className="h-12 w-auto"
          />
        </NavLink>

        {/* Organization badge */}
        {organization && (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg',
              isFamily ? 'bg-emerald-500/10' : 'bg-primary/10'
            )}
          >
            {isFamily ? (
              <Heart className="h-4 w-4 text-emerald-400" />
            ) : (
              <Briefcase className="h-4 w-4 text-primary" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400">
                {isFamily ? 'Family' : 'Work'}
              </p>
              <p className="text-sm font-medium text-white truncate">
                {organization.name}
              </p>
            </div>
          </div>
        )}
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
                    ? cn(accentColor, 'text-white')
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Admin CMS Section */}
        <div className="my-4 mx-3 border-t border-slate-700" />
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Espace Citoyen
        </p>
        <nav className="space-y-1">
          {adminNavigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-emerald-600 text-white'
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
              ? cn(accentColor, 'text-white')
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          )}
        >
          <Settings className="h-4 w-4" strokeWidth={1.5} />
          Paramètres
        </NavLink>

        {/* Site public links */}
        <div className="my-4 mx-3 border-t border-slate-700" />
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Site public
        </p>
        <NavLink
          to="/welcome"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
          Landing page
        </NavLink>
        <NavLink
          to="/school"
          className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
        >
          <GraduationCap className="h-4 w-4" strokeWidth={1.5} />
          Espace Citoyen
        </NavLink>
      </ScrollArea>

      {/* User - Dark theme */}
      <div className="p-3 border-t border-slate-700">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-800 transition-colors">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white',
              accentColor
            )}
          >
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
