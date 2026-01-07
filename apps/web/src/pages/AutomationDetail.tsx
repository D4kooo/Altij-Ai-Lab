import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import {
  Zap,
  ArrowLeft,
  Clock,
  Upload,
  X,
  FileText,
  Loader2,
  ChevronDown,
  Check,
  Eye,
  Send,
  Edit3,
  Download,
} from 'lucide-react';
import { automationsApi, lettreMissionApi } from '@/lib/api';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDuration, cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import type { InputField, InputFieldCondition } from '@altij/shared';

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[name] || Zap;
  return <Icon className={className} />;
}

interface FormValues {
  [key: string]: string | number | boolean | File | File[] | undefined;
}

// Check if a field should be visible based on conditions
function shouldShowField(
  field: InputField,
  formValues: FormValues
): boolean {
  if (!field.showWhen || field.showWhen.length === 0) return true;

  return field.showWhen.every((condition: InputFieldCondition) => {
    const fieldValue = formValues[condition.field];

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'notEquals':
        return fieldValue !== condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value as string);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue as string);
      default:
        return true;
    }
  });
}

// Group fields by section
function groupFieldsBySection(fields: InputField[]): Map<string, InputField[]> {
  const grouped = new Map<string, InputField[]>();

  fields.forEach((field) => {
    const section = field.section || 'default';
    if (!grouped.has(section)) {
      grouped.set(section, []);
    }
    grouped.get(section)!.push(field);
  });

  return grouped;
}

// Check if this is a Lettre de Mission automation
function isLettreMission(automation: { name: string; category: string } | undefined): boolean {
  return automation?.name === 'Lettre de Mission' || automation?.category === 'Propriété Intellectuelle';
}

export function AutomationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState<FormValues>({});
  const [files, setFiles] = useState<{ [key: string]: File[] }>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['default']));

  // PDF Preview state
  const [previewMode, setPreviewMode] = useState<'form' | 'preview'>('form');
  const [pdfPreview, setPdfPreview] = useState<{ pdf: string; filename: string } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const { data: automation, isLoading } = useQuery({
    queryKey: ['automations', id],
    queryFn: () => automationsApi.get(id!),
    enabled: !!id,
  });

  // Initialize default values
  useEffect(() => {
    if (automation?.inputSchema) {
      const defaults: FormValues = {};
      automation.inputSchema.forEach((field) => {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        }
      });
      setFormValues((prev) => ({ ...defaults, ...prev }));
    }
  }, [automation]);

  // Get visible fields based on conditions
  const visibleFields = useMemo(() => {
    if (!automation?.inputSchema) return [];
    return automation.inputSchema.filter((field) => shouldShowField(field, formValues));
  }, [automation?.inputSchema, formValues]);

  // Group visible fields by section
  const groupedFields = useMemo(() => {
    return groupFieldsBySection(visibleFields);
  }, [visibleFields]);

  // Get section metadata from the first field of each section
  const sectionMeta = useMemo(() => {
    const meta: { [key: string]: { title?: string; description?: string } } = {};
    visibleFields.forEach((field) => {
      const section = field.section || 'default';
      if (!meta[section] && (field.sectionTitle || field.sectionDescription)) {
        meta[section] = {
          title: field.sectionTitle,
          description: field.sectionDescription,
        };
      }
    });
    return meta;
  }, [visibleFields]);

  // Auto-expand sections when their fields become visible
  useEffect(() => {
    const newSections = new Set(expandedSections);
    let changed = false;

    groupedFields.forEach((fields, section) => {
      // Check if any required field in this section needs to be filled
      const hasVisibleRequiredField = fields.some(
        (f) => f.required && formValues[f.name] === undefined
      );

      // Auto-expand if we have a required field that needs attention
      // Only for the first unfilled section
      if (hasVisibleRequiredField && !newSections.has(section)) {
        // Find if all previous sections are complete
        let canExpand = true;
        for (const [prevSection] of groupedFields) {
          if (prevSection === section) break;
          const prevFields = groupedFields.get(prevSection) || [];
          const prevComplete = prevFields.every(
            (f) => !f.required || (formValues[f.name] !== undefined && formValues[f.name] !== '')
          );
          if (!prevComplete) {
            canExpand = false;
            break;
          }
        }

        if (canExpand) {
          newSections.add(section);
          changed = true;
        }
      }
    });

    if (changed) {
      setExpandedSections(newSections);
    }
  }, [groupedFields, formValues]);

  // Removed auto-scroll - it was causing page jumps

  // Generate PDF preview mutation (for Lettre de Mission)
  const generatePreview = useMutation({
    mutationFn: () => {
      return lettreMissionApi.preview(formValues as Record<string, unknown>);
    },
    onSuccess: (data) => {
      setPdfPreview({ pdf: data.pdf, filename: data.filename });
      setPreviewMode('preview');
      setPreviewError(null);
    },
    onError: (error) => {
      setPreviewError(error instanceof Error ? error.message : 'Erreur lors de la génération');
    },
  });

  // Send for signature mutation (for Lettre de Mission)
  const sendForSignature = useMutation({
    mutationFn: () => {
      return lettreMissionApi.sendToSignature(id!, formValues as Record<string, unknown>);
    },
    onSuccess: (data) => {
      navigate(`/automations/runs/${data.runId}`);
    },
    onError: (error) => {
      setPreviewError(error instanceof Error ? error.message : "Erreur lors de l'envoi");
    },
  });

  const runAutomation = useMutation({
    mutationFn: () => {
      const inputs: Record<string, unknown> = { ...formValues };

      // Remove file fields from inputs (they're handled separately)
      automation?.inputSchema?.forEach((field) => {
        if (field.type === 'file' || field.type === 'multifile') {
          delete inputs[field.name];
        }
      });

      // TODO: Implement file upload to get URLs
      return automationsApi.run(id!, { inputs });
    },
    onSuccess: (data) => {
      navigate(`/automations/runs/${data.runId}`);
    },
  });

  const handleInputChange = (name: string, value: string | number | boolean) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));

    // Auto-expand next section after filling a field
    const fieldIndex = visibleFields.findIndex((f) => f.name === name);
    if (fieldIndex >= 0) {
      const currentField = visibleFields[fieldIndex];
      const currentSection = currentField.section || 'default';

      // Check if current section is now complete
      const currentSectionFields = groupedFields.get(currentSection) || [];
      const allCurrentFilled = currentSectionFields.every((f) => {
        if (!f.required) return true;
        const val = f.name === name ? value : formValues[f.name];
        return val !== undefined && val !== '';
      });

      if (allCurrentFilled) {
        // Find and expand next section
        const sections = Array.from(groupedFields.keys());
        const currentSectionIndex = sections.indexOf(currentSection);
        if (currentSectionIndex < sections.length - 1) {
          const nextSection = sections[currentSectionIndex + 1];
          setExpandedSections((prev) => new Set([...prev, nextSection]));
        }
      }
    }
  };

  const handleFileChange = (name: string, newFiles: File[]) => {
    setFiles((prev) => ({ ...prev, [name]: newFiles }));
  };

  const removeFile = (name: string, index: number) => {
    setFiles((prev) => ({
      ...prev,
      [name]: prev[name]?.filter((_, i) => i !== index) || [],
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For Lettre de Mission, generate preview first
    if (isLettreMission(automation)) {
      generatePreview.mutate();
    } else {
      runAutomation.mutate();
    }
  };

  const handleBackToForm = () => {
    setPreviewMode('form');
    setPdfPreview(null);
    setPreviewError(null);
  };

  const handleConfirmAndSend = () => {
    sendForSignature.mutate();
  };

  const handleDownloadPdf = () => {
    if (!pdfPreview) return;
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${pdfPreview.pdf}`;
    link.download = pdfPreview.filename;
    link.click();
  };

  const isFormValid = () => {
    if (!automation?.inputSchema) return true;

    return visibleFields.every((field) => {
      if (!field.required) return true;

      if (field.type === 'file') {
        return files[field.name]?.length > 0;
      }
      if (field.type === 'multifile') {
        return files[field.name]?.length > 0;
      }

      const value = formValues[field.name];
      return value !== undefined && value !== '';
    });
  };

  const isSectionComplete = (section: string) => {
    const fields = groupedFields.get(section) || [];
    return fields.every((field) => {
      if (!field.required) return true;
      if (field.type === 'file' || field.type === 'multifile') {
        return files[field.name]?.length > 0;
      }
      const value = formValues[field.name];
      return value !== undefined && value !== '';
    });
  };

  if (isLoading || !automation) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sections = Array.from(groupedFields.keys());
  const isLM = isLettreMission(automation);

  // PDF Preview Mode
  if (previewMode === 'preview' && pdfPreview) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" onClick={handleBackToForm}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au formulaire
        </Button>

        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${automation.color}20`,
                  color: automation.color,
                }}
              >
                <Eye className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">Aperçu de la Lettre de Mission</CardTitle>
                <CardDescription className="mt-2">
                  Vérifiez le contenu du document avant de l'envoyer pour signature.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* PDF Viewer */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <iframe
              src={`data:application/pdf;base64,${pdfPreview.pdf}`}
              className="w-full h-[70vh] border-0"
              title="Aperçu PDF"
            />
          </CardContent>
        </Card>

        {/* Error message */}
        {previewError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{previewError}</p>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleBackToForm}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleDownloadPdf}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger PDF
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmAndSend}
                disabled={sendForSignature.isPending}
              >
                {sendForSignature.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Envoyer pour signature
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link to="/automations">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux automatisations
        </Link>
      </Button>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${automation.color}20`,
                color: automation.color,
              }}
            >
              <DynamicIcon name={automation.icon} className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">{automation.name}</CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{automation.category}</Badge>
                {automation.estimatedDuration && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDuration(automation.estimatedDuration)}
                  </div>
                )}
              </div>
            </div>
          </div>
          <CardDescription className="mt-4">
            {automation.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {sections.map((section, sectionIndex) => {
          const fields = groupedFields.get(section) || [];
          const meta = sectionMeta[section] || {};
          const isExpanded = expandedSections.has(section);
          const isComplete = isSectionComplete(section);
          const isFirst = sectionIndex === 0;

          return (
            <Card
              key={section}
              className={cn(
                'transition-all duration-300 overflow-hidden',
                isExpanded ? 'ring-2 ring-primary/20' : 'hover:bg-muted/50'
              )}
            >
              {/* Section Header - Clickable */}
              <div
                className={cn(
                  'cursor-pointer',
                  !isFirst && 'border-b'
                )}
                onClick={() => toggleSection(section)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Step indicator */}
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                          isComplete
                            ? 'bg-green-100 text-green-700'
                            : isExpanded
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {isComplete ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          sectionIndex + 1
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {meta.title || `Étape ${sectionIndex + 1}`}
                        </CardTitle>
                        {meta.description && (
                          <CardDescription className="text-sm">
                            {meta.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-5 w-5 text-muted-foreground transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </div>
                </CardHeader>
              </div>

              {/* Section Content - Animated */}
              <div
                className={cn(
                  'grid transition-all duration-300 ease-in-out',
                  isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                )}
              >
                <div className="overflow-hidden">
                  <CardContent className="pt-0 pb-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {fields.map((field) => (
                        <div
                          key={field.name}
                          className={cn(
                            'transition-all duration-200',
                            field.width === 'full' && 'md:col-span-2',
                            field.width === 'third' && 'md:col-span-1',
                            !field.width && 'md:col-span-2'
                          )}
                        >
                          <FormField
                            field={field}
                            value={formValues[field.name] as string | number | boolean | undefined}
                            files={files[field.name] || []}
                            onChange={(value) => handleInputChange(field.name, value)}
                            onFileChange={(newFiles) => handleFileChange(field.name, newFiles)}
                            onFileRemove={(index) => removeFile(field.name, index)}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Error message */}
        {previewError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{previewError}</p>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!isFormValid() || runAutomation.isPending || generatePreview.isPending}
            >
              {(runAutomation.isPending || generatePreview.isPending) ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Génération en cours...
                </>
              ) : isLM ? (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  Générer l'aperçu
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Lancer l'automatisation
                </>
              )}
            </Button>
            {isLM && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                Un aperçu du PDF sera généré pour vérification avant envoi pour signature.
              </p>
            )}
            {/* Debug info - à supprimer en production */}
            {!isFormValid() && (
              <div className="text-xs text-orange-500 text-center mt-2 text-left p-2 bg-orange-50 rounded">
                <p className="font-semibold">Formulaire incomplet. Champs manquants :</p>
                <ul className="mt-1 space-y-1">
                  {visibleFields
                    .filter((field) => {
                      if (!field.required) return false;
                      // Check file fields separately
                      if (field.type === 'file' || field.type === 'multifile') {
                        return !files[field.name] || files[field.name].length === 0;
                      }
                      const value = formValues[field.name];
                      return value === undefined || value === '';
                    })
                    .map((field) => (
                      <li key={field.name}>
                        • <span className="font-medium">{field.label}</span>
                        <span className="text-gray-500"> ({field.name})</span>
                        <span className="text-red-600 ml-2">
                          {field.type === 'file' || field.type === 'multifile'
                            ? `fichiers: ${files[field.name]?.length || 0}`
                            : `valeur: ${JSON.stringify(formValues[field.name])}`}
                        </span>
                        {field.showWhen && (
                          <span className="text-blue-500 ml-1">
                            [conditionnel: {field.showWhen.map(c => `${c.field}=${c.value}`).join(', ')}]
                          </span>
                        )}
                      </li>
                    ))}
                </ul>
                <p className="mt-2 text-gray-600">
                  Champs visibles: {visibleFields.length} |
                  Requis visibles: {visibleFields.filter(f => f.required).length} |
                  Sections: {sections.length}
                </p>
                <p className="mt-1 text-gray-500">
                  Sections complètes: {sections.filter(s => isSectionComplete(s)).join(', ') || 'aucune'}
                </p>
                <p className="text-gray-500">
                  Sections incomplètes: {sections.filter(s => !isSectionComplete(s)).join(', ') || 'aucune'}
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-blue-600">Voir tous les champs visibles requis</summary>
                  <ul className="mt-1 text-gray-600 max-h-40 overflow-y-auto text-left">
                    {visibleFields.filter(f => f.required).map(f => {
                      const isFileField = f.type === 'file' || f.type === 'multifile';
                      const isValid = isFileField
                        ? (files[f.name]?.length || 0) > 0
                        : formValues[f.name] !== undefined && formValues[f.name] !== '';
                      return (
                        <li key={f.name} className={isValid ? 'text-green-600' : 'text-red-600'}>
                          {isValid ? '✓' : '✗'} {f.name}: {isFileField ? `${files[f.name]?.length || 0} fichier(s)` : JSON.stringify(formValues[f.name])} [{f.section}]
                        </li>
                      );
                    })}
                  </ul>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

interface FormFieldProps {
  field: InputField;
  value: string | number | boolean | undefined;
  files: File[];
  onChange: (value: string | number | boolean) => void;
  onFileChange: (files: File[]) => void;
  onFileRemove: (index: number) => void;
}

function FormField({
  field,
  value,
  files,
  onChange,
  onFileChange,
  onFileRemove,
}: FormFieldProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (field.type === 'file') {
        onFileChange(acceptedFiles.slice(0, 1));
      } else {
        onFileChange([...files, ...acceptedFiles].slice(0, field.maxFiles || 10));
      }
    },
    accept: field.accept
      ? field.accept.split(',').reduce(
          (acc, ext) => {
            const mimeTypes: Record<string, string> = {
              '.pdf': 'application/pdf',
              '.doc': 'application/msword',
              '.docx':
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              '.txt': 'text/plain',
              '.csv': 'text/csv',
            };
            const mime = mimeTypes[ext.trim()];
            if (mime) {
              acc[mime] = [ext.trim()];
            }
            return acc;
          },
          {} as Record<string, string[]>
        )
      : undefined,
    multiple: field.type === 'multifile',
    disabled: field.type === 'file' && files.length > 0,
  });

  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>
          <Input
            id={field.name}
            type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {field.helpText && (
            <p className="text-sm text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>
          <Textarea
            id={field.name}
            placeholder={field.placeholder}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            rows={4}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {field.helpText && (
            <p className="text-sm text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );

    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>
          <Input
            id={field.name}
            type="number"
            placeholder={field.placeholder}
            value={(value as number) ?? ''}
            onChange={(e) => onChange(Number(e.target.value))}
            required={field.required}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {field.helpText && (
            <p className="text-sm text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>
          <Select
            value={(value as string) || ''}
            onValueChange={(v) => onChange(v)}
            required={field.required}
          >
            <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
              <SelectValue placeholder={field.placeholder || 'Sélectionnez...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.helpText && (
            <p className="text-sm text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );

    case 'file':
    case 'multifile':
      return (
        <div className="space-y-2">
          <Label>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50',
              files.length > 0 && field.type === 'file' && 'pointer-events-none opacity-50'
            )}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isDragActive
                ? 'Déposez le fichier ici...'
                : 'Glissez-déposez un fichier ici, ou cliquez pour sélectionner'}
            </p>
            {field.accept && (
              <p className="mt-1 text-xs text-muted-foreground">
                Formats acceptés : {field.accept}
              </p>
            )}
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-2 rounded-lg border bg-muted/50 p-2"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onFileRemove(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {field.helpText && (
            <p className="text-sm text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            id={field.name}
            type="checkbox"
            checked={(value as boolean) || false}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-input transition-all duration-200"
          />
          <Label htmlFor={field.name} className="font-normal">
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>
        </div>
      );

    case 'date':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-destructive"> *</span>}
          </Label>
          <Input
            id={field.name}
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
          />
          {field.helpText && (
            <p className="text-sm text-muted-foreground">{field.helpText}</p>
          )}
        </div>
      );

    default:
      return null;
  }
}
