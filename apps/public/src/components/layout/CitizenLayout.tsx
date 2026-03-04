import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Shield,
  Users,
  Menu,
  X,
  LogOut,
  User,
  Sun,
  Moon,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

interface NavItem {
  name: string;
  href: string;
  icon: typeof GraduationCap;
}

const navigation: NavItem[] = [
  {
    name: 'School',
    href: '/school',
    icon: GraduationCap,
  },
  {
    name: 'Outils',
    href: '/outils',
    icon: Shield,
  },
  {
    name: 'Actions',
    href: '/actions',
    icon: Users,
  },
];

export function CitizenLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="min-h-[100svh] bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex flex-col relative overflow-hidden">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-4 group cursor-pointer">
              <div className="w-2.5 h-2.5 rounded-full bg-foreground/90 group-hover:bg-primary transition-colors duration-700"></div>
              <span className="font-medium tracking-[0.3em] text-[10px] sm:text-[11px] uppercase text-foreground/80 group-hover:text-foreground transition-colors duration-700">
                Data Ring
              </span>
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'px-5 py-2.5 rounded-full text-[10px] font-medium tracking-[0.15em] uppercase transition-all duration-500 flex items-center gap-2.5 border',
                      isActive
                        ? 'bg-muted text-foreground border-border'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted border-transparent'
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" strokeWidth={2} />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground transition-colors p-2"
                aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              <div className="hidden sm:flex items-center gap-3 text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground">
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                  <User className="h-3 w-3" />
                </div>
                <span>{user?.firstName}</span>
              </div>

              <button
                onClick={() => logout()}
                className="text-muted-foreground hover:text-primary transition-colors hidden sm:block p-2"
                aria-label="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>

              {/* Mobile menu button */}
              <button
                className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 absolute w-full pb-6">
            <nav className="px-6 py-6 flex flex-col gap-4">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-4 px-5 py-4 rounded-2xl transition-colors tracking-[0.15em] text-xs uppercase font-medium border',
                      isActive
                        ? 'bg-muted text-foreground border-border'
                        : 'text-muted-foreground hover:bg-muted border-transparent'
                    )}
                  >
                    <item.icon className="h-4 w-4 text-primary" />
                    {item.name}
                  </NavLink>
                );
              })}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-4 px-5 py-4 text-xs font-medium uppercase tracking-[0.15em] text-red-400 hover:bg-red-400/10 rounded-2xl transition-colors mt-4 border border-transparent"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 w-full mx-auto max-w-6xl px-6 lg:px-8 py-10 lg:py-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background mt-auto relative z-10 w-full pb-safe">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 py-8 md:py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
            <div className="flex items-center gap-4 text-[10px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
              <span className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-50"></span>
                Intérêt Général
              </span>
            </div>

            <div className="flex items-center gap-8 text-[9px] sm:text-[10px] font-medium tracking-[0.15em] text-muted-foreground uppercase">
              <a
                href="https://www.data-ring.net"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                data-ring.net
              </a>
              <a
                href="https://www.data-ring.net/mentions-legales"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CitizenLayout;
