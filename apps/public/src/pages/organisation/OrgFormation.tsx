import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowLeft,
  Brain,
  Scale,
  Shield,
  BookOpen,
  Lock,
  Heart,
  FileText,
  Loader2,
  Clock,
} from 'lucide-react';
import { coursesApi } from '@/lib/api';

const iconMap: Record<string, any> = {
  Brain, Scale, Shield, BookOpen, Lock, Heart, FileText,
};

function CourseIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = (name && iconMap[name]) || BookOpen;
  return <Icon size={20} strokeWidth={1.5} className={className} />;
}

const staticCategories: Record<string, { label: string; description: string }> = {
  'IA & Décision': { label: 'IA & Décision', description: 'Comprendre les enjeux de l\'intelligence artificielle pour la prise de décision en entreprise.' },
  'Conformité': { label: 'Conformité RGPD', description: 'Maîtriser les obligations réglementaires et mettre en place les processus de conformité.' },
  'Intelligence Artificielle': { label: 'Claude & IA', description: 'Maîtriser Claude et l\'IA générative en contexte professionnel et juridique.' },
  'Conformité & Sécurité': { label: 'Conformité & Sécurité', description: 'Protéger les données sensibles et respecter les obligations réglementaires.' },
};

export function OrgFormation() {
  const { courseId } = useParams<{ courseId?: string }>();
  const [activeCategory, setActiveCategory] = useState('all');

  // Fetch only organisation courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses', 'organisation'],
    queryFn: () => coursesApi.list('organisation'),
  });

  // If a courseId is in the URL, show course detail
  if (courseId) {
    return <CourseDetail courseId={courseId} />;
  }

  // Build category filters dynamically from courses
  const categoryFilters = useMemo(() => {
    if (!courses) return [];
    const uniqueCategories = [...new Set(courses.map(c => c.category).filter(Boolean))] as string[];
    return uniqueCategories.map(cat => ({
      id: cat,
      label: staticCategories[cat]?.label || cat,
      description: staticCategories[cat]?.description || '',
    }));
  }, [courses]);

  const filteredCourses = activeCategory === 'all'
    ? courses
    : courses?.filter(c => c.category === activeCategory);

  return (
    <div className="px-6 lg:px-10 pt-16 pb-8 lg:pb-12">
      {/* Header */}
      <div className="mb-10">
        <span className="font-mono text-[10px] tracking-[0.15em] text-black/30 uppercase block mb-3">
          Formation
        </span>
        <h1 className="font-heading font-bold text-3xl sm:text-4xl tracking-tighter leading-[0.95]">
          Formation professionnelle
        </h1>
        <p className="mt-2 text-black/40 text-sm">
          Parcours adaptés aux besoins de votre organisation.
        </p>
      </div>

      {/* Category filters — clickable cards */}
      <div className={`grid grid-cols-1 gap-0 mb-10 ${categoryFilters.length <= 2 ? 'md:grid-cols-2' : categoryFilters.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        {categoryFilters.map((cat, i) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
            className={`text-left p-8 lg:p-10 border-2 border-black transition-colors duration-100 ${
              i > 0 ? 'md:border-l-0' : ''
            } ${i > 0 ? 'border-t-0 md:border-t-2' : ''} ${
              activeCategory === cat.id ? 'bg-black text-white' : 'hover:bg-black hover:text-white'
            }`}
          >
            <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA] uppercase block mb-4">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h2 className="font-heading font-bold text-xl tracking-tighter mb-3">
              {cat.label}
            </h2>
            <p className={`text-sm leading-relaxed ${activeCategory === cat.id ? 'text-white/60' : 'text-black/40'}`}>
              {cat.description}
            </p>
          </button>
        ))}
      </div>

      {/* Active filter indicator */}
      {activeCategory !== 'all' && (
        <div className="mb-6 flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.15em] text-black/30 uppercase">
            Filtre : {categoryFilters.find(c => c.id === activeCategory)?.label}
          </span>
          <button onClick={() => setActiveCategory('all')} className="font-mono text-[10px] tracking-[0.15em] text-black/40 uppercase border-b border-black/20 hover:text-black hover:border-black transition-colors">
            Tout afficher
          </button>
        </div>
      )}

      {/* Courses list */}
      <div className="border-[2px] border-black">
        <div className="p-6 border-b-[2px] border-black">
          <span className="font-mono text-[10px] tracking-[0.15em] text-black/30 uppercase">
            {activeCategory === 'all' ? 'Tous les cours' : categoryFilters.find(c => c.id === activeCategory)?.label}
            {filteredCourses && ` (${filteredCourses.length})`}
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-black/30" />
          </div>
        ) : filteredCourses && filteredCourses.length > 0 ? (
          <div>
            {filteredCourses.map((course, i) => (
              <Link
                key={course.id}
                to={`/org/formation/${course.id}`}
                className={`flex items-center justify-between p-6 hover:bg-black hover:text-white transition-colors duration-100 group ${
                  i > 0 ? 'border-t border-black/10' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <CourseIcon name={course.icon} className="text-black group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-sm tracking-tight block">
                      {course.name}
                    </span>
                    {course.description && (
                      <span className="text-black/40 text-xs block mt-0.5 group-hover:text-white/50 line-clamp-1">
                        {course.description}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {course.moduleCount != null && (
                    <span className="font-mono text-[9px] tracking-[0.15em] text-black/20 uppercase group-hover:text-white/40">
                      {course.moduleCount} modules
                    </span>
                  )}
                  <ArrowRight size={14} strokeWidth={1.5} className="text-black/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-100" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-black/30 text-sm">
            Aucun cours disponible{activeCategory !== 'all' ? ' dans cette catégorie' : ''}.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Course Detail View ──────────────────────────────────────────────

function CourseDetail({ courseId }: { courseId: string }) {
  const navigate = useNavigate();

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesApi.get(courseId),
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-black/30" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="px-6 lg:px-10 pt-16 pb-8 text-center">
        <p className="text-black/40">Cours introuvable.</p>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-10 pt-16 pb-8 lg:pb-12">
      {/* Back */}
      <button
        onClick={() => navigate('/org/formation')}
        className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] text-black/40 uppercase hover:text-black transition-colors mb-8"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        Formation
      </button>

      {/* Course header */}
      <div className="flex items-start gap-4 mb-10">
        <div className="w-12 h-12 flex items-center justify-center border-2 border-black">
          <CourseIcon name={course.icon} />
        </div>
        <div>
          <h1 className="font-heading font-bold text-2xl sm:text-3xl tracking-tighter leading-[0.95]">
            {course.name}
          </h1>
          {course.description && (
            <p className="mt-2 text-black/40 text-sm max-w-2xl">{course.description}</p>
          )}
          {course.category && (
            <span className="inline-block mt-3 font-mono text-[9px] tracking-[0.15em] text-[#21B2AA] uppercase border border-[#21B2AA]/30 px-2 py-0.5">
              {course.category}
            </span>
          )}
        </div>
      </div>

      {/* Modules list */}
      <div className="border-[2px] border-black">
        <div className="p-6 border-b-[2px] border-black">
          <span className="font-mono text-[10px] tracking-[0.15em] text-black/30 uppercase">
            Modules ({course.modules?.length || 0})
          </span>
        </div>

        {course.modules && course.modules.length > 0 ? (
          <div>
            {course.modules.map((mod: any, i: number) => (
              <Link
                key={mod.id}
                to={`/org/formation/${courseId}/module/${mod.id}`}
                className={`flex items-center justify-between p-6 hover:bg-black hover:text-white transition-colors duration-100 group ${
                  i > 0 ? 'border-t border-black/10' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[10px] tracking-[0.3em] text-[#21B2AA] w-8">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <span className="font-heading font-bold text-sm tracking-tight block">
                      {mod.title}
                    </span>
                    {mod.description && (
                      <span className="text-black/40 text-xs block mt-0.5 group-hover:text-white/50 line-clamp-1">
                        {mod.description}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {mod.duration && (
                    <span className="flex items-center gap-1 font-mono text-[9px] tracking-[0.1em] text-black/20 group-hover:text-white/40">
                      <Clock size={12} strokeWidth={1.5} />
                      {mod.duration} min
                    </span>
                  )}
                  <span className="font-mono text-[9px] tracking-[0.1em] text-black/20 uppercase group-hover:text-white/40">
                    {mod.difficulty}
                  </span>
                  <ArrowRight size={14} strokeWidth={1.5} className="text-black/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all duration-100" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-black/30 text-sm">
            Aucun module disponible.
          </div>
        )}
      </div>
    </div>
  );
}

export default OrgFormation;
