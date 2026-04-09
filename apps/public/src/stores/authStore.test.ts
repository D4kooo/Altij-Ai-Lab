import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import { authApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

describe('authStore', () => {
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

  describe('login', () => {
    it('sets user and isAuthenticated on success', async () => {
      const user = { id: '1', email: 'a@b.c', firstName: 'A', lastName: 'B' };
      vi.mocked(authApi.login).mockResolvedValueOnce({
        user,
        token: 't',
        refreshToken: 'r',
      // deno-lint-ignore no-explicit-any
      } as any);

      await useAuthStore.getState().login('a@b.c', 'pw');
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error and rethrows on failure', async () => {
      vi.mocked(authApi.login).mockRejectedValueOnce(new Error('invalid'));
      await expect(useAuthStore.getState().login('a@b.c', 'bad')).rejects.toThrow('invalid');
      const state = useAuthStore.getState();
      expect(state.error).toBe('invalid');
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears user and auth state', async () => {
      useAuthStore.setState({
        // deno-lint-ignore no-explicit-any
        user: { id: '1' } as any,
        isAuthenticated: true,
      });
      vi.mocked(authApi.logout).mockResolvedValueOnce(undefined);
      await useAuthStore.getState().logout();
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('clears auth state even when API call fails', async () => {
      useAuthStore.setState({
        // deno-lint-ignore no-explicit-any
        user: { id: '1' } as any,
        isAuthenticated: true,
      });
      vi.mocked(authApi.logout).mockRejectedValueOnce(new Error('net'));
      await expect(useAuthStore.getState().logout()).rejects.toThrow('net');
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('sets unauthenticated when no token', async () => {
      await useAuthStore.getState().checkAuth();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(authApi.me).not.toHaveBeenCalled();
    });

    it('fetches user and sets authenticated when token exists', async () => {
      localStorage.setItem('citizen_token', 't');
      const user = { id: '1', email: 'a@b.c' };
      // deno-lint-ignore no-explicit-any
      vi.mocked(authApi.me).mockResolvedValueOnce(user as any);
      await useAuthStore.getState().checkAuth();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
    });

    it('clears auth when me() fails', async () => {
      localStorage.setItem('citizen_token', 't');
      vi.mocked(authApi.me).mockRejectedValueOnce(new Error('401'));
      await useAuthStore.getState().checkAuth();
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });

  describe('clearError', () => {
    it('resets error to null', () => {
      useAuthStore.setState({ error: 'oops' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
