import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  BookOpen,
  Shield,
  Brain,
  Scale,
  FileText,
  Lock,
  Play,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';
import { adultesModules } from '@/data/schoolContent';

// Map icon strings to components
const iconMap: Record<string, typeof Shield> = {
  Scale,
  Brain,
  Shield,
  FileText,
  Lock,
  Briefcase,
};

const categories = [
  { id: 'rgpd', name: 'RGPD & Droits', icon: Scale, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'ia', name: 'Intelligence Artificielle', icon: Brain, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 'security', name: 'Cybersécurité', icon: Shield, color: 'text-green-600', bgColor: 'bg-green-100' },
  { id: 'work', name: 'Numérique au travail', icon: Briefcase, color: 'text-amber-600', bgColor: 'bg-amber-100' },
];

export function SchoolAdults() {
  const navigate = useNavigate();
  const { isModuleCompleted, getCompletedCount } = useSchoolProgress();

  const completedCount = getCompletedCount('adultes');
  const progress = (completedCount / adultesModules.length) * 100;

  // Calculate total duration
  const totalDuration = adultesModules.reduce((acc, m) => {
    const mins = parseInt(m.duration.replace(' min', ''));
    return acc + mins;
  }, 0);

  const handleStartModule = (moduleId: string) => {
    navigate(`/school/adultes/module/${moduleId}`);
  };

  return (
    <div className="space-y-8">
      {/* Back link */}
      <NavLink
        to="/school"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux parcours
      </NavLink>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-[#57C5B6]/20 bg-gradient-to-br from-[#57C5B6]/10 to-teal-50 p-8">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-4 rounded-2xl bg-[#57C5B6]/20 text-[#57C5B6]">
            <Briefcase className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Parcours Adultes</h1>
              <span className="px-2 py-1 rounded bg-[#57C5B6]/20 text-[#57C5B6] text-xs font-medium">
                16-60 ans
              </span>
            </div>
            <p className="text-gray-600">
              Maîtrisez les enjeux du numérique moderne. RGPD, intelligence
              artificielle, cybersécurité : tout ce qu'il faut savoir pour
              protéger vos données et celles de votre entreprise.
            </p>
          </div>
        </div>
      </section>

      {/* Progress */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Votre progression</h2>
            <p className="text-sm text-gray-500">
              {completedCount} modules terminés sur {adultesModules.length}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-[#57C5B6]">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#57C5B6] to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Catégories</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const catModules = adultesModules.filter((m) => m.category === cat.id);
            const catCompleted = catModules.filter((m) => isModuleCompleted('adultes', m.id)).length;
            return (
              <div
                key={cat.id}
                className="group rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('p-2 rounded-lg', cat.bgColor, cat.color)}>
                    <cat.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-500">
                      {catCompleted}/{catModules.length} terminés
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', cat.color.replace('text-', 'bg-'))}
                    style={{
                      width: `${catModules.length > 0 ? (catCompleted / catModules.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* All Modules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Tous les modules</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            ~{Math.round(totalDuration / 60)}h de contenu
          </div>
        </div>

        <div className="grid gap-4">
          {adultesModules.map((module) => {
            const category = categories.find((c) => c.id === module.category);
            const completed = isModuleCompleted('adultes', module.id);
            const IconComponent = iconMap[module.icon] || Shield;

            return (
              <div
                key={module.id}
                className={cn(
                  'relative group rounded-xl border p-5 transition-all',
                  completed
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-[#57C5B6]/30 hover:shadow-md'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'p-3 rounded-xl',
                      completed
                        ? 'bg-green-100 text-green-600'
                        : category?.bgColor,
                      !completed && category?.color
                    )}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <IconComponent className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{module.title}</h3>
                      {completed && (
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                          Terminé
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{module.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className={category?.color}>{category?.name}</span>
                      <span>•</span>
                      <span>{module.duration}</span>
                      <span>•</span>
                      <span
                        className={cn(
                          module.level === 'débutant' && 'text-green-600',
                          module.level === 'intermédiaire' && 'text-amber-600',
                          module.level === 'avancé' && 'text-red-600'
                        )}
                      >
                        {module.level && module.level.charAt(0).toUpperCase() + module.level.slice(1)}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleStartModule(module.id)}
                    className={cn(
                      completed
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-[#57C5B6] hover:bg-[#4AB0A2]',
                      'text-white'
                    )}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    {completed ? 'Revoir' : 'Commencer'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Resources */}
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-[#57C5B6]/10 text-[#57C5B6]">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Ressources complémentaires
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Approfondissez vos connaissances avec ces guides pratiques.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Guide RGPD (PDF)',
                'Checklist Cybersécurité',
                'Modèles de lettres RGPD',
                "FAQ Intelligence Artificielle",
              ].map((resource) => (
                <NavLink
                  key={resource}
                  to="/outils"
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  {resource}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SchoolAdults;
