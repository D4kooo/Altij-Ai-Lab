import { NavLink } from 'react-router-dom';
import {
  Users,
  Scale,
  FileText,
  Megaphone,
  ArrowRight,
  CheckCircle,
  Clock,
  Heart,
  Download,
  Calendar,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Campaign {
  id: string;
  title: string;
  description: string;
  target: string;
  status: 'active' | 'upcoming' | 'completed';
  participants: number;
  goal: number;
  startDate: string;
  category: string;
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  downloadCount: number;
}

const campaigns: Campaign[] = [
  {
    id: '1',
    title: 'Transparence des algorithmes de recommandation',
    description:
      "Demandons aux grandes plateformes (YouTube, TikTok, Instagram) de révéler le fonctionnement de leurs algorithmes de recommandation et leur impact sur les utilisateurs.",
    target: 'Plateformes de médias sociaux',
    status: 'active',
    participants: 1247,
    goal: 5000,
    startDate: '2024-01-15',
    category: 'IA & Algorithmes',
  },
  {
    id: '2',
    title: 'Droit à la portabilité réel',
    description:
      "Les géants du numérique rendent difficile la récupération de nos données. Exigeons des formats standardisés et facilement exploitables.",
    target: 'GAFAM',
    status: 'active',
    participants: 892,
    goal: 3000,
    startDate: '2024-02-01',
    category: 'RGPD',
  },
  {
    id: '3',
    title: 'Protection des données des mineurs',
    description:
      "Renforcer la protection des données personnelles des enfants sur les plateformes de jeux et réseaux sociaux.",
    target: 'Plateformes de gaming',
    status: 'upcoming',
    participants: 0,
    goal: 2000,
    startDate: '2024-03-01',
    category: 'Protection des mineurs',
  },
];

const templates: Template[] = [
  {
    id: '1',
    title: "Demande d'accès aux données (Article 15 RGPD)",
    description: 'Modèle de lettre pour demander une copie de vos données personnelles.',
    category: 'RGPD',
    downloadCount: 2341,
  },
  {
    id: '2',
    title: "Demande de suppression (Article 17 RGPD)",
    description: 'Modèle pour exercer votre droit à l\'oubli.',
    category: 'RGPD',
    downloadCount: 1876,
  },
  {
    id: '3',
    title: 'Opposition au profilage publicitaire',
    description: 'Lettre type pour refuser le ciblage publicitaire basé sur vos données.',
    category: 'Publicité',
    downloadCount: 1543,
  },
  {
    id: '4',
    title: 'Réclamation auprès de la CNIL',
    description: 'Guide et modèle pour déposer une plainte auprès de la CNIL.',
    category: 'Réclamation',
    downloadCount: 987,
  },
];

const getStatusBadge = (status: Campaign['status']) => {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
          En cours
        </span>
      );
    case 'upcoming':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs">
          <Clock className="h-3 w-3" />
          À venir
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">
          <CheckCircle className="h-3 w-3" />
          Terminée
        </span>
      );
  }
};

export function CollectiveActions() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#57C5B6]/10 text-[#57C5B6] text-sm font-medium">
          <Users className="h-4 w-4" />
          Actions Collectives
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Ensemble, faisons
          <span className="block text-[#57C5B6]">bouger les lignes</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Rejoignez des campagnes citoyennes pour défendre vos droits
          numériques. La force du collectif face aux géants du numérique.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: '3 200+', label: 'Citoyens mobilisés' },
          { value: '5', label: 'Campagnes actives' },
          { value: '12', label: 'Victoires obtenues' },
          { value: '50K+', label: 'Modèles téléchargés' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="text-center p-6 rounded-xl bg-gray-50 border border-gray-200"
          >
            <p className="text-3xl font-bold text-[#57C5B6]">
              {stat.value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Active Campaigns */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Campagnes en cours</h2>
          <span className="text-sm text-gray-500">
            {campaigns.filter((c) => c.status === 'active').length} campagnes
            actives
          </span>
        </div>

        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(campaign.status)}
                    <span className="text-xs text-gray-400">
                      {campaign.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {campaign.title}
                  </h3>
                  <p className="text-gray-500 mb-4">{campaign.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>Cible : {campaign.target}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Début :{' '}
                        {new Date(campaign.startDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:w-64 space-y-4">
                  {/* Progress */}
                  {campaign.status !== 'upcoming' && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">
                          {campaign.participants.toLocaleString()} participants
                        </span>
                        <span className="text-[#57C5B6] font-medium">
                          {Math.round(
                            (campaign.participants / campaign.goal) * 100
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#57C5B6] rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (campaign.participants / campaign.goal) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Objectif : {campaign.goal.toLocaleString()} participants
                      </p>
                    </div>
                  )}

                  <Button
                    className={cn(
                      'w-full',
                      campaign.status === 'active'
                        ? 'bg-[#57C5B6] hover:bg-[#4AB0A2] text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                    )}
                    disabled={campaign.status === 'upcoming'}
                  >
                    {campaign.status === 'active' && (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Rejoindre
                      </>
                    )}
                    {campaign.status === 'upcoming' && (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Bientôt disponible
                      </>
                    )}
                    {campaign.status === 'completed' && (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Voir les résultats
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Modèles juridiques</h2>
          <NavLink
            to="/outils/gdpr"
            className="text-sm text-[#57C5B6] hover:underline flex items-center gap-1"
          >
            Générateur RGPD
            <ArrowRight className="h-4 w-4" />
          </NavLink>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <span className="text-xs text-gray-400">
                    {template.category}
                  </span>
                  <h3 className="font-medium text-gray-900 group-hover:text-[#57C5B6] transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Download className="h-3 w-3" />
                    {template.downloadCount.toLocaleString()} téléchargements
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Comment ça marche ?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              icon: Users,
              title: 'Rejoignez une campagne',
              description:
                'Choisissez une cause qui vous tient à cœur et ajoutez votre voix au collectif.',
            },
            {
              step: '2',
              icon: Megaphone,
              title: 'Action coordonnée',
              description:
                'Quand l\'objectif est atteint, nous envoyons une action collective (lettre, pétition, signalement).',
            },
            {
              step: '3',
              icon: Scale,
              title: 'Suivi juridique',
              description:
                'Nos experts juridiques assurent le suivi et vous informent des avancées.',
            },
          ].map((item, idx) => (
            <div key={idx} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#57C5B6]/10 text-[#57C5B6] mb-4">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border border-[#57C5B6]/20 bg-gradient-to-br from-[#57C5B6]/5 to-teal-500/5 p-8 text-center">
        <Heart className="h-12 w-12 text-[#57C5B6] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Soutenez nos actions
        </h2>
        <p className="text-gray-500 max-w-lg mx-auto mb-6">
          Data Ring est une association d'intérêt général. Vos dons nous
          permettent de mener des actions juridiques pour défendre les droits
          numériques de tous.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="https://www.data-ring.net/soutenir"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white">
              <Heart className="h-4 w-4 mr-2" />
              Faire un don
            </Button>
          </a>
          <a
            href="https://www.data-ring.net/adhesion"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className="border-[#57C5B6]/30 text-[#57C5B6] hover:bg-[#57C5B6]/10"
            >
              <Users className="h-4 w-4 mr-2" />
              Devenir membre
            </Button>
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          66% de votre don est déductible de vos impôts
        </p>
      </section>
    </div>
  );
}

export default CollectiveActions;
