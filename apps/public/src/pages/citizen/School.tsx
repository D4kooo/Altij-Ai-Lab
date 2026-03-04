import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  GraduationCap,
  Gamepad2,
  Briefcase,
  BookOpen,
  ArrowRight,
  Brain,
  Smartphone,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudienceCard {
  id: 'kids' | 'adults' | 'seniors';
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  iconBg: string;
  features: string[];
  href: string;
}

const audiences: AudienceCard[] = [
  {
    id: 'adults',
    title: 'Adultes',
    subtitle: '16-60 ans',
    description:
      'Maîtrisez les outils numériques et protégez votre vie privée au quotidien et au travail.',
    icon: Briefcase,
    color: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
    features: [
      'RGPD expliqué',
      "Sécurité de l'IA",
      'Droits numériques',
      'Outils pratiques',
    ],
    href: '/school/adultes',
  },
  {
    id: 'kids',
    title: 'Juniors',
    subtitle: '7-15 ans',
    description:
      "Apprends à naviguer sur Internet en toute sécurité et à protéger tes informations personnelles.",
    icon: Gamepad2,
    color: 'text-amber-400',
    iconBg: 'bg-amber-400/10 border-amber-400/20',
    features: [
      'Jeux interactifs',
      'Quiz amusants',
      'Histoires numériques',
      'Badges à collectionner',
    ],
    href: '/school/juniors',
  },
  {
    id: 'seniors',
    title: 'Seniors',
    subtitle: '60+ ans',
    description:
      'Découvrez le numérique à votre rythme avec des explications claires et un accompagnement bienveillant.',
    icon: Heart,
    color: 'text-purple-400',
    iconBg: 'bg-purple-400/10 border-purple-400/20',
    features: [
      'Pas à pas illustrés',
      'Glossaire simplifié',
      'Arnaques à éviter',
      'Aide personnalisée',
    ],
    href: '/school/seniors',
  },
];

const popularTopics = [
  {
    title: "Qu'est-ce que l'IA ?",
    icon: Brain,
    audience: 'Tous',
    duration: '10 min',
  },
  {
    title: 'Protéger ses mots de passe',
    icon: Shield,
    audience: 'Tous',
    duration: '15 min',
  },
  {
    title: 'Les réseaux sociaux en sécurité',
    icon: Smartphone,
    audience: 'Juniors',
    duration: '20 min',
  },
  {
    title: 'Comprendre le RGPD',
    icon: BookOpen,
    audience: 'Adultes',
    duration: '25 min',
  },
];

export function School() {
  return (
    <div className="space-y-24 animate-[float-up_1s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0">
      {/* Hero */}
      <section className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase">
          <GraduationCap className="h-4 w-4" />
          Data Ring Academy
        </div>
        <h1 className="text-4xl md:text-6xl font-light text-foreground tracking-tight leading-[1.1] text-balance">
          Apprenez le numérique <br />
          <span className="font-medium">
            en toute confiance
          </span>
        </h1>
        <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed text-pretty">
          Des parcours adaptés à chaque génération pour comprendre, maîtriser et
          se protéger dans le monde numérique.
        </p>
      </section>

      {/* Audience Selection */}
      <section className="grid md:grid-cols-3 gap-6">
        {audiences.map((audience) => (
          <NavLink
            key={audience.id}
            to={audience.href}
            className={cn(
              'group relative overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all duration-500',
              'hover:border-foreground/20 hover:bg-muted'
            )}
          >
            <div className="relative z-10 flex flex-col h-full">
              {/* Icon & Title */}
              <div className="flex items-start justify-between mb-8">
                <div
                  className={cn(
                    'p-4 rounded-2xl border transition-colors duration-500',
                    audience.iconBg,
                    audience.color,
                    'group-hover:bg-opacity-20'
                  )}
                >
                  <audience.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <span className="text-[9px] font-medium tracking-[0.2em] uppercase text-muted-foreground bg-muted border border-border px-3 py-1.5 rounded-full">
                  {audience.subtitle}
                </span>
              </div>

              <div className="mb-8 flex-grow">
                <h2 className="text-2xl font-light text-foreground mb-3 text-balance">
                  {audience.title}
                </h2>
                <p className="text-sm font-light text-muted-foreground leading-relaxed text-pretty">
                  {audience.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-10">
                {audience.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 text-sm text-muted-foreground font-light"
                  >
                    <Sparkles className={cn('h-3 w-3', audience.color)} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div
                className={cn(
                  'flex items-center gap-2 text-[11px] font-bold tracking-[0.15em] uppercase pt-4 border-t border-border mt-auto transition-colors',
                  audience.color
                )}
              >
                Commencer <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </NavLink>
        ))}
      </section>

      {/* Popular Topics */}
      <section className="space-y-8 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-light text-foreground mb-2 text-balance">Sujets populaires</h2>
            <p className="text-sm font-light text-muted-foreground">
              Commencez par ces essentiels
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularTopics.map((topic, idx) => (
            <div
              key={idx}
              className="group p-5 rounded-2xl border border-border bg-card hover:bg-muted hover:border-foreground/10 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                  <topic.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground/80 group-hover:text-foreground truncate transition-colors">
                    {topic.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground truncate">
                    <span>{topic.audience}</span>
                    <span>•</span>
                    <span>{topic.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: '50+', label: 'Modules interactifs' },
          { value: '3', label: 'Parcours adaptés' },
          { value: '100%', label: 'Gratuit' },
          { value: '0', label: "Publicité ou traçage" },
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

      {/* Why Data Ring */}
      <section className="relative rounded-3xl border border-border bg-card p-10 md:p-16 overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
              <Shield className="h-8 w-8 text-primary" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-light text-foreground tracking-tight text-balance">
            Association reconnue d'intérêt général
          </h2>
          <p className="text-lg font-light leading-relaxed text-muted-foreground text-pretty">
            Data Ring agit sans compromis. Nous ne vendons pas vos données, nous vous apprenons à les protéger.
            Notre mission est de rendre le numérique accessible pour tous, sans jargon ni publicité, pour restaurer l'autonomie citoyenne face à l'empreinte numérique.
          </p>
          <div className="flex flex-wrap justify-center gap-6 pt-4">
            <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Transparence totale
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Indépendance
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.1em] text-muted-foreground uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Engagement sociétal
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default School;
