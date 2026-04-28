// Mock must be declared before imports — Jest hoists this call
jest.mock('@anthropic-ai/sdk', () => {
  const create = jest.fn();
  function MockAnthropic(this: any) {
    this.messages = { create };
  }
  (MockAnthropic as any).__create = create;
  return { __esModule: true, default: MockAnthropic };
});

import Anthropic from '@anthropic-ai/sdk';
import { generateSongSuggestions } from './aiRecommendations';

// Access the shared mock function via the property we attached above
const mockCreate = (Anthropic as any).__create as jest.Mock;

describe('generateSongSuggestions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mockCreate.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns curated fallback songs for a known mood when API key is absent', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const songs = await generateSongSuggestions('happy');

    expect(songs.length).toBeGreaterThan(0);
    songs.forEach((s) => {
      expect(s).toHaveProperty('title');
      expect(s).toHaveProperty('artist');
      expect(typeof s.title).toBe('string');
      expect(typeof s.artist).toBe('string');
    });
  });

  it('returns curated songs for sad mood when API key is absent', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const songs = await generateSongSuggestions('sad');

    expect(songs.length).toBeGreaterThan(0);
  });

  it('returns curated songs for relaxed mood when API key is absent', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const songs = await generateSongSuggestions('relaxed');

    expect(songs.length).toBeGreaterThan(0);
  });

  it('returns empty array for a completely unknown mood when API key is absent', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const songs = await generateSongSuggestions('zzz-completely-unknown-xyz-abc');

    expect(Array.isArray(songs)).toBe(true);
    expect(songs.length).toBe(0);
  });

  it('returns AI-generated songs when Anthropic responds with valid JSON', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    mockCreate.mockResolvedValue({
      // content as a plain string — matches the string branch of extractTextFromMessageContent
      content: JSON.stringify({
        songs: [
          { title: 'AI Track Alpha', artist: 'AI Artist Alpha' },
          { title: 'AI Track Beta', artist: 'AI Artist Beta' },
          { title: 'AI Track Gamma', artist: 'AI Artist Gamma' },
        ],
      }),
    });

    const songs = await generateSongSuggestions('relaxed');

    expect(songs.length).toBeGreaterThan(0);
    expect(songs[0].title).toBe('AI Track Alpha');
    expect(songs[0].artist).toBe('AI Artist Alpha');
  });

  it('falls back to curated songs when Anthropic returns malformed JSON', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    mockCreate.mockResolvedValue({
      content: 'this is not valid json at all',
    });

    const songs = await generateSongSuggestions('sad');

    expect(songs.length).toBeGreaterThan(0);
    expect(songs[0]).toHaveProperty('title');
    expect(songs[0]).toHaveProperty('artist');
  });

  it('falls back to curated songs when Anthropic call throws an error', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    mockCreate.mockRejectedValue(new Error('Network error'));

    const songs = await generateSongSuggestions('romantic');

    expect(songs.length).toBeGreaterThan(0);
  });

  it('falls back to curated songs when AI response has wrong JSON shape', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    mockCreate.mockResolvedValue({
      content: JSON.stringify({ wrongKey: [] }),
    });

    const songs = await generateSongSuggestions('happy');

    expect(Array.isArray(songs)).toBe(true);
  });

  it('excludes titles listed in options.excludedTitles', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const allSongs = await generateSongSuggestions('happy');
    const firstTitle = allSongs[0].title;

    const filtered = await generateSongSuggestions('happy', {
      excludedTitles: [firstTitle],
    });

    expect(filtered.every((s) => s.title !== firstTitle)).toBe(true);
  });

  it('handles string content blocks from Anthropic response', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    mockCreate.mockResolvedValue({
      content: JSON.stringify({
        songs: [
          { title: 'String Block Song', artist: 'String Block Artist' },
        ],
      }),
    });

    // Even if the content is a string (not array), it should handle gracefully
    const songs = await generateSongSuggestions('excited');

    expect(Array.isArray(songs)).toBe(true);
  });

  it('handles Anthropic text object blocks (type:text)', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: '{"songs":[{"title":"Neon Skyline","artist":"Midnight Echo"}]}',
        },
      ],
    });

    const songs = await generateSongSuggestions('happy');

    expect(songs.length).toBeGreaterThan(0);
    expect(songs[0].title).toBe('Neon Skyline');
    expect(songs[0].artist).toBe('Midnight Echo');
  });
});
