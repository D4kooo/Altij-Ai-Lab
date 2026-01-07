import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Shield,
  Upload,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
  Plus,
  Trash2,
  Eye,
  FileCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { anonymiseurApi, type CensorPreviewResult } from '@/lib/api';

export function Anonymiseur() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [terms, setTerms] = useState<string[]>([]);
  const [newTerm, setNewTerm] = useState('');
  const [previewResult, setPreviewResult] = useState<CensorPreviewResult | null>(null);

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || terms.length === 0) {
        throw new Error('Fichier et termes requis');
      }
      return anonymiseurApi.censorPreview(selectedFile, terms);
    },
    onSuccess: (data) => {
      setPreviewResult(data);
    },
  });

  // Censor mutation
  const censorMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || terms.length === 0) {
        throw new Error('Fichier et termes requis');
      }
      return anonymiseurApi.censor(selectedFile, terms);
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anonymise_${selectedFile?.name || 'document.pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setPreviewResult(null);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
        setPreviewResult(null);
      }
    }
  };

  const addTerm = () => {
    const trimmed = newTerm.trim();
    if (!trimmed) return;
    if (terms.some(t => t.toLowerCase() === trimmed.toLowerCase())) return;

    setTerms(prev => [...prev, trimmed]);
    setNewTerm('');
    setPreviewResult(null);
  };

  const removeTerm = (index: number) => {
    setTerms(prev => prev.filter((_, i) => i !== index));
    setPreviewResult(null);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setTerms([]);
    setNewTerm('');
    setPreviewResult(null);
    censorMutation.reset();
  };

  const canProcess = selectedFile && terms.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Anonymiseur de documents
        </h1>
        <p className="text-muted-foreground mt-1">
          Saisissez les noms, termes ou données à censurer dans votre PDF
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column - Upload and Terms */}
        <div className="space-y-4">
          {/* Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Document PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedFile ? (
                <div
                  className={cn(
                    'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={handleFileChange}
                    accept=".pdf"
                  />
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">Glissez votre PDF ici</p>
                  <p className="mt-1 text-xs text-muted-foreground">ou cliquez pour parcourir</p>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
                  <FileText className="h-10 w-10 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} Ko
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={handleReset}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Termes à censurer
              </CardTitle>
              <CardDescription>
                Ajoutez les noms, sociétés ou données à anonymiser.
                Les mots seront aussi censurés individuellement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Jean Dupont, Société ABC, 12 rue..."
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTerm()}
                  className="flex-1"
                />
                <Button onClick={addTerm} size="icon" disabled={!newTerm.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Terms list */}
              {terms.length > 0 ? (
                <ScrollArea className="h-[200px] rounded-lg border p-3">
                  <div className="space-y-2">
                    {terms.map((term, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-lg bg-muted/50 p-2"
                      >
                        <span className="flex-1 text-sm truncate">{term}</span>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {term.split(/\s+/).length > 1
                            ? `${term.split(/\s+/).length} mots`
                            : '1 mot'
                          }
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeTerm(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                  <p className="text-sm">Aucun terme ajouté</p>
                  <p className="text-xs mt-1">Ajoutez les noms ou données à censurer</p>
                </div>
              )}

              {terms.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  <strong>{terms.length}</strong> terme(s) à censurer
                </p>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => previewMutation.mutate()}
              disabled={!canProcess || previewMutation.isPending}
            >
              {previewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Prévisualiser
                </>
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={() => censorMutation.mutate()}
              disabled={!canProcess || censorMutation.isPending}
            >
              {censorMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Anonymisation...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Anonymiser
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right column - Preview */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Aperçu
            </CardTitle>
            <CardDescription>
              Visualisez les occurrences qui seront censurées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Loading state */}
            {previewMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">
                  Analyse du document...
                </p>
              </div>
            )}

            {/* Error state */}
            {previewMutation.isError && (
              <div className="flex flex-col items-center justify-center py-12 text-destructive">
                <AlertCircle className="h-10 w-10" />
                <p className="mt-4 font-medium">Erreur lors de l'analyse</p>
                <p className="text-sm text-muted-foreground">
                  {(previewMutation.error as Error).message}
                </p>
              </div>
            )}

            {/* Censor error */}
            {censorMutation.isError && (
              <div className="flex flex-col items-center justify-center py-12 text-destructive">
                <AlertCircle className="h-10 w-10" />
                <p className="mt-4 font-medium">Erreur lors de l'anonymisation</p>
                <p className="text-sm text-muted-foreground">
                  {(censorMutation.error as Error).message}
                </p>
              </div>
            )}

            {/* Success state */}
            {censorMutation.isSuccess && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-green-100 p-4 mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-green-700 mb-2">
                  Document anonymisé !
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Le PDF a été téléchargé avec la table de correspondance et le contenu censuré.
                </p>
                <Button variant="outline" className="mt-4" onClick={handleReset}>
                  Nouveau document
                </Button>
              </div>
            )}

            {/* Preview results */}
            {previewResult && !censorMutation.isSuccess && !previewMutation.isPending && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {previewResult.totalOccurrences} occurrences trouvées
                  </Badge>
                  <Badge variant="outline">
                    {previewResult.termsFound} termes trouvés
                  </Badge>
                </div>

                {/* Terms found */}
                {previewResult.terms.filter(t => t.count > 0).length > 0 ? (
                  <ScrollArea className="h-[350px]">
                    <div className="space-y-2">
                      {previewResult.terms
                        .filter(t => t.count > 0)
                        .map((term, idx) => (
                          <div key={idx} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm">{term.original}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{term.count}x</Badge>
                                <Badge variant="outline" className="font-mono text-xs">
                                  {term.replacement}
                                </Badge>
                              </div>
                            </div>
                            {term.original !== term.fromTerm && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Extrait de: {term.fromTerm}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucune occurrence trouvée</p>
                    <p className="text-sm">Vérifiez l'orthographe des termes</p>
                  </div>
                )}

                {/* Not found terms */}
                {previewResult.terms.filter(t => t.count === 0).length > 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-sm font-medium text-amber-700 mb-1">
                      Termes non trouvés dans le document :
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {previewResult.terms
                        .filter(t => t.count === 0)
                        .map((term, idx) => (
                          <Badge key={idx} variant="outline" className="text-amber-600">
                            {term.original}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Initial state */}
            {!previewMutation.isPending && !previewResult && !censorMutation.isSuccess && !censorMutation.isError && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Eye className="h-10 w-10 opacity-50" />
                <p className="mt-4 text-sm text-center">
                  {!selectedFile
                    ? 'Uploadez un PDF pour commencer'
                    : terms.length === 0
                    ? 'Ajoutez les termes à censurer'
                    : 'Cliquez sur "Prévisualiser" pour voir les occurrences'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
