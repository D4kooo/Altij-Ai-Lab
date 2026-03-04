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
    color: 'text-blue-400',
    iconBg: 'bg-blue-400/10 border-blue-400/20',
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
    color: 'text-purple-400',
    iconBg: 'bg-purple-400/10 border-purple-400/20',
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
    color: 'text-amber-400',
    iconBg: 'bg-amber-400/10 border-amber-400/20',
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
    <div className="space-y-24 animate-[float-up_1s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0">
      {/* Hero */}
      <section className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase">
          <Shield className="h-4 w-4" />
          Outils Citoyens
        </div>
        <h1 className="text-4xl md:text-6xl font-light text-foreground tracking-tight leading-[1.1] text-balance">
          Protégez vos <br />
          <span className="font-medium">
            données personnelles
          </span>
        </h1>
        <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed text-pretty">
          Des outils gratuits pour exercer vos droits numériques, comprendre les
          services que vous utilisez, et vérifier si vos données ont été compromises.
        </p>
      </section>

      {/* Tools Grid */}
      <section className="grid md:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <NavLink
            key={tool.id}
            to={tool.href}
            className={cn(
              'group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all duration-500',
              'hover:border-foreground/20 hover:bg-muted'
            )}
          >
            <div className="relative z-10 flex flex-col h-full">
              {/* Icon & Badge */}
              <div className="flex items-start justify-between mb-8">
                <div
                  className={cn(
                    'p-4 rounded-2xl border transition-colors duration-500',
                    tool.iconBg,
                    tool.color,
                    'group-hover:bg-opacity-20'
                  )}
                >
                  <tool.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                {tool.badge && (
                  <span className="text-[9px] font-medium text-primary tracking-[0.2em] uppercase bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-full">
                    {tool.badge}
                  </span>
                )}
              </div>

              <div className="mb-8 flex-grow">
                <h2 className="text-2xl font-light text-foreground mb-3 text-balance">
                  {tool.title}
                </h2>
                <p className="text-sm font-light text-muted-foreground leading-relaxed text-pretty">
                  {tool.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-10">
                {tool.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 text-sm text-muted-foreground font-light"
                  >
                    <CheckCircle className={cn('h-3 w-3', tool.color)} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div
                className={cn(
                  'flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase pt-4 border-t border-border mt-auto transition-colors',
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
      <section className="space-y-8 relative">
        <div className="text-center">
          <h2 className="text-3xl font-light text-foreground mb-2 text-balance">
            Vos droits RGPD en un coup d'œil
          </h2>
          <p className="text-sm font-light text-muted-foreground text-pretty">
            Le Règlement Général sur la Protection des Données vous donne des
            droits sur vos informations.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gdprRights.map((right, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-border bg-card hover:bg-muted hover:border-foreground/10 transition-all duration-300"
            >
              <div className="p-3 rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400 w-fit mb-5">
                <right.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className="font-medium text-foreground/80 mb-2">{right.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{right.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security Tips */}
      <section className="relative rounded-3xl border border-border bg-card p-10 md:p-12 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
          <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 text-primary hidden sm:block">
            <Lock className="h-10 w-10" strokeWidth={1.5} />
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl font-light text-foreground text-center md:text-left text-balance">
              Conseils de souveraineté
            </h2>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {[
                'Utilisez un mot de passe unique pour chaque service',
                "Activez l'authentification à deux facteurs (2FA)",
                'Vérifiez régulièrement vos paramètres de confidentialité',
                'Méfiez-vous des emails demandant des informations personnelles',
                'Mettez à jour vos applications et systèmes régulièrement',
                'Limitez les permissions accordées aux applications',
              ].map((tip, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0 opacity-80" />
                  <span className="text-sm font-light text-muted-foreground leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-10">
        {[
          { value: '100%', label: 'Gratuit' },
          { value: '0', label: 'Données collectées' },
          { value: 'RGPD', label: 'Conforme' },
          { value: 'Open', label: 'Transparence' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="text-center p-8 rounded-2xl bg-card border border-border"
          >
            <p className="text-4xl font-light text-primary mb-2">
              {stat.value}
            </p>
            <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default CitizenTools;
