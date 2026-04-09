import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const parcours = [
  {
    id: 'juniors',
    title: 'Juniors',
    subtitle: '7–15 ans',
    description: 'Apprends à naviguer en sécurité sur Internet et à protéger tes informations personnelles.',
    href: '/school/juniors',
  },
  {
    id: 'adultes',
    title: 'Adultes',
    subtitle: '16–60 ans',
    description: 'Maîtrisez vos droits numériques, protégez vos données personnelles et développez votre culture digitale.',
    href: '/school/adultes',
  },
  {
    id: 'seniors',
    title: 'Seniors',
    subtitle: '60+ ans',
    description: 'À votre rythme, sans jargon, apprenez l\'essentiel pour vous protéger en ligne.',
    href: '/school/seniors',
  },
];

export function School() {
  const navigate = useNavigate();

  return (
    <div className="px-6 lg:px-10 pt-8 sm:pt-36 pb-8 lg:pb-12">
      {/* Header */}
      <div className="mb-10">
        <h1
          className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95]"
         
        >
          Académie
        </h1>
        <p className="mt-2 text-black/60 text-sm">
          Parcours adaptés à chaque niveau
        </p>
      </div>

      {/* 3 parcours cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {parcours.map((p, i) => (
          <button
            key={p.id}
            onClick={() => navigate(p.href)}
            className={`group text-left p-8 lg:p-10 border-2 border-black flex flex-col justify-between min-h-[280px] hover:bg-black hover:text-white transition-colors duration-200 ${
              i > 0 ? 'md:border-l-0' : ''
            } ${i > 0 ? 'border-t-0 md:border-t-2' : ''}`}
          >
            <div>
              <span className="font-mono text-[10px] tracking-[0.3em] text-brand-turquoise uppercase block mb-4 group-hover:text-brand-turquoise">
                {p.subtitle}
              </span>
              <h2
                className="font-heading font-bold text-2xl sm:text-3xl tracking-tighter mb-4"
               
              >
                {p.title}
              </h2>
              <p className="text-black/50 text-sm leading-relaxed group-hover:text-white/60">
                {p.description}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-8 font-mono text-[10px] tracking-[0.15em] uppercase text-black/50 group-hover:text-white/60">
              Voir les cours <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" className="group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-[2px] border-black border-t-0 md:border-t-2 mt-0 md:mt-10">
        {[
          { value: '50+', label: 'Parcours' },
          { value: '3', label: 'Niveaux' },
          { value: '100%', label: 'Gratuit' },
          { value: '0', label: 'Publicité' },
        ].map((stat, i) => (
          <div
            key={i}
            className={`p-5 text-center ${i < 3 ? 'border-r border-black/10 md:border-black' : ''} ${i < 2 ? 'border-b md:border-b-0 border-black/10' : i === 2 ? 'border-b md:border-b-0 border-black/10' : ''}`}
          >
            <p className="text-2xl font-bold tracking-tighter">
              {stat.value}
            </p>
            <p className="font-mono text-[9px] tracking-[0.15em] text-black/50 uppercase mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
