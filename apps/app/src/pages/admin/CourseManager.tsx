import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Users,
  GraduationCap,
  Search,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { coursesApi, type Course } from '@/lib/api';
import { cn } from '@/lib/utils';

const audienceTabs = [
  { key: 'juniors', label: 'Juniors', subtitle: '7-15 ans', icon: <Users className="h-4 w-4" />, color: 'purple' },
  { key: 'adultes', label: 'Adultes', subtitle: '16-60 ans', icon: <GraduationCap className="h-4 w-4" />, color: 'blue' },
  { key: 'seniors', label: 'Seniors', subtitle: '60+ ans', icon: <Users className="h-4 w-4" />, color: 'amber' },
  { key: 'organisation', label: 'Organisation', subtitle: 'Entreprises', icon: <Building2 className="h-4 w-4" />, color: 'teal' },
] as const;

const tabColors: Record<string, { active: string; badge: string }> = {
  purple: { active: 'border-purple-500 text-purple-700', badge: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
  blue: { active: 'border-blue-500 text-blue-700', badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  amber: { active: 'border-amber-500 text-amber-700', badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  teal: { active: 'border-[#57C5B6] text-[#57C5B6]', badge: 'bg-[#57C5B6]/15 text-[#57C5B6]' },
};

export function CourseManager() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('juniors');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await coursesApi.list();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      setDeletingId(confirmDeleteId);
      await coursesApi.delete(confirmDeleteId);
      setCourses(courses.filter(c => c.id !== confirmDeleteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleTogglePublish = async (course: Course) => {
    try {
      await coursesApi.update(course.id, { isPublished: !course.isPublished });
      setCourses(courses.map(c =>
        c.id === course.id ? { ...c, isPublished: !c.isPublished } : c
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  // Count courses per audience
  const audienceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tab of audienceTabs) {
      counts[tab.key] = courses.filter(c => c.audience === tab.key).length;
    }
    return counts;
  }, [courses]);

  // Filter and group courses for active tab
  const groupedCourses = useMemo(() => {
    const tabCourses = courses.filter(c => {
      if (c.audience !== activeTab) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q);
    });

    const groups = new Map<string, Course[]>();
    for (const course of tabCourses) {
      const cat = course.category || 'Non catégorisé';
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(course);
    }

    // Sort: named categories first alphabetically, "Non catégorisé" last
    const sorted = [...groups.entries()].sort(([a], [b]) => {
      if (a === 'Non catégorisé') return 1;
      if (b === 'Non catégorisé') return -1;
      return a.localeCompare(b);
    });

    return sorted;
  }, [courses, activeTab, searchQuery]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

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
          <h1 className="text-2xl font-bold text-foreground">Gestion des Cours</h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez les cours de la School Data Ring
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/courses/new')}
          className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouveau cours
        </Button>
      </div>

      {/* Audience Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          {audienceTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const colors = tabColors[tab.color];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3 border-b-2 transition-colors text-sm font-medium',
                  isActive
                    ? colors.active
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className="text-xs text-muted-foreground">({tab.subtitle})</span>
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
                  isActive ? colors.badge : 'bg-muted text-muted-foreground'
                )}>
                  {audienceCounts[tab.key] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un cours..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {/* Course Groups */}
      {groupedCourses.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-xl border border-border">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium text-foreground mb-2">
            {searchQuery ? 'Aucun cours trouvé' : 'Aucun cours pour cette audience'}
          </h2>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Modifiez votre recherche ou créez un nouveau cours'
              : 'Commencez par créer un cours pour ce parcours'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => navigate('/admin/courses/new')}
              className="bg-[#57C5B6] hover:bg-[#4AB0A2] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un cours
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {groupedCourses.map(([category, categoryCourses]) => {
            const isCollapsed = collapsedCategories.has(category);
            return (
              <div key={category} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex items-center gap-3 w-full px-5 py-3 bg-muted hover:bg-accent transition-colors text-left"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <FolderOpen className="h-4 w-4 text-[#57C5B6]" />
                  <span className="font-semibold text-foreground">{category}</span>
                  <span className="text-xs text-muted-foreground">
                    {categoryCourses.length} cours
                  </span>
                </button>

                {/* Course Cards */}
                {!isCollapsed && (
                  <div className="divide-y divide-border">
                    {categoryCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-start gap-4 px-5 py-4 hover:bg-muted/50 transition-colors"
                      >
                        {/* Icon */}
                        <div
                          className="p-2.5 rounded-lg shrink-0"
                          style={{ backgroundColor: `${course.color}20`, color: course.color }}
                        >
                          <BookOpen className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-semibold text-foreground truncate text-sm">
                              {course.name}
                            </h3>
                            {course.isPublished ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/15 text-green-600 dark:text-green-400 text-xs">
                                <Eye className="h-3 w-3" />
                                Publié
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs">
                                <EyeOff className="h-3 w-3" />
                                Brouillon
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs line-clamp-1">
                            {course.description || 'Aucune description'}
                          </p>
                          <span className="text-xs text-muted-foreground mt-1 inline-block">
                            {course.moduleCount || 0} module(s)
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {confirmDeleteId === course.id ? (
                            <>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="min-w-[44px] min-h-[44px]"
                                onClick={confirmDelete}
                                disabled={deletingId === course.id}
                              >
                                {deletingId === course.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Supprimer'
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-w-[44px] min-h-[44px]"
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={deletingId === course.id}
                              >
                                Annuler
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-w-[44px] min-h-[44px]"
                                onClick={() => handleTogglePublish(course)}
                                title={course.isPublished ? 'Dépublier' : 'Publier'}
                              >
                                {course.isPublished ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-w-[44px] min-h-[44px]"
                                onClick={() => navigate(`/admin/courses/${course.id}`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="min-w-[44px] min-h-[44px]"
                                onClick={() => handleDelete(course.id)}
                                disabled={deletingId === course.id}
                              >
                                {deletingId === course.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CourseManager;
