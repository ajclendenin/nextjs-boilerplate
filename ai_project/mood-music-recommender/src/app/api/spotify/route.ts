import { NextRequest, NextResponse } from 'next/server';
import { Mood } from '../../../types';
import { generateSongSuggestions, SongSuggestion } from '../../../lib/aiRecommendations';
import {
  buildMoodContext,
  fetchCurrentWeather,
  getContextAwareSearchQueries,
} from '../../../lib/weatherContext';

const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = 'spotify23.p.rapidapi.com';

const canonicalMoodSynonyms: Record<string, string[]> = {
  happy: ['happy', 'joyful', 'cheerful', 'bright', 'upbeat', 'optimistic', 'glad'],
  sad: ['sad', 'down', 'blue', 'upset', 'mellow', 'depressed', 'gloomy', 'heartbroken', 'low'],
  angry: ['angry', 'mad', 'furious', 'frustrated', 'irritated', 'annoyed'],
  relaxed: ['relaxed', 'calm', 'chill', 'peaceful', 'serene', 'laid back'],
  excited: ['excited', 'hyped', 'energetic', 'pumped', 'amped'],
  romantic: ['romantic', 'loving', 'flirty', 'intimate'],
  nostalgic: ['nostalgic', 'wistful', 'sentimental', 'throwback'],
  adventurous: ['adventurous', 'bold', 'explorative', 'wild'],
};

const genericTitleWords = new Set([
  'happy',
  'sad',
  'upbeat',
  'chill',
  'relaxed',
  'relaxing',
  'calm',
  'mood',
  'vibes',
  'vibe',
  'energy',
  'playlist',
  'song',
  'songs',
  'music',
  'birthday',
]);

