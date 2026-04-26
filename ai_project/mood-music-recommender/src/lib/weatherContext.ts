interface WeatherSnapshot {
  condition: string;
  temperatureC: number | null;
  summary: string;
}

interface MoodContext {
  effectiveMood: string;
  summary: string;
  timeOfDay: string;
}

const WEATHER_API_HOST = process.env.WEATHER_API_HOST || 'weather-api167.p.rapidapi.com';

function getTimeOfDay(localHour?: number | null): string {
  if (typeof localHour !== 'number' || Number.isNaN(localHour)) {
    return 'day';
  }

  if (localHour >= 5 && localHour < 12) {
    return 'morning';
  }

  if (localHour >= 12 && localHour < 17) {
    return 'afternoon';
  }

  if (localHour >= 17 && localHour < 21) {
    return 'evening';
  }

  return 'night';
}

function pickString(candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
}

function pickNumber(candidates: unknown[]): number | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === 'string') {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function normalizeWeatherPayload(payload: any): WeatherSnapshot | null {
  const root = payload?.data ?? payload;
  const condition = pickString([
    root?.current?.condition?.text,
    root?.current?.weather?.[0]?.main,
    root?.current?.weather?.[0]?.description,
    root?.current?.weather_descriptions?.[0],
    root?.weather?.[0]?.main,
    root?.weather?.[0]?.description,
    root?.currentConditions?.conditions,
    root?.condition,
  ]);

  if (!condition) {
    return null;
  }

  const temperatureC = pickNumber([
    root?.current?.temp_c,
    root?.current?.temperature,
    root?.current?.temp,
    root?.main?.temp,
    root?.temperature,
    root?.currentConditions?.temp,
  ]);

  return {
    condition,
    temperatureC,
    summary: temperatureC === null ? condition : `${condition}, ${Math.round(temperatureC)}C`,
  };
}

function buildWeatherRequestUrl(latitude: number, longitude: number): string | null {
  const template = process.env.WEATHER_API_URL_TEMPLATE;

  if (!template) {
    return null;
  }

  return template
    .replace('{lat}', encodeURIComponent(String(latitude)))
    .replace('{lon}', encodeURIComponent(String(longitude)));
}
//decides how weather influences mood
function inferWeatherBias(weather: WeatherSnapshot, timeOfDay: string): string {
  const condition = weather.condition.toLowerCase();

  if (condition.includes('sun') || condition.includes('clear')) {
    if (timeOfDay === 'night') {
      return 'relaxed';
    }

    return 'happy';
  }

  if (
    condition.includes('rain') ||
    condition.includes('drizzle') ||
    condition.includes('mist') ||
    condition.includes('fog')
  ) {
    return 'reflective';
  }

  if (condition.includes('storm') || condition.includes('thunder')) {
    return 'intense';
  }

  if (condition.includes('snow')) {
    return 'nostalgic';
  }

  if (condition.includes('wind')) {
    return 'adventurous';
  }

  if (weather.temperatureC !== null) {
    if (weather.temperatureC >= 28) {
      return 'energetic';
    }

    if (weather.temperatureC <= 8) {
      return 'cozy';
    }
  }

  if (timeOfDay === 'evening') {
    return 'romantic';
  }

  if (timeOfDay === 'night') {
    return 'calm';
  }

  return 'relaxed';
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number
): Promise<WeatherSnapshot | null> {
  const url = buildWeatherRequestUrl(latitude, longitude);
  const apiKey = process.env.RAPID_API_KEY;

  if (!url || !apiKey) {
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': WEATHER_API_HOST,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn('Weather API request failed:', response.status, await response.text());
      return null;
    }

    const payload = await response.json();
    const normalized = normalizeWeatherPayload(payload);

    if (!normalized) {
      console.warn('Weather API response could not be normalized.');
    }

    return normalized;
  } catch (error) {
    console.warn('Weather lookup failed:', error);
    return null;
  }
}
// considers normalized mood
export function buildMoodContext(
  userMood: string,
  weather: WeatherSnapshot | null,
  localHour?: number | null
): MoodContext {
  const trimmedMood = userMood.trim();
  const timeOfDay = getTimeOfDay(localHour);

  if (!weather) {
    const timeBias =
      timeOfDay === 'morning'
        ? 'fresh'
        : timeOfDay === 'afternoon'
          ? 'uplifting'
          : timeOfDay === 'evening'
            ? 'warm'
            : 'calm';

    return {
      effectiveMood: `${trimmedMood} with a ${timeBias} ${timeOfDay} vibe`,
      summary: `Using your mood "${trimmedMood}" with ${timeOfDay} time-of-day context.`,
      timeOfDay,
    };
  }

  const weatherBias = inferWeatherBias(weather, timeOfDay);
  const weatherPhrase = `${weather.condition.toLowerCase()} ${timeOfDay}`;

  return {
    effectiveMood: `${trimmedMood} with a ${weatherBias} influence from the ${weatherPhrase}`,
    summary: `Using your mood "${trimmedMood}" with ${weather.summary.toLowerCase()} during the ${timeOfDay}.`,
    timeOfDay,
  };
}

export function inferMoodFromWeather(
  weather: WeatherSnapshot | null,
  localHour?: number | null
): string {
  if (!weather) {
    const timeOfDay = getTimeOfDay(localHour);
    if (timeOfDay === 'morning') return 'energized morning';
    if (timeOfDay === 'afternoon') return 'uplifting afternoon';
    if (timeOfDay === 'evening') return 'warm evening';
    return 'calm night';
  }

  const weatherBias = inferWeatherBias(weather, getTimeOfDay(localHour));
  const timeOfDay = getTimeOfDay(localHour);
  return `${weatherBias} ${timeOfDay}`;
}

export function getContextAwareSearchQueries(
  userMood: string,
  effectiveMood: string,
  weather: WeatherSnapshot | null,
  localHour?: number | null
): string[] {
  const queries = [effectiveMood, userMood];

  if (weather) {
    const timeOfDay = getTimeOfDay(localHour);
    queries.push(`${userMood} ${weather.condition}`);
    queries.push(`${weather.condition} ${timeOfDay} playlist`);
  }

  return Array.from(
    new Set(
      queries
        .map((query) => query.trim())
        .filter((query) => query.length > 0)
    )
  );
}