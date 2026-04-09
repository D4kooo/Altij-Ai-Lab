import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  authApi,
  coursesApi,
  campaignsApi,
  templatesApi,
  breachCheckApi,
  cguApi,
  fuitesApi,
  ApiError,
} from './api';

interface FakeResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

function okResponse<T>(data: T): FakeResponse {
  return { ok: true, status: 200, json: async () => ({ success: true, data }) };
}

function errorResponse(status: number, error = 'boom'): FakeResponse {
  return { ok: false, status, json: async () => ({ success: false, error }) };
}

function queueFetch(...responses: FakeResponse[]) {
  const mock = vi.fn();
  responses.forEach((r) => mock.mockResolvedValueOnce(r));
  vi.stubGlobal('fetch', mock);
  return mock;
}

describe('api', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('ApiError', () => {
    it('carries status and name', () => {
      const e = new ApiError('nope', 418);
      expect(e.status).toBe(418);
      expect(e.name).toBe('ApiError');
      expect(e.message).toBe('nope');
      expect(e).toBeInstanceOf(Error);
    });
  });

  describe('fetchApi (via authApi.me)', () => {
    it('sends Authorization header when token is present', async () => {
      localStorage.setItem('citizen_token', 'abc');
      const fetchMock = queueFetch(okResponse({ id: '1', email: 'a@b.c' }));
      await authApi.me();
      const init = fetchMock.mock.calls[0][1];
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc');
    });

    it('does not send Authorization when no token', async () => {
      const fetchMock = queueFetch(okResponse({ id: '1' }));
      await authApi.me();
      const init = fetchMock.mock.calls[0][1];
      expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    });

    it('throws ApiError with message on error response', async () => {
      queueFetch(errorResponse(400, 'bad'));
      await expect(authApi.me()).rejects.toThrow('bad');
    });
  });

  describe('authApi.login', () => {
    it('stores tokens on success and returns data', async () => {
      const payload = {
        token: 't1',
        refreshToken: 'r1',
        user: { id: '1', email: 'a@b.c' },
      };
      const fetchMock = queueFetch(okResponse(payload));
      const result = await authApi.login({ email: 'a@b.c', password: 'x' });
      expect(result).toEqual(payload);
      expect(localStorage.getItem('citizen_token')).toBe('t1');
      expect(localStorage.getItem('citizen_refreshToken')).toBe('r1');
      // adds context: 'citizen'
      const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(body.context).toBe('citizen');
    });
  });

  describe('authApi.logout', () => {
    it('clears tokens even if request fails', async () => {
      localStorage.setItem('citizen_token', 't');
      localStorage.setItem('citizen_refreshToken', 'r');
      queueFetch(errorResponse(500));
      await expect(authApi.logout()).rejects.toThrow();
      expect(localStorage.getItem('citizen_token')).toBeNull();
      expect(localStorage.getItem('citizen_refreshToken')).toBeNull();
    });

    it('clears tokens on success', async () => {
      localStorage.setItem('citizen_token', 't');
      localStorage.setItem('citizen_refreshToken', 'r');
      queueFetch(okResponse({}));
      await authApi.logout();
      expect(localStorage.getItem('citizen_token')).toBeNull();
    });
  });

  describe('authApi.changePassword', () => {
    it('updates stored tokens with new ones', async () => {
      localStorage.setItem('citizen_token', 'old');
      queueFetch(okResponse({ message: 'ok', token: 'new', refreshToken: 'newR' }));
      const result = await authApi.changePassword({ currentPassword: 'a', newPassword: 'b' });
      expect(result.token).toBe('new');
      expect(localStorage.getItem('citizen_token')).toBe('new');
      expect(localStorage.getItem('citizen_refreshToken')).toBe('newR');
    });
  });

  describe('authApi.registerCitizen', () => {
    it('stores tokens on successful registration', async () => {
      const payload = {
        token: 'tt',
        refreshToken: 'rr',
        user: { id: '1', email: 'a@b.c' },
      };
      queueFetch(okResponse(payload));
      await authApi.registerCitizen({
        email: 'a@b.c',
        password: 'x',
        firstName: 'A',
        lastName: 'B',
      });
      expect(localStorage.getItem('citizen_token')).toBe('tt');
    });
  });

  describe('authApi.updateProfile', () => {
    it('sends PUT with the given fields', async () => {
      const fetchMock = queueFetch(okResponse({ id: '1', firstName: 'New' }));
      await authApi.updateProfile({ firstName: 'New' });
      const init = fetchMock.mock.calls[0][1];
      expect(init.method).toBe('PUT');
      expect(JSON.parse(init.body as string)).toEqual({ firstName: 'New' });
    });
  });

  describe('coursesApi', () => {
    it('list: appends audience param when provided', async () => {
      const fetchMock = queueFetch(okResponse([]));
      await coursesApi.list('juniors');
      expect(fetchMock.mock.calls[0][0]).toContain('?audience=juniors');
    });

    it('list: no params when audience omitted', async () => {
      const fetchMock = queueFetch(okResponse([]));
      await coursesApi.list();
      expect(fetchMock.mock.calls[0][0]).not.toContain('?audience');
    });

    it('get: fetches course by id', async () => {
      const fetchMock = queueFetch(okResponse({ id: 'c1', modules: [] }));
      await coursesApi.get('c1');
      expect(fetchMock.mock.calls[0][0]).toContain('/courses/c1');
    });

    it('getModule: fetches module by id', async () => {
      const fetchMock = queueFetch(okResponse({ id: 'm1', lessons: [] }));
      await coursesApi.getModule('m1');
      expect(fetchMock.mock.calls[0][0]).toContain('/courses/modules/m1');
    });

    it('submitQuiz: posts answers array', async () => {
      const fetchMock = queueFetch(
        okResponse({ score: 100, passed: true, passingScore: 80, correctAnswers: 1, totalQuestions: 1, results: [] })
      );
      await coursesApi.submitQuiz('q1', [{ questionId: 'q', selectedOptionId: 'o' }]);
      const init = fetchMock.mock.calls[0][1];
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string).answers).toHaveLength(1);
    });

    it('completeModule: posts to complete endpoint', async () => {
      const fetchMock = queueFetch(okResponse(undefined));
      await coursesApi.completeModule('m1');
      expect(fetchMock.mock.calls[0][0]).toContain('/courses/progress/m1/complete');
      expect(fetchMock.mock.calls[0][1].method).toBe('POST');
    });

    it('getMyProgress: fetches progress list', async () => {
      const fetchMock = queueFetch(okResponse([]));
      await coursesApi.getMyProgress();
      expect(fetchMock.mock.calls[0][0]).toContain('/courses/progress/me');
    });
  });

  describe('campaignsApi', () => {
    it('list without status', async () => {
      const fetchMock = queueFetch(okResponse([]));
      await campaignsApi.list();
      expect(fetchMock.mock.calls[0][0]).not.toContain('?status');
    });

    it('list with status', async () => {
      const fetchMock = queueFetch(okResponse([]));
      await campaignsApi.list('active');
      expect(fetchMock.mock.calls[0][0]).toContain('?status=active');
    });

    it('join posts', async () => {
      const fetchMock = queueFetch(okResponse({ participationId: 'p', participants: 1 }));
      await campaignsApi.join('c1');
      expect(fetchMock.mock.calls[0][1].method).toBe('POST');
      expect(fetchMock.mock.calls[0][0]).toContain('/campaigns/c1/join');
    });

    it('leave deletes', async () => {
      const fetchMock = queueFetch(okResponse({ participants: 0 }));
      await campaignsApi.leave('c1');
      expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
    });

    it('get by id', async () => {
      const fetchMock = queueFetch(okResponse({ id: 'c1' }));
      await campaignsApi.get('c1');
      expect(fetchMock.mock.calls[0][0]).toContain('/campaigns/c1');
    });

    it('getStats fetches global stats', async () => {
      const fetchMock = queueFetch(
        okResponse({ totalParticipants: 0, activeCampaigns: 0, completedCampaigns: 0 })
      );
      await campaignsApi.getStats();
      expect(fetchMock.mock.calls[0][0]).toContain('/campaigns/stats/global');
    });

    it('getMyParticipations', async () => {
      const fetchMock = queueFetch(okResponse([]));
      await campaignsApi.getMyParticipations();
      expect(fetchMock.mock.calls[0][0]).toContain('/campaigns/my/participations');
    });
  });

  describe('templatesApi', () => {
    it('list with category', async () => {
      const fetchMock = queueFetch(okResponse([]));
      await templatesApi.list('RGPD');
      expect(fetchMock.mock.calls[0][0]).toContain('?category=RGPD');
    });

    it('list without category', async () => {
      const fetchMock = queueFetch(okResponse([]));
      await templatesApi.list();
      expect(fetchMock.mock.calls[0][0]).not.toContain('?category');
    });

    it('get by id', async () => {
      const fetchMock = queueFetch(okResponse({ id: 't1' }));
      await templatesApi.get('t1');
      expect(fetchMock.mock.calls[0][0]).toContain('/templates/t1');
    });

    it('download triggers download endpoint', async () => {
      const fetchMock = queueFetch(okResponse({ id: 't1', downloadCount: 1 }));
      await templatesApi.download('t1');
      expect(fetchMock.mock.calls[0][0]).toContain('/templates/t1/download');
    });

    it('getCategories', async () => {
      const fetchMock = queueFetch(okResponse([]));
      await templatesApi.getCategories();
      expect(fetchMock.mock.calls[0][0]).toContain('/templates/categories/list');
    });
  });

  describe('breachCheckApi', () => {
    it('posts email', async () => {
      const fetchMock = queueFetch(okResponse({ email: 'a@b.c', breachCount: 0, breaches: [] }));
      await breachCheckApi.check('a@b.c');
      expect(fetchMock.mock.calls[0][1].method).toBe('POST');
      expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ email: 'a@b.c' });
    });
  });

  describe('cguApi', () => {
    it('analyze posts body', async () => {
      const fetchMock = queueFetch(
        okResponse({ serviceName: 'X', score: 1, summary: '', points: [] })
      );
      await cguApi.analyze({ url: 'https://x.y' });
      expect(fetchMock.mock.calls[0][1].method).toBe('POST');
      expect(fetchMock.mock.calls[0][0]).toContain('/cgu-analyze');
    });
  });

  describe('fuitesApi', () => {
    it('gets fuites infos', async () => {
      const fetchMock = queueFetch(okResponse([]));
      await fuitesApi.getInfos();
      expect(fetchMock.mock.calls[0][0]).toContain('/fuites-infos');
    });
  });
});