// Map moods to broader search terms to avoid literal title searches
const moodSearchMap: Record<string, string[]> = {
  happy: [
    'As It Was Harry Styles',
    'Good Vibrations The Beach Boys',
    'Dancing Queen ABBA',
    'Walking on Sunshine Katrina and the Waves',
  ],
  sad: [
    'Someone Like You Adele',
    'Skinny Love Bon Iver',
    'Fix You Coldplay',
    'The Night We Met Lord Huron',
  ],
  angry: [
    'Killing In The Name Rage Against The Machine',
    'Sabotage Beastie Boys',
    'Misery Business Paramore',
    'Seven Nation Army The White Stripes',
  ],
  relaxed: [
    'Weightless Marconi Union',
    'Banana Pancakes Jack Johnson',
    'Come Away With Me Norah Jones',
    'Sunset Lover Petit Biscuit',
  ],
  excited: [
    'Levitating Dua Lipa',
    'Blinding Lights The Weeknd',
    'Titanium David Guetta Sia',
    'Dont Start Now Dua Lipa',
  ],
  romantic: [
    'At Last Etta James',
    'Lover Taylor Swift',
    'Best Part Daniel Caesar H.E.R.',
    'Lets Stay Together Al Green',
  ],
  nostalgic: [
    'Dreams Fleetwood Mac',
    'Take On Me a-ha',
    'Time After Time Cyndi Lauper',
    'Everybody Wants to Rule the World Tears for Fears',
  ],
  adventurous: [
    'Send Me On My Way Rusted Root',
    'Mountain Sound Of Monsters and Men',
    'Adventure of a Lifetime Coldplay',
    'Ends of the Earth Lord Huron',
  ],
  // Add more mappings as needed
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMoodTokens(mood: string): Set<string> {
  return new Set(
    normalizeText(mood)
      .split(' ')
      .filter((token) => token.length > 2)
  );
}

function shouldFilterTrackTitle(title: string, mood: string): boolean {
  const normalizedTitle = normalizeText(title);
  if (!normalizedTitle) {
    return true;
  }

  const titleTokens = normalizedTitle.split(' ').filter(Boolean);
  const moodTokens = getMoodTokens(mood);
  const overlapsMood = titleTokens.some((token) => moodTokens.has(token));
  const looksGeneric = titleTokens.every(
    (token) => genericTitleWords.has(token) || moodTokens.has(token)
  );

  if (looksGeneric) {
    return true;
  }

  if (overlapsMood && titleTokens.length <= 4) {
    return true;
  }

  return false;
}

function isVariantReleaseTitle(title: string): boolean {
  const loweredTitle = title.toLowerCase();

  return /\b(?:cover|remaster(?:ed)?|remix|mix|version|edit|live|mono|stereo|acoustic|deluxe|sped up|speed up|slowed(?: down)?|nightcore|karaoke|festival|radio edit|extended|bonus track|re-release)\b/.test(loweredTitle);
}

function getCanonicalTrackTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\((?:feat\.?|ft\.?|featuring)[^)]*\)/g, ' ')
    .replace(/\[(?:feat\.?|ft\.?|featuring)[^\]]*\]/g, ' ')
    .replace(/\s+-\s+(?:feat\.?|ft\.?|featuring)\s+.*$/g, ' ')
    .replace(/\((?:[^)]*?(?:remaster|remastered|remix|mix|version|edit|live|mono|stereo|cover|acoustic|deluxe|sped up|speed up|slowed(?: down)?|nightcore|karaoke|festival|radio edit|extended|bonus track|re-release)[^)]*)\)/g, ' ')
    .replace(/\[(?:[^\]]*?(?:remaster|remastered|remix|mix|version|edit|live|mono|stereo|cover|acoustic|deluxe|sped up|speed up|slowed(?: down)?|nightcore|karaoke|festival|radio edit|extended|bonus track|re-release)[^\]]*)\]/g, ' ')
    .replace(/\s+-\s+(?:[^-]*?(?:remaster|remastered|remix|mix|version|edit|live|mono|stereo|cover|acoustic|deluxe|sped up|speed up|slowed(?: down)?|nightcore|karaoke|festival|radio edit|extended|bonus track|re-release).*)$/g, ' ')
    .replace(/\b(?:remaster|remastered|remix|mix|version|edit|live|mono|stereo|cover|acoustic|deluxe)\b.*$/g, ' ')
    .replace(/\b(?:part|pt)\s*\d+\b/g, ' ')
    .replace(/\b(?:sped up|speed up|slowed|slowed down|nightcore|instrumental|karaoke|festival|radio edit|extended|bonus track|re-release)\b.*$/g, ' ')
    .replace(/\b\d{4}\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCsvValues(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function getFallbackSearchQueries(mood: string): string[] {
  const lowerMood = mood.toLowerCase();
  if (moodSearchMap[lowerMood]) {
    return moodSearchMap[lowerMood];
  }
  // For custom moods, use the mood itself plus some variations
  return [mood, `${mood} music`, `${mood} playlist`, `${mood} vibe`];
}

function parseCoordinate(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeMoodInput(mood: string): string {
  const normalizedInput = normalizeText(mood);

  if (!normalizedInput) {
    return mood;
  }

  for (const [canonicalMood, synonyms] of Object.entries(canonicalMoodSynonyms)) {
    if (
      synonyms.some((synonym) => {
        const normalizedSynonym = normalizeText(synonym);
        return (
          normalizedInput === normalizedSynonym ||
          normalizedInput.includes(normalizedSynonym) ||
          normalizedSynonym.includes(normalizedInput)
        );
      })
    ) {
      return canonicalMood;
    }
  }

  return normalizedInput;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mood = searchParams.get('mood');
    const exclude = searchParams.get('exclude');
    const excludeIds = parseCsvValues(searchParams.get('excludeIds'));
    const excludeTitles = parseCsvValues(searchParams.get('excludeTitles'));
    const feedback = searchParams.get('feedback')?.trim() || '';
    const rejectedTrackTitle = searchParams.get('rejectedTrackTitle')?.trim() || '';
    const requestSeed = searchParams.get('requestSeed') || undefined;
    const latitude = parseCoordinate(searchParams.get('lat'));
    const longitude = parseCoordinate(searchParams.get('lon'));
    const localHour = parseCoordinate(searchParams.get('localHour'));

    if (!mood || typeof mood !== 'string' || mood.trim().length === 0) {
      return NextResponse.json({ error: 'Mood parameter is required' }, { status: 400 });
    }

    const normalizedMood = normalizeMoodInput(mood);

    console.log(`Generating recommendations for mood: ${mood}`);

    if (!RAPID_API_KEY) {
      console.error('RAPID_API_KEY is not set.');
      return NextResponse.json(
        { error: 'Spotify RapidAPI key is missing. Please set RAPID_API_KEY.' },
        { status: 500 }
      );
    }

    const weather =
      latitude !== null && longitude !== null
        ? await fetchCurrentWeather(latitude, longitude)
        : null;
    const moodContext = buildMoodContext(normalizedMood, weather, localHour);

    console.log('Resolved mood context:', moodContext.summary);

    // Get song suggestions: re-prompt Claude every time for fresh recommendations
    let songSuggestions: SongSuggestion[] = [];
    try {
      songSuggestions = await generateSongSuggestions(moodContext.effectiveMood as Mood, {
        isAlternative: !!exclude || excludeIds.length > 0 || feedback.length > 0,
        excludedTitles: excludeTitles,
        feedback,
        rejectedTrackTitle,
        requestSeed,
      });
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      songSuggestions = [];
    }

    console.log('Generated song suggestions:', songSuggestions);

    const fallbackQueries = (() => {
      const fallback = getFallbackSearchQueries(normalizedMood);
      if (fallback.length > 0) {
        return fallback;
      }

      return getContextAwareSearchQueries(
        normalizedMood,
        moodContext.effectiveMood,
        weather,
        localHour
      );
    })();

    const searchQueries: string[] = songSuggestions.length > 0
      ? songSuggestions.map((song) => `${song.title} ${song.artist}`)
      : fallbackQueries;

    console.log('Using generated search queries:', searchQueries);

    // Try multiple searches to get diverse tracks
    let allTracks: any[] = [];

    for (const query of searchQueries) {
      if (allTracks.length >= 20) break;
      
      console.log(`Searching for: ${query}`);
      const recommendationsUrl = new URL('https://spotify23.p.rapidapi.com/search');
      recommendationsUrl.searchParams.set('q', query);
      recommendationsUrl.searchParams.set('type', 'track');
      recommendationsUrl.searchParams.set('limit', '5');

      try {
        const response = await fetch(recommendationsUrl.toString(), {
          method: 'GET',
          headers: {
            'x-rapidapi-key': RAPID_API_KEY || '',
            'x-rapidapi-host': RAPID_API_HOST,
          },
        });

        console.log(`Response status for "${query}":`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          const tracks = data.tracks?.items || [];
          console.log(`Found ${tracks.length} tracks for "${query}"`);
          allTracks = allTracks.concat(tracks);
        } else {
          const errorText = await response.text();
          console.error(`Error response for "${query}":`, errorText);
        }
      } catch (e) {
        console.error(`Error fetching for query "${query}":`, e);
      }
    }

    // Filter duplicates and normalize track data
    const blockedTrackIds = new Set(excludeIds.concat(exclude ? [exclude] : []));
    const blockedCanonicalTitles = new Set(
      excludeTitles.map((title) => getCanonicalTrackTitle(title))
    );
    const uniqueTrackIds = new Set<string>();
    const uniqueCanonicalTitles = new Set<string>();
    console.log('Total tracks before filtering:', allTracks.length);
    if (allTracks.length > 0) {
      console.log('Sample track structure:', JSON.stringify(allTracks[0], null, 2));
    }
    
    const normalizedTracks = allTracks
      .map((track: any) => {
        // Handle nested Rapid API structure
        const trackData = track.data || track;

        const artistsRaw = trackData.artists?.items || trackData.artists || [];
        const artists = Array.isArray(artistsRaw)
          ? artistsRaw
              .map((artist: any) => {
                if (!artist) return null;
                if (typeof artist === 'string') return artist;
                // Handle the RapidAPI artist structure
                const artistName = 
                  artist.name ||
                  artist.profile?.name ||
                  artist.artist?.name ||
                  artist.title ||
                  null;
                return artistName;
              })
              .filter(Boolean)
              .map((name: string) => ({ name }))
          : [];

        console.log(`Track: ${trackData.name}, Artists extracted:`, JSON.stringify(artists));

        return {
          id: trackData.id,
          canonicalTitle: getCanonicalTrackTitle(trackData.name || ''),
          name: trackData.name,
          artists: artists.length > 0 ? artists : [{ name: 'Unknown Artist' }],
          album: {
            name: trackData.albumOfTrack?.name || trackData.album?.name || 'Unknown Album',
            images: trackData.albumOfTrack?.coverArt?.sources || trackData.album?.images || [{ url: '/placeholder-album.png' }],
          },
          external_urls: trackData.external_urls || { spotify: '' },
          preview_url: trackData.preview_url,
        };
      })
      .filter((track: any) => {
        const canonicalTitle = track.canonicalTitle || normalizeText(track.name || '');

        if (
          !track.id ||
          !track.name ||
          isVariantReleaseTitle(track.name) ||
          blockedTrackIds.has(track.id) ||
          uniqueTrackIds.has(track.id) ||
          blockedCanonicalTitles.has(canonicalTitle) ||
          uniqueCanonicalTitles.has(canonicalTitle) ||
          shouldFilterTrackTitle(track.name, normalizedMood)
        ) {
          return false;
        }

        uniqueTrackIds.add(track.id);
        uniqueCanonicalTitles.add(canonicalTitle);
        return true;
      })
      .map(({ canonicalTitle, ...track }: any) => track)
      .slice(0, 10);

    console.log('Normalized tracks count:', normalizedTracks.length);

    if (normalizedTracks.length === 0) {
      return NextResponse.json(
        {
          error: 'No tracks were found for this mood. Please try a different mood or check your Spotify API key.',
        },
        { status: 404 }
      );
    }

    // Filter out excluded track if provided
    const filteredTracks = exclude ? normalizedTracks.filter(track => track.id !== exclude) : normalizedTracks;

    if (filteredTracks.length === 0) {
      return NextResponse.json(
        {
          error: 'Unable to find additional recommendations for this mood. Try selecting a different mood.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tracks: filteredTracks.slice(0, 10),
      context: {
        requestedMood: mood,
        interpretedMood: normalizedMood,
        effectiveMood: moodContext.effectiveMood,
        timeOfDay: moodContext.timeOfDay,
        summary: feedback.length > 0
          ? `${moodContext.summary} Considering your feedback: "${feedback}".`
          : moodContext.summary,
        weather: weather
          ? {
              condition: weather.condition,
              temperatureC: weather.temperatureC,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching Spotify recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}