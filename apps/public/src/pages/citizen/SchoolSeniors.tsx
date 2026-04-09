import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';
import { useCoursesData } from '@/hooks/useCoursesData';

const scamAlerts = [
  { title: 'Faux conseiller bancaire', text: 'Votre banque ne vous demandera JAMAIS vos codes par téléphone.' },
  { title: 'Colis en attente', text: 'Méfiez-vous des SMS de "livraison" demandant un paiement.' },
  { title: 'Gain à une loterie', text: 'On ne gagne pas à un jeu auquel on n\'a pas participé.' },
];

export function SchoolSeniors() {
  const navigate = useNavigate();
  const { isModuleCompleted, getCompletedCount } = useSchoolProgress();
  const { allModules, loading, error } = useCoursesData('seniors');

  const completedCount = getCompletedCount('seniors');
  const totalModules = allModules.length;
  const progress = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-black/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-black/50">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 px-6 lg:px-10 py-8 lg:py-10 sm:pt-20">
      {/* Back */}
      <NavLink to="/school" className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors duration-100">
        <ArrowLeft size={14} strokeWidth={1.5} /> Parcours
      </NavLink>

      {/* Header */}
      <div>
        <span className="font-mono text-[10px] tracking-[0.3em] text-brand-turquoise/60 uppercase block mb-4">Seniors · 60+ ans</span>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95] mb-2">
          Votre parcours numérique
        </h1>
        <p className="text-black/50 text-lg leading-relaxed">
          À votre rythme, sans jargon, juste l'essentiel.
        </p>

        {/* Progress */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex-1 h-[4px] bg-black/10">
            <div className="h-full bg-black transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-xs tracking-[0.1em] text-black/60">
            {completedCount}/{totalModules}
          </span>
        </div>
      </div>

      {/* Scam alerts */}
      <div className="border-2 border-black p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle size={18} strokeWidth={1.5} />
          <span className="font-heading font-bold text-sm tracking-tight uppercase">
            Alertes arnaques
          </span>
        </div>
        <div className="space-y-4">
          {scamAlerts.map((alert, i) => (
            <div key={i} className="flex gap-3">
              <span className="font-mono text-[10px] tracking-[0.3em] text-brand-turquoise/50 mt-1 shrink-0">
                {String(i + 1).padStart(2, '0')}.
              </span>
              <div>
                <p className="font-heading font-bold text-sm">{alert.title}</p>
                <p className="text-black/50 text-sm">{alert.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module list */}
      <div className="border-t-[2px] border-black">
        {allModules.map((module, i) => {
          const completed = isModuleCompleted('seniors', module.id);
          const locked = false; // Seniors: no locking, all modules accessible

          return (
            <button
              key={module.id}
              onClick={() => !locked && navigate(`/school/seniors/module/${module.id}`)}
              disabled={locked}
              className={`w-full text-left flex items-center gap-4 py-6 border-b border-black/10 transition-colors duration-100 group ${
                locked ? 'opacity-40 cursor-not-allowed' : 'hover:border-black'
              }`}
            >
              <span className={`font-mono text-[10px] tracking-[0.3em] w-8 shrink-0 ${
                completed ? 'text-brand-turquoise' : 'text-black/20'
              }`}>
                {String(i + 1).padStart(2, '0')}.
              </span>

              <div className="flex-1 min-w-0">
                <span className={`block text-lg tracking-tight truncate ${
                  completed ? 'text-black/60' : locked ? 'text-black/50' : 'text-black'
                }`}>
                  {module.title}
                </span>
                {module.hasAudio && (
                  <span className="font-mono text-[9px] tracking-[0.15em] text-brand-turquoise/50 uppercase">Audio disponible</span>
                )}
              </div>

              <span className="font-mono text-[10px] tracking-[0.1em] text-black/50 shrink-0 hidden sm:block">
                {module.duration}
              </span>

              <div className="w-6 shrink-0 flex justify-center">
                {completed ? (
                  <Check size={18} strokeWidth={2} className="text-brand-turquoise" />
                ) : locked ? (
                  <Lock size={14} strokeWidth={1.5} className="text-black/20" />
                ) : (
                  <ArrowRight size={16} strokeWidth={1.5} className="text-black/60 group-hover:translate-x-1 transition-transform duration-100" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tip */}
      <div className="border-l-[3px] border-brand-turquoise/30 pl-6 py-2">
        <p className="font-mono text-[10px] tracking-[0.15em] text-black/50 uppercase mb-2">Conseil du jour</p>
        <p className="text-black/50 text-base leading-relaxed">
          En cas de doute sur un email ou un appel, ne faites rien dans l'urgence. Prenez le temps de demander conseil à un proche ou appelez directement l'organisme avec le numéro habituel.
        </p>
      </div>

      {/* Help */}
      <div className="border-2 border-black p-8 text-center">
        <p className="font-heading font-bold text-lg mb-2">Besoin d'aide ?</p>
        <p className="text-black/50 text-sm mb-6 max-w-md mx-auto">
          Contactez notre équipe de bénévoles pour un accompagnement personnalisé.
        </p>
        <button className="px-8 py-3 border-2 border-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100">
          Demander de l'aide
        </button>
      </div>
    </div>
  );
}
