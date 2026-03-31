import { NextRequest, NextResponse } from 'next/server';
import { Mood } from '../../../types';

const RAPID_API_KEY = process.env.RAPID_API_KEY;
const RAPID_API_HOST = 'spotify23.p.rapidapi.com';

const moodConfigs: Record<Mood, { searchArtists: string[]; searchTerms: string }> = {
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

    if (!mood || !moodConfigs[mood]) {
      return NextResponse.json({ error: 'Invalid mood' }, { status: 400 });
    }

    const config = moodConfigs[mood];
    console.log('Mood config:', config);
    console.log('RAPID_API_KEY present:', !!RAPID_API_KEY);

    // Try multiple searches: first by artist, then by general term
    let allTracks: any[] = [];
    
    // Search by different artists and terms to get better results
    const searchQueries = [
      config.searchArtists[0],
      config.searchArtists[1],
      config.searchTerms,
    ];

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
        return {
          id: trackData.id,
          name: trackData.name,
          artists: trackData.artists?.items || trackData.artists || [],
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