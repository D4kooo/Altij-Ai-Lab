import { useState } from 'react';
import { Users, Heart, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsApi, type Campaign } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import {
  filterCampaignsByCategory,
  getActiveCampaigns,
  computeProgressPct,
  computeTotalParticipants,
  ALL_CATEGORIES_LABEL,
} from './CollectiveActions.utils';

const categories = [ALL_CATEGORIES_LABEL, 'Numérique', 'Santé', 'Éducation', 'Environnement'];

export function CollectiveActions() {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORIES_LABEL);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: campaigns = [], isLoading: campaignsLoading, error: campaignsError } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.list(),
  });

  const { data: stats } = useQuery({
    queryKey: ['campaigns', 'stats'],
    queryFn: () => campaignsApi.getStats(),
  });

  const { data: participations = [] } = useQuery({
    queryKey: ['campaigns', 'my-participations'],
    queryFn: () => campaignsApi.getMyParticipations(),
    enabled: isAuthenticated,
  });

  const participatingIds = new Set(participations.map((p) => p.campaign.id));

  const joinMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.join(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.leave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const activeCampaigns = getActiveCampaigns(campaigns);
  const filteredCampaigns = filterCampaignsByCategory(campaigns, activeCategory);

  const totalParticipants = stats?.totalParticipants ?? computeTotalParticipants(campaigns);
  const completedCampaigns = stats?.completedCampaigns ?? 0;

  const handleJoinLeave = (campaign: Campaign) => {
    if (!isAuthenticated) {
      window.location.href = '/citizen/login';
      return;
    }
    const isMutating = joinMutation.isPending || leaveMutation.isPending;
    if (isMutating) return;

    if (participatingIds.has(campaign.id)) {
      leaveMutation.mutate(campaign.id);
    } else {
      joinMutation.mutate(campaign.id);
    }
  };

  if (campaignsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100svh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-black/50" />
      </div>
    );
  }

  if (campaignsError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100svh-3.5rem)]">
        <p className="text-black/50 text-sm">Impossible de charger les campagnes. Réessayez plus tard.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)]">
      {/* Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r-[2px] border-black bg-white">
        <div className="sticky top-14 p-6 pt-24 space-y-8">
          {/* Stats */}
          <div>
            <span className="font-mono text-[10px] tracking-[0.15em] text-black/50 uppercase block mb-4">
              En un coup d'oeil
            </span>
            <div className="space-y-3">
              {[
                { label: 'Campagnes actives', value: String(stats?.activeCampaigns ?? activeCampaigns.length) },
                { label: 'Participants', value: totalParticipants.toLocaleString() + '+' },
                { label: 'Terminées', value: String(completedCampaigns) },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-xs text-black/50">{stat.label}</span>
                  <span className="font-heading font-bold text-sm tracking-tight">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <span className="font-mono text-[10px] tracking-[0.15em] text-black/50 uppercase block mb-4">
              Filtrer par
            </span>
            <nav className="space-y-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left py-2.5 text-sm transition-colors duration-100 ${
                    activeCategory === cat
                      ? 'text-white bg-black px-3 -mx-3 font-medium'
                      : 'text-black/50 hover:text-black'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 px-6 lg:px-10 py-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1
              className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95]"
             
            >
              Actions collectives
            </h1>
            <p className="mt-2 text-black/60 text-sm">
              Rejoignez des campagnes citoyennes pour défendre vos droits numériques.
            </p>
          </div>
        </div>

        {/* Campaign count */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-mono text-[10px] tracking-[0.15em] text-black/50 uppercase">
            {filteredCampaigns.length} campagne{filteredCampaigns.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Campaign list */}
        {filteredCampaigns.length === 0 ? (
          <div className="border-2 border-black/10 p-12 text-center">
            <p className="text-black/60 text-sm">Aucune campagne pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => {
              const progressPct = computeProgressPct(campaign.participants, campaign.participantGoal);
              const isActive = campaign.status === 'active';
              const isParticipating = participatingIds.has(campaign.id);
              const isMutatingThis = (joinMutation.isPending && joinMutation.variables === campaign.id) ||
                (leaveMutation.isPending && leaveMutation.variables === campaign.id);

              return (
                <div key={campaign.id} className="border-2 border-black/10 hover:border-black transition-colors duration-100 p-6">
                  {/* Tags + date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 ${
                        isActive ? 'bg-black text-white' : 'border border-black/20 text-black/50'
                      }`}>
                        {campaign.status === 'active' ? 'Active' : campaign.status === 'upcoming' ? 'À venir' : 'Terminée'}
                      </span>
                      {campaign.category && (
                        <span className="font-mono text-[9px] tracking-[0.15em] text-black/50 uppercase">
                          {campaign.category}
                        </span>
                      )}
                    </div>
                    {campaign.startDate && (
                      <span className="font-mono text-[9px] tracking-[0.1em] text-black/25">
                        Lancée le {new Date(campaign.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                  </div>

                  {/* Title + description */}
                  <h3
                    className="font-heading font-bold text-lg tracking-tight mb-2"
                   
                  >
                    {campaign.title}
                  </h3>
                  <p className="text-black/50 text-sm leading-relaxed mb-4">
                    {campaign.description}
                  </p>

                  {/* Progress + actions */}
                  {isActive && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-[3px] bg-black/10">
                            <div className="h-full bg-black transition-all duration-300" style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="font-mono text-[10px] tracking-[0.1em] text-black/50 shrink-0">
                            {Math.round(progressPct)}%
                          </span>
                        </div>
                        <span className="font-mono text-[9px] tracking-[0.1em] text-black/25 mt-1 block">
                          {campaign.participants.toLocaleString()} participants
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleJoinLeave(campaign)}
                          disabled={isMutatingThis}
                          className={`px-5 py-2.5 text-[11px] font-medium tracking-[0.15em] uppercase border-2 transition-colors duration-100 flex items-center gap-2 disabled:opacity-50 ${
                            isParticipating
                              ? 'border-black/15 text-black/40 hover:border-black hover:text-black'
                              : 'bg-black text-white border-black hover:bg-white hover:text-black'
                          }`}
                        >
                          {isMutatingThis ? (
                            <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                          ) : (
                            <Users size={14} strokeWidth={1.5} />
                          )}
                          {isParticipating ? 'Quitter' : 'Rejoindre'}
                        </button>
                        <button className="px-5 py-2.5 border-2 border-black/15 text-black/40 text-[11px] font-medium tracking-[0.15em] uppercase hover:border-black hover:text-black transition-colors duration-100">
                          Partager
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="border-2 border-black p-8 text-center mt-10">
          <Heart size={20} strokeWidth={1.5} className="mx-auto mb-4 text-brand-turquoise" />
          <h2
            className="font-heading font-bold text-xl tracking-tighter mb-2"
           
          >
            Soutenez nos actions
          </h2>
          <p className="text-black/60 text-sm max-w-md mx-auto mb-6 leading-relaxed">
            Dataring est une association d'intérêt général. Vos dons nous permettent de mener des actions juridiques.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a
              href="https://www.data-ring.net/soutenir"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-white hover:text-black border-2 border-black transition-colors duration-100"
            >
              Faire un don
            </a>
            <a
              href="https://www.data-ring.net/adhesion"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border-2 border-black text-black text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-black hover:text-white transition-colors duration-100"
            >
              Devenir membre
            </a>
          </div>
          <p className="font-mono text-[9px] tracking-[0.1em] text-brand-turquoise/60 uppercase mt-4">
            66% de votre don est déductible de vos impôts
          </p>
        </div>
      </div>
    </div>
  );
}
