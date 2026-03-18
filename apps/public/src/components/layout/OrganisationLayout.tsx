import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LogOut, Settings, Menu, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';

const navigation = [
  { name: 'Tableau de bord', href: '/org' },
  { name: 'Formation', href: '/org/formation' },
  { name: 'Outils', href: '/org/outils' },
  { name: 'Équipe', href: '/org/equipe' },
];

export function OrganisationLayout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();

  const organizationName = useMemo(() => {
    try {
      const onboarding = localStorage.getItem('citizen_onboarding');
      if (onboarding) {
        const data = JSON.parse(onboarding);
        return data.organizationName || null;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  return (
    <div className="min-h-[100svh] bg-white text-black font-body selection:bg-[#21B2AA] selection:text-white flex flex-col relative">

      {/* Logo stamp — fixed overlay that bleeds from header into content */}
      <NavLink
        to="/"
        className="fixed top-1 left-6 lg:left-10 z-[60] w-32 h-28 bg-white border-2 border-black flex items-center justify-center hover:bg-black group transition-colors duration-200"
        style={{ boxShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}
      >
        <img
          src="/assets/logo-dataring-black.png"
          alt="Dataring"
          className="h-16 group-hover:hidden"
        />
        <img
          src="/assets/logo-dataring.png"
          alt="Dataring"
          className="h-16 hidden group-hover:block"
        />
      </NavLink>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b-[2px] border-black bg-white">
        <div className="px-6 lg:px-10">
          <div className="flex h-14 items-center justify-between">

            {/* Spacer for logo stamp */}
            <div className="w-36 shrink-0" />

            {/* Desktop Navigation — tabs */}
            <nav className="hidden md:flex items-center gap-0 font-mono text-[10px] tracking-[0.15em] uppercase">
              {navigation.map((item) => {
                const isActive =
                  item.href === '/org'
                    ? location.pathname === '/org'
                    : location.pathname.startsWith(item.href);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`px-5 py-4 border-b-2 transition-colors duration-100 ${
                      isActive
                        ? 'border-black text-black font-medium'
                        : 'border-transparent text-black/40 hover:text-black'
                    }`}
                  >
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Organisation badge */}
              {organizationName && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white font-mono text-[9px] tracking-[0.15em] uppercase">
                  {organizationName}
                </span>
              )}

              {user?.isStaff && (
                <a
                  href={import.meta.env.VITE_APP_URL || '/app'}
                  className="hidden sm:block text-black/30 hover:text-black transition-colors duration-100"
                  title="Espace staff"
                >
                  <Settings size={16} strokeWidth={1.5} />
                </a>
              )}

              {/* User initial */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-7 h-7 bg-black text-white flex items-center justify-center text-[10px] font-bold uppercase">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <span className="font-mono text-[10px] tracking-[0.1em] text-black/40 uppercase">
                  {user?.firstName}
                </span>
              </div>

              <button
                onClick={() => logout()}
                className="hidden sm:block text-black/30 hover:text-black transition-colors duration-100"
                aria-label="Se déconnecter"
              >
                <LogOut size={16} strokeWidth={1.5} />
              </button>

              {/* Mobile menu */}
              <button
                className="md:hidden text-black/50 hover:text-black transition-colors duration-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-black bg-white">
            <nav className="px-6 py-4 space-y-0">
              {organizationName && (
                <div className="py-3 border-b border-black/10">
                  <span className="font-mono text-[9px] tracking-[0.15em] text-black/30 uppercase block mb-1">Organisation</span>
                  <span className="font-mono text-[11px] tracking-[0.1em] text-black uppercase">{organizationName}</span>
                </div>
              )}
              {navigation.map((item) => {
                const isActive =
                  item.href === '/org'
                    ? location.pathname === '/org'
                    : location.pathname.startsWith(item.href);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-3 font-mono text-[11px] tracking-[0.15em] uppercase border-b border-black/10 transition-colors duration-100 ${
                      isActive ? 'text-black font-medium' : 'text-black/40'
                    }`}
                  >
                    {item.name}
                  </NavLink>
                );
              })}
              {user?.isStaff && (
                <a
                  href={import.meta.env.VITE_APP_URL || '/app'}
                  className="block py-3 font-mono text-[11px] tracking-[0.15em] uppercase text-black/40 border-b border-black/10"
                >
                  Espace Staff
                </a>
              )}
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="block py-3 font-mono text-[11px] tracking-[0.15em] uppercase text-black/40"
              >
                Déconnexion
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main content — full width, pages control their own layout */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t-[2px] border-black bg-white mt-auto">
        <div className="px-6 lg:px-10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-mono text-[10px] tracking-[0.2em] text-black/30 uppercase">
              Dataring © {new Date().getFullYear()}
            </span>
            <div className="flex items-center gap-8 font-mono text-[10px] tracking-[0.15em] text-black/30 uppercase">
              <a href="https://www.data-ring.net" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors duration-100">
                data-ring.net
              </a>
              <a href="https://www.data-ring.net/mentions-legales" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors duration-100">
                Mentions légales
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default OrganisationLayout;
