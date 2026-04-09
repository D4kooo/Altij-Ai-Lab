import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCoursesData } from './useCoursesData';
import { coursesApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  coursesApi: {
    list: vi.fn(),
    get: vi.fn(),
  },
}));

describe('useCoursesData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads courses and flattens modules with course info', async () => {
    // deno-lint-ignore no-explicit-any
    vi.mocked(coursesApi.list).mockResolvedValueOnce([{ id: 'c1' }, { id: 'c2' }] as any);
    vi.mocked(coursesApi.get)
      // deno-lint-ignore no-explicit-any
      .mockResolvedValueOnce({
        id: 'c1',
        name: 'C1',
        category: 'cat1',
        modules: [{ id: 'm1', title: 'M1' }, { id: 'm2', title: 'M2' }],
      } as any)
      // deno-lint-ignore no-explicit-any
      .mockResolvedValueOnce({
        id: 'c2',
        name: 'C2',
        category: null,
        modules: [{ id: 'm3', title: 'M3' }],
      } as any);

    const { result } = renderHook(() => useCoursesData('juniors'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.courses).toHaveLength(2);
    expect(result.current.allModules).toHaveLength(3);
    expect(result.current.allModules[0]).toMatchObject({
      id: 'm1',
      courseName: 'C1',
      courseCategory: 'cat1',
    });
    expect(result.current.allModules[2]).toMatchObject({
      id: 'm3',
      courseName: 'C2',
      courseCategory: null,
    });
    expect(coursesApi.list).toHaveBeenCalledWith('juniors');
  });

  it('sets error when list fails', async () => {
    vi.mocked(coursesApi.list).mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useCoursesData('adultes'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('network');
    expect(result.current.courses).toEqual([]);
  });

  it('uses generic message for non-Error rejections', async () => {
    vi.mocked(coursesApi.list).mockRejectedValueOnce('nope');
    const { result } = renderHook(() => useCoursesData('seniors'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Erreur de chargement');
  });
});
