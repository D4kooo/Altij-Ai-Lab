import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function OrgDashboard() {
  const navigate = useNavigate();

  const organizationName = useMemo(() => {
    try {
      const onboarding = localStorage.getItem('citizen_onboarding');
      if (onboarding) {
        const data = JSON.parse(onboarding);
        return data.organizationName || 'votre organisation';
      }
    } catch {
      // ignore
    }
    return 'votre organisation';
  }, []);

  const quickLinks = [
    {
      label: 'Formation',
      description: 'Parcours IA, RGPD et gouvernance pour vos équipes.',
      href: '/org/formation',
    },
    {
      label: 'Outils',
      description: 'Générateur RGPD, analyseur de CGU, alertes.',
      href: '/org/outils',
    },
    {
      label: 'Équipe',
      description: 'Gérez les accès de vos collaborateurs.',
      href: '/org/equipe',
    },
  ];

  const stats = [
    { value: '0', label: 'Membres' },
    { value: '0', label: 'Formations complétées' },
    { value: '0', label: 'Documents générés' },
  ];

  return (
    <div className="px-6 lg:px-10 pt-16 pb-8 lg:pb-12">
      {/* Header */}
      <div className="mb-10">
        <span className="font-mono text-[10px] tracking-[0.15em] text-black/30 uppercase block mb-3">
          Tableau de bord
        </span>
        <h1
          className="font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95]"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Bienvenue, {organizationName}.
        </h1>
        <p className="mt-2 text-black/40 text-sm">
          Pilotez la conformité et la formation de votre organisation.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-0 border-[2px] border-black mb-10">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`p-5 text-center ${i < stats.length - 1 ? 'border-r-[2px] border-black' : ''}`}
          >
            <p
              className="text-2xl font-bold tracking-tighter"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              {stat.value}
            </p>
            <p className="font-mono text-[9px] tracking-[0.15em] text-black/30 uppercase mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {quickLinks.map((link, i) => (
          <button
            key={link.href}
            onClick={() => navigate(link.href)}
            className={`group text-left p-8 lg:p-10 border-2 border-black flex flex-col justify-between min-h-[220px] hover:bg-black hover:text-white transition-colors duration-200 ${
              i > 0 ? 'md:border-l-0' : ''
            } ${i > 0 ? 'border-t-0 md:border-t-2' : ''}`}
          >
            <div>
              <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA] uppercase block mb-4 group-hover:text-[#21B2AA]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2
                className="font-bold text-2xl tracking-tighter mb-3"
                style={{ fontFamily: "'Inter Tight', sans-serif" }}
              >
                {link.label}
              </h2>
              <p className="text-black/50 text-sm leading-relaxed group-hover:text-white/60">
                {link.description}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-6 font-mono text-[10px] tracking-[0.15em] uppercase text-black/30 group-hover:text-white/60">
              Accéder <ArrowRight size={14} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </button>
        ))}
      </div>

      {/* Recent activity placeholder */}
      <div className="border-[2px] border-black border-t-0 md:border-t-2 md:mt-10 p-8">
        <span className="font-mono text-[10px] tracking-[0.15em] text-black/30 uppercase block mb-4">
          Activité récente
        </span>
        <p className="text-black/30 text-sm">
          Aucune activité pour le moment. Commencez par explorer les formations ou les outils.
        </p>
      </div>
    </div>
  );
}

export default OrgDashboard;
