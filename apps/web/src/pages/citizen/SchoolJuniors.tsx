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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';
import { juniorsModules } from '@/data/schoolContent';

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

  const completedCount = getCompletedCount('juniors');
  const progress = (completedCount / juniorsModules.length) * 100;

  const handleStartModule = (moduleId: string) => {
    navigate(`/school/juniors/module/${moduleId}`);
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
      <section className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-4 rounded-2xl bg-amber-100 text-amber-600">
            <Gamepad2 className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Parcours Juniors</h1>
              <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-xs font-medium">
                7-15 ans
              </span>
            </div>
            <p className="text-gray-600">
              Deviens un vrai super-héros du numérique ! Apprends à naviguer sur
              Internet en toute sécurité avec des jeux et des quiz amusants.
            </p>
          </div>
        </div>
      </section>

      {/* Progress & Badges */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Progress */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ta progression</h2>
            <span className="text-2xl font-bold text-amber-600">
              {completedCount}/{juniorsModules.length}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {completedCount === 0
              ? 'Commence ton aventure !'
              : completedCount === juniorsModules.length
              ? 'Bravo, tu as tout terminé ! 🎉'
              : 'Continue comme ça, tu es sur la bonne voie !'}
          </p>
        </div>

        {/* Badges */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tes badges</h2>
          <div className="flex gap-4">
            {badges.map((badge) => {
              const earned = completedCount >= badge.modulesRequired;
              return (
                <div
                  key={badge.name}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                    earned
                      ? 'bg-amber-50'
                      : 'bg-gray-50 opacity-50'
                  )}
                  title={earned ? `Badge obtenu !` : `Termine ${badge.modulesRequired} module(s) pour débloquer`}
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <span
                    className={cn(
                      'text-xs font-medium',
                      earned ? 'text-amber-600' : 'text-gray-400'
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
        <h2 className="text-xl font-bold text-gray-900">Les modules</h2>
        <div className="grid gap-4">
          {juniorsModules.map((module, index) => {
            const completed = isModuleCompleted('juniors', module.id);
            // Modules are locked if previous module isn't completed (except first)
            const locked = index > 0 && !isModuleCompleted('juniors', juniorsModules[index - 1].id) && !completed;
            const IconComponent = iconMap[module.icon] || Shield;

            return (
              <div
                key={module.id}
                className={cn(
                  'relative group rounded-xl border p-5 transition-all',
                  locked
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : completed
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-amber-300 hover:shadow-md'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'p-3 rounded-xl',
                      completed
                        ? 'bg-green-100 text-green-600'
                        : locked
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-amber-100 text-amber-600'
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
                      <h3 className="font-semibold text-gray-900">{module.title}</h3>
                      {completed && (
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                          Terminé
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{module.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{module.duration}</span>
                      <span>•</span>
                      <span
                        className={cn(
                          module.difficulty === 'facile' && 'text-green-600',
                          module.difficulty === 'moyen' && 'text-amber-600',
                          module.difficulty === 'expert' && 'text-red-600'
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
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Conseil du jour
            </h3>
            <p className="text-sm text-gray-600">
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
