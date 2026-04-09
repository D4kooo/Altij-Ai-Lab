import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cmsApi } from './cms';

function mockFetchOnce(payload: unknown, ok = true, status = 200) {
  const mock = vi.fn().mockResolvedValueOnce({
    ok,
    status,
    json: async () => payload,
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

describe('cmsApi', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getPage', () => {
    it('returns first doc when found', async () => {
      const page = { id: '1', title: 'T', slug: 's', status: 'published' };
      const fetchMock = mockFetchOnce({ docs: [page] });
      const result = await cmsApi.getPage('about');
      expect(result).toEqual(page);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/pages?where[slug][equals]=about'),
        expect.any(Object)
      );
    });

    it('returns null when not found', async () => {
      mockFetchOnce({ docs: [] });
      expect(await cmsApi.getPage('missing')).toBeNull();
    });

    it('throws on non-ok response', async () => {
      mockFetchOnce({}, false, 500);
      await expect(cmsApi.getPage('x')).rejects.toThrow('CMS error: 500');
    });
  });

  describe('getPages', () => {
    it('returns all docs', async () => {
      const docs = [{ id: '1' }, { id: '2' }];
      mockFetchOnce({ docs });
      const result = await cmsApi.getPages();
      expect(result).toEqual(docs);
    });
  });

  describe('getArticles', () => {
    it('passes pagination params', async () => {
      const fetchMock = mockFetchOnce({ docs: [], totalDocs: 0 });
      await cmsApi.getArticles(undefined, 2, 5);
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain('page=2');
      expect(url).toContain('limit=5');
    });

    it('adds category filter when provided', async () => {
      const fetchMock = mockFetchOnce({ docs: [] });
      await cmsApi.getArticles('rgpd');
      expect(fetchMock.mock.calls[0][0]).toContain('[category][equals]=rgpd');
    });
  });

  describe('getArticle', () => {
    it('returns first matching article', async () => {
      const article = { id: '1', slug: 'a' };
      mockFetchOnce({ docs: [article] });
      expect(await cmsApi.getArticle('a')).toEqual(article);
    });

    it('returns null when no match', async () => {
      mockFetchOnce({ docs: [] });
      expect(await cmsApi.getArticle('x')).toBeNull();
    });
  });

  describe('getFAQ', () => {
    it('filters by category when given', async () => {
      const fetchMock = mockFetchOnce({ docs: [] });
      await cmsApi.getFAQ('data');
      expect(fetchMock.mock.calls[0][0]).toContain('[category][equals]=data');
    });

    it('returns all FAQs without filter', async () => {
      const docs = [{ id: '1' }];
      mockFetchOnce({ docs });
      expect(await cmsApi.getFAQ()).toEqual(docs);
    });
  });

  describe('getCourses', () => {
    it('filters by audience', async () => {
      const fetchMock = mockFetchOnce({ docs: [] });
      await cmsApi.getCourses('juniors');
      expect(fetchMock.mock.calls[0][0]).toContain('[audience][equals]=juniors');
    });
  });

  describe('getSiteSettings', () => {
    it('fetches the site-settings global', async () => {
      const settings = { general: { siteName: 'X' } };
      const fetchMock = mockFetchOnce(settings);
      const result = await cmsApi.getSiteSettings();
      expect(result).toEqual(settings);
      expect(fetchMock.mock.calls[0][0]).toContain('/globals/site-settings');
    });
  });

  describe('getNewsletters / getNewsletter', () => {
    it('fetches newsletters with pagination', async () => {
      const fetchMock = mockFetchOnce({ docs: [], totalDocs: 0 });
      await cmsApi.getNewsletters(3, 20);
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain('page=3');
      expect(url).toContain('limit=20');
    });

    it('fetches one newsletter by id', async () => {
      const nl = { id: 'abc', subject: 'S' };
      const fetchMock = mockFetchOnce(nl);
      const result = await cmsApi.getNewsletter('abc');
      expect(result).toEqual(nl);
      expect(fetchMock.mock.calls[0][0]).toContain('/newsletters/abc');
    });
  });
});
