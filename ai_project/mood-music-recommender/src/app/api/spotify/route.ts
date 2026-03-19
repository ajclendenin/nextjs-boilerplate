import { NextRequest, NextResponse } from 'next/server';
import { Mood } from '../../../types';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getSpotifyAccessToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify access token');
  }

  const data = await response.json();
  return data.access_token;
}

const moodConfigs: Record<Mood, { genres: string[]; valence: number; energy: number }> = {
  happy: { genres: ['pop', 'dance', 'happy'], valence: 0.8, energy: 0.7 },
  sad: { genres: ['indie', 'folk', 'acoustic'], valence: 0.2, energy: 0.3 },
  energetic: { genres: ['electronic', 'rock', 'dance'], valence: 0.7, energy: 0.9 },
  relaxed: { genres: ['ambient', 'jazz', 'classical'], valence: 0.6, energy: 0.2 },
  romantic: { genres: ['r&b', 'pop', 'indie'], valence: 0.7, energy: 0.4 },
  focused: { genres: ['classical', 'ambient', 'instrumental'], valence: 0.5, energy: 0.3 },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mood = searchParams.get('mood') as Mood;

    if (!mood || !moodConfigs[mood]) {
      return NextResponse.json({ error: 'Invalid mood' }, { status: 400 });
    }

    const accessToken = await getSpotifyAccessToken();
    const config = moodConfigs[mood];

    const recommendationsUrl = new URL('https://api.spotify.com/v1/recommendations');
    recommendationsUrl.searchParams.set('seed_genres', config.genres.join(','));
    recommendationsUrl.searchParams.set('target_valence', config.valence.toString());
    recommendationsUrl.searchParams.set('target_energy', config.energy.toString());
    recommendationsUrl.searchParams.set('limit', '10');

    const response = await fetch(recommendationsUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get recommendations from Spotify');
    }

    const data = await response.json();

    return NextResponse.json({
      tracks: data.tracks,
    });
  } catch (error) {
    console.error('Error fetching Spotify recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}