   'use client';

import { Track } from '../../types';

interface MusicPlayerProps {
  tracks: Track[];
  currentTrackIndex: number;
  onTrackChange: (index: number) => void;
  onRequestReplacement?: (trackId: string, index: number) => void;
}

export default function MusicPlayer({ tracks, currentTrackIndex, onTrackChange, onRequestReplacement }: MusicPlayerProps) {
  const currentTrack = tracks[currentTrackIndex];

  if (!currentTrack) {
    return (
      <div className="loading-state">
        <p>No tracks available</p>
      </div>
    );
  }

  const albumImageUrl = currentTrack.album?.images?.[0]?.url || '/placeholder-album.png';
  const albumName = currentTrack.album?.name || 'Unknown Album';

  const artistLabelFromTrack = (trackName: string) => {
    const splitByDash = trackName.split(' - ');
    if (splitByDash.length >= 2) return splitByDash[0].trim();
    const byIndex = trackName.toLowerCase().indexOf(' by ');
    if (byIndex > 0) return trackName.slice(byIndex + 4).trim();
    return '';
  };

  const getArtistText = (track: Track) => {
    const artistNames: string[] = [];

    if (track.artists && Array.isArray(track.artists)) {
      track.artists.forEach((artist) => {
        if (!artist) return;
        if (typeof artist === 'string') {
          artistNames.push(artist);
        } else if (typeof artist === 'object') {
          const obj: any = artist;
          if (obj.name) artistNames.push(obj.name);
          else if (obj.profile?.name) artistNames.push(obj.profile.name);
          else if (obj.artist?.name) artistNames.push(obj.artist.name);
          else if (obj.title) artistNames.push(obj.title);
        }
      });
    }

    const cleaned = artistNames.filter(Boolean);
    if (cleaned.length > 0) return cleaned.join(', ');
    return artistLabelFromTrack(track.name);
  };

  const displayArtists = getArtistText(currentTrack);

  return (
    <div className="music-card">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={albumImageUrl}
          alt={albumName}
          className="album-cover"
        />
        <div className="flex-1">
          <h3 className="font-bold text-lg">{currentTrack.name}</h3>
          <p className="text-secondary">{displayArtists}</p>
          <p className="text-secondary text-sm">{albumName}</p>
        </div>
      </div>

      {currentTrack.preview_url ? (
        <audio
          controls
          className="w-full mb-4"
          src={currentTrack.preview_url}
          onEnded={() => {
            const nextIndex = (currentTrackIndex + 1) % tracks.length;
            onTrackChange(nextIndex);
          }}
        >
          Your browser does not support the audio element.
        </audio>
      ) : (
        <div className="text-center p-4 rounded" style={{ background: 'rgba(15, 23, 42, 0.3)' }}>
          <p className="text-gray-200">Preview not available</p>
          <a
            href={currentTrack.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 hover:underline"
          >
            Open in Spotify
          </a>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
            onTrackChange(prevIndex);
          }}
          className="control-btn music-player-action"
        >
          Previous
        </button>

        <button
          onClick={() => {
            // Ask parent to fetch/replace recommendations for this track
            if (typeof onRequestReplacement === 'function') {
              onRequestReplacement(currentTrack.id, currentTrackIndex);
            }
          }}
          className="control-btn music-player-action"
          aria-label="Not the right song - get new recommendations"
          title="Not the right song"
        >
          Not right song
        </button>

        <span className="text-sm text-gray-500">
          {currentTrackIndex + 1} of {tracks.length}
        </span>

        <button
          onClick={() => {
            const nextIndex = (currentTrackIndex + 1) % tracks.length;
            onTrackChange(nextIndex);
          }}
          className="control-btn music-player-action"
        >
          Next
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 max-h-60 overflow-y-auto" role="list" aria-label="Track list">
        {tracks.map((track, index) => {
          const trackArtistText = getArtistText(track);
          return (
            <button
              key={track.id}
              onClick={() => onTrackChange(index)}
              className={`track-list ${index === currentTrackIndex ? 'track-active' : ''}`}
              role="listitem"
              aria-current={index === currentTrackIndex ? 'true' : undefined}
              aria-label={`Play ${track.name}${trackArtistText ? ` by ${trackArtistText}` : ''}`}
            >
            <div className="track-title">{track.name}</div>
            <div className="track-artists">
              {trackArtistText}
            </div>
          </button>
        );
      })}
      </div>
    </div>
  );
}