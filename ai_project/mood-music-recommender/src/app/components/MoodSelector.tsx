 'use client';

import { useState } from 'react';
import { Mood, MoodConfig } from '../../types';

interface MoodSelectorProps {
  onMoodSelect: (mood: Mood) => void;
  selectedMood?: Mood;
}

const moodConfigs: MoodConfig[] = [
  {
    mood: 'happy',
    label: 'Happy',
    emoji: '😊',
    seedGenres: ['pop', 'dance', 'happy'],
    targetValence: 0.8,
    targetEnergy: 0.7,
  },
  {
    mood: 'sad',
    label: 'Sad',
    emoji: '😢',
    seedGenres: ['indie', 'folk', 'acoustic'],
    targetValence: 0.2,
    targetEnergy: 0.3,
  },
  {
    mood: 'energetic',
    label: 'Energetic',
    emoji: '⚡',
    seedGenres: ['electronic', 'rock', 'dance'],
    targetValence: 0.7,
    targetEnergy: 0.9,
  },
  {
    mood: 'relaxed',
    label: 'Relaxed',
    emoji: '😌',
    seedGenres: ['ambient', 'jazz', 'classical'],
    targetValence: 0.6,
    targetEnergy: 0.2,
  },
  {
    mood: 'romantic',
    label: 'Romantic',
    emoji: '💕',
    seedGenres: ['r&b', 'pop', 'indie'],
    targetValence: 0.7,
    targetEnergy: 0.4,
  },
  {
    mood: 'focused',
    label: 'Focused',
    emoji: '🎯',
    seedGenres: ['classical', 'ambient', 'instrumental'],
    targetValence: 0.5,
    targetEnergy: 0.3,
  },
];

export default function MoodSelector({ onMoodSelect, selectedMood }: MoodSelectorProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim().toLowerCase();
    if (!v) {
      setError('Please enter a mood');
      return;
    }

    // If the typed mood matches one of the known moods, use that canonical value.
    const match = moodConfigs.find((c) => c.mood === v || c.label.toLowerCase() === v);
    const moodToSend = (match ? match.mood : (v as Mood));

    setError(null);
    onMoodSelect(moodToSend);
  };

  return (
    <form onSubmit={handleSubmit} className="mood-input p-2">
      <label htmlFor="mood-input" className="sr-only">
        Enter mood
      </label>
      <div className="flex gap-2 items-center">
        <input
          id="mood-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a mood (e.g. happy, relaxed)"
          className="w-full rounded-md border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-600 text-white px-3 py-2 disabled:opacity-50"
          disabled={value.trim() === ''}
        >
          Set
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

      {selectedMood && (
        <p className="text-sm text-gray-600 mt-2">Selected mood: {selectedMood}</p>
      )}

      <p className="text-xs text-gray-500 mt-3">
        Suggestions: {moodConfigs.map((c) => c.label).join(', ')}
      </p>
    </form>
  );
}