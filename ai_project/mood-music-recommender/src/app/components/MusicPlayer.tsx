   'use client';

import { Track } from '../../types';

interface MusicPlayerProps {
  tracks: Track[];
  currentTrackIndex: number;
  onTrackChange: (index: number) => void;
}

export default function MusicPlayer({ tracks, currentTrackIndex, onTrackChange }: MusicPlayerProps) {
  const currentTrack = tracks[currentTrackIndex];

  if (!currentTrack) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No tracks available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={currentTrack.album.images[0]?.url || '/placeholder-album.png'}
          alt={currentTrack.album.name}
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="font-bold text-lg">{currentTrack.name}</h3>
          <p className="text-gray-600">
            {currentTrack.artists.map(artist => artist.name).join(', ')}
          </p>
          <p className="text-gray-500 text-sm">{currentTrack.album.name}</p>
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
        <div className="text-center p-4 bg-gray-100 rounded">
          <p className="text-gray-600">Preview not available</p>
          <a
            href={currentTrack.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
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
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Previous
        </button>

        <span className="text-sm text-gray-500">
          {currentTrackIndex + 1} of {tracks.length}
        </span>

        <button
          onClick={() => {
            const nextIndex = (currentTrackIndex + 1) % tracks.length;
            onTrackChange(nextIndex);
          }}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Next
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
        {tracks.map((track, index) => (
          <button
            key={track.id}
            onClick={() => onTrackChange(index)}
            className={`text-left p-2 rounded ${
              index === currentTrackIndex
                ? 'bg-blue-100 border-l-4 border-blue-500'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="font-medium text-sm">{track.name}</div>
            <div className="text-xs text-gray-600">
              {track.artists.map(artist => artist.name).join(', ')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}