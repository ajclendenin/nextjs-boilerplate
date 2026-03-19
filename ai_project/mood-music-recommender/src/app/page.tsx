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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Mood Music Recommender
          </h1>
          <p className="text-gray-600">
            Select your mood and discover the perfect soundtrack
          </p>
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
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  ← Change Mood
                </button>
              </div>

              {loading && (
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Finding the perfect tracks...</p>
                </div>
              )}

              {error && (
                <div className="text-center p-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    onClick={() => handleMoodSelect(selectedMood)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {!loading && !error && tracks.length > 0 && (
                <MusicPlayer
                  tracks={tracks}
                  currentTrackIndex={currentTrackIndex}
                  onTrackChange={setCurrentTrackIndex}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}