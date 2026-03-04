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
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-medium tracking-[0.2em] uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          En cours
        </span>
      );
    case 'upcoming':
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-medium tracking-[0.2em] uppercase">
          <Clock className="h-2.5 w-2.5" />
          À venir
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-medium tracking-[0.2em] uppercase">
          <CheckCircle className="h-2.5 w-2.5" />
          Terminée
        </span>
      );
  }
};

export function CollectiveActions() {
  return (
    <div className="space-y-24 animate-[float-up_1s_cubic-bezier(0.16,1,0.3,1)_forwards] opacity-0">
      {/* Hero */}
      <section className="text-center space-y-6 pt-10">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] sm:text-xs font-medium tracking-[0.2em] uppercase">
          <Users className="h-4 w-4" />
          Actions Collectives
        </div>
        <h1 className="text-4xl md:text-6xl font-light text-foreground tracking-tight leading-[1.1] text-balance">
          Ensemble, faisons <br />
          <span className="font-medium">
            bouger les lignes
          </span>
        </h1>
        <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed text-pretty">
          Rejoignez des campagnes citoyennes pour défendre vos droits numériques.
          La force du collectif face à l'empreinte technologique.
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
            className="text-center p-8 rounded-2xl bg-card border border-border"
          >
            <p className="text-4xl font-light text-primary mb-2">
              {stat.value}
            </p>
            <p className="text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Active Campaigns */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-light text-foreground text-balance">Campagnes en cours</h2>
          <span className="text-sm font-light text-muted-foreground">
            {campaigns.filter((c) => c.status === 'active').length} campagnes
            actives
          </span>
        </div>

        <div className="space-y-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="rounded-3xl border border-border bg-card p-8 hover:bg-muted hover:border-foreground/10 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-10">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    {getStatusBadge(campaign.status)}
                    <span className="text-[9px] font-medium tracking-[0.15em] text-muted-foreground uppercase px-3 py-1 rounded-full border border-border bg-muted">
                      {campaign.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-light text-foreground mb-3 text-balance">
                    {campaign.title}
                  </h3>
                  <p className="text-sm font-light text-muted-foreground leading-relaxed mb-6 text-pretty">
                    {campaign.description}
                  </p>

                  <div className="flex flex-wrap gap-6 text-[10px] font-medium tracking-[0.1em] uppercase text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Target className="h-3.5 w-3.5" />
                      <span>Cible : {campaign.target}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Début :{' '}
                        {new Date(campaign.startDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:w-72 space-y-6">
                  {/* Progress */}
                  {campaign.status !== 'upcoming' && (
                    <div className="p-5 rounded-2xl bg-muted border border-border">
                      <div className="flex justify-between text-[10px] font-medium tracking-[0.1em] uppercase mb-3">
                        <span className="text-muted-foreground">
                          {campaign.participants.toLocaleString()} mobilisés
                        </span>
                        <span className="text-primary">
                          {Math.round(
                            (campaign.participants / campaign.goal) * 100
                          )}
                          %
                        </span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min(
                              (campaign.participants / campaign.goal) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground text-right">
                        Objectif : {campaign.goal.toLocaleString()}
                      </p>
                    </div>
                  )}

                  <button
                    className={cn(
                      'w-full py-4 px-6 rounded-2xl text-[10px] font-bold tracking-[0.2em] uppercase flex items-center justify-center transition-all duration-300',
                      campaign.status === 'active'
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
                    )}
                    disabled={campaign.status === 'upcoming'}
                  >
                    {campaign.status === 'active' && (
                      <>
                        <Users className="h-3.5 w-3.5 mr-3" />
                        Rejoindre
                      </>
                    )}
                    {campaign.status === 'upcoming' && (
                      <>
                        <Clock className="h-3.5 w-3.5 mr-3" />
                        Bientôt disponible
                      </>
                    )}
                    {campaign.status === 'completed' && (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 mr-3" />
                        Voir les résultats
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section className="space-y-8 relative">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-light text-foreground mb-2 text-balance">Modèles juridiques</h2>
            <p className="text-sm font-light text-muted-foreground">Gagnez du temps dans vos démarches</p>
          </div>
          <NavLink
            to="/outils/gdpr"
            className="text-[10px] font-medium tracking-[0.1em] uppercase text-primary hover:text-foreground transition-colors duration-300 flex items-center gap-2"
          >
            Générateur RGPD
            <ArrowRight className="h-3.5 w-3.5" />
          </NavLink>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-foreground/10 hover:bg-muted transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start gap-5">
                <div className="p-3 rounded-xl bg-blue-400/10 border border-blue-400/20 text-blue-400">
                  <FileText className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-medium tracking-[0.1em] uppercase text-muted-foreground border border-border px-2 py-1 rounded-md">
                      {template.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-[9px] font-medium tracking-[0.1em] uppercase text-primary">
                      <Download className="h-3 w-3" />
                      {template.downloadCount.toLocaleString()}
                    </div>
                  </div>
                  <h3 className="font-medium text-foreground/90 group-hover:text-foreground transition-colors mb-2">
                    {template.title}
                  </h3>
                  <p className="text-xs font-light text-muted-foreground leading-relaxed text-pretty">
                    {template.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-3xl border border-border bg-card p-10 md:p-14 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-3xl font-light text-foreground mb-10 text-center text-balance">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                step: '1',
                icon: Users,
                title: 'Rejoignez une campagne',
                description:
                  'Choisissez une cause qui vous tient à cœur et ajoutez votre voix au collectif citoyen.',
              },
              {
                step: '2',
                icon: Megaphone,
                title: 'Action coordonnée',
                description:
                  'Quand l\'objectif est atteint, nous envoyons une action collective formelle (lettre, plainte, signalement).',
              },
              {
                step: '3',
                icon: Scale,
                title: 'Suivi juridique',
                description:
                  'Nos experts assurent le suivi de la contestation et vous informent en toute transparence.',
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-6 transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-sm">
                  <item.icon className="h-7 w-7" strokeWidth={1.5} />
                </div>
                <h3 className="font-medium text-foreground mb-3 text-lg">{item.title}</h3>
                <p className="text-sm font-light text-muted-foreground leading-relaxed text-pretty">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl border border-primary/20 bg-primary/10 p-10 md:p-16 text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Heart className="h-7 w-7 text-primary animate-pulse" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-light text-foreground mb-4 text-balance">
            Soutenez nos actions
          </h2>
          <p className="text-muted-foreground font-light max-w-lg mx-auto mb-10 leading-relaxed text-pretty">
            Data Ring est une association d'intérêt général. Vos dons nous
            permettent de mener des actions juridiques pour défendre librement les
            droits numériques de tous.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://www.data-ring.net/soutenir"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-primary text-primary-foreground text-[10px] font-bold tracking-[0.2em] uppercase rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center"
            >
              <Heart className="h-3.5 w-3.5 mr-2" />
              Faire un don
            </a>
            <a
              href="https://www.data-ring.net/adhesion"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-muted border border-border text-foreground text-[10px] font-bold tracking-[0.2em] uppercase rounded-full hover:bg-muted/80 hover:border-foreground/20 transition-colors flex items-center justify-center"
            >
              <Users className="h-3.5 w-3.5 mr-2" />
              Devenir membre
            </a>
          </div>
          <p className="text-[9px] font-medium tracking-[0.1em] text-primary uppercase mt-6 opacity-80">
            66% de votre don est déductible de vos impôts
          </p>
        </div>
      </section>
    </div>
  );
}

export default CollectiveActions;
