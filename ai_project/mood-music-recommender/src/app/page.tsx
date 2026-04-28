   'use client';

import { useEffect, useRef, useState } from 'react';
import MoodSelector from './components/MoodSelector';
import MusicPlayer from './components/MusicPlayer';
import { Mood, Track } from '../types';

  interface ListenerContext {
    lat?: string;
    lon?: string;
    localHour: string;
  }

  interface RecommendationResponse {
    tracks: Track[];
    context?: {
      summary?: string;
      timeOfDay?: string;
      weather?: {
        condition?: string;
        temperatureC?: number | null;
      } | null;
    };
  }

  interface HeaderContextResponse {
    weather?: {
      condition?: string;
      temperatureC?: number | null;
    } | null;
  }

  function TimeIcon() {
    const hour = new Date().getHours();

    if (hour < 6 || hour >= 21) {
      return (
        <svg viewBox="0 0 24 24" className="context-icon" aria-hidden="true">
          <path d="M16.5 2.5a9.5 9.5 0 1 0 5 17.5A8.5 8.5 0 1 1 16.5 2.5z" fill="#334155" />
        </svg>
      );
    }

    if (hour >= 17) {
      return (
        <svg viewBox="0 0 24 24" className="context-icon" aria-hidden="true">
          <circle cx="12" cy="12" r="5" fill="#fb923c" />
          <path d="M3 17h18" stroke="#334155" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    }

    if (hour < 12) {
      return (
        <svg viewBox="0 0 24 24" className="context-icon" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="#fbbf24" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2.2 2.2M16.3 16.3l2.2 2.2M18.5 5.5l-2.2 2.2M7.7 16.3l-2.2 2.2" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    }

    return (
      <svg viewBox="0 0 24 24" className="context-icon" aria-hidden="true">
        <circle cx="12" cy="12" r="5" fill="#f59e0b" />
        <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  function WeatherIcon({ condition }: { condition?: string }) {
    const lower = condition?.toLowerCase() ?? '';
    const renderSunIcon = () => (
      <svg viewBox="0 0 24 24" className="context-icon context-icon-weather" aria-hidden="true">
        <circle cx="12" cy="12" r="5" fill="#fbbf24" />
        <path d="M12 2.3v2.8M12 18.9v2.8M2.3 12h2.8M18.9 12h2.8M5.1 5.1l2 2M16.9 16.9l2 2M18.9 5.1l-2 2M7.1 16.9l-2 2" stroke="#f59e0b" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );

    if (!condition || lower.trim().length === 0) {
      return renderSunIcon();
    }

    const isSunnyLike =
      lower.includes('sun') ||
      lower.includes('clear') ||
      lower.includes('sunny') ||
      lower.includes('mostly sunny') ||
      lower.includes('partly sunny') ||
      lower.includes('partly cloudy') ||
      lower.includes('few clouds') ||
      lower.includes('fair');

    if (lower.includes('rain') || lower.includes('drizzle')) {
      return (
        <svg viewBox="0 0 24 24" className="context-icon context-icon-weather" aria-hidden="true">
          <path d="M7 16a4.5 4.5 0 1 1 .5-9 5.5 5.5 0 0 1 10.5 2A3.5 3.5 0 1 1 18.5 16H7z" fill="#ffffff" />
          <path d="M8.5 18.5l-1 2M12 18.5l-1 2M15.5 18.5l-1 2" stroke="#0ea5e9" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    }

    if (lower.includes('storm') || lower.includes('thunder')) {
      return (
        <svg viewBox="0 0 24 24" className="context-icon context-icon-weather" aria-hidden="true">
          <path d="M7 15.5a4.5 4.5 0 1 1 .5-9 5.5 5.5 0 0 1 10.5 2A3.5 3.5 0 1 1 18.5 15.5H7z" fill="#475569" />
          <path d="M12 16l-2 3h2l-1 3 3-4h-2l1-2z" fill="#facc15" />
        </svg>
      );
    }

    if (lower.includes('snow')) {
      return (
        <svg viewBox="0 0 24 24" className="context-icon context-icon-weather" aria-hidden="true">
          <path d="M7 15.5a4.5 4.5 0 1 1 .5-9 5.5 5.5 0 0 1 10.5 2A3.5 3.5 0 1 1 18.5 15.5H7z" fill="#64748b" />
          <path d="M10 18.2h4M12 16.2v4M10.6 16.8l2.8 2.8M13.4 16.8l-2.8 2.8" stroke="#f1f5f9" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }

    if (lower.includes('fog') || lower.includes('mist')) {
      return (
        <svg viewBox="0 0 24 24" className="context-icon context-icon-weather" aria-hidden="true">
          <path d="M6 9h12M4 13h16M6 17h12" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }

    if (isSunnyLike) {
      return renderSunIcon();
    }

    if (lower.includes('overcast') || lower.includes('cloudy') || lower === 'clouds' || lower.includes('clouds')) {
      return (
        <svg viewBox="0 0 24 24" className="context-icon context-icon-weather" aria-hidden="true">
          <path d="M7 16a4.5 4.5 0 1 1 .5-9 5.5 5.5 0 0 1 10.5 2A3.5 3.5 0 1 1 18.5 16H7z" fill="#ffffff" />
          <path d="M7 16h11.5" stroke="#bfdbfe" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    }

    return renderSunIcon();
  }

  function getCurrentHour(): string {
    return String(new Date().getHours());
  }

  async function getListenerContext(): Promise<ListenerContext> {
    const fallbackContext: ListenerContext = { localHour: getCurrentHour() };

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return fallbackContext;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          maximumAge: 15 * 60 * 1000,
          timeout: 5000,
        });
      });

      return {
        lat: String(position.coords.latitude),
        lon: String(position.coords.longitude),
        localHour: getCurrentHour(),
      };
    } catch {
      return fallbackContext;
    }
  }

export default function Home() {
  const autoLoadInFlightRef = useRef(false);
  const recommendationsInFlightRef = useRef(false);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextSummary, setContextSummary] = useState<string | null>(null);
  const [listenerContext, setListenerContext] = useState<ListenerContext | null>(null);
  const [moodHistory, setMoodHistory] = useState<Record<string, { ids: string[]; titles: string[] }>>({});
  const [headerWeather, setHeaderWeather] = useState<HeaderContextResponse['weather'] | null>(null);
  const [clockLabel, setClockLabel] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [isAutoLoadComplete, setIsAutoLoadComplete] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setClockLabel(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const loadHeaderWeather = async () => {
      const context = await getListenerContext();
      setListenerContext(context);

      if (!context.lat || !context.lon) {
        setHeaderWeather(null);
        return;
      }

      try {
        const response = await fetch(`/api/context?lat=${context.lat}&lon=${context.lon}`);
        if (!response.ok) {
          setHeaderWeather(null);
          return;
        }

        const data: HeaderContextResponse = await response.json();
        setHeaderWeather(data.weather ?? null);
      } catch {
        setHeaderWeather(null);
      }
    };

    void loadHeaderWeather();
  }, []);

  useEffect(() => {
    const autoLoadRecommendations = async () => {
      if (selectedMood || isAutoLoadComplete || autoLoadInFlightRef.current) return;

      autoLoadInFlightRef.current = true;

      setLoading(true);

      try {
        // Get listener context if not already set
        const context = listenerContext || (await getListenerContext());
        if (listenerContext === null) {
          setListenerContext(context);
        }

        // Get weather data
        let weatherData = headerWeather;
        if (!weatherData && context.lat && context.lon) {
          try {
            const response = await fetch(`/api/context?lat=${context.lat}&lon=${context.lon}`);
            if (response.ok) {
              const data: HeaderContextResponse = await response.json();
              weatherData = data.weather ?? null;
            }
          } catch {
            // Weather fetch failed, continue without it
          }
        }

        // Import and use the inference function
        const { inferMoodFromWeather } = await import('../lib/weatherContext');
        const weatherSnapshot = (weatherData && weatherData.condition)
          ? { 
              condition: weatherData.condition, 
              temperatureC: weatherData.temperatureC ?? null, 
              summary: `${weatherData.condition}${typeof weatherData.temperatureC === 'number' ? `, ${weatherData.temperatureC}C` : ''}`
            }
          : null;
        
        const inferredMood = inferMoodFromWeather(weatherSnapshot, parseInt(context.localHour, 10)) as Mood;

        // Fetch recommendations with inferred mood
        const params = new URLSearchParams({
          mood: inferredMood,
          localHour: context.localHour,
          requestSeed: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        });

        if (context.lat && context.lon) {
          params.set('lat', context.lat);
          params.set('lon', context.lon);
        }

        const response = await fetch(`/api/spotify?${params.toString()}`);
        if (response.ok) {
          const data: RecommendationResponse = await response.json();
          setTracks(data.tracks);
          setCurrentTrackIndex(0);
          setContextSummary(data.context?.summary ?? null);
          setSelectedMood(inferredMood);
          updateMoodHistory(inferredMood, data.tracks);
        }
      } catch (err) {
        console.error('Auto-load recommendations failed:', err);
        // Don't set error state to avoid showing error message on initial load
      } finally {
        autoLoadInFlightRef.current = false;
        setLoading(false);
        setIsAutoLoadComplete(true);
      }
    };

    void autoLoadRecommendations();
  }, [isAutoLoadComplete, selectedMood, listenerContext, headerWeather]);

  const getMoodHistoryEntry = (mood: Mood) => {
    return moodHistory[mood.trim().toLowerCase()] ?? { ids: [], titles: [] };
  };

  const updateMoodHistory = (mood: Mood, nextTracks: Track[]) => {
    const moodKey = mood.trim().toLowerCase();

    setMoodHistory((currentHistory) => {
      const existing = currentHistory[moodKey] ?? { ids: [], titles: [] };
      const ids = Array.from(new Set([...existing.ids, ...nextTracks.map((track) => track.id)])).slice(-50);
      const titles = Array.from(new Set([...existing.titles, ...nextTracks.map((track) => track.name)])).slice(-50);

      return {
        ...currentHistory,
        [moodKey]: { ids, titles },
      };
    });
  };

  const buildRecommendationUrl = async (
    mood: Mood,
    exclude?: string,
    replacementFeedback?: string,
    rejectedTrackTitle?: string,
    options?: {
      includeHistory?: boolean;
    }
  ) => {
    const resolvedContext = listenerContext
      ? { ...listenerContext, localHour: getCurrentHour() }
      : await getListenerContext();
    const includeHistory = options?.includeHistory ?? true;
    const historyEntry = includeHistory ? getMoodHistoryEntry(mood) : { ids: [], titles: [] };

    setListenerContext(resolvedContext);

    const params = new URLSearchParams({
      mood,
      localHour: resolvedContext.localHour,
      requestSeed: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });

    if (resolvedContext.lat && resolvedContext.lon) {
      params.set('lat', resolvedContext.lat);
      params.set('lon', resolvedContext.lon);
    }
//exclude ids and titles from history to avoid repeats, but only if there is a history to exclude - otherwise the API will error when trying to parse empty excludeIds/excludeTitles params. This allows the first recommendation request for a mood to include history (which may be desirable for auto-load) without causing issues. Subsequent requests for the same mood will then exclude the initial tracks as expected.
    if (historyEntry.ids.length > 0) {
      params.set('excludeIds', historyEntry.ids.join(','));
    }

    if (historyEntry.titles.length > 0) {
      params.set('excludeTitles', historyEntry.titles.join(','));
    }

    if (exclude) {
      params.set('exclude', exclude);
    }

    if (replacementFeedback && replacementFeedback.trim().length > 0) {
      params.set('feedback', replacementFeedback.trim());
    }

    if (rejectedTrackTitle && rejectedTrackTitle.trim().length > 0) {
      params.set('rejectedTrackTitle', rejectedTrackTitle.trim());
    }

    return `/api/spotify?${params.toString()}`;
  };

  const handleMoodSelect = async (mood: Mood) => {
    if (recommendationsInFlightRef.current) return;
    recommendationsInFlightRef.current = true;

    setSelectedMood(mood);
    setLoading(true);
    setError(null);

    try {
        const response = await fetch(await buildRecommendationUrl(mood));
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data: RecommendationResponse = await response.json();
      setTracks(data.tracks);
      setCurrentTrackIndex(0);
      setContextSummary(data.context?.summary ?? null);
      updateMoodHistory(mood, data.tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTracks([]);
      setContextSummary(null);
    } finally {
      recommendationsInFlightRef.current = false;
      setLoading(false);
    }
  };
// Handles both track replacement requests and general "redo" requests based on presence of feedback and rejected track title
  const handleRequestReplacement = async (
    trackId: string,
    index: number,
    replacementFeedback?: string,
    rejectedTrackTitle?: string
  ) => {
    if (!selectedMood || recommendationsInFlightRef.current) return;
    recommendationsInFlightRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        await buildRecommendationUrl(
          selectedMood,
          trackId,
          replacementFeedback,
          rejectedTrackTitle,
          { includeHistory: false }
        )
      );
      if (!response.ok) throw new Error('Failed to fetch replacement recommendations');
      const data: RecommendationResponse = await response.json();
      setTracks(data.tracks);
      setCurrentTrackIndex(0);
      setContextSummary(data.context?.summary ?? null);
      updateMoodHistory(selectedMood, data.tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching replacements');
    } finally {
      recommendationsInFlightRef.current = false;
      setLoading(false);
    }
  };

  const handleRedoRecommendations = async () => {
    if (!selectedMood || recommendationsInFlightRef.current) return;
    recommendationsInFlightRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(await buildRecommendationUrl(selectedMood));
      if (!response.ok) {
        throw new Error('Failed to refresh recommendations');
      }

      const data: RecommendationResponse = await response.json();
      setTracks(data.tracks);
      setCurrentTrackIndex(0);
      setContextSummary(data.context?.summary ?? null);
      updateMoodHistory(selectedMood, data.tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while refreshing recommendations');
    } finally {
      recommendationsInFlightRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-card">
        <header className="app-header">
          <div className="title-row">
            <h1>Mood Music Recommender</h1>
            {(
              <span className="header-context-pill">
                <WeatherIcon condition={headerWeather?.condition} />
                <span>{headerWeather?.condition ?? 'Weather'}</span>
                {typeof headerWeather?.temperatureC === 'number'
                  ? <span>{Math.round(headerWeather.temperatureC)}C</span>
                  : null}
                <span className="context-sep">|</span>
                <TimeIcon />
                <span>{clockLabel}</span>
              </span>
            )}
          </div>
          <p>Select your mood and discover the perfect soundtrack</p>
        </header>

        <main>
          {!selectedMood && !loading ? (
            <div>
              <h2 className="text-2xl font-semibold text-center mb-6">
                How are you feeling today?
              </h2>
              <MoodSelector onMoodSelect={handleMoodSelect} />
            </div>
          ) : loading && !selectedMood ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Loading personalized recommendations based on your weather and time of day...</p>
              <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            </div>
          ) : selectedMood ? (
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setSelectedMood(null);
                    setTracks([]);
                    setContextSummary(null);
                  }}
                  className="control-btn"
                >
                  ← Change Mood
                </button>

                <button
                  onClick={handleRedoRecommendations}
                  className="control-btn"
                  disabled={loading}
                >
                  Redo Songs
                </button>
              </div>

              {contextSummary && !loading && !error && (
                <p className="text-center text-sm text-gray-600 mb-4">{contextSummary}</p>
              )}

              {loading && (
                <div className="loading-state">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p>Finding the perfect tracks...</p>
                </div>
              )}

              {error && (
                <div className="error-state">
                  <p>{error}</p>
                  <button
                    onClick={() => handleMoodSelect(selectedMood)}
                    className="control-btn"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && tracks.length === 0 && (
                <div className="empty-state">
                  <p>No recommendations were found for that mood.</p>
                  <button
                    onClick={() => setSelectedMood(null)}
                    className="control-btn"
                  >
                    Try a different mood
                  </button>
                </div>
              )}

              {!loading && !error && tracks.length > 0 && (
                <>
                  <MusicPlayer
                    tracks={tracks}
                    currentTrackIndex={currentTrackIndex}
                    onTrackChange={setCurrentTrackIndex}
                    onRequestReplacement={handleRequestReplacement}
                  />
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Or try a different mood:</h3>
                    <MoodSelector onMoodSelect={handleMoodSelect} selectedMood={selectedMood} />
                  </div>
                </>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}