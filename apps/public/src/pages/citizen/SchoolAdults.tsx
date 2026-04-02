import { NavLink, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';
import { useCoursesData } from '@/hooks/useCoursesData';

export function SchoolAdults() {
  const navigate = useNavigate();
  const { isModuleCompleted, getCompletedCount } = useSchoolProgress();
  const { allModules, loading, error } = useCoursesData('adultes');

  const completedCount = getCompletedCount('adultes');
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

  // Find next module to do
  const nextModuleIndex = allModules.findIndex((m) => !isModuleCompleted('adultes', m.id));

  return (
    <div className="space-y-10 px-6 lg:px-10 py-8 lg:py-10 sm:pt-20">
      {/* Back */}
      <NavLink to="/school" className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] uppercase text-black/40 hover:text-black transition-colors duration-100">
        <ArrowLeft size={14} strokeWidth={1.5} /> Parcours
      </NavLink>

      {/* Header + progress */}
      <div>
        <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA]/60 uppercase block mb-4">Adultes · 16–60 ans</span>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95] mb-6">
          Ton parcours
        </h1>

        {/* Progress bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[3px] bg-black/10">
            <div className="h-full bg-black transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-[10px] tracking-[0.15em] text-black/40">
            {completedCount}/{totalModules}
          </span>
        </div>
      </div>

      {/* Module list grouped by course */}
      <div>
        {(() => {
          // Group modules by course (courseName), preserving order
          const groups: { courseName: string; category: string; modules: typeof allModules }[] = [];
          let globalIndex = 0;
          for (const module of allModules) {
            const last = groups[groups.length - 1];
            if (last && last.courseName === module.courseName) {
              last.modules.push(module);
            } else {
              groups.push({ courseName: module.courseName, category: module.courseCategory || '', modules: [module] });
            }
          }

          return groups.map((group, gi) => {
            const startIndex = globalIndex;
            globalIndex += group.modules.length;

            return (
              <div key={`${group.courseName}-${gi}`} className="mt-8 first:mt-0">
                {/* Course separator */}
                <div className="border-t-[2px] border-black pt-4 pb-2">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-black/40 uppercase">
                    {group.courseName}
                  </span>
                </div>

                {/* Modules in this course */}
                {group.modules.map((module, j) => {
                  const i = startIndex + j;
                  const completed = isModuleCompleted('adultes', module.id);
                  const isNext = i === nextModuleIndex;

                  return (
                    <button
                      key={module.id}
                      onClick={() => navigate(`/school/adultes/module/${module.id}`)}
                      aria-label={`${completed ? 'Terminé : ' : ''}${module.title}`}
                      className={`w-full text-left flex items-center gap-4 py-5 border-b border-black/10 hover:border-black transition-colors duration-100 group ${
                        isNext ? 'bg-black/[0.02]' : ''
                      }`}
                    >
                      {/* Number */}
                      <span className={`font-mono text-[10px] tracking-[0.3em] w-8 shrink-0 ${
                        completed ? 'text-[#21B2AA]' : 'text-black/20'
                      }`}>
                        {String(i + 1).padStart(2, '0')}.
                      </span>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <span className={`block text-base tracking-tight truncate ${
                          completed ? 'text-black/40' : isNext ? 'font-bold text-black' : 'text-black/70'
                        }`}>
                          {module.title}
                        </span>
                      </div>

                      {/* Duration */}
                      <span className="font-mono text-[10px] tracking-[0.1em] text-black/30 shrink-0 hidden sm:block">
                        {module.duration}
                      </span>

                      {/* Status */}
                      <div className="w-6 shrink-0 flex justify-center">
                        {completed ? (
                          <Check size={16} strokeWidth={2} className="text-[#21B2AA]" />
                        ) : isNext ? (
                          <ArrowRight size={14} strokeWidth={1.5} className="text-black group-hover:translate-x-1 transition-transform duration-100" />
                        ) : (
                          <span className="w-3 h-3 border border-black/15 rounded-full" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

export default SchoolAdults;
