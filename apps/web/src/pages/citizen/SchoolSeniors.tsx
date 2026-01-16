import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Phone,
  Mail,
  CreditCard,
  ShieldAlert,
  HelpCircle,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Volume2,
  Eye,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSchoolProgress } from '@/hooks/useSchoolProgress';
import { seniorsModules } from '@/data/schoolContent';

// Map icon strings to components
const iconMap: Record<string, typeof Phone> = {
  Mail,
  Phone,
  ShieldAlert,
  CreditCard,
  HelpCircle,
  Lock,
};

const scamAlerts = [
  {
    title: 'Faux conseiller bancaire',
    description: 'Votre banque ne vous demandera JAMAIS vos codes par téléphone.',
    severity: 'high',
  },
  {
    title: 'Colis en attente',
    description: 'Méfiez-vous des SMS de "livraison" demandant un paiement.',
    severity: 'high',
  },
  {
    title: 'Gain à une loterie',
    description: 'On ne gagne pas à un jeu auquel on n\'a pas participé.',
    severity: 'medium',
  },
];

export function SchoolSeniors() {
  const navigate = useNavigate();
  const { isModuleCompleted, getCompletedCount } = useSchoolProgress();

  const completedCount = getCompletedCount('seniors');
  const progress = (completedCount / seniorsModules.length) * 100;

  const handleStartModule = (moduleId: string) => {
    navigate(`/school/seniors/module/${moduleId}`);
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
      <section className="relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-8">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-4 rounded-2xl bg-purple-100 text-purple-600">
            <Heart className="h-10 w-10" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Parcours Seniors</h1>
              <span className="px-2 py-1 rounded bg-purple-100 text-purple-700 text-xs font-medium">
                60+ ans
              </span>
            </div>
            <p className="text-gray-600 text-lg">
              Découvrez le numérique à votre rythme, avec des explications
              claires et un accompagnement bienveillant. Pas de jargon, juste
              l'essentiel.
            </p>
          </div>
        </div>
      </section>

      {/* Accessibility options */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <Eye className="h-4 w-4 mr-2" />
          Agrandir le texte
        </Button>
        <Button
          variant="outline"
          className="border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Version audio disponible
        </Button>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Votre progression</h2>
            <p className="text-gray-500">
              Vous avez terminé {completedCount} leçon(s) sur {seniorsModules.length}
            </p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-purple-600">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Scam Alerts */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h2 className="text-xl font-bold text-gray-900">Alertes arnaques</h2>
        </div>
        <div className="grid gap-4">
          {scamAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={cn(
                'rounded-xl border p-5',
                alert.severity === 'high'
                  ? 'border-red-200 bg-red-50'
                  : 'border-amber-200 bg-amber-50'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    alert.severity === 'high'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-600'
                  )}
                >
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{alert.title}</h3>
                  <p className="text-gray-600 mt-1">{alert.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Les leçons</h2>
        <div className="grid gap-4">
          {seniorsModules.map((module) => {
            const completed = isModuleCompleted('seniors', module.id);
            const IconComponent = iconMap[module.icon] || HelpCircle;

            return (
              <div
                key={module.id}
                className={cn(
                  'relative group rounded-xl border p-6 transition-all',
                  completed
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'p-3 rounded-xl',
                      completed
                        ? 'bg-green-100 text-green-600'
                        : 'bg-purple-100 text-purple-600'
                    )}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <IconComponent className="h-6 w-6" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {module.title}
                      </h3>
                      {completed && (
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-sm">
                          Terminé
                        </span>
                      )}
                      {module.hasAudio && (
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-sm flex items-center gap-1">
                          <Volume2 className="h-3 w-3" />
                          Audio
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500">{module.description}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Durée : {module.duration}
                    </p>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => handleStartModule(module.id)}
                    className={cn(
                      completed
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-purple-600 hover:bg-purple-700',
                      'text-white'
                    )}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {completed ? 'Revoir' : 'Commencer'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tips */}
      <section className="rounded-xl border border-purple-200 bg-purple-50 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">
              Le conseil du jour
            </h3>
            <p className="text-gray-600 text-lg">
              En cas de doute sur un email ou un appel, ne faites rien dans
              l'urgence. Prenez le temps de demander conseil à un proche ou
              appelez directement l'organisme concerné avec le numéro habituel
              (pas celui donné dans le message).
            </p>
          </div>
        </div>
      </section>

      {/* Help section */}
      <section className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="text-center space-y-4">
          <HelpCircle className="h-12 w-12 text-purple-600 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900">
            Besoin d'aide ?
          </h3>
          <p className="text-gray-500 max-w-lg mx-auto">
            Vous pouvez contacter notre équipe de bénévoles pour un
            accompagnement personnalisé. Nous sommes là pour vous aider.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="border-purple-200 text-purple-600 hover:bg-purple-50"
          >
            <Phone className="h-5 w-5 mr-2" />
            Demander de l'aide
          </Button>
        </div>
      </section>
    </div>
  );
}

export default SchoolSeniors;
