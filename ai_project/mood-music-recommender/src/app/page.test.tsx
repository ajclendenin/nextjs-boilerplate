// Mock fetch before component loads to prevent real API calls from useEffect hooks
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

// Mock the weatherContext module — page.tsx dynamically imports inferMoodFromWeather
jest.mock('@/lib/weatherContext', () => ({
  inferMoodFromWeather: jest.fn().mockReturnValue('calm morning'),
  buildMoodContext: jest.fn(),
  fetchCurrentWeather: jest.fn().mockResolvedValue(null),
  getContextAwareSearchQueries: jest.fn().mockReturnValue([]),
}));

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Home from './page';

// Deny geolocation so the auto-load path fails fast and component settles
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn((_success: any, reject: any) =>
      reject(new Error('User denied geolocation'))
    ),
  },
  configurable: true,
});

const sampleTrack = {
  id: 'page-track-1',
  name: 'Page Song',
  artists: [{ name: 'Page Artist' }],
  album: {
    name: 'Page Album',
    images: [{ url: 'https://example.com/img.jpg' }],
  },
  external_urls: { spotify: 'https://open.spotify.com/track/page-track-1' },
  preview_url: null,
};

beforeEach(() => {
  mockFetch.mockReset();
  // Default: all API calls fail (context, spotify)
  mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
});

describe('Home page', () => {
  it('renders the app title', async () => {
    await act(async () => {
      render(<Home />);
    });

    expect(screen.getByText(/mood music recommender/i)).toBeInTheDocument();
  });

  it('renders the subtitle tagline', async () => {
    await act(async () => {
      render(<Home />);
    });

    expect(
      screen.getByText(/select your mood and discover the perfect soundtrack/i)
    ).toBeInTheDocument();
  });

  it('shows the mood input form after auto-load attempt settles', async () => {
    await act(async () => {
      render(<Home />);
    });

    // After the auto-load effect fails (fetch returns ok: false),
    // the component should show the mood selector
    await waitFor(() => {
      expect(screen.getByLabelText(/enter mood or vibe/i)).toBeInTheDocument();
    });
  });

  it('shows error message when API call fails after mood selection', async () => {
    // Auto-load fails, then explicit mood selection also fails
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });

    await act(async () => {
      render(<Home />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/enter mood or vibe/i)).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/enter mood or vibe/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'sad' } });
      fireEvent.submit(input.closest('form') as HTMLFormElement);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/failed to fetch recommendations/i)
      ).toBeInTheDocument();
    });
  });
});
