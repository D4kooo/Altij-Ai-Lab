import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Lock, Loader2 } from 'lucide-react';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';
import { useCoursesData } from '@/hooks/useCoursesData';

type ModuleState = { completed: boolean; locked: boolean; isNext: boolean };

function getModuleButtonClasses(state: ModuleState): string {
  if (state.locked) return 'opacity-40 cursor-not-allowed';
  if (state.isNext) return 'bg-black/[0.02] hover:border-black';
  return 'hover:border-black';
}

function getModuleTitleClasses(state: ModuleState): string {
  if (state.completed) return 'text-black/60';
  if (state.locked) return 'text-black/50';
  if (state.isNext) return 'font-bold text-black';
  return 'text-black/70';
}

function getModuleAriaPrefix(state: ModuleState): string {
  if (state.completed) return 'Terminé : ';
  if (state.locked) return 'Verrouillé : ';
  return '';
}

export function SchoolAdults() {
  const navigate = useNavigate();
  const { isModuleCompleted, getCompletedCount } = useSchoolProgress();
  const { allModules, loading, error } = useCoursesData('adultes');

  const completedCount = getCompletedCount('adultes');
  const totalModules = allModules.length;
  const progress = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  const nextModuleIndex = allModules.findIndex((m) => !isModuleCompleted('adultes', m.id));

  const groups = useMemo(() => {
    const result: { courseName: string; startIndex: number; modules: typeof allModules }[] = [];
    let idx = 0;
    for (const module of allModules) {
      const last = result[result.length - 1];
      if (last && last.courseName === module.courseName) {
        last.modules.push(module);
      } else {
        result.push({ courseName: module.courseName, startIndex: idx, modules: [module] });
      }
      idx++;
    }
    return result;
  }, [allModules]);

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
      <NavLink to="/school" className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors duration-100">
        <ArrowLeft size={14} strokeWidth={1.5} /> Parcours
      </NavLink>

      <div>
        <span className="font-mono text-[10px] tracking-[0.3em] text-brand-turquoise/60 uppercase block mb-4">Adultes · 16–60 ans</span>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95] mb-6">
          Ton parcours
        </h1>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-[3px] bg-black/10">
            <div className="h-full bg-black transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] text-black/60">
            {completedCount}/{totalModules}
          </span>
        </div>
      </div>

      <div>
        {groups.map((group, gi) => (
          <div key={`${group.courseName}-${gi}`} className="mt-8 first:mt-0">
            <div className="border-t-[2px] border-black pt-4 pb-2">
              <span className="font-mono text-[10px] tracking-[0.3em] text-black/60 uppercase">
                {group.courseName}
              </span>
            </div>

            {group.modules.map((module, j) => {
              const i = group.startIndex + j;
              const completed = isModuleCompleted('adultes', module.id);
              const prevCompleted = j === 0 || isModuleCompleted('adultes', group.modules[j - 1].id);
              const state: ModuleState = {
                completed,
                locked: !prevCompleted && !completed,
                isNext: i === nextModuleIndex,
              };

              return (
                <button
                  key={module.id}
                  onClick={() => !state.locked && navigate(`/school/adultes/module/${module.id}`)}
                  disabled={state.locked}
                  aria-label={`${getModuleAriaPrefix(state)}${module.title}`}
                  className={`w-full text-left flex items-center gap-4 py-5 border-b border-black/10 transition-colors duration-100 group ${getModuleButtonClasses(state)}`}
                >
                  <span className={`font-mono text-[10px] tracking-[0.3em] w-8 shrink-0 ${
                    completed ? 'text-brand-turquoise' : 'text-black/20'
                  }`}>
                    {String(i + 1).padStart(2, '0')}.
                  </span>

                  <div className="flex-1 min-w-0">
                    <span className={`block text-base tracking-tight truncate ${getModuleTitleClasses(state)}`}>
                      {module.title}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] tracking-[0.1em] text-black/50 shrink-0 hidden sm:block">
                    {module.duration}
                  </span>

                  <div className="w-6 shrink-0 flex justify-center">
                    {state.completed ? (
                      <Check size={16} strokeWidth={2} className="text-brand-turquoise" />
                    ) : state.locked ? (
                      <Lock size={14} strokeWidth={1.5} className="text-black/20" />
                    ) : state.isNext ? (
                      <ArrowRight size={14} strokeWidth={1.5} className="text-black group-hover:translate-x-1 transition-transform duration-100" />
                    ) : (
                      <span className="w-3 h-3 border border-black/15 rounded-full" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
