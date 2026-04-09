import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LogOut, Settings, Menu, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { LogoStamp } from './LogoStamp';
import { getOrganizationName } from '@/lib/onboarding';

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

  const organizationName = useMemo(() => getOrganizationName(), []);

  return (
    <div className="min-h-[100svh] bg-white text-black font-body selection:bg-brand-turquoise selection:text-white flex flex-col relative">

      {/* Skip navigation */}
      <a href="#main-content" className="skip-nav">Aller au contenu</a>

      <LogoStamp />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b-[2px] border-black bg-white">
        <div className="px-6 lg:px-10">
          <div className="flex h-14 items-center justify-between">

            {/* Mobile brand mark */}
            <NavLink to="/" className="sm:hidden font-mono text-[10px] tracking-[0.25em] uppercase text-black/80 font-medium">
              Data Ring
            </NavLink>

            {/* Spacer for logo stamp (hidden on mobile) */}
            <div className="hidden sm:block w-36 shrink-0" />

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

              {/* User initial — links to profile */}
              <NavLink to="/org/profil" className="hidden sm:flex items-center gap-3 hover:opacity-70 transition-opacity duration-100">
                <div className="w-7 h-7 bg-black text-white flex items-center justify-center text-[10px] font-bold uppercase">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <span className="font-mono text-[10px] tracking-[0.1em] text-black/60 uppercase">
                  {user?.firstName}
                </span>
              </NavLink>

              <button
                onClick={async () => { await logout(); }}
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
                  <span className="font-mono text-[9px] tracking-[0.15em] text-black/50 uppercase block mb-1">Organisation</span>
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
                      isActive ? 'text-black font-medium' : 'text-black/60'
                    }`}
                  >
                    {item.name}
                  </NavLink>
                );
              })}
              {user?.isStaff && (
                <a
                  href={import.meta.env.VITE_APP_URL || '/app'}
                  className="block py-3 font-mono text-[11px] tracking-[0.15em] uppercase text-black/60 border-b border-black/10"
                >
                  Espace Staff
                </a>
              )}
              <NavLink
                to="/org/profil"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-3 font-mono text-[11px] tracking-[0.15em] uppercase text-black/60 border-b border-black/10"
              >
                Mon profil
              </NavLink>
              <button
                onClick={async () => { await logout(); setMobileMenuOpen(false); }}
                className="block py-3 font-mono text-[11px] tracking-[0.15em] uppercase text-black/60"
              >
                Déconnexion
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main content — full width, pages control their own layout */}
      <main id="main-content" className="flex-1 sm:pt-20">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t-[2px] border-black bg-white mt-auto">
        <div className="px-6 lg:px-10 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-mono text-[10px] tracking-[0.2em] text-black/50 uppercase">
              Dataring © {new Date().getFullYear()}
            </span>
            <div className="flex items-center gap-8 font-mono text-[10px] tracking-[0.15em] text-black/50 uppercase">
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
