import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bot, Plus, Pencil, Trash2, Loader2, Upload, FileText, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { assistantsApi } from '@/lib/api';
import type { Assistant, OpenRouterModel, AssistantDocument } from '@altij/shared';
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
  const [model, setModel] = useState('anthropic/claude-sonnet-4');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [icon, setIcon] = useState('Bot');
  const [color, setColor] = useState('#3b82f6');
  const [suggestedPrompts, setSuggestedPrompts] = useState('');

  // Document management state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch app assistants
  const { data: appAssistants, isLoading: isLoadingAppAssistants } = useQuery({
    queryKey: ['assistants'],
    queryFn: assistantsApi.list,
  });

  // Fetch OpenRouter models
  const { data: openRouterModels, isLoading: isLoadingModels } = useQuery({
    queryKey: ['openrouter-models'],
    queryFn: assistantsApi.listModels,
    enabled: open,
  });

  // Fetch documents for the editing assistant
  const { data: documents, isLoading: isLoadingDocuments, refetch: refetchDocuments } = useQuery({
    queryKey: ['assistant-documents', editingAssistant?.id],
    queryFn: () => editingAssistant ? assistantsApi.listDocuments(editingAssistant.id) : Promise.resolve([]),
    enabled: !!editingAssistant && viewMode === 'edit',
    refetchInterval: (query) => {
      // Poll for updates if there are processing documents
      const docs = query.state.data as AssistantDocument[] | undefined;
      const hasProcessing = docs?.some(d => d.status === 'processing');
      return hasProcessing ? 3000 : false;
    },
  });

  // Upload document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ assistantId, file }: { assistantId: string; file: File }) => {
      return assistantsApi.uploadDocument(assistantId, file, file.name);
    },
    onSuccess: (_, variables) => {
      setUploadingFiles(prev => prev.filter(f => f !== variables.file.name));
      refetchDocuments();
    },
    onError: (error: unknown, variables) => {
      setUploadingFiles(prev => prev.filter(f => f !== variables.file.name));
      setFormError(getErrorMessage(error, `Erreur lors de l'upload de ${variables.file.name}`));
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async ({ assistantId, documentId }: { assistantId: string; documentId: string }) => {
      return assistantsApi.deleteDocument(assistantId, documentId);
    },
    onSuccess: () => {
      refetchDocuments();
    },
    onError: (error: unknown) => {
      setFormError(getErrorMessage(error, 'Erreur lors de la suppression du document'));
    },
  });

  // Helper to extract error message
  const getErrorMessage = (error: unknown, defaultMessage: string): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      if (typeof err.message === 'string') return err.message;
      if (typeof err.error === 'string') return err.error;
      // Zod validation errors
      if (Array.isArray(err.issues)) {
        return err.issues.map((i: { message?: string }) => i.message).join(', ');
      }
    }
    return defaultMessage;
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: assistantsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      resetForm();
      setViewMode('list');
    },
    onError: (error: unknown) => {
      setFormError(getErrorMessage(error, 'Une erreur est survenue lors de la création'));
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
      setFormError(getErrorMessage(error, 'Une erreur est survenue lors de la mise à jour'));
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
    setModel('anthropic/claude-sonnet-4');
    setSystemPrompt('');
    setTemperature(0.7);
    setMaxTokens(4096);
    setName('');
    setDescription('');
    setSpecialty('');
    setIcon('Bot');
    setColor('#3b82f6');
    setSuggestedPrompts('');
    setEditingAssistant(null);
    setFormError(null);
    setUploadingFiles([]);
  };

  // Document upload handlers
  const handleFileDrop = useCallback(async (files: FileList | File[]) => {
    if (!editingAssistant) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];
    const maxSize = 20 * 1024 * 1024; // 20MB

    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.md')) {
        setFormError(`Type de fichier non supporté: ${file.name}. Formats acceptés: PDF, DOCX, TXT, MD`);
        continue;
      }
      if (file.size > maxSize) {
        setFormError(`Le fichier ${file.name} dépasse la limite de 20MB`);
        continue;
      }

      setUploadingFiles(prev => [...prev, file.name]);
      uploadDocumentMutation.mutate({ assistantId: editingAssistant.id, file });
    }
  }, [editingAssistant, uploadDocumentMutation]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileDrop(e.dataTransfer.files);
    }
  }, [handleFileDrop]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileDrop(e.target.files);
      e.target.value = ''; // Reset input
    }
  }, [handleFileDrop]);

  const handleDeleteDocument = useCallback((documentId: string) => {
    if (!editingAssistant) return;
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      deleteDocumentMutation.mutate({ assistantId: editingAssistant.id, documentId });
    }
  }, [editingAssistant, deleteDocumentMutation]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const handleCreate = () => {
    resetForm();
    setViewMode('create');
  };

  const handleEdit = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setModel(assistant.model || 'anthropic/claude-sonnet-4');
    setSystemPrompt(assistant.systemPrompt || '');
    setTemperature(assistant.temperature ?? 0.7);
    setMaxTokens(assistant.maxTokens ?? 4096);
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
    if (!model) {
      setFormError('Veuillez sélectionner un modèle');
      return;
    }
    if (!systemPrompt.trim()) {
      setFormError('Le prompt système est requis');
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
      type: 'openrouter' as const,
      model,
      systemPrompt: systemPrompt.trim(),
      temperature,
      maxTokens,
      name: name.trim(),
      description: description.trim(),
      specialty,
      icon,
      color,
      suggestedPrompts: promptsArray,
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

  // Format model display
  const formatModelName = (modelData: OpenRouterModel) => {
    const contextK = modelData.contextLength ? `${Math.round(modelData.contextLength / 1000)}k` : '';
    const price = modelData.pricing?.prompt ? `$${parseFloat(modelData.pricing.prompt).toFixed(4)}/1K` : '';
    return { name: modelData.name, context: contextK, price };
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {viewMode === 'list' && 'Gestion des assistants'}
            {viewMode === 'create' && 'Créer un assistant'}
            {viewMode === 'edit' && 'Modifier l\'assistant'}
          </DialogTitle>
          <DialogDescription>
            {viewMode === 'list' && 'Gérez les assistants IA disponibles dans l\'application'}
            {viewMode === 'create' && 'Créez un nouvel assistant avec un modèle OpenRouter'}
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

            <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
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
                        {assistant.type === 'webhook' ? 'Webhook' : assistant.model?.split('/')[1] || 'OpenRouter'}
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
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto -mx-6 px-6 min-h-0">
              <div className="space-y-4 py-4">
                {formError && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {formError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="model">Modèle IA *</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un modèle" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingModels ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : openRouterModels && openRouterModels.length > 0 ? (
                        openRouterModels.map((m) => {
                          const formatted = formatModelName(m);
                          return (
                            <SelectItem key={m.id} value={m.id}>
                              <div className="flex items-center gap-2">
                                <span>{formatted.name}</span>
                                {formatted.context && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatted.context}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })
                      ) : (
                        <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                          Aucun modèle disponible
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">Prompt système *</Label>
                  <Textarea
                    id="systemPrompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Tu es un assistant juridique spécialisé en droit des affaires. Tu aides les avocats à rédiger des contrats et à analyser des documents juridiques..."
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Instructions qui définissent le comportement et la personnalité de l'assistant
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Température ({temperature.toFixed(1)})</Label>
                    <input
                      id="temperature"
                      type="range"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <p className="text-xs text-muted-foreground">
                      0 = précis, 2 = créatif
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(Number(e.target.value))}
                      min={100}
                      max={128000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Longueur max de la réponse
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-4">Métadonnées</h4>
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
                    placeholder="Description courte de l'assistant pour les utilisateurs"
                    rows={2}
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

                {/* Knowledge Base Section - Only in edit mode */}
                {viewMode === 'edit' && editingAssistant && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Base de connaissances (RAG)
                    </h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Ajoutez des documents pour enrichir les réponses de l'assistant avec des connaissances spécifiques.
                    </p>

                    {/* Upload Zone */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        isDragging
                          ? 'border-primary bg-primary/5'
                          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.txt,.md"
                        multiple
                        onChange={handleFileInputChange}
                      />
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Glissez-déposez vos fichiers ici, ou{' '}
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          parcourez
                        </button>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOCX, TXT, MD • Max 20MB par fichier
                      </p>
                    </div>

                    {/* Uploading Files */}
                    {uploadingFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {uploadingFiles.map((fileName) => (
                          <div
                            key={fileName}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                          >
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm flex-1 truncate">{fileName}</span>
                            <span className="text-xs text-muted-foreground">Traitement...</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Documents List */}
                    {isLoadingDocuments ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : documents && documents.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-2 p-2 rounded-lg border border-primary/[0.04] hover:bg-primary/[0.02]"
                          >
                            {getDocumentIcon(doc.mimeType)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(doc.fileSize)}
                                {doc.chunksCount !== undefined && ` • ${doc.chunksCount} chunks`}
                              </p>
                            </div>
                            {doc.status === 'processing' && (
                              <div className="flex items-center gap-1 text-amber-500">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span className="text-xs">Traitement</span>
                              </div>
                            )}
                            {doc.status === 'ready' && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {doc.status === 'error' && (
                              <div className="flex items-center gap-1 text-destructive" title={doc.errorMessage || 'Erreur'}>
                                <AlertCircle className="h-4 w-4" />
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteDocument(doc.id)}
                              disabled={deleteDocumentMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center mt-3">
                        Aucun document ajouté
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t mt-auto shrink-0">
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
              <Button type="submit" disabled={isSubmitting || !model || !systemPrompt}>
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
