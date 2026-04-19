   'use client';

import { useState } from 'react';
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
    };
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
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextSummary, setContextSummary] = useState<string | null>(null);
  const [listenerContext, setListenerContext] = useState<ListenerContext | null>(null);
  const [moodHistory, setMoodHistory] = useState<Record<string, { ids: string[]; titles: string[] }>>({});

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

  const buildRecommendationUrl = async (mood: Mood, exclude?: string) => {
    const resolvedContext = listenerContext
      ? { ...listenerContext, localHour: getCurrentHour() }
      : await getListenerContext();
    const historyEntry = getMoodHistoryEntry(mood);

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

    if (historyEntry.ids.length > 0) {
      params.set('excludeIds', historyEntry.ids.join(','));
    }

    if (historyEntry.titles.length > 0) {
      params.set('excludeTitles', historyEntry.titles.join(','));
    }

    if (exclude) {
      params.set('exclude', exclude);
    }

    return `/api/spotify?${params.toString()}`;
  };

  const handleMoodSelect = async (mood: Mood) => {
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
      setLoading(false);
    }
  };

  const handleRequestReplacement = async (trackId: string, index: number) => {
    if (!selectedMood) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(await buildRecommendationUrl(selectedMood, trackId));
      if (!response.ok) throw new Error('Failed to fetch replacement recommendations');
      const data: RecommendationResponse = await response.json();
      setTracks(data.tracks);
      setCurrentTrackIndex(0);
      setContextSummary(data.context?.summary ?? null);
      updateMoodHistory(selectedMood, data.tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching replacements');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="app-card">
        <header className="app-header">
          <h1>Mood Music Recommender</h1>
          <p>Select your mood and discover the perfect soundtrack</p>
        </header>

        <main>
          {!selectedMood ? (
            <div>
              <h2 className="text-2xl font-semibold text-center mb-6">
                How are you feeling today?
              </h2>
              <MoodSelector onMoodSelect={handleMoodSelect} />
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
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
                <MusicPlayer
                  tracks={tracks}
                  currentTrackIndex={currentTrackIndex}
                  onTrackChange={setCurrentTrackIndex}
                  onRequestReplacement={handleRequestReplacement}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}