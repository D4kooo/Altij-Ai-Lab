import { useState, useEffect, useCallback } from 'react';

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

function loadProgress(): ProgressData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure all audiences exist
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

function saveProgress(progress: ProgressData): void {
  try {
    progress.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save school progress:', error);
  }
}

export function useSchoolProgress() {
  const [progress, setProgress] = useState<ProgressData>(loadProgress);

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
  const completeModule = useCallback((audience: string, moduleId: string): void => {
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

      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  // Reset a module (mark as not completed)
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

      saveProgress(newProgress);
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

      saveProgress(newProgress);
      return newProgress;
    });
  }, []);

  // Get quiz score
  const getQuizScore = useCallback((audience: string, moduleId: string): number | null => {
    const key = `${audience}:${moduleId}`;
    return progress.quizScores[key] ?? null;
  }, [progress]);

  // Reset all progress
  const resetAllProgress = useCallback((): void => {
    setProgress(defaultProgress);
    saveProgress(defaultProgress);
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

      saveProgress(newProgress);
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
