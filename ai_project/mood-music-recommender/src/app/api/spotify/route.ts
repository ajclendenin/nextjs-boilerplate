import { NextRequest, NextResponse } from 'next/server';
import { Mood } from '../../../types';
import { generateArtistSuggestions } from '../../../lib/aiRecommendations';

const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = 'spotify23.p.rapidapi.com';

// Fallback configs if AI generation fails
const fallbackMoodConfigs: Record<Mood, { searchArtists: string[]; searchTerms: string }> = {
  happy: { searchArtists: ['Pharrell Williams', 'Katy Perry', 'Mark Ronson'], searchTerms: 'upbeat happy song' },
  sad: { searchArtists: ['Adele', 'Sam Smith', 'Billie Eilish'], searchTerms: 'sad emotional ballad' },
  energetic: { searchArtists: ['The Weeknd', 'Dua Lipa', 'Calvin Harris'], searchTerms: 'high energy dance' },
  relaxed: { searchArtists: ['Bon Iver', 'Ludovico Einaudi', 'Damien Rice'], searchTerms: 'calm ambient relaxing' },
  romantic: { searchArtists: ['Ed Sheeran', 'John Legend', 'Beyoncé'], searchTerms: 'romantic love song' },
  focused: { searchArtists: ['Hans Zimmer', 'Lo-fi hip hop', 'Tycho'], searchTerms: 'focus study music' },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mood = searchParams.get('mood') as Mood;

    if (!mood || !fallbackMoodConfigs[mood]) {
      return NextResponse.json({ error: 'Invalid mood' }, { status: 400 });
    }

    console.log(`Generating recommendations for mood: ${mood}`);
    
    // Get AI-generated suggestions for diverse recommendations
    const aiSuggestions = await generateArtistSuggestions(mood);
    console.log('Generated suggestions:', aiSuggestions);

    // Always use the generated suggestions (now with guaranteed randomization)
    let searchQueries: string[] = [];
    
    if (aiSuggestions && aiSuggestions.artists.length > 0 && aiSuggestions.searchTerms.length > 0) {
      // Use the generated artists and search terms
      searchQueries = [...aiSuggestions.artists, ...aiSuggestions.searchTerms];
      console.log('Using generated search queries:', searchQueries);
    } else {
      // Fall back to default configuration (backup only)
      const fallbackConfig = fallbackMoodConfigs[mood];
      searchQueries = [
        fallbackConfig.searchArtists[0],
        fallbackConfig.searchArtists[1],
        fallbackConfig.searchTerms,
      ];
      console.log('Using fallback search queries:', searchQueries);
    }

    // Try multiple searches: by selected artists and terms
    let allTracks: any[] = [];

    for (const query of searchQueries) {
      if (allTracks.length >= 10) break;
      
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

    // Filter duplicates and ensure required fields exist
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
                return (
                  artist.name ||
                  artist.profile?.name ||
                  artist.artist?.name ||
                  artist.title ||
                  null
                );
              })
              .filter(Boolean)
              .map((name: string) => ({ name }))
          : [];

        return {
          id: trackData.id,
          name: trackData.name,
          artists,
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

    return NextResponse.json({
      tracks: normalizedTracks,
    });
  } catch (error) {
    console.error('Error fetching Spotify recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}