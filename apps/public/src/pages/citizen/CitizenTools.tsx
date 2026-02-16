import { NavLink } from 'react-router-dom';
import {
  Shield,
  FileText,
  AlertTriangle,
  Scale,
  ArrowRight,
  CheckCircle,
  Lock,
  Eye,
  Trash2,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: typeof Shield;
  color: string;
  bgColor: string;
  iconBg: string;
  features: string[];
  href: string;
  badge?: string;
}

const tools: Tool[] = [
  {
    id: 'gdpr',
    title: 'Générateur RGPD',
    description:
      'Créez des demandes personnalisées pour exercer vos droits sur vos données personnelles.',
    icon: Scale,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    iconBg: 'bg-blue-100',
    features: [
      "Droit d'accès",
      'Droit de rectification',
      "Droit à l'effacement",
      'Droit à la portabilité',
    ],
    href: '/outils/gdpr',
  },
  {
    id: 'cgu',
    title: 'Analyseur de CGU',
    description:
      "Comprenez ce que cachent les conditions d'utilisation des services que vous utilisez.",
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    features: [
      'Analyse IA des CGU',
      'Points de vigilance',
      'Résumé simplifié',
      'Score de confiance',
    ],
    href: '/outils/cgu',
    badge: 'IA',
  },
  {
    id: 'alerts',
    title: 'Alertes Violations',
    description:
      'Vérifiez si vos données ont été compromises dans une fuite de données.',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    features: [
      'Recherche par email',
      'Historique des fuites',
      'Conseils de sécurité',
      'Notifications',
    ],
    href: '/outils/alertes',
  },
];

const gdprRights = [
  {
    icon: Eye,
    title: "Droit d'accès",
    description: 'Savoir quelles données une entreprise détient sur vous.',
  },
  {
    icon: FileText,
    title: 'Droit de rectification',
    description: 'Corriger des informations inexactes vous concernant.',
  },
  {
    icon: Trash2,
    title: "Droit à l'effacement",
    description: 'Demander la suppression de vos données personnelles.',
  },
  {
    icon: Download,
    title: 'Droit à la portabilité',
    description: 'Récupérer vos données dans un format réutilisable.',
  },
];

export function CitizenTools() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#57C5B6]/10 text-[#57C5B6] text-sm font-medium">
          <Shield className="h-4 w-4" />
          Outils Citoyens
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Protégez vos
          <span className="block text-[#57C5B6]">données personnelles</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Des outils gratuits pour exercer vos droits numériques, comprendre les
          services que vous utilisez, et vérifier si vos données ont été
          compromises.
        </p>
      </section>

      {/* Tools Grid */}
      <section className="grid md:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <NavLink
            key={tool.id}
            to={tool.href}
            className={cn(
              'group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300',
              'hover:border-gray-300 hover:shadow-lg'
            )}
          >
            {/* Background gradient */}
            <div
              className={cn(
                'absolute inset-0 opacity-50 transition-opacity group-hover:opacity-70',
                tool.bgColor
              )}
            />

            <div className="relative space-y-4">
              {/* Icon & Badge */}
              <div className="flex items-start justify-between">
                <div
                  className={cn('p-3 rounded-xl', tool.iconBg, tool.color)}
                >
                  <tool.icon className="h-6 w-6" />
                </div>
                {tool.badge && (
                  <span className="text-xs font-medium text-[#57C5B6] bg-[#57C5B6]/10 px-2 py-1 rounded">
                    {tool.badge}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {tool.title}
                </h2>
                <p className="text-sm text-gray-500">{tool.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {tool.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <CheckCircle className={cn('h-3.5 w-3.5', tool.color)} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div
                className={cn(
                  'flex items-center gap-2 text-sm font-medium pt-2',
                  tool.color
                )}
              >
                Accéder à l'outil
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </NavLink>
        ))}
      </section>

      {/* GDPR Rights Explainer */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Vos droits RGPD en un coup d'œil
          </h2>
          <p className="text-gray-500">
            Le Règlement Général sur la Protection des Données vous donne des
            droits sur vos informations personnelles.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gdprRights.map((right, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all"
            >
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 w-fit mb-3">
                <right.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{right.title}</h3>
              <p className="text-sm text-gray-500">{right.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security Tips */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
        <div className="flex items-start gap-6">
          <div className="p-4 rounded-xl bg-[#57C5B6]/10 text-[#57C5B6] hidden sm:block">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Conseils de sécurité
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Utilisez un mot de passe unique pour chaque service',
                "Activez l'authentification à deux facteurs (2FA)",
                'Vérifiez régulièrement vos paramètres de confidentialité',
                'Méfiez-vous des emails demandant des informations personnelles',
                'Mettez à jour vos applications et systèmes régulièrement',
                'Limitez les permissions accordées aux applications',
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-[#57C5B6] mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-600">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: '100%', label: 'Gratuit' },
          { value: '0', label: 'Données collectées' },
          { value: 'RGPD', label: 'Conforme' },
          { value: 'Open', label: 'Source ouverte' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="text-center p-6 rounded-xl bg-gray-50 border border-gray-100"
          >
            <p className="text-3xl font-bold text-[#57C5B6]">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default CitizenTools;
