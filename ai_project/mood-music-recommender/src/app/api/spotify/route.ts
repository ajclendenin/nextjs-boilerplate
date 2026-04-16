import { NextRequest, NextResponse } from 'next/server';
import { Mood } from '../../../types';
import { generateSongSuggestions, SongSuggestion } from '../../../lib/aiRecommendations';

const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = 'spotify23.p.rapidapi.com';

// Map moods to broader search terms to avoid literal title searches
const moodSearchMap: Record<string, string[]> = {
  happy: ['upbeat', 'pop', 'dance', 'joyful', 'cheerful'],
  sad: ['ballad', 'acoustic', 'melancholy', 'slow', 'emotional'],
  angry: ['rock', 'heavy', 'intense', 'aggressive', 'punk'],
  relaxed: ['chill', 'ambient', 'lo-fi', 'calm', 'jazz'],
  excited: ['electronic', 'dance', 'energetic', 'party', 'edm'],
  romantic: ['love', 'romantic', 'ballad', 'slow', 'r&b'],
  nostalgic: ['80s', '90s', 'retro', 'classic', 'oldies'],
  adventurous: ['adventure', 'epic', 'instrumental', 'soundtrack', 'folk'],
  // Add more mappings as needed
};

function getFallbackSearchQueries(mood: string): string[] {
  const lowerMood = mood.toLowerCase();
  if (moodSearchMap[lowerMood]) {
    return moodSearchMap[lowerMood];
  }
  // For custom moods, use the mood itself plus some variations
  return [mood, `${mood} music`, `${mood} playlist`, `${mood} vibe`];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mood = searchParams.get('mood');
    const exclude = searchParams.get('exclude');

    if (!mood || typeof mood !== 'string' || mood.trim().length === 0) {
      return NextResponse.json({ error: 'Mood parameter is required' }, { status: 400 });
    }

    console.log(`Generating recommendations for mood: ${mood}`);

    if (!RAPID_API_KEY) {
      console.error('RAPID_API_KEY is not set.');
      return NextResponse.json(
        { error: 'Spotify RapidAPI key is missing. Please set RAPID_API_KEY.' },
        { status: 500 }
      );
    }

    // Get song suggestions: re-prompt Claude every time for fresh recommendations
    let songSuggestions: SongSuggestion[] = [];
    try {
      songSuggestions = await generateSongSuggestions(mood, !!exclude);
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      songSuggestions = [];
    }

    console.log('Generated song suggestions:', songSuggestions);

    const searchQueries: string[] = songSuggestions.length > 0
      ? songSuggestions.map((song) => `${song.title} ${song.artist}`)
      : getFallbackSearchQueries(mood);

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
    const uniqueTrackIds = new Set<string>();
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
        if (!track.id || !track.name || uniqueTrackIds.has(track.id)) {
          return false;
        }
        uniqueTrackIds.add(track.id);
        return true;
      })
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
    });
  } catch (error) {
    console.error('Error fetching Spotify recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}