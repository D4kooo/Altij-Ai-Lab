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
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';
import { useCoursesData } from '@/hooks/useCoursesData';

// Map icon strings to components
const iconMap: Record<string, typeof Shield> = {
  Scale,
  Brain,
  Shield,
  FileText,
  Lock,
  Briefcase,
  BookOpen,
};

// Color palette for dynamic categories
const categoryColors = [
  { color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-400/10', bar: 'bg-blue-600' },
  { color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-400/10', bar: 'bg-purple-600' },
  { color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-400/10', bar: 'bg-green-600' },
  { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-400/10', bar: 'bg-amber-600' },
  { color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-100 dark:bg-rose-400/10', bar: 'bg-rose-600' },
  { color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-100 dark:bg-cyan-400/10', bar: 'bg-cyan-600' },
];

export function SchoolAdults() {
  const navigate = useNavigate();
  const { isModuleCompleted, getCompletedCount } = useSchoolProgress();
  const { allModules, loading, error } = useCoursesData('adultes');

  const completedCount = getCompletedCount('adultes');
  const totalModules = allModules.length;
  const progress = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  // Extract unique categories dynamically
  const categoryNames = [...new Set(allModules.map((m) => m.courseCategory).filter(Boolean))] as string[];
  const categories = categoryNames.map((name, idx) => ({
    id: name,
    name,
    colors: categoryColors[idx % categoryColors.length],
  }));

  // Calculate total duration
  const totalDuration = allModules.reduce((acc, m) => {
    const mins = parseInt(m.duration.replace(/[^\d]/g, '')) || 0;
    return acc + mins;
  }, 0);

  const handleStartModule = (moduleId: string) => {
    navigate(`/school/adultes/module/${moduleId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <NavLink
        to="/school"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux parcours
      </NavLink>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 p-8">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-4 rounded-2xl bg-primary/20 text-primary">
            <Briefcase className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground text-balance">Parcours Adultes</h1>
              <span className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-medium">
                16-60 ans
              </span>
            </div>
            <p className="text-muted-foreground text-pretty">
              Maîtrisez les enjeux du numérique moderne. RGPD, intelligence
              artificielle, cybersécurité : tout ce qu'il faut savoir pour
              protéger vos données et celles de votre entreprise.
            </p>
          </div>
        </div>
      </section>

      {/* Progress */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Votre progression</h2>
            <p className="text-sm text-muted-foreground">
              {completedCount} modules terminés sur {totalModules}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-primary">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Catégories</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const catModules = allModules.filter((m) => m.courseCategory === cat.id);
              const catCompleted = catModules.filter((m) => isModuleCompleted('adultes', m.id)).length;
              return (
                <div
                  key={cat.id}
                  className="group rounded-xl border border-border bg-card p-4 hover:border-foreground/20 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn('p-2 rounded-lg', cat.colors.bgColor, cat.colors.color)}>
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {catCompleted}/{catModules.length} terminés
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', cat.colors.bar)}
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
      )}

      {/* All Modules */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Tous les modules</h2>
          {totalDuration > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              ~{Math.round(totalDuration / 60)}h de contenu
            </div>
          )}
        </div>

        <div className="grid gap-4">
          {allModules.map((module) => {
            const category = categories.find((c) => c.id === module.courseCategory);
            const completed = isModuleCompleted('adultes', module.id);
            const IconComponent = iconMap[module.icon] || Shield;

            return (
              <div
                key={module.id}
                className={cn(
                  'relative group rounded-xl border p-5 transition-all',
                  completed
                    ? 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5'
                    : 'border-border bg-card hover:border-primary/30 hover:shadow-sm'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'p-3 rounded-xl',
                      completed
                        ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                        : category?.colors.bgColor,
                      !completed && category?.colors.color
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
                      <h3 className="font-semibold text-foreground">{module.title}</h3>
                      {completed && (
                        <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs">
                          Terminé
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {category && <span className={category.colors.color}>{category.name}</span>}
                      {category && <span>•</span>}
                      <span>{module.duration}</span>
                      <span>•</span>
                      <span
                        className={cn(
                          module.difficulty === 'facile' && 'text-green-600 dark:text-green-400',
                          module.difficulty === 'moyen' && 'text-amber-600 dark:text-amber-400',
                          module.difficulty === 'expert' && 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {module.difficulty && module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleStartModule(module.id)}
                    className={cn(
                      completed
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-primary hover:bg-primary/90',
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
      <section className="rounded-xl border border-border bg-muted p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Ressources complémentaires
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-pretty">
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
                  className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:bg-muted cursor-pointer transition-colors"
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
