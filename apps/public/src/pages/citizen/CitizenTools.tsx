import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v6c0 5.25 3.75 10.13 9 11 5.25-.87 9-5.75 9-11V7l-9-5z" />
    <path d="M9 12h6M12 9v6" />
  </svg>
);

const SearchDocIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
    <path d="M14 2v6h6" />
    <circle cx="11" cy="15" r="2.5" />
    <path d="M13 17l2 2" />
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L3 7v6c0 5.25 3.75 10.13 9 11 5.25-.87 9-5.75 9-11V7l-9-5z" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const DatabaseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const tools = [
  {
    title: 'Générateur RGPD',
    description: 'Générez vos courriers RGPD.',
    href: '/outils/gdpr',
    icon: ShieldIcon,
  },
  {
    title: 'Analyseur de CGU',
    description: 'Analysez les conditions d\'utilisation.',
    href: '/outils/cgu',
    badge: 'IA',
    icon: SearchDocIcon,
  },
  {
    title: 'Alertes Violations',
    description: 'Surveillez les violations de données.',
    href: '/outils/alertes',
    icon: AlertIcon,
  },
  {
    title: 'Fuites en France',
    description: 'Catalogue des violations référencées.',
    href: '/outils/fuites',
    icon: DatabaseIcon,
  },
];

export function CitizenTools() {
  const location = useLocation();

  // Redirect /outils to /outils/gdpr
  if (location.pathname === '/outils') {
    return <Navigate to="/outils/gdpr" replace />;
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100svh-3.5rem)]">

      {/* Mobile nav — horizontal scrollable */}
      <nav className="lg:hidden border-b-[2px] border-black bg-white overflow-x-auto scrollbar-thin">
        <div className="flex min-w-max px-4 py-0">
          {tools.map((tool) => {
            const isActive = location.pathname === tool.href;
            return (
              <NavLink
                key={tool.href}
                to={tool.href}
                className={`flex items-center gap-2 px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase whitespace-nowrap border-b-2 transition-colors duration-100 ${
                  isActive
                    ? 'border-black text-black font-medium'
                    : 'border-transparent text-black/40 hover:text-black'
                }`}
              >
                <span className="shrink-0"><tool.icon /></span>
                {tool.title}
                {tool.badge && (
                  <span className="px-1.5 py-0.5 bg-[#21B2AA]/10 text-[#21B2AA] text-[8px] font-bold tracking-wider">{tool.badge}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r-[2px] border-black bg-white">
        <div className="sticky top-14 p-6 pt-24 space-y-6">
          <div>
            <span className="font-heading font-bold text-lg tracking-tight block mb-1">
              Outils
            </span>
            <p className="text-black/40 text-xs">Protégez vos données personnelles</p>
          </div>

          <nav className="space-y-0">
            {tools.map((tool) => {
              const isActive = location.pathname === tool.href;
              return (
                <NavLink
                  key={tool.href}
                  to={tool.href}
                  className={`flex items-start gap-3 py-3 border-b border-black/10 transition-colors duration-100 ${
                    isActive ? 'text-black' : 'text-black/40 hover:text-black'
                  }`}
                >
                  <span className="mt-0.5 shrink-0"><tool.icon /></span>
                  <div>
                    <span className={`font-heading text-sm tracking-tight block ${isActive ? 'font-bold' : ''}`}>
                      {tool.title}
                    </span>
                    <span className="text-xs text-black/30 block mt-0.5">{tool.description}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 px-6 lg:px-10 py-8 lg:py-10">
        <Outlet />
      </div>
    </div>
  );
}

export default CitizenTools;
