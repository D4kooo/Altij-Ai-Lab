import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { assistantsApi } from '@/lib/api';
import type { Assistant } from '@altij/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AssistantManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ICON_OPTIONS = [
  'Bot', 'Scale', 'FileText', 'Briefcase', 'Building2', 'Gavel',
  'BookOpen', 'MessageSquare', 'Search', 'Shield', 'Users', 'Zap',
];

const COLOR_OPTIONS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Red', value: '#ef4444' },
];

const SPECIALTY_OPTIONS = [
  'Droit des affaires',
  'Droit du travail',
  'Droit fiscal',
  'Droit immobilier',
  'Propriété intellectuelle',
  'Droit pénal',
  'Droit de la famille',
  'Contentieux',
  'Rédaction',
  'Recherche',
  'Général',
];

type ViewMode = 'list' | 'create' | 'edit';

export function AssistantManagement({ open, onOpenChange }: AssistantManagementProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [selectedOpenAIId, setSelectedOpenAIId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [icon, setIcon] = useState('Bot');
  const [color, setColor] = useState('#3b82f6');
  const [suggestedPrompts, setSuggestedPrompts] = useState('');

  // Fetch app assistants
  const { data: appAssistants, isLoading: isLoadingAppAssistants } = useQuery({
    queryKey: ['assistants'],
    queryFn: assistantsApi.list,
  });

  // Fetch OpenAI assistants
  const { data: openAIAssistants, isLoading: isLoadingOpenAI } = useQuery({
    queryKey: ['openai-assistants'],
    queryFn: assistantsApi.listOpenAI,
    enabled: open,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: assistantsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      resetForm();
      setViewMode('list');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        setFormError(error.message);
      } else if (typeof error === 'string') {
        setFormError(error);
      } else {
        setFormError('Une erreur est survenue lors de la création');
      }
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Assistant> }) =>
      assistantsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      resetForm();
      setViewMode('list');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        setFormError(error.message);
      } else if (typeof error === 'string') {
        setFormError(error);
      } else {
        setFormError('Une erreur est survenue lors de la mise à jour');
      }
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: assistantsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
    },
  });

  const resetForm = () => {
    setSelectedOpenAIId('');
    setName('');
    setDescription('');
    setSpecialty('');
    setIcon('Bot');
    setColor('#3b82f6');
    setSuggestedPrompts('');
    setEditingAssistant(null);
    setFormError(null);
  };

  const handleOpenAISelect = (openaiId: string) => {
    setSelectedOpenAIId(openaiId);
    const selected = openAIAssistants?.find((a) => a.id === openaiId);
    if (selected) {
      setName(selected.name || '');
      setDescription(selected.description || '');
    }
  };

  const handleCreate = () => {
    resetForm();
    setViewMode('create');
  };

  const handleEdit = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setSelectedOpenAIId(assistant.openaiAssistantId || '');
    setName(assistant.name);
    setDescription(assistant.description);
    setSpecialty(assistant.specialty);
    setIcon(assistant.icon);
    setColor(assistant.color);
    setSuggestedPrompts((assistant.suggestedPrompts || []).join('\n'));
    setViewMode('edit');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate required fields
    if (!selectedOpenAIId) {
      setFormError('Veuillez sélectionner un assistant OpenAI');
      return;
    }
    if (!name.trim()) {
      setFormError('Le nom est requis');
      return;
    }
    if (!description.trim()) {
      setFormError('La description est requise');
      return;
    }
    if (!specialty) {
      setFormError('La spécialité est requise');
      return;
    }

    const promptsArray = suggestedPrompts
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const data = {
      type: 'openai' as const,
      openaiAssistantId: selectedOpenAIId,
      webhookUrl: null,
      name: name.trim(),
      description: description.trim(),
      specialty,
      icon,
      color,
      suggestedPrompts: promptsArray,
      isPinned: false,
      pinOrder: null,
    };

    if (viewMode === 'edit' && editingAssistant) {
      updateMutation.mutate({ id: editingAssistant.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet assistant ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleClose = () => {
    resetForm();
    setViewMode('list');
    onOpenChange(false);
  };

  // Filter out OpenAI assistants that are already linked (except current one being edited)
  const availableOpenAIAssistants = openAIAssistants?.filter(
    (oai) =>
      !appAssistants?.some(
        (app) =>
          app.openaiAssistantId === oai.id &&
          app.id !== editingAssistant?.id
      )
  );

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {viewMode === 'list' && 'Gestion des assistants'}
            {viewMode === 'create' && 'Créer un assistant'}
            {viewMode === 'edit' && 'Modifier l\'assistant'}
          </DialogTitle>
          <DialogDescription>
            {viewMode === 'list' && 'Gérez les assistants IA disponibles dans l\'application'}
            {viewMode === 'create' && 'Liez un assistant OpenAI à l\'application'}
            {viewMode === 'edit' && 'Modifiez les paramètres de l\'assistant'}
          </DialogDescription>
        </DialogHeader>

        {viewMode === 'list' ? (
          <>
            <div className="flex justify-end">
              <Button onClick={handleCreate} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nouvel assistant
              </Button>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              {isLoadingAppAssistants ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : appAssistants && appAssistants.length > 0 ? (
                <div className="space-y-3">
                  {appAssistants.map((assistant) => (
                    <div
                      key={assistant.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-primary/[0.04] hover:bg-primary/[0.02] transition-colors"
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${assistant.color}15`,
                          color: assistant.color,
                        }}
                      >
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{assistant.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {assistant.specialty}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {assistant.type === 'webhook' ? 'Webhook' : assistant.openaiAssistantId?.slice(0, 12) + '...'}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(assistant)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(assistant.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun assistant configuré
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 pb-4">
                {formError && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {formError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="openai-assistant">Assistant OpenAI *</Label>
                  <Select
                    value={selectedOpenAIId}
                    onValueChange={handleOpenAISelect}
                    disabled={viewMode === 'edit'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un assistant OpenAI" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingOpenAI ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : availableOpenAIAssistants && availableOpenAIAssistants.length > 0 ? (
                        availableOpenAIAssistants.map((oai) => (
                          <SelectItem key={oai.id} value={oai.id}>
                            <div className="flex flex-col">
                              <span>{oai.name || 'Sans nom'}</span>
                              <span className="text-xs text-muted-foreground">
                                {oai.id}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          Aucun assistant OpenAI disponible
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nom de l'assistant"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description de l'assistant"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">Spécialité *</Label>
                  <Select value={specialty} onValueChange={setSpecialty} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une spécialité" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALTY_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icône</Label>
                    <Select value={icon} onValueChange={setIcon}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((i) => (
                          <SelectItem key={i} value={i}>
                            {i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Couleur</Label>
                    <Select value={color} onValueChange={setColor}>
                      <SelectTrigger>
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-4 w-4 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            {COLOR_OPTIONS.find((c) => c.value === color)?.name}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-4 w-4 rounded-full"
                                style={{ backgroundColor: c.value }}
                              />
                              {c.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompts">Prompts suggérés (un par ligne)</Label>
                  <Textarea
                    id="prompts"
                    value={suggestedPrompts}
                    onChange={(e) => setSuggestedPrompts(e.target.value)}
                    placeholder="Rédige un contrat de travail&#10;Analyse ce document juridique&#10;Explique cette clause"
                    rows={4}
                  />
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setViewMode('list');
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedOpenAIId}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {viewMode === 'edit' ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
