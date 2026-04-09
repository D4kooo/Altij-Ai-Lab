import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { ShieldIcon, SearchDocIcon, AlertIcon, DatabaseIcon } from '@/components/icons/ToolIcons';

const tools = [
  {
    title: 'Générateur RGPD',
    description: 'Générez vos courriers RGPD.',
    href: '/org/outils/gdpr',
    icon: ShieldIcon,
  },
  {
    title: 'Analyseur de CGU',
    description: 'Analysez les conditions d\'utilisation.',
    href: '/org/outils/cgu',
    badge: 'IA',
    icon: SearchDocIcon,
  },
  {
    title: 'Alertes Violations',
    description: 'Surveillez les violations de données.',
    href: '/org/outils/alertes',
    icon: AlertIcon,
  },
  {
    title: 'Fuites en France',
    description: 'Catalogue des violations référencées.',
    href: '/org/outils/fuites',
    icon: DatabaseIcon,
  },
];

export function OrgTools() {
  const location = useLocation();

  if (location.pathname === '/org/outils') {
    return <Navigate to="/org/outils/gdpr" replace />;
  }

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)]">
      {/* Sidebar */}
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
                    <span className={`text-sm tracking-tight block ${isActive ? 'font-bold' : ''}`}>
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
