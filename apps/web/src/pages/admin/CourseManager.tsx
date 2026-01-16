import { useState, useEffect } from 'react';
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
  Filter,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { coursesApi, type Course } from '@/lib/api';
import { cn } from '@/lib/utils';

const audienceLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  juniors: { label: 'Juniors (7-15 ans)', icon: <Users className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700' },
  adultes: { label: 'Adultes (16-60 ans)', icon: <GraduationCap className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
  seniors: { label: 'Seniors (60+ ans)', icon: <Users className="h-4 w-4" />, color: 'bg-amber-100 text-amber-700' },
};

export function CourseManager() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAudience, setFilterAudience] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce cours ?')) return;

    try {
      setDeletingId(id);
      await coursesApi.delete(id);
      setCourses(courses.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
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

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAudience = !filterAudience || course.audience === filterAudience;
    return matchesSearch && matchesAudience;
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
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Cours</h1>
          <p className="text-gray-500 mt-1">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un cours..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterAudience === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterAudience(null)}
            className={filterAudience === null ? 'bg-[#57C5B6] hover:bg-[#4AB0A2]' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Tous
          </Button>
          {Object.entries(audienceLabels).map(([key, { label }]) => (
            <Button
              key={key}
              variant={filterAudience === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterAudience(key)}
              className={filterAudience === key ? 'bg-[#57C5B6] hover:bg-[#4AB0A2]' : ''}
            >
              {label.split(' ')[0]}
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

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterAudience ? 'Aucun cours trouvé' : 'Aucun cours'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || filterAudience
              ? 'Modifiez vos filtres ou créez un nouveau cours'
              : 'Commencez par créer votre premier cours'}
          </p>
          {!searchQuery && !filterAudience && (
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
        <div className="grid gap-4">
          {filteredCourses.map((course) => {
            const audienceInfo = audienceLabels[course.audience];
            return (
              <div
                key={course.id}
                className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="p-3 rounded-xl shrink-0"
                    style={{ backgroundColor: `${course.color}20`, color: course.color }}
                  >
                    <BookOpen className="h-6 w-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {course.name}
                      </h3>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs',
                        audienceInfo.color
                      )}>
                        {audienceInfo.icon}
                        {audienceInfo.label.split(' ')[0]}
                      </span>
                      {course.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs">
                          <Eye className="h-3 w-3" />
                          Publié
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">
                          <EyeOff className="h-3 w-3" />
                          Brouillon
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-2">
                      {course.description || 'Aucune description'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span>{course.moduleCount || 0} module(s)</span>
                      <span>Ordre: {course.order}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(course)}
                      title={course.isPublished ? 'Dépublier' : 'Publier'}
                    >
                      {course.isPublished ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/courses/${course.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(course.id)}
                      disabled={deletingId === course.id}
                    >
                      {deletingId === course.id ? (
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
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        {Object.entries(audienceLabels).map(([key, { label }]) => {
          const count = courses.filter(c => c.audience === key).length;
          return (
            <div key={key} className="text-center p-4 rounded-xl bg-gray-50">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500">{label.split(' ')[0]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CourseManager;
