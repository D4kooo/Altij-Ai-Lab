import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Lock, Loader2 } from 'lucide-react';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';
import { useCoursesData } from '@/hooks/useCoursesData';

const badges = [
  { name: 'Explorateur', icon: '🔍', modulesRequired: 1 },
  { name: 'Protecteur', icon: '🛡️', modulesRequired: 2 },
  { name: 'Cyber-héros', icon: '🦸', modulesRequired: 4 },
  { name: 'Expert', icon: '⭐', modulesRequired: 6 },
];

export function SchoolJuniors() {
  const navigate = useNavigate();
  const { isModuleCompleted, getCompletedCount } = useSchoolProgress();
  const { allModules, loading, error } = useCoursesData('juniors');

  const completedCount = getCompletedCount('juniors');
  const totalModules = allModules.length;
  const progress = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-black/30" />
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
    <div className="space-y-10 px-6 lg:px-10 py-8 lg:py-10 pt-20">
      {/* Back */}
      <NavLink to="/school" className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors duration-100">
        <ArrowLeft size={14} strokeWidth={1.5} /> Parcours
      </NavLink>

      {/* Header */}
      <div>
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-4">Juniors · 7–15 ans</span>
        <h1 className="font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95] mb-6" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
          Ton aventure numérique
        </h1>

        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[3px] bg-black/10">
            <div className="h-full bg-black transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] text-black/40">
            {completedCount}/{totalModules}
          </span>
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-6">
        {badges.map((badge) => {
          const earned = completedCount >= badge.modulesRequired;
          return (
            <div key={badge.name} className="text-center">
              <span className={`text-2xl block mb-1 ${earned ? '' : 'grayscale opacity-30'}`}>
                {badge.icon}
              </span>
              <span className={`font-mono text-[9px] tracking-[0.1em] uppercase ${
                earned ? 'text-black' : 'text-black/20'
              }`}>
                {badge.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Module list */}
      <div className="border-t-[2px] border-black">
        {allModules.map((module, i) => {
          const completed = isModuleCompleted('juniors', module.id);
          const locked = i > 0 && !isModuleCompleted('juniors', allModules[i - 1].id) && !completed;

          return (
            <button
              key={module.id}
              onClick={() => !locked && navigate(`/school/juniors/module/${module.id}`)}
              disabled={locked}
              className={`w-full text-left flex items-center gap-4 py-5 border-b border-black/10 transition-colors duration-100 group ${
                locked ? 'opacity-40 cursor-not-allowed' : 'hover:border-black'
              }`}
            >
              <span className={`font-mono text-[10px] tracking-[0.3em] w-8 shrink-0 ${
                completed ? 'text-[#21B2AA]' : 'text-black/20'
              }`}>
                {String(i + 1).padStart(2, '0')}.
              </span>

              <div className="flex-1 min-w-0">
                <span className={`block text-base tracking-tight truncate ${
                  completed ? 'text-black/40' : locked ? 'text-black/30' : 'text-black'
                }`} style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                  {module.title}
                </span>
              </div>

              <span className="font-mono text-[10px] tracking-[0.1em] text-black/30 shrink-0 hidden sm:block">
                {module.duration}
              </span>

              <div className="w-6 shrink-0 flex justify-center">
                {completed ? (
                  <Check size={16} strokeWidth={2} className="text-[#21B2AA]" />
                ) : locked ? (
                  <Lock size={14} strokeWidth={1.5} className="text-black/20" />
                ) : (
                  <ArrowRight size={14} strokeWidth={1.5} className="text-black/40 group-hover:translate-x-1 transition-transform duration-100" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tip */}
      <div className="border-l-[3px] border-[#21B2AA]/30 pl-6 py-2">
        <p className="font-mono text-[10px] tracking-[0.15em] text-black/30 uppercase mb-2">Conseil du jour</p>
        <p className="text-black/50 text-sm leading-relaxed">
          Ne partage jamais ton mot de passe, même avec tes meilleurs amis. Un mot de passe, c'est comme une brosse à dents : on ne le prête pas !
        </p>
      </div>
    </div>
  );
}

export default SchoolJuniors;
