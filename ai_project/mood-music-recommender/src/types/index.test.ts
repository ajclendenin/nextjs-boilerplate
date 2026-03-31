import { Mood, Track, MoodConfig } from '../types';

describe('Types', () => {
  describe('Mood type', () => {
    it('accepts all valid mood values', () => {
      const moods: Mood[] = [
        'happy',
        'sad',
        'energetic',
        'relaxed',
        'romantic',
        'focused',
      ];

      expect(moods).toHaveLength(6);
    });
  });

  describe('Track interface', () => {
    it('has all required properties', () => {
      const track: Track = {
        id: '123',
        name: 'Song Name',
        artists: [{ name: 'Artist 1' }],
        album: {
          name: 'Album Name',
          images: [{ url: 'https://example.com/image.jpg' }],
        },
        external_urls: {
          spotify: 'https://open.spotify.com/track/123',
        },
      };

      expect(track.id).toBeDefined();
      expect(track.name).toBeDefined();
      expect(track.artists).toBeDefined();
      expect(track.album).toBeDefined();
      expect(track.external_urls).toBeDefined();
    });

    it('allows optional preview_url', () => {
      const trackWithPreview: Track = {
        id: '123',
        name: 'Song Name',
        artists: [{ name: 'Artist 1' }],
        album: {
          name: 'Album Name',
          images: [{ url: 'https://example.com/image.jpg' }],
        },
        external_urls: {
          spotify: 'https://open.spotify.com/track/123',
        },
        preview_url: 'https://example.com/preview.mp3',
      };

      expect(trackWithPreview.preview_url).toBe('https://example.com/preview.mp3');
    });

    it('allows omission of preview_url', () => {
      const trackWithoutPreview: Track = {
        id: '123',
        name: 'Song Name',
        artists: [{ name: 'Artist 1' }],
        album: {
          name: 'Album Name',
          images: [{ url: 'https://example.com/image.jpg' }],
        },
        external_urls: {
          spotify: 'https://open.spotify.com/track/123',
        },
      };

      expect(trackWithoutPreview.preview_url).toBeUndefined();
    });

    it('supports multiple artists', () => {
      const track: Track = {
        id: '123',
        name: 'Collaboration Song',
        artists: [
          { name: 'Artist 1' },
          { name: 'Artist 2' },
          { name: 'Artist 3' },
        ],
        album: {
          name: 'Album Name',
          images: [{ url: 'https://example.com/image.jpg' }],
        },
        external_urls: {
          spotify: 'https://open.spotify.com/track/123',
        },
      };

      expect(track.artists).toHaveLength(3);
      expect(track.artists[0].name).toBe('Artist 1');
    });

    it('supports multiple album images', () => {
      const track: Track = {
        id: '123',
        name: 'Song Name',
        artists: [{ name: 'Artist 1' }],
        album: {
          name: 'Album Name',
          images: [
            { url: 'https://example.com/image-large.jpg' },
            { url: 'https://example.com/image-medium.jpg' },
            { url: 'https://example.com/image-small.jpg' },
          ],
        },
        external_urls: {
          spotify: 'https://open.spotify.com/track/123',
        },
      };

      expect(track.album.images).toHaveLength(3);
    });
  });

  describe('MoodConfig interface', () => {
    it('has all required properties', () => {
      const config: MoodConfig = {
        mood: 'happy',
        label: 'Happy',
        emoji: '😊',
        seedGenres: ['pop', 'dance'],
        targetValence: 0.8,
        targetEnergy: 0.7,
      };

      expect(config.mood).toBe('happy');
      expect(config.label).toBe('Happy');
      expect(config.emoji).toBe('😊');
      expect(config.seedGenres).toEqual(['pop', 'dance']);
      expect(config.targetValence).toBe(0.8);
      expect(config.targetEnergy).toBe(0.7);
    });

    it('validates mood value is a valid Mood type', () => {
      const validConfigs: MoodConfig[] = [
        {
          mood: 'happy',
          label: 'Happy',
          emoji: '😊',
          seedGenres: ['pop'],
          targetValence: 0.8,
          targetEnergy: 0.7,
        },
        {
          mood: 'sad',
          label: 'Sad',
          emoji: '😢',
          seedGenres: ['indie'],
          targetValence: 0.2,
          targetEnergy: 0.3,
        },
      ];

      expect(validConfigs).toHaveLength(2);
      validConfigs.forEach((config) => {
        expect(['happy', 'sad', 'energetic', 'relaxed', 'romantic', 'focused']).toContain(
          config.mood
        );
      });
    });

    it('valence and energy are in valid range', () => {
      const config: MoodConfig = {
        mood: 'happy',
        label: 'Happy',
        emoji: '😊',
        seedGenres: ['pop'],
        targetValence: 0.8,
        targetEnergy: 0.7,
      };

      expect(config.targetValence).toBeGreaterThanOrEqual(0);
      expect(config.targetValence).toBeLessThanOrEqual(1);
      expect(config.targetEnergy).toBeGreaterThanOrEqual(0);
      expect(config.targetEnergy).toBeLessThanOrEqual(1);
    });
  });
});
