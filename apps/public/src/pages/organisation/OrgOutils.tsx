import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const tools = [
  {
    title: 'Générateur RGPD',
    description: 'Générez les courriers de conformité RGPD pour votre organisation.',
    href: '/org/outils/gdpr',
    tag: 'Conformité',
  },
  {
    title: 'Analyseur de CGU',
    description: 'Analysez les conditions d\'utilisation de vos fournisseurs et partenaires.',
    href: '/org/outils/cgu',
    tag: 'IA',
  },
  {
    title: 'Alertes Violations',
    description: 'Surveillez les violations de données impliquant votre organisation.',
    href: '/org/outils/alertes',
    tag: 'Sécurité',
  },
  {
    title: 'Anonymisation de documents',
    description: 'Anonymisez automatiquement les données personnelles dans vos documents.',
    href: '#',
    tag: 'Bientôt',
    disabled: true,
  },
];

export function OrgOutils() {
  const navigate = useNavigate();

  return (
    <div className="px-6 lg:px-10 pt-36 pb-8 lg:pb-12">
      {/* Header */}
      <div className="mb-10">
        <span className="font-mono text-[10px] tracking-[0.15em] text-black/30 uppercase block mb-3">
          Outils
        </span>
        <h1
          className="font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95]"
          style={{ fontFamily: "'Inter Tight', sans-serif" }}
        >
          Outils professionnels
        </h1>
        <p className="mt-2 text-black/40 text-sm">
          Des outils automatisés pour la conformité de votre organisation.
        </p>
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {tools.map((tool, i) => (
          <button
            key={tool.href + i}
            onClick={() => !tool.disabled && navigate(tool.href)}
            disabled={tool.disabled}
            className={`group text-left p-8 lg:p-10 border-2 border-black flex flex-col justify-between min-h-[200px] transition-colors duration-200 ${
              tool.disabled
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-black hover:text-white'
            } ${i % 2 !== 0 ? 'md:border-l-0' : ''} ${i >= 2 ? 'border-t-0' : ''}`}
          >
            <div>
              <span className={`inline-block font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 mb-4 border ${
                tool.disabled
                  ? 'border-black/20 text-black/30'
                  : 'border-black/20 text-black/40 group-hover:border-white/30 group-hover:text-white/50'
              }`}>
                {tool.tag}
              </span>
              <h2
                className="font-bold text-xl tracking-tighter mb-3"
                style={{ fontFamily: "'Inter Tight', sans-serif" }}
              >
                {tool.title}
              </h2>
              <p className={`text-sm leading-relaxed ${
                tool.disabled
                  ? 'text-black/30'
                  : 'text-black/40 group-hover:text-white/60'
              }`}>
                {tool.description}
              </p>
            </div>

            {!tool.disabled && (
              <div className="flex items-center gap-2 mt-6 font-mono text-[10px] tracking-[0.15em] uppercase text-black/30 group-hover:text-white/60">
                Ouvrir <ArrowRight size={14} strokeWidth={1.5} className="group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default OrgOutils;
