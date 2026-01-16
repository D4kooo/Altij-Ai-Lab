import { useState, useEffect } from 'react';
import {
  Plus,
  Megaphone,
  Edit,
  Trash2,
  Users,
  Calendar,
  Target,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { campaignsApi, type Campaign } from '@/lib/api';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: 'draft', label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: Clock },
  { value: 'upcoming', label: 'À venir', color: 'bg-amber-100 text-amber-700', icon: Calendar },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700', icon: Users },
  { value: 'completed', label: 'Terminée', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
];

export function CampaignManager() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<Campaign> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await campaignsApi.list();
      setCampaigns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette campagne ?')) return;

    try {
      setDeletingId(id);
      await campaignsApi.delete(id);
      setCampaigns(campaigns.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    if (!editingCampaign?.title) {
      setError('Le titre est requis');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingCampaign.id) {
        // Update
        const updated = await campaignsApi.update(editingCampaign.id, {
          title: editingCampaign.title,
          description: editingCampaign.description || undefined,
          target: editingCampaign.target || undefined,
          category: editingCampaign.category || undefined,
          status: editingCampaign.status,
          participantGoal: editingCampaign.participantGoal,
          startDate: editingCampaign.startDate || undefined,
          endDate: editingCampaign.endDate || undefined,
        });
        setCampaigns(campaigns.map(c => c.id === updated.id ? updated : c));
      } else {
        // Create
        const created = await campaignsApi.create({
          title: editingCampaign.title,
          description: editingCampaign.description || undefined,
          target: editingCampaign.target || undefined,
          category: editingCampaign.category || undefined,
          status: editingCampaign.status || 'draft',
          participantGoal: editingCampaign.participantGoal || 1000,
          startDate: editingCampaign.startDate || undefined,
          endDate: editingCampaign.endDate || undefined,
        });
        setCampaigns([created, ...campaigns]);
      }

      setShowModal(false);
      setEditingCampaign(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const openNewModal = () => {
    setEditingCampaign({
      title: '',
      description: '',
      target: '',
      category: '',
      status: 'draft',
      participantGoal: 1000,
    });
    setShowModal(true);
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign({
      ...campaign,
      startDate: campaign.startDate?.split('T')[0],
      endDate: campaign.endDate?.split('T')[0],
    });
    setShowModal(true);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (campaign.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !filterStatus || campaign.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#57C5B6]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Campagnes</h1>
          <p className="text-gray-500 mt-1">
            Créez et gérez les actions collectives
          </p>
        </div>
        <Button
          onClick={openNewModal}
          className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle campagne
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher une campagne..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(null)}
            className={filterStatus === null ? 'bg-[#57C5B6] hover:bg-[#4AB0A2]' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Tous
          </Button>
          {statusOptions.map(({ value, label }) => (
            <Button
              key={value}
              variant={filterStatus === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(value)}
              className={filterStatus === value ? 'bg-[#57C5B6] hover:bg-[#4AB0A2]' : ''}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterStatus ? 'Aucune campagne trouvée' : 'Aucune campagne'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || filterStatus
              ? 'Modifiez vos filtres ou créez une nouvelle campagne'
              : 'Commencez par créer votre première campagne'}
          </p>
          {!searchQuery && !filterStatus && (
            <Button
              onClick={openNewModal}
              className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer une campagne
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign) => {
            const statusInfo = statusOptions.find(s => s.value === campaign.status);
            const StatusIcon = statusInfo?.icon || Clock;
            const progress = Math.min((campaign.participants / campaign.participantGoal) * 100, 100);

            return (
              <div
                key={campaign.id}
                className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="p-3 rounded-xl bg-[#57C5B6]/10 text-[#57C5B6] shrink-0">
                    <Megaphone className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {campaign.title}
                      </h3>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                        statusInfo?.color
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo?.label}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {campaign.description || 'Aucune description'}
                    </p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-400">
                      {campaign.target && (
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {campaign.target}
                        </span>
                      )}
                      {campaign.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(campaign.startDate).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    {campaign.status !== 'draft' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">
                            {campaign.participants.toLocaleString()} participants
                          </span>
                          <span className="text-[#57C5B6] font-medium">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#57C5B6] rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Objectif: {campaign.participantGoal.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(campaign)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(campaign.id)}
                      disabled={deletingId === campaign.id}
                    >
                      {deletingId === campaign.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCampaign.id ? 'Modifier la campagne' : 'Nouvelle campagne'}
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <Input
                  value={editingCampaign.title || ''}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, title: e.target.value })}
                  placeholder="Ex: Transparence des algorithmes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={editingCampaign.description || ''}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                  placeholder="Description de la campagne..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cible
                  </label>
                  <Input
                    value={editingCampaign.target || ''}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, target: e.target.value })}
                    placeholder="Ex: GAFAM"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <Input
                    value={editingCampaign.category || ''}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, category: e.target.value })}
                    placeholder="Ex: RGPD"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={editingCampaign.status || 'draft'}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, status: e.target.value as Campaign['status'] })}
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Objectif participants
                  </label>
                  <Input
                    type="number"
                    value={editingCampaign.participantGoal || 1000}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, participantGoal: parseInt(e.target.value) || 1000 })}
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <Input
                    type="date"
                    value={editingCampaign.startDate || ''}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <Input
                    type="date"
                    value={editingCampaign.endDate || ''}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {editingCampaign.id ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignManager;
