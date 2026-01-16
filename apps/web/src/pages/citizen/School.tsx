import { NavLink } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Heart,
  GraduationCap,
  Gamepad2,
  Briefcase,
  BookOpen,
  ArrowRight,
  Shield,
  Brain,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudienceCard {
  id: 'kids' | 'adults' | 'seniors';
  title: string;
  subtitle: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  bgColor: string;
  iconBg: string;
  features: string[];
  href: string;
}

const audiences: AudienceCard[] = [
  {
    id: 'kids',
    title: 'Juniors',
    subtitle: '7-15 ans',
    description:
      "Apprends à naviguer sur Internet en toute sécurité et à protéger tes informations personnelles.",
    icon: Gamepad2,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    iconBg: 'bg-amber-100',
    features: [
      'Jeux interactifs',
      'Quiz amusants',
      'Histoires numériques',
      'Badges à collectionner',
    ],
    href: '/school/juniors',
  },
  {
    id: 'adults',
    title: 'Adultes',
    subtitle: '16-60 ans',
    description:
      'Maîtrisez les outils numériques et protégez votre vie privée au quotidien et au travail.',
    icon: Briefcase,
    color: 'text-[#57C5B6]',
    bgColor: 'bg-[#57C5B6]/5',
    iconBg: 'bg-[#57C5B6]/10',
    features: [
      'RGPD expliqué',
      "Sécurité de l'IA",
      'Droits numériques',
      'Outils pratiques',
    ],
    href: '/school/adultes',
  },
  {
    id: 'seniors',
    title: 'Seniors',
    subtitle: '60+ ans',
    description:
      'Découvrez le numérique à votre rythme avec des explications claires et un accompagnement bienveillant.',
    icon: Heart,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    iconBg: 'bg-purple-100',
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
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#57C5B6]/10 text-[#57C5B6] text-sm font-medium">
          <GraduationCap className="h-4 w-4" />
          Data Ring Academy
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Apprenez le numérique
          <span className="block text-[#57C5B6]">en toute confiance</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
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
              'group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300',
              'hover:border-gray-300 hover:shadow-lg'
            )}
          >
            {/* Background gradient */}
            <div
              className={cn(
                'absolute inset-0 opacity-50 transition-opacity group-hover:opacity-70',
                audience.bgColor
              )}
            />

            <div className="relative space-y-4">
              {/* Icon & Title */}
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    'p-3 rounded-xl',
                    audience.iconBg,
                    audience.color
                  )}
                >
                  <audience.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {audience.subtitle}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {audience.title}
                </h2>
                <p className="text-sm text-gray-500">{audience.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {audience.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <Sparkles className={cn('h-3.5 w-3.5', audience.color)} />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div
                className={cn(
                  'flex items-center gap-2 text-sm font-medium pt-2',
                  audience.color
                )}
              >
                Commencer le parcours
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </NavLink>
        ))}
      </section>

      {/* Popular Topics */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Sujets populaires</h2>
          <span className="text-sm text-gray-500">
            Commencez par ces essentiels
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularTopics.map((topic, idx) => (
            <div
              key={idx}
              className="group p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#57C5B6]/10 text-[#57C5B6]">
                  <topic.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-[#57C5B6] transition-colors">
                    {topic.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
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
          { value: '50+', label: 'Modules de formation' },
          { value: '3', label: 'Parcours adaptés' },
          { value: '100%', label: 'Gratuit' },
          { value: '0', label: "Publicité ou tracking" },
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

      {/* Why Data Ring */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-8 md:p-12">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Pourquoi apprendre avec Data Ring ?
          </h2>
          <p className="text-gray-500">
            Data Ring est une association d'intérêt général. Nous ne vendons pas
            vos données, nous vous apprenons à les protéger. Notre mission est
            de rendre le numérique accessible et compréhensible pour tous, sans
            jargon ni publicité.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4 text-[#57C5B6]" />
              Sans publicité
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4 text-[#57C5B6]" />
              Association indépendante
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Heart className="h-4 w-4 text-[#57C5B6]" />
              Intérêt général
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default School;
