import { useState, useEffect } from 'react';
import { coursesApi, type Course, type CourseWithModules, type Module } from '@/lib/api';

interface CoursesData {
  courses: CourseWithModules[];
  allModules: (Module & { courseName: string; courseCategory: string | null })[];
  loading: boolean;
  error: string | null;
}

export function useCoursesData(audience: 'juniors' | 'adultes' | 'seniors'): CoursesData {
  const [courses, setCourses] = useState<CourseWithModules[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const courseList = await coursesApi.list(audience);

        const coursesWithModules = await Promise.all(
          courseList.map((course: Course) => coursesApi.get(course.id))
        );

        if (!cancelled) {
          setCourses(coursesWithModules);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur de chargement');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [audience]);

  const allModules = courses.flatMap((course) =>
    course.modules.map((mod) => ({
      ...mod,
      courseName: course.name,
      courseCategory: course.category,
    }))
  );

  return { courses, allModules, loading, error };
}
