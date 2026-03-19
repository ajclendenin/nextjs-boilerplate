   export type Mood = 'happy' | 'sad' | 'energetic' | 'relaxed' | 'romantic' | 'focused';

export interface Track {
  id: string;
  name: string;
  artists: Array<{
    name: string;
  }>;
  album: {
    name: string;
    images: Array<{
      url: string;
    }>;
  };
  external_urls: {
    spotify: string;
  };
  preview_url?: string;
}

export interface MoodConfig {
  mood: Mood;
  label: string;
  emoji: string;
  seedGenres: string[];
  targetValence: number;
  targetEnergy: number;
}