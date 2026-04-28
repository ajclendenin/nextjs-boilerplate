/**
 * @jest-environment node
 */

// Mock dependencies before any imports so route.ts uses stubs not real APIs
jest.mock('@/lib/aiRecommendations', () => ({
  generateSongSuggestions: jest.fn().mockResolvedValue([]),
  generateSongSuggestionsWithSource: jest
    .fn()
    .mockResolvedValue({ songs: [], source: 'fallback' }),
}));

jest.mock('@/lib/weatherContext', () => ({
  buildMoodContext: jest.fn().mockReturnValue({
    effectiveMood: 'happy',
    summary: 'Happy in the morning.',
    timeOfDay: 'morning',
  }),
  fetchCurrentWeather: jest.fn().mockResolvedValue(null),
  getContextAwareSearchQueries: jest.fn().mockReturnValue(['happy music']),
}));

import { NextRequest } from 'next/server';
import { GET } from './route';

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/spotify');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

const sampleSpotifyTrack = {
  data: {
    id: 'track-abc',
    name: 'As It Was',
    artists: {
      items: [{ profile: { name: 'Harry Styles' } }],
    },
    albumOfTrack: {
      name: 'Harrys House',
      coverArt: { sources: [{ url: 'https://example.com/cover.jpg' }] },
    },
    external_urls: { spotify: 'https://open.spotify.com/track/track-abc' },
    preview_url: null,
  },
};

describe('GET /api/spotify', () => {
  const originalFetch = (globalThis as any).fetch;

  beforeEach(() => {
    // Default: Spotify returns no items → 404 unless overridden per-test
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ tracks: { items: [] } }),
      text: async () => '',
    });
  });

  afterEach(() => {
    (globalThis as any).fetch = originalFetch;
  });

  describe('parameter validation', () => {
    it('returns 400 when mood parameter is missing', async () => {
      const res = await GET(makeRequest({}));

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/mood parameter is required/i);
    });

    it('returns 400 when mood is blank whitespace', async () => {
      const res = await GET(makeRequest({ mood: '   ' }));

      expect(res.status).toBe(400);
    });
  });

  describe('track results', () => {
    it('returns 404 when Spotify returns no usable tracks', async () => {
      const res = await GET(makeRequest({ mood: 'happy' }));

      expect(res.status).toBe(404);
    });

    it('returns 200 with tracks when Spotify returns valid data', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tracks: { items: [sampleSpotifyTrack] } }),
        text: async () => '',
      });

      const res = await GET(makeRequest({ mood: 'happy' }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.tracks)).toBe(true);
      expect(body.tracks.length).toBeGreaterThan(0);
      expect(body.context).toBeDefined();
      expect(body.context.requestedMood).toBe('happy');
    });

    it('normalises mood synonyms — joyful resolves to happy', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tracks: { items: [sampleSpotifyTrack] } }),
        text: async () => '',
      });

      const res = await GET(makeRequest({ mood: 'joyful' }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.context.interpretedMood).toBe('happy');
    });

    it('filters out remastered variant tracks — returns 404', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          tracks: {
            items: [
              {
                data: {
                  id: 'v1',
                  name: 'Some Song (Remastered)',
                  artists: { items: [{ profile: { name: 'Artist' } }] },
                  albumOfTrack: {
                    name: 'Album',
                    coverArt: { sources: [{ url: 'https://example.com/img.jpg' }] },
                  },
                  external_urls: { spotify: 'https://open.spotify.com/track/v1' },
                },
              },
            ],
          },
        }),
        text: async () => '',
      });

      const res = await GET(makeRequest({ mood: 'happy' }));

      expect(res.status).toBe(404);
    });

    it('handles Spotify fetch failure gracefully — returns 404', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        text: async () => 'Service Unavailable',
      });

      const res = await GET(makeRequest({ mood: 'relaxed' }));

      expect(res.status).toBe(404);
    });

    it('passes excludeIds and feedback params through', async () => {
      (globalThis as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ tracks: { items: [sampleSpotifyTrack] } }),
        text: async () => '',
      });

      const res = await GET(
        makeRequest({
          mood: 'happy',
          excludeIds: 'track-abc',
          excludeTitles: 'As It Was',
          feedback: 'too fast',
          rejectedTrackTitle: 'As It Was',
        })
      );

      // excluded track is filtered out → 404
      expect(res.status).toBe(404);
    });
  });
});
