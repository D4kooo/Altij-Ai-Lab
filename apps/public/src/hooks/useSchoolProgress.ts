import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const STORAGE_KEY = 'dataring-school-progress';

interface ProgressData {
  completedModules: {
    [audience: string]: string[]; // audience -> list of completed module IDs
  };
  quizScores: {
    [key: string]: number; // "audience:moduleId" -> score
  };
  lastUpdated: string;
}

const defaultProgress: ProgressData = {
  completedModules: {
    juniors: [],
    adultes: [],
    seniors: [],
  },
  quizScores: {},
  lastUpdated: new Date().toISOString(),
};

function loadLocalProgress(): ProgressData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaultProgress,
        ...parsed,
        completedModules: {
          ...defaultProgress.completedModules,
          ...parsed.completedModules,
        },
      };
    }
  } catch (error) {
    console.error('Failed to load school progress:', error);
  }
  return defaultProgress;
}

function saveLocalProgress(progress: ProgressData): void {
  try {
    progress.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save school progress:', error);
  }
}

/** Build ProgressData from API response, merging with local cache */
function mergeApiProgress(local: ProgressData): ProgressData {
  // The API returns course-level progress (completedModules count per course),
  // not individual module IDs. We keep local data as the source of truth
  // for module-level granularity since the API progress is tracked per-module
  // via the module.progress field when fetching modules individually.
  // The local cache stays in sync because we update it on every completeModule call.
  return {
    completedModules: { ...local.completedModules },
    quizScores: { ...local.quizScores },
    lastUpdated: new Date().toISOString(),
  };
}

export function useSchoolProgress() {
  const [progress, setProgress] = useState<ProgressData>(loadLocalProgress);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Fetch API progress if authenticated
  const { data: apiProgress } = useQuery({
    queryKey: ['courses', 'progress', 'me'],
    queryFn: () => coursesApi.getMyProgress(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // Merge API data into local state when it arrives
  useEffect(() => {
    if (apiProgress) {
      setProgress((prev) => {
        const merged = mergeApiProgress(prev);
        saveLocalProgress(merged);
        return merged;
      });
    }
  }, [apiProgress]);

  // Reload progress when storage changes (e.g., from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setProgress(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Failed to parse storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check if a module is completed
  const isModuleCompleted = useCallback((audience: string, moduleId: string): boolean => {
    return progress.completedModules[audience]?.includes(moduleId) ?? false;
  }, [progress]);

  // Mark a module as completed
  // skipApi: true when the backend was already updated (e.g. quiz submission)
  const completeModule = useCallback((audience: string, moduleId: string, options?: { skipApi?: boolean }): void => {
    setProgress(prev => {
      const audienceModules = prev.completedModules[audience] || [];
      if (audienceModules.includes(moduleId)) {
        return prev; // Already completed
      }

      const newProgress: ProgressData = {
        ...prev,
        completedModules: {
          ...prev.completedModules,
          [audience]: [...audienceModules, moduleId],
        },
      };

      saveLocalProgress(newProgress);
      return newProgress;
    });

    if (options?.skipApi) {
      // Backend already updated (e.g. via quiz submission), just refresh cache
      queryClient.invalidateQueries({ queryKey: ['courses', 'progress', 'me'] });
      return;
    }

    // POST to API if authenticated
    if (isAuthenticated) {
      const revertOnError = () => {
        setProgress(prev => {
          const audienceModules = prev.completedModules[audience] || [];
          const reverted: ProgressData = {
            ...prev,
            completedModules: {
              ...prev.completedModules,
              [audience]: audienceModules.filter(id => id !== moduleId),
            },
          };
          saveLocalProgress(reverted);
          return reverted;
        });
      };
      coursesApi.completeModule(moduleId)
        .then(() => queryClient.invalidateQueries({ queryKey: ['courses', 'progress', 'me'] }))
        .catch(revertOnError);
    }
  }, [queryClient, isAuthenticated]);

  // Reset a module (mark as not completed) — local only, no API endpoint for this
  const resetModule = useCallback((audience: string, moduleId: string): void => {
    setProgress(prev => {
      const audienceModules = prev.completedModules[audience] || [];
      const newProgress: ProgressData = {
        ...prev,
        completedModules: {
          ...prev.completedModules,
          [audience]: audienceModules.filter(id => id !== moduleId),
        },
      };

      saveLocalProgress(newProgress);
      return newProgress;
    });
  }, []);

  // Get completed count for an audience
  const getCompletedCount = useCallback((audience: string): number => {
    return progress.completedModules[audience]?.length ?? 0;
  }, [progress]);

  // Get completed module IDs for an audience
  const getCompletedModules = useCallback((audience: string): string[] => {
    return progress.completedModules[audience] || [];
  }, [progress]);

  // Save quiz score
  const saveQuizScore = useCallback((audience: string, moduleId: string, score: number): void => {
    setProgress(prev => {
      const key = `${audience}:${moduleId}`;
      const existingScore = prev.quizScores[key];

      // Only save if it's a better score
      if (existingScore !== undefined && existingScore >= score) {
        return prev;
      }

      const newProgress: ProgressData = {
        ...prev,
        quizScores: {
          ...prev.quizScores,
          [key]: score,
        },
      };

      saveLocalProgress(newProgress);
      return newProgress;
    });
    // Quiz submission is handled in ModuleViewer via coursesApi.submitQuiz directly
  }, []);

  // Get quiz score
  const getQuizScore = useCallback((audience: string, moduleId: string): number | null => {
    const key = `${audience}:${moduleId}`;
    return progress.quizScores[key] ?? null;
  }, [progress]);

  // Reset all progress
  const resetAllProgress = useCallback((): void => {
    setProgress(defaultProgress);
    saveLocalProgress(defaultProgress);
  }, []);

  // Reset progress for a specific audience
  const resetAudienceProgress = useCallback((audience: string): void => {
    setProgress(prev => {
      // Remove completed modules for this audience
      const newCompletedModules = { ...prev.completedModules, [audience]: [] };

      // Remove quiz scores for this audience
      const newQuizScores = { ...prev.quizScores };
      Object.keys(newQuizScores).forEach(key => {
        if (key.startsWith(`${audience}:`)) {
          delete newQuizScores[key];
        }
      });

      const newProgress: ProgressData = {
        ...prev,
        completedModules: newCompletedModules,
        quizScores: newQuizScores,
      };

      saveLocalProgress(newProgress);
      return newProgress;
    });
  }, []);

  return {
    // State
    progress,

    // Module progress
    isModuleCompleted,
    completeModule,
    resetModule,
    getCompletedCount,
    getCompletedModules,

    // Quiz scores
    saveQuizScore,
    getQuizScore,

    // Reset functions
    resetAllProgress,
    resetAudienceProgress,
  };
}
