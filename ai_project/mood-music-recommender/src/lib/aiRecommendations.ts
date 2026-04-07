import { Mood } from "../types";

interface ArtistSuggestions {
  artists: string[];
  searchTerms: string[];
}

// Mood-specific contexts for Claude prompts
const moodContexts: Record<Mood, string> = {
  happy: "upbeat, joyful, positive vibes, feel-good music",
  sad: "melancholic, emotional, introspective, heartfelt ballads",
  energetic: "high-energy, intense, dance-focused, club bangers",
  relaxed: "calming, peaceful, ambient, chill vibes",
  romantic: "emotional, intimate, love-themed, romantic ballads",
  focused: "instrumental, concentration-focused, study-friendly, background music",
};

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
  const RAPID_API_KEY = process.env.RAPID_API_KEY;

  if (!RAPID_API_KEY) {
    console.warn('RAPID_API_KEY not found, falling back to random selection');
    return generateFallbackSuggestions(mood);
  }

  try {
    const context = moodContexts[mood];
    const prompt = `Generate diverse music recommendations for a ${mood} mood. Context: ${context}.

Please provide exactly 8 popular artists and 5 search terms/genres that would fit this mood perfectly. Format your response as JSON:

{
  "artists": ["Artist 1", "Artist 2", "Artist 3", "Artist 4", "Artist 5", "Artist 6", "Artist 7", "Artist 8"],
  "searchTerms": ["term 1", "term 2", "term 3", "term 4", "term 5"]
}

Make sure artists are well-known and search terms are specific to the mood. Vary the recommendations each time.`;

    const response = await fetch('https://claude-ai-chatbot.p.rapidapi.com/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': RAPID_API_KEY,
        'X-RapidAPI-Host': 'claude-ai-chatbot.p.rapidapi.com'
      },
      body: JSON.stringify({
        prompt: prompt,
        model: 'claude-3-haiku',
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.response || data.content || '';

    // Try to parse JSON from the response
    try {
      const parsed = JSON.parse(content);
      if (parsed.artists && parsed.searchTerms && Array.isArray(parsed.artists) && Array.isArray(parsed.searchTerms)) {
        console.log(`Claude generated recommendations for ${mood}:`, parsed);
        return {
          artists: parsed.artists.slice(0, 8),
          searchTerms: parsed.searchTerms.slice(0, 5)
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse Claude response as JSON, extracting manually');
    }

    // Fallback: extract from text response
    const artists = extractArtistsFromText(content);
    const searchTerms = extractSearchTermsFromText(content);

    if (artists.length > 0 || searchTerms.length > 0) {
      return { artists, searchTerms };
    }

    throw new Error('Could not extract valid suggestions from Claude response');

  } catch (error) {
    console.warn('Claude API call failed, using fallback:', error);
    return generateFallbackSuggestions(mood);
  }
}

// Fallback function using predefined pools (original logic)
function generateFallbackSuggestions(mood: Mood): ArtistSuggestions {
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

  console.log(`Generated fallback recommendations for ${mood}:`, {
    artists: selectedArtists,
    searchTerms: selectedTerms,
  });

  return {
    artists: selectedArtists,
    searchTerms: selectedTerms,
  };
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper functions to extract from text if JSON parsing fails
function extractArtistsFromText(text: string): string[] {
  const artistMatches = text.match(/["']([^"']+)["']/g);
  return artistMatches ? artistMatches.slice(0, 8).map(match => match.slice(1, -1)) : [];
}

function extractSearchTermsFromText(text: string): string[] {
  // Look for terms in quotes or after colons
  const termMatches = text.match(/(?:searchTerms|terms):\s*\[([^\]]+)\]/);
  if (termMatches) {
    return termMatches[1].split(',').map(term => term.trim().replace(/["']/g, '')).slice(0, 5);
  }
  return [];
}

