import { fireEvent, render, screen } from '@testing-library/react';
import MusicPlayer from './MusicPlayer';
import { Track } from '../../types';

function buildTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 't1',
    name: 'Song One',
    artists: [{ name: 'Artist One' }],
    album: {
      name: 'Album One',
      images: [{ url: 'https://example.com/cover.jpg' }],
    },
    external_urls: {
      spotify: 'https://open.spotify.com/track/t1',
    },
    preview_url: 'https://example.com/preview.mp3',
    ...overrides,
  };
}

describe('MusicPlayer', () => {
  it('shows empty state when there is no current track', () => {
    render(
      <MusicPlayer tracks={[]} currentTrackIndex={0} onTrackChange={jest.fn()} />
    );

    expect(screen.getByText(/no tracks available/i)).toBeInTheDocument();
  });

  it('renders preview audio and advances when audio ends', () => {
    const onTrackChange = jest.fn();
    const tracks = [buildTrack({ id: 'a' }), buildTrack({ id: 'b', name: 'Song Two' })];

    const { container } = render(
      <MusicPlayer tracks={tracks} currentTrackIndex={1} onTrackChange={onTrackChange} />
    );

    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    fireEvent.ended(audio as HTMLAudioElement);

    expect(onTrackChange).toHaveBeenCalledWith(0);
  });

  it('shows spotify fallback when preview is unavailable', () => {
    const track = buildTrack({ preview_url: undefined });

    render(
      <MusicPlayer tracks={[track]} currentTrackIndex={0} onTrackChange={jest.fn()} />
    );

    expect(screen.getByText(/preview not available/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open in spotify/i })).toHaveAttribute(
      'href',
      'https://open.spotify.com/track/t1'
    );
  });

  it('handles previous and next button navigation', () => {
    const onTrackChange = jest.fn();
    const tracks = [
      buildTrack({ id: 'a' }),
      buildTrack({ id: 'b', name: 'Song Two' }),
      buildTrack({ id: 'c', name: 'Song Three' }),
    ];

    render(<MusicPlayer tracks={tracks} currentTrackIndex={0} onTrackChange={onTrackChange} />);

    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(onTrackChange).toHaveBeenNthCalledWith(1, 2);
    expect(onTrackChange).toHaveBeenNthCalledWith(2, 1);
  });

  it('requests replacement with trimmed feedback and track details', () => {
    const onRequestReplacement = jest.fn();
    const track = buildTrack({ id: 'song-id', name: 'Current Song' });

    render(
      <MusicPlayer
        tracks={[track]}
        currentTrackIndex={0}
        onTrackChange={jest.fn()}
        onRequestReplacement={onRequestReplacement}
      />
    );

    fireEvent.change(screen.getByLabelText(/explain why this song is not the right fit/i), {
      target: { value: '  too slow  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /not the right song/i }));

    expect(onRequestReplacement).toHaveBeenCalledWith('song-id', 0, 'too slow', 'Current Song');
  });

  it('falls back to title parsing when artist list is unusable', () => {
    const trackWithFallbackArtist = buildTrack({
      name: 'Great Song - Parsed Artist',
      artists: [] as any,
    });

    render(
      <MusicPlayer
        tracks={[trackWithFallbackArtist]}
        currentTrackIndex={0}
        onTrackChange={jest.fn()}
      />
    );

    expect(screen.getAllByText('Great Song').length).toBeGreaterThan(0);
  });

  it('lets user pick a track from the track list', () => {
    const onTrackChange = jest.fn();
    const tracks = [
      buildTrack({ id: 'a', name: 'Alpha' }),
      buildTrack({ id: 'b', name: 'Beta' }),
    ];

    render(<MusicPlayer tracks={tracks} currentTrackIndex={0} onTrackChange={onTrackChange} />);

    fireEvent.click(screen.getByRole('listitem', { name: /play beta by artist one/i }));
    expect(onTrackChange).toHaveBeenCalledWith(1);
  });
});