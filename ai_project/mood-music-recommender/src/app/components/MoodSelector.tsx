'use client';

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
  return (
    <div className="mood-grid p-2">
      {moodConfigs.map((config) => (
        <button
          key={config.mood}
          onClick={() => onMoodSelect(config.mood)}
          className={`mood-card ${selectedMood === config.mood ? 'mood-card-active' : ''}`}
        >
          <div className="emoji">{config.emoji}</div>
          <div className="label">{config.label}</div>
        </button>
      ))}
    </div>
  );
}