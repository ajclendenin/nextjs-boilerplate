   'use client';

import { useState } from 'react';
import MoodSelector from './components/MoodSelector';
import MusicPlayer from './components/MusicPlayer';
import { Mood, Track } from '../types';

export default function Home() {
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMoodSelect = async (mood: Mood) => {
    setSelectedMood(mood);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/spotify?mood=${mood}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setTracks(data.tracks);
      setCurrentTrackIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReplacement = async (trackId: string, index: number) => {
    if (!selectedMood) return;
    setLoading(true);
    setError(null);

    try {
      // Request fresh recommendations for the same mood. The API can optionally accept
      // a 'exclude' param to avoid returning the same track; backend should handle it.
      const response = await fetch(`/api/spotify?mood=${selectedMood}&exclude=${trackId}`);
      if (!response.ok) throw new Error('Failed to fetch replacement recommendations');
      const data = await response.json();
      setTracks(data.tracks);
      setCurrentTrackIndex(0);
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
                  onClick={() => setSelectedMood(null)}
                  className="control-btn"
                >
                  ← Change Mood
                </button>
              </div>

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