import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Gamepad2,
  Star,
  Lock,
  Eye,
  MessageSquare,
  Users,
  Shield,
  Sparkles,
  Play,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';
import { useCoursesData } from '@/hooks/useCoursesData';

// Map icon strings to components
const iconMap: Record<string, typeof Shield> = {
  Sparkles,
  Lock,
  Eye,
  MessageSquare,
  Users,
  Shield,
};

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

  const handleStartModule = (moduleId: string) => {
    navigate(`/school/juniors/module/${moduleId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
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
      <section className="relative overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-8">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-4 rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Gamepad2 className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground text-balance">Parcours Juniors</h1>
              <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium">
                7-15 ans
              </span>
            </div>
            <p className="text-muted-foreground text-pretty">
              Deviens un vrai super-héros du numérique ! Apprends à naviguer sur
              Internet en toute sécurité avec des jeux et des quiz amusants.
            </p>
          </div>
        </div>
      </section>

      {/* Progress & Badges */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Progress */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Ta progression</h2>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {completedCount}/{totalModules}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {completedCount === 0
              ? 'Commence ton aventure !'
              : completedCount === totalModules
              ? 'Bravo, tu as tout terminé ! 🎉'
              : 'Continue comme ça, tu es sur la bonne voie !'}
          </p>
        </div>

        {/* Badges */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Tes badges</h2>
          <div className="flex gap-4">
            {badges.map((badge) => {
              const earned = completedCount >= badge.modulesRequired;
              return (
                <div
                  key={badge.name}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                    earned
                      ? 'bg-amber-50 dark:bg-amber-500/10'
                      : 'bg-muted opacity-50'
                  )}
                  title={earned ? `Badge obtenu !` : `Termine ${badge.modulesRequired} module(s) pour débloquer`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      earned ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                    )}
                  >
                    {badge.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modules */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Les modules</h2>
        <div className="grid gap-4">
          {allModules.map((module, index) => {
            const completed = isModuleCompleted('juniors', module.id);
            // Modules are locked if previous module isn't completed (except first)
            const locked = index > 0 && !isModuleCompleted('juniors', allModules[index - 1].id) && !completed;
            const IconComponent = iconMap[module.icon] || Shield;

            return (
              <div
                key={module.id}
                className={cn(
                  'relative group rounded-xl border p-5 transition-all',
                  locked
                    ? 'border-border bg-muted opacity-60'
                    : completed
                    ? 'border-green-200 dark:border-green-500/20 bg-green-50 dark:bg-green-500/5'
                    : 'border-border bg-card hover:border-amber-300 dark:hover:border-amber-500/30 hover:shadow-sm'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'p-3 rounded-xl',
                      completed
                        ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400'
                        : locked
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {locked ? (
                      <Lock className="h-5 w-5" />
                    ) : completed ? (
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
                      <span>{module.duration}</span>
                      <span>•</span>
                      <span
                        className={cn(
                          module.difficulty === 'facile' && 'text-green-600 dark:text-green-400',
                          module.difficulty === 'moyen' && 'text-amber-600 dark:text-amber-400',
                          module.difficulty === 'expert' && 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {module.difficulty && module.difficulty.charAt(0).toUpperCase() +
                          module.difficulty.slice(1)}
                      </span>
                    </div>
                  </div>

                  {!locked && (
                    <Button
                      size="sm"
                      onClick={() => handleStartModule(module.id)}
                      className={cn(
                        completed
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-amber-500 hover:bg-amber-600',
                        'text-white'
                      )}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {completed ? 'Revoir' : 'Jouer'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tips */}
      <section className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Conseil du jour
            </h3>
            <p className="text-sm text-muted-foreground text-pretty">
              Ne partage jamais ton mot de passe, même avec tes meilleurs amis.
              Un mot de passe, c'est comme une brosse à dents : on ne le prête
              pas !
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SchoolJuniors;
