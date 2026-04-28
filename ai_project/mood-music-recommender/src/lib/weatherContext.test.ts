import {
  buildMoodContext,
  fetchCurrentWeather,
  getContextAwareSearchQueries,
  inferMoodFromWeather,
} from './weatherContext';

describe('weatherContext', () => {
  const originalEnv = process.env;
  const originalFetch = (globalThis as any).fetch;

  beforeEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
    (globalThis as any).fetch = originalFetch;
  });

  describe('buildMoodContext', () => {
    it('uses time-of-day fallback when weather is unavailable', () => {
      const result = buildMoodContext('chill', null, 9);

      expect(result.timeOfDay).toBe('morning');
      expect(result.effectiveMood).toContain('chill');
      expect(result.effectiveMood).toContain('fresh morning vibe');
      expect(result.summary).toContain('time-of-day context');
    });

    it('blends mood with weather details when weather is available', () => {
      const result = buildMoodContext(
        'happy',
        {
          condition: 'Rain',
          temperatureC: 14,
          summary: 'Rain, 14C',
        },
        20
      );

      expect(result.timeOfDay).toBe('evening');
      expect(result.effectiveMood).toContain('reflective influence');
      expect(result.summary).toContain('rain, 14c');
    });
  });

  describe('inferMoodFromWeather', () => {
    it('returns time-based default when weather is missing', () => {
      expect(inferMoodFromWeather(null, 14)).toBe('uplifting afternoon');
    });

    it('returns weather-biased mood with time of day', () => {
      expect(
        inferMoodFromWeather(
          {
            condition: 'Clear',
            temperatureC: 22,
            summary: 'Clear, 22C',
          },
          19
        )
      ).toBe('happy evening');
    });
  });

  describe('getContextAwareSearchQueries', () => {
    it('returns deduplicated and trimmed queries', () => {
      const result = getContextAwareSearchQueries(
        ' nostalgic  ',
        'nostalgic',
        {
          condition: 'Cloudy',
          temperatureC: 18,
          summary: 'Cloudy, 18C',
        },
        10
      );

      expect(result).toEqual([
        'nostalgic',
        'nostalgic   Cloudy',
        'Cloudy morning playlist',
      ]);
    });
  });

  describe('fetchCurrentWeather', () => {
    it('returns null when required environment values are missing', async () => {
      delete process.env.WEATHER_API_URL_TEMPLATE;
      delete process.env.RAPID_API_KEY;

      const fetchSpy = jest.fn();
      (globalThis as any).fetch = fetchSpy;
      const result = await fetchCurrentWeather(30, -90);

      expect(result).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('normalizes valid API response', async () => {
      process.env.WEATHER_API_URL_TEMPLATE =
        'https://example.test/weather?lat={lat}&lon={lon}';
      process.env.RAPID_API_KEY = 'test-key';

      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          current: {
            condition: { text: 'Sunny' },
            temp_c: 26,
          },
        }),
      });
      (globalThis as any).fetch = fetchMock;

      const result = await fetchCurrentWeather(10.5, -20.25);

      expect(result).toEqual({
        condition: 'Sunny',
        temperatureC: 26,
        summary: 'Sunny, 26C',
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});