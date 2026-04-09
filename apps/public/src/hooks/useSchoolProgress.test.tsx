import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSchoolProgress } from './useSchoolProgress';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

vi.mock('@/lib/api', () => ({
  coursesApi: {
    getMyProgress: vi.fn().mockResolvedValue([]),
    completeModule: vi.fn().mockResolvedValue(undefined),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useSchoolProgress', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initial state: no completed modules', () => {
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    expect(result.current.getCompletedCount('juniors')).toBe(0);
    expect(result.current.getCompletedModules('juniors')).toEqual([]);
    expect(result.current.isModuleCompleted('juniors', 'm1')).toBe(false);
  });

  it('loads initial state from localStorage', () => {
    localStorage.setItem(
      'dataring-school-progress',
      JSON.stringify({
        completedModules: { juniors: ['m1'], adultes: [], seniors: [] },
        quizScores: { 'juniors:m1': 90 },
        lastUpdated: '2026-01-01',
      })
    );
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    expect(result.current.isModuleCompleted('juniors', 'm1')).toBe(true);
    expect(result.current.getQuizScore('juniors', 'm1')).toBe(90);
  });

  it('completeModule: adds module (unauthenticated, no API call)', () => {
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    act(() => {
      result.current.completeModule('adultes', 'm2');
    });
    expect(result.current.isModuleCompleted('adultes', 'm2')).toBe(true);
    expect(result.current.getCompletedCount('adultes')).toBe(1);
    expect(coursesApi.completeModule).not.toHaveBeenCalled();
    const stored = JSON.parse(localStorage.getItem('dataring-school-progress')!);
    expect(stored.completedModules.adultes).toContain('m2');
  });

  it('completeModule: idempotent when already completed', () => {
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    act(() => {
      result.current.completeModule('seniors', 'm1');
    });
    act(() => {
      result.current.completeModule('seniors', 'm1');
    });
    expect(result.current.getCompletedCount('seniors')).toBe(1);
  });

  it('completeModule: calls API when authenticated', async () => {
    useAuthStore.setState({ isAuthenticated: true });
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    act(() => {
      result.current.completeModule('juniors', 'm-api');
    });
    await waitFor(() => expect(coursesApi.completeModule).toHaveBeenCalledWith('m-api'));
  });

  it('completeModule: reverts on API failure', async () => {
    useAuthStore.setState({ isAuthenticated: true });
    vi.mocked(coursesApi.completeModule).mockRejectedValueOnce(new Error('fail'));
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    act(() => {
      result.current.completeModule('juniors', 'm-fail');
    });
    await waitFor(() => expect(result.current.isModuleCompleted('juniors', 'm-fail')).toBe(false));
  });

  it('completeModule: skipApi does not call API', async () => {
    useAuthStore.setState({ isAuthenticated: true });
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    act(() => {
      result.current.completeModule('juniors', 'm-skip', { skipApi: true });
    });
    expect(result.current.isModuleCompleted('juniors', 'm-skip')).toBe(true);
    expect(coursesApi.completeModule).not.toHaveBeenCalled();
  });

  it('resetModule: removes module from completed list', () => {
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    act(() => {
      result.current.completeModule('juniors', 'm1');
    });
    act(() => {
      result.current.resetModule('juniors', 'm1');
    });
    expect(result.current.isModuleCompleted('juniors', 'm1')).toBe(false);
  });

  it('saveQuizScore: stores score', () => {
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    act(() => {
      result.current.saveQuizScore('juniors', 'm1', 85);
    });
    expect(result.current.getQuizScore('juniors', 'm1')).toBe(85);
  });

  it('saveQuizScore: keeps higher existing score', () => {
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    act(() => {
      result.current.saveQuizScore('juniors', 'm1', 90);
    });
    act(() => {
      result.current.saveQuizScore('juniors', 'm1', 50);
    });
    expect(result.current.getQuizScore('juniors', 'm1')).toBe(90);
  });

  it('saveQuizScore: updates with higher score', () => {
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    act(() => {
      result.current.saveQuizScore('juniors', 'm1', 60);
    });
    act(() => {
      result.current.saveQuizScore('juniors', 'm1', 100);
    });
    expect(result.current.getQuizScore('juniors', 'm1')).toBe(100);
  });

  it('getQuizScore: returns null when unset', () => {
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    expect(result.current.getQuizScore('juniors', 'unknown')).toBeNull();
  });

  it('resetAllProgress: clears everything', () => {
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    act(() => {
      result.current.completeModule('juniors', 'm1');
      result.current.saveQuizScore('juniors', 'm1', 80);
    });
    act(() => {
      result.current.resetAllProgress();
    });
    expect(result.current.getCompletedCount('juniors')).toBe(0);
    expect(result.current.getQuizScore('juniors', 'm1')).toBeNull();
  });

  it('resetAudienceProgress: clears one audience only', () => {
    const { result } = renderHook(() => useSchoolProgress(), { wrapper });
    act(() => {
      result.current.completeModule('juniors', 'm1');
      result.current.completeModule('adultes', 'm2');
      result.current.saveQuizScore('juniors', 'm1', 80);
      result.current.saveQuizScore('adultes', 'm2', 70);
    });
    act(() => {
      result.current.resetAudienceProgress('juniors');
    });
    expect(result.current.getCompletedCount('juniors')).toBe(0);
    expect(result.current.getCompletedCount('adultes')).toBe(1);
    expect(result.current.getQuizScore('juniors', 'm1')).toBeNull();
    expect(result.current.getQuizScore('adultes', 'm2')).toBe(70);
  });
});
