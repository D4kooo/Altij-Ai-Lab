import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  BookOpen,
  FileText,
  HelpCircle,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  coursesApi,
  type Course,
  type Module,
  type ModuleWithDetails,
  type Lesson,
} from '@/lib/api';
import { cn } from '@/lib/utils';

const audienceOptions = [
  { value: 'juniors', label: 'Juniors (7-15 ans)', description: 'Contenu adapté aux jeunes' },
  { value: 'adultes', label: 'Adultes (16-60 ans)', description: 'Contenu standard' },
  { value: 'seniors', label: 'Seniors (60+ ans)', description: 'Interface et rythme adaptés' },
];

const difficultyOptions = [
  { value: 'facile', label: 'Facile', color: 'text-green-600' },
  { value: 'moyen', label: 'Moyen', color: 'text-amber-600' },
  { value: 'expert', label: 'Expert', color: 'text-red-600' },
];

const colorOptions = ['#57C5B6', '#6366f1', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

// Helper to convert null values to undefined for API compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanNulls<T extends Record<string, any>>(obj: T): Record<string, any> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v])
  );
}

export function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Course data
  const [course, setCourse] = useState<Partial<Course>>({
    name: '',
    description: '',
    audience: 'adultes',
    icon: 'BookOpen',
    color: '#57C5B6',
    isPublished: false,
    order: 0,
  });

  // Modules
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleDetails, setModuleDetails] = useState<Map<string, ModuleWithDetails>>(new Map());
  const [loadingModules, setLoadingModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id && id !== 'new') {
      loadCourse(id);
    }
  }, [id]);

  const loadCourse = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await coursesApi.get(courseId);
      setCourse(data);
      setModules(data.modules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadModuleDetails = async (moduleId: string) => {
    if (moduleDetails.has(moduleId)) return;

    try {
      setLoadingModules(prev => new Set(prev).add(moduleId));
      const data = await coursesApi.getModule(moduleId);
      setModuleDetails(prev => new Map(prev).set(moduleId, data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du module');
    } finally {
      setLoadingModules(prev => {
        const next = new Set(prev);
        next.delete(moduleId);
        return next;
      });
    }
  };

  const handleSaveCourse = async () => {
    if (!course.name || !course.audience) {
      setError('Le nom et l\'audience sont requis');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isNew) {
        const created = await coursesApi.create({
          name: course.name,
          description: course.description || undefined,
          audience: course.audience as 'juniors' | 'adultes' | 'seniors',
          icon: course.icon,
          color: course.color,
          isPublished: course.isPublished,
          order: course.order,
        });
        navigate(`/admin/courses/${created.id}`);
      } else if (id) {
        await coursesApi.update(id, {
          name: course.name,
          description: course.description || undefined,
          audience: course.audience as 'juniors' | 'adultes' | 'seniors',
          icon: course.icon,
          color: course.color,
          isPublished: course.isPublished,
          order: course.order,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleAddModule = async () => {
    if (!id || isNew) {
      setError('Veuillez d\'abord sauvegarder le cours');
      return;
    }

    try {
      const module = await coursesApi.createModule({
        courseId: id,
        title: 'Nouveau module',
        description: '',
        order: modules.length,
      });
      setModules([...modules, module]);
      setExpandedModules(prev => new Set(prev).add(module.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du module');
    }
  };

  const handleUpdateModule = async (moduleId: string, data: Partial<Module>) => {
    try {
      const updated = await coursesApi.updateModule(moduleId, cleanNulls(data));
      setModules(modules.map(m => m.id === moduleId ? { ...m, ...updated } : m));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce module et tout son contenu ?')) return;

    try {
      await coursesApi.deleteModule(moduleId);
      setModules(modules.filter(m => m.id !== moduleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    try {
      const lesson = await coursesApi.createLesson({
        moduleId,
        title: 'Nouvelle leçon',
        content: '',
        order: (moduleDetails.get(moduleId)?.lessons.length || 0),
      });
      setModuleDetails(prev => {
        const next = new Map(prev);
        const current = next.get(moduleId);
        if (current) {
          next.set(moduleId, {
            ...current,
            lessons: [...current.lessons, lesson],
          });
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la leçon');
    }
  };

  const handleUpdateLesson = async (lessonId: string, moduleId: string, data: Partial<Lesson>) => {
    try {
      const updated = await coursesApi.updateLesson(lessonId, cleanNulls(data));
      setModuleDetails(prev => {
        const next = new Map(prev);
        const current = next.get(moduleId);
        if (current) {
          next.set(moduleId, {
            ...current,
            lessons: current.lessons.map(l => l.id === lessonId ? { ...l, ...updated } : l),
          });
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteLesson = async (lessonId: string, moduleId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette leçon ?')) return;

    try {
      await coursesApi.deleteLesson(lessonId);
      setModuleDetails(prev => {
        const next = new Map(prev);
        const current = next.get(moduleId);
        if (current) {
          next.set(moduleId, {
            ...current,
            lessons: current.lessons.filter(l => l.id !== lessonId),
          });
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleAddQuiz = async (moduleId: string) => {
    try {
      const quiz = await coursesApi.createQuiz({
        moduleId,
        title: 'Quiz du module',
        description: '',
        passingScore: 70,
      });
      setModuleDetails(prev => {
        const next = new Map(prev);
        const current = next.get(moduleId);
        if (current) {
          next.set(moduleId, { ...current, quiz: { ...quiz, questions: [] } });
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du quiz');
    }
  };

  const toggleModuleExpanded = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
      if (!moduleDetails.has(moduleId)) {
        loadModuleDetails(moduleId);
      }
    }
    setExpandedModules(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#57C5B6]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/courses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNew ? 'Nouveau cours' : 'Modifier le cours'}
            </h1>
          </div>
        </div>
        <Button
          onClick={handleSaveCourse}
          disabled={saving}
          className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Sauvegarder
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Course Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#57C5B6]" />
          Informations du cours
        </h2>

        <div className="grid gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du cours *
            </label>
            <Input
              value={course.name || ''}
              onChange={(e) => setCourse({ ...course, name: e.target.value })}
              placeholder="Ex: Protection des données personnelles"
              className="bg-gray-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              value={course.description || ''}
              onChange={(e) => setCourse({ ...course, description: e.target.value })}
              placeholder="Description du cours..."
              rows={3}
              className="bg-gray-50"
            />
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audience cible *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {audienceOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setCourse({ ...course, audience: option.value as 'juniors' | 'adultes' | 'seniors' })}
                  className={cn(
                    'p-3 rounded-lg border-2 text-left transition-all',
                    course.audience === option.value
                      ? 'border-[#57C5B6] bg-[#57C5B6]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <p className="font-medium text-gray-900 text-sm">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color & Published */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur
              </label>
              <div className="flex gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCourse({ ...course, color })}
                    className={cn(
                      'w-8 h-8 rounded-full transition-transform',
                      course.color === color && 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <Button
                type="button"
                variant={course.isPublished ? 'default' : 'outline'}
                onClick={() => setCourse({ ...course, isPublished: !course.isPublished })}
                className={course.isPublished ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {course.isPublished ? (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Publié
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Brouillon
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Order */}
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordre d'affichage
            </label>
            <Input
              type="number"
              value={course.order || 0}
              onChange={(e) => setCourse({ ...course, order: parseInt(e.target.value) || 0 })}
              min={0}
              className="bg-gray-50"
            />
          </div>
        </div>
      </div>

      {/* Modules Section */}
      {!isNew && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#57C5B6]" />
              Modules ({modules.length})
            </h2>
            <Button
              onClick={handleAddModule}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un module
            </Button>
          </div>

          {modules.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">Aucun module</p>
              <Button
                onClick={handleAddModule}
                variant="ghost"
                size="sm"
                className="mt-2 text-[#57C5B6]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier module
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Module Header */}
                  <div
                    className="flex items-center gap-3 p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleModuleExpanded(module.id)}
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                    <div className="flex-1">
                      <Input
                        value={module.title}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newModules = modules.map(m =>
                            m.id === module.id ? { ...m, title: e.target.value } : m
                          );
                          setModules(newModules);
                        }}
                        onBlur={() => handleUpdateModule(module.id, { title: module.title })}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium bg-transparent border-0 p-0 h-auto focus-visible:ring-0"
                      />
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded',
                      difficultyOptions.find(d => d.value === module.difficulty)?.color || 'text-gray-500',
                      'bg-white'
                    )}>
                      {module.difficulty || 'facile'}
                    </span>
                    <span className="text-xs text-gray-400">{module.duration || '15 min'}</span>
                    {module.hasAudio && <Volume2 className="h-4 w-4 text-blue-500" />}
                    {module.isLocked && <Lock className="h-4 w-4 text-amber-500" />}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModule(module.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  {/* Module Content */}
                  {expandedModules.has(module.id) && (
                    <div className="p-4 border-t border-gray-200 space-y-4">
                      {loadingModules.has(module.id) ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-[#57C5B6]" />
                        </div>
                      ) : (
                        <>
                          {/* Module Settings */}
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Difficulté
                              </label>
                              <select
                                value={module.difficulty}
                                onChange={(e) => handleUpdateModule(module.id, { difficulty: e.target.value as 'facile' | 'moyen' | 'expert' })}
                                className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
                              >
                                {difficultyOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Durée
                              </label>
                              <Input
                                value={module.duration || ''}
                                onChange={(e) => setModules(modules.map(m =>
                                  m.id === module.id ? { ...m, duration: e.target.value } : m
                                ))}
                                onBlur={() => handleUpdateModule(module.id, { duration: module.duration })}
                                placeholder="15 min"
                                className="h-8 text-sm bg-gray-50"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <Button
                                variant={module.hasAudio ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleUpdateModule(module.id, { hasAudio: !module.hasAudio })}
                                className={module.hasAudio ? 'bg-blue-600 hover:bg-blue-700' : ''}
                              >
                                <Volume2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={module.isLocked ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handleUpdateModule(module.id, { isLocked: !module.isLocked })}
                                className={module.isLocked ? 'bg-amber-600 hover:bg-amber-700' : ''}
                              >
                                {module.isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          {/* Lessons */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-700">Leçons</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddLesson(module.id)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Ajouter
                              </Button>
                            </div>
                            {moduleDetails.get(module.id)?.lessons.length === 0 ? (
                              <p className="text-sm text-gray-400 py-2">Aucune leçon</p>
                            ) : (
                              <div className="space-y-2">
                                {moduleDetails.get(module.id)?.lessons.map((lesson, lessonIndex) => (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                                  >
                                    <span className="text-xs text-gray-400 w-6">{lessonIndex + 1}.</span>
                                    <Input
                                      value={lesson.title}
                                      onChange={(e) => {
                                        const newDetails = new Map(moduleDetails);
                                        const current = newDetails.get(module.id);
                                        if (current) {
                                          newDetails.set(module.id, {
                                            ...current,
                                            lessons: current.lessons.map(l =>
                                              l.id === lesson.id ? { ...l, title: e.target.value } : l
                                            ),
                                          });
                                          setModuleDetails(newDetails);
                                        }
                                      }}
                                      onBlur={() => handleUpdateLesson(lesson.id, module.id, { title: lesson.title })}
                                      className="flex-1 h-7 text-sm bg-white"
                                    />
                                    <select
                                      value={lesson.contentType}
                                      onChange={(e) => handleUpdateLesson(lesson.id, module.id, { contentType: e.target.value as 'text' | 'video' | 'image' | 'audio' })}
                                      className="h-7 text-xs border border-gray-200 rounded bg-white px-2"
                                    >
                                      <option value="text">Texte</option>
                                      <option value="video">Vidéo</option>
                                      <option value="image">Image</option>
                                      <option value="audio">Audio</option>
                                    </select>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => handleDeleteLesson(lesson.id, module.id)}
                                    >
                                      <Trash2 className="h-3 w-3 text-red-500" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quiz */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <HelpCircle className="h-4 w-4" />
                                Quiz
                              </h4>
                              {!moduleDetails.get(module.id)?.quiz && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddQuiz(module.id)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Ajouter un quiz
                                </Button>
                              )}
                            </div>
                            {moduleDetails.get(module.id)?.quiz ? (
                              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-purple-900 text-sm">
                                    {moduleDetails.get(module.id)?.quiz?.title}
                                  </span>
                                  <span className="text-xs text-purple-600">
                                    Score requis: {moduleDetails.get(module.id)?.quiz?.passingScore}%
                                  </span>
                                </div>
                                <p className="text-xs text-purple-700">
                                  {moduleDetails.get(module.id)?.quiz?.questions?.length || 0} question(s)
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 py-2">Pas de quiz pour ce module</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CourseEditor;
