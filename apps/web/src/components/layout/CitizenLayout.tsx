import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Shield,
  Users,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <NavLink to="/welcome" className="flex items-center gap-3">
              <img
                src="/assets/logo-dataring-black.png"
                alt="Data Ring"
                className="h-8 w-auto"
                onError={(e) => {
                  // Fallback si le logo noir n'existe pas
                  e.currentTarget.src = '/assets/logo-dataring.png';
                }}
              />
            </NavLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[#57C5B6] text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    )}
                  >
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.firstName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-gray-600"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-[#57C5B6] text-white'
                        : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 mt-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo-dataring-black.png"
                alt="Data Ring"
                className="h-5 w-auto opacity-50"
                onError={(e) => {
                  e.currentTarget.src = '/assets/logo-dataring.png';
                }}
              />
              <p className="text-sm text-gray-400">
                Association d'intérêt général
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a
                href="https://www.data-ring.net"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-600 transition-colors"
              >
                data-ring.net
              </a>
              <a
                href="https://www.data-ring.net/mentions-legales"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-600 transition-colors"
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
