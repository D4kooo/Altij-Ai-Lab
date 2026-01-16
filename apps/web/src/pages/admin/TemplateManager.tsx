import { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Download,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { templatesApi, type DocumentTemplate } from '@/lib/api';
import { cn } from '@/lib/utils';

const categoryOptions = [
  { value: 'RGPD', label: 'RGPD', color: 'bg-blue-100 text-blue-700' },
  { value: 'Publicité', label: 'Publicité', color: 'bg-purple-100 text-purple-700' },
  { value: 'Réclamation', label: 'Réclamation', color: 'bg-amber-100 text-amber-700' },
  { value: 'Autre', label: 'Autre', color: 'bg-gray-100 text-gray-700' },
];

export function TemplateManager() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<DocumentTemplate> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templatesApi.list();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce modèle ?')) return;

    try {
      setDeletingId(id);
      await templatesApi.delete(id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    if (!editingTemplate?.title) {
      setError('Le titre est requis');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingTemplate.id) {
        // Update
        const updated = await templatesApi.update(editingTemplate.id, {
          title: editingTemplate.title,
          description: editingTemplate.description || undefined,
          category: editingTemplate.category || undefined,
          content: editingTemplate.content || undefined,
          fileUrl: editingTemplate.fileUrl || undefined,
        });
        setTemplates(templates.map(t => t.id === updated.id ? updated : t));
      } else {
        // Create
        const created = await templatesApi.create({
          title: editingTemplate.title,
          description: editingTemplate.description || undefined,
          category: editingTemplate.category || undefined,
          content: editingTemplate.content || undefined,
          fileUrl: editingTemplate.fileUrl || undefined,
        });
        setTemplates([created, ...templates]);
      }

      setShowModal(false);
      setEditingTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const openNewModal = () => {
    setEditingTemplate({
      title: '',
      description: '',
      category: 'RGPD',
      content: '',
      fileUrl: '',
    });
    setShowModal(true);
  };

  const openEditModal = (template: DocumentTemplate) => {
    setEditingTemplate({ ...template });
    setShowModal(true);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !filterCategory || template.category === filterCategory;
    return matchesSearch && matchesCategory;
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Modèles</h1>
          <p className="text-gray-500 mt-1">
            Créez et gérez les modèles de documents téléchargeables
          </p>
        </div>
        <Button
          onClick={openNewModal}
          className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau modèle
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un modèle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(null)}
            className={filterCategory === null ? 'bg-[#57C5B6] hover:bg-[#4AB0A2]' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Tous
          </Button>
          {categoryOptions.map(({ value, label }) => (
            <Button
              key={value}
              variant={filterCategory === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(value)}
              className={filterCategory === value ? 'bg-[#57C5B6] hover:bg-[#4AB0A2]' : ''}
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

      {/* Templates List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterCategory ? 'Aucun modèle trouvé' : 'Aucun modèle'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || filterCategory
              ? 'Modifiez vos filtres ou créez un nouveau modèle'
              : 'Commencez par créer votre premier modèle'}
          </p>
          {!searchQuery && !filterCategory && (
            <Button
              onClick={openNewModal}
              className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un modèle
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => {
            const categoryInfo = categoryOptions.find(c => c.value === template.category);

            return (
              <div
                key={template.id}
                className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {categoryInfo && (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded',
                          categoryInfo.color
                        )}>
                          {categoryInfo.label}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {template.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                      {template.description || 'Aucune description'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {template.downloadCount.toLocaleString()} téléchargements
                      </span>
                      {template.fileUrl && (
                        <a
                          href={template.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#57C5B6] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Fichier
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      disabled={deletingId === template.id}
                    >
                      {deletingId === template.id ? (
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

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        {categoryOptions.map(({ value, label }) => {
          const count = templates.filter(t => t.category === value).length;
          const downloads = templates
            .filter(t => t.category === value)
            .reduce((sum, t) => sum + t.downloadCount, 0);
          return (
            <div key={value} className="text-center p-4 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-xs text-gray-400">{downloads.toLocaleString()} DL</p>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingTemplate.id ? 'Modifier le modèle' : 'Nouveau modèle'}
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre *
                </label>
                <Input
                  value={editingTemplate.title || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  placeholder="Ex: Demande d'accès aux données"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  placeholder="Description du modèle..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={editingTemplate.category || 'RGPD'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as DocumentTemplate['category'] })}
                    className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL du fichier (optionnel)
                  </label>
                  <Input
                    value={editingTemplate.fileUrl || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, fileUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu du modèle (Markdown)
                </label>
                <Textarea
                  value={editingTemplate.content || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  placeholder={`Objet : Demande d'accès aux données personnelles (Article 15 RGPD)

Madame, Monsieur,

Conformément à l'article 15 du Règlement Général sur la Protection des Données...`}
                  rows={12}
                  className="font-mono text-sm"
                />
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
                  {editingTemplate.id ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplateManager;
