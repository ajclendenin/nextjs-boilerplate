import { Mood } from "../types";

interface ArtistSuggestions {
  artists: string[];
  searchTerms: string[];
}

// Diverse pools of artists and search terms for each mood
// These are randomly selected on each request for variety
const moodPools: Record<Mood, { artists: string[]; terms: string[] }> = {
  happy: {
    artists: [
      "Pharrell Williams",
      "Katy Perry",
      "Mark Ronson",
      "Dua Lipa",
      "Bruno Mars",
      "The Weeknd",
      "Lizzo",
      "Post Malone",
      "Cardi B",
      "Ariana Grande",
    ],
    terms: [
      "upbeat happy song",
      "feel-good pop",
      "cheerful dance",
      "positive vibes",
      "joyful pop hit",
      "energetic feel-good",
      "uplifting pop",
    ],
  },
  sad: {
    artists: [
      "Adele",
      "Sam Smith",
      "Billie Eilish",
      "Lewis Capaldi",
      "Bon Iver",
      "Damien Rice",
      "Amy Winehouse",
      "Lorde",
      "Clairo",
      "Phoebe Bridgers",
    ],
    terms: [
      "sad emotional ballad",
      "melancholic acoustic",
      "emotional love song",
      "heartbreak ballad",
      "sad piano ballad",
      "emotional indie",
      "introspective song",
    ],
  },
  energetic: {
    artists: [
      "The Weeknd",
      "Dua Lipa",
      "Calvin Harris",
      "David Guetta",
      "Tiësto",
      "The Chainsmokers",
      "Kygo",
      "Diplo",
      "Avicii",
      "Deadmau5",
    ],
    terms: [
      "high energy dance",
      "electronic dance music",
      "intense club beats",
      "high energy edm",
      "club bangers",
      "dance floor hits",
      "electronic energy",
    ],
  },
  relaxed: {
    artists: [
      "Bon Iver",
      "Ludovico Einaudi",
      "Damien Rice",
      "Norah Jones",
      "Nick Drake",
      "Ólafur Arnalds",
      "Tycho",
      "Explosions in the Sky",
      "Balmorhea",
      "Ólafur Arnalds",
    ],
    terms: [
      "calm ambient relaxing",
      "peaceful instrumental",
      "ambient chill",
      "relaxation music",
      "lo-fi chill beats",
      "peaceful acoustic",
      "ambient relaxation",
    ],
  },
  romantic: {
    artists: [
      "Ed Sheeran",
      "John Legend",
      "Beyoncé",
      "Frank Ocean",
      "Adele",
      "Bruno Mars",
      "The Weeknd",
      "Sam Smith",
      "Coldplay",
      "James Bay",
    ],
    terms: [
      "romantic love song",
      "intimate slow burn",
      "romantic ballad",
      "love song acoustic",
      "romantic pop",
      "emotional romance",
      "slow love song",
    ],
  },
  focused: {
    artists: [
      "Hans Zimmer",
      "Lo-fi hip hop",
      "Tycho",
      "Ólafur Arnalds",
      "Explosions in the Sky",
      "Ludovico Einaudi",
      "Jon Hopkins",
      "Boards of Canada",
      "Max Richter",
      "Nils Frahm",
    ],
    terms: [
      "focus study music",
      "instrumental study beats",
      "concentration music",
      "productive work music",
      "lo-fi study hip hop",
      "focus instrumental",
      "study background music",
    ],
  },
};

export async function generateArtistSuggestions(
  mood: Mood
): Promise<ArtistSuggestions> {
  // Get the pools for this mood
  const pools = moodPools[mood];
  
  if (!pools) {
    console.warn(`No pools found for mood: ${mood}`);
    return { artists: [], searchTerms: [] };
  }

  // Shuffle and select random artists
  const shuffledArtists = [...pools.artists].sort(() => Math.random() - 0.5);
  const selectedArtists = shuffledArtists.slice(0, getRandomInt(3, 5));

  // Shuffle and select random search terms
  const shuffledTerms = [...pools.terms].sort(() => Math.random() - 0.5);
  const selectedTerms = shuffledTerms.slice(0, getRandomInt(2, 3));

  console.log(`Generated recommendations for ${mood}:`, {
    artists: selectedArtists,
    searchTerms: selectedTerms,
  });

  return {
    artists: selectedArtists,
    searchTerms: selectedTerms,
  };
}

export function getRandomItems<T>(array: T[], count: number): T[] {
  if (array.length === 0) return [];
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

