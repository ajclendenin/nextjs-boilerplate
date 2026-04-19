'use client';

import { useState } from 'react';
import { Mood } from '../../types';

interface MoodSelectorProps {
  onMoodSelect: (mood: Mood) => void;
  selectedMood?: Mood;
}

export default function MoodSelector({ onMoodSelect, selectedMood }: MoodSelectorProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v) {
      setError('Please enter a mood or vibe');
      return;
    }

    setError(null);
    onMoodSelect(v as Mood);
    setValue(''); // Clear input after submission
  };

  return (
    <form onSubmit={handleSubmit} className="mood-input p-2">
      <label htmlFor="mood-input" className="sr-only">
        Enter mood or vibe
      </label>
      <div className="flex gap-2 items-center">
        <input
          id="mood-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter any mood or vibe (e.g., nostalgic 80s, chill lo-fi, workout energy)"
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
        <p className="text-sm text-gray-600 mt-2">Currently playing: <span className="font-semibold">{selectedMood}</span></p>
      )}

      <p className="text-xs text-gray-500 mt-3">
        Tip: Allowing location access will fine-tune the recommendations to suit your mood based on local weather and time of day.
      </p>
    </form>
  );
}