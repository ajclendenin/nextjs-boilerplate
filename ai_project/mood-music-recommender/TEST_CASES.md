# Test Cases for Mood Music Recommender

## Overview
This document outlines comprehensive test cases for the Mood Music Recommender application. The application has three main areas: UI Components, API Integration, and Type Safety.

---

## 1. Unit Tests - Type System

### Test: Mood Type Definition
**Purpose**: Verify the Mood type accepts only valid values
**Status**: ✅ PASSING (see `src/types/index.test.ts`)

#### Test Cases:
- ✅ Accepts 'happy' mood
- ✅ Accepts 'sad' mood
- ✅ Accepts 'energetic' mood
- ✅ Accepts 'relaxed' mood
- ✅ Accepts 'romantic' mood
- ✅ Accepts 'focused' mood
- ✅ Rejects invalid mood values

### Test: Track Interface
**Purpose**: Verify Track type structure matches Spotify API response

#### Test Cases:
- ✅ Has required properties (id, name, artists, album, external_urls)
- ✅ Supports optional preview_url
- ✅ Supports multiple artists
- ✅ Supports multiple album images
- ✅ Album images are properly structured

### Test: MoodConfig Interface
**Purpose**: Verify mood configuration structure

#### Test Cases:
- ✅ All moods have required configuration
- ✅ Valence values are between 0 and 1 (0.2 - 0.8)
- ✅ Energy values are between 0 and 1 (0.2 - 0.9)
- ✅ Each mood has appropriate seed genres
- ✅ Each mood has emoji representation

---

## 2. Component Tests - Manual Testing

### MoodSelector Component

#### Test: Rendering
- [ ] All 6 mood buttons are rendered
- [ ] Each button displays correct emoji
- [ ] Each button displays correct label
- [ ] Buttons are arranged in a grid layout

#### Test: User Interaction
- [ ] Clicking "Happy" button calls onMoodSelect with 'happy'
- [ ] Clicking "Sad" button calls onMoodSelect with 'sad'
- [ ] Clicking "Energetic" button calls onMoodSelect with 'energetic'
- [ ] Clicking "Relaxed" button calls onMoodSelect with 'relaxed'
- [ ] Clicking "Romantic" button calls onMoodSelect with 'romantic'
- [ ] Clicking "Focused" button calls onMoodSelect with 'focused'

#### Test: Visual States
- [ ] Selected mood is highlighted with blue border and background
- [ ] Non-selected moods have gray border
- [ ] Buttons have hover effect
- [ ] Buttons scale up slightly on hover (scale-105)

#### Test: Accessibility
- [ ] All buttons are keyboard accessible
- [ ] Mood names are readable by screen readers
- [ ] Emoji provides visual meaning

### MusicPlayer Component

#### Test: No Tracks State
- [ ] Displays "No tracks available" message when tracks array is empty
- [ ] Component gracefully handles undefined currentTrackIndex

#### Test: Track Display
- [ ] Shows current track name
- [ ] Shows artist names (separated by comma for multiple artists)
- [ ] Shows album name
- [ ] Displays album artwork image

#### Test: Picture Fallback
- [ ] Uses placeholder image when album has no images
- [ ] Image alt text matches album name

#### Test: Audio Controls
- [ ] Audio player shows when preview_url exists
- [ ] "Preview not available" message shows when preview_url is undefined
- [ ] "Open in Spotify" link appears when preview_url is absent
- [ ] Spotify link opens in new tab (target="_blank")

#### Test: Navigation Buttons
- [ ] "Previous" button navigates to previous track
- [ ] "Previous" wraps around from first to last track
- [ ] "Next" button navigates to next track
- [ ] "Next" wraps around from last to first track
- [ ] Track counter shows current position (e.g., "2 of 5")

#### Test: Playlist Display
- [ ] All tracks in playlist are visible
- [ ] Current track is highlighted in blue
- [ ] Clicking playlist item selects that track
- [ ] Playlist scrolls vertically if it exceeds max height

#### Test: Auto-Advance
- [ ] When audio ends, automatically plays next track
- [ ] Properly wraps to first track when last track finishes

---

## 3. API Integration Tests

### Spotify Authentication

#### Test: Token Request
- [ ] Sends POST request to Spotify token endpoint
- [ ] Uses correct Authorization header with base64 encoding
- [ ] Sends correct grant_type=client_credentials
- [ ] Handles authentication success (200 response)
- [ ] Handles authentication failure (401 response)

#### Test: Environment Variables
- [ ] Reads SPOTIFY_CLIENT_ID from environment
- [ ] Reads SPOTIFY_CLIENT_SECRET from environment
- [ ] Handles missing client credentials gracefully

### Spotify Recommendations API

#### Test: Valid Mood Requests
- [ ] GET /api/spotify?mood=happy returns 200
- [ ] GET /api/spotify?mood=sad returns 200
- [ ] GET /api/spotify?mood=energetic returns 200
- [ ] GET /api/spotify?mood=relaxed returns 200
- [ ] GET /api/spotify?mood=romantic returns 200
- [ ] GET /api/spotify?mood=focused returns 200

#### Test: Invalid Mood Requests
- [ ] GET /api/spotify (no mood param) returns 400 with error
- [ ] GET /api/spotify?mood= (empty mood) returns 400 with error
- [ ] GET /api/spotify?mood=invalid returns 400 with error
- [ ] Error message is "Invalid mood"

#### Test: API Request Parameters
For each mood, verify correct Spotify API parameters:

**Happy Mood**:
```
seed_genres: pop,dance,happy
target_valence: 0.8
target_energy: 0.7
limit: 10
```

**Sad Mood**:
```
seed_genres: indie,folk,acoustic
target_valence: 0.2
target_energy: 0.3
limit: 10
```

**Energetic Mood**:
```
seed_genres: electronic,rock,dance
target_valence: 0.7
target_energy: 0.9
limit: 10
```

**Relaxed Mood**:
```
seed_genres: ambient,jazz,classical
target_valence: 0.6
target_energy: 0.2
limit: 10
```

**Romantic Mood**:
```
seed_genres: r&b,pop,indie
target_valence: 0.7
target_energy: 0.4
limit: 10
```

**Focused Mood**:
```
seed_genres: classical,ambient,instrumental
target_valence: 0.5
target_energy: 0.3
limit: 10
```

#### Test: Response Handling
- [ ] Returns tracks array in response
- [ ] Returns exactly 10 tracks
- [ ] Each track has required properties
- [ ] Handles Spotify API errors (4xx, 5xx)
- [ ] Returns 500 error when Spotify API fails

---

## 4. Integration Tests - UI Flow

### End-to-End Happy Path

#### Test: User selects mood
- [ ] User sees mood selection screen
- [ ] User clicks "Happy" button
- [ ] API request is sent with mood=happy
- [ ] Loading spinner appears
- [ ] Tracks are fetched and displayed

#### Test: User plays music
- [ ] First track is displayed in player
- [ ] Album art is visible
- [ ] Audio player is visible
- [ ] User can click play to preview track
- [ ] User can navigate to next track

#### Test: User changes mood
- [ ] User clicks "Change Mood" button
- [ ] Returns to mood selection screen
- [ ] User can select a different mood

#### Test: Error Handling
- [ ] Invalid Spotify credentials show error message
- [ ] Network error shows error message with retry button
- [ ] User can click "Try Again" to retry
- [ ] "Change Mood" button always works

---

## 5. Performance Tests

### Test: Response Time
- [ ] API response time < 2 seconds
- [ ] Components render within 16ms (60fps)
- [ ] Audio player loads in < 1 second

### Test: Memory
- [ ] Loading 10 tracks doesn't cause memory leak
- [ ] Switching between moods doesn't accumulate memory
- [ ] Audio preloading is efficient

### Test: Bundle Size
- [ ] Production build < 150KB JavaScript
- [ ] CSS < 50KB
- [ ] First contentful paint < 1.5 seconds

---

## 6. Browser Compatibility Tests

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Mobile Firefox

### Features
- [ ] Audio playback works on all browsers
- [ ] Responsive grid layout on mobile
- [ ] Touch interactions work on mobile

---

## 7. Accessibility Tests

### WCAG 2.1 Level AA Compliance

#### Test: Keyboard Navigation
- [ ] All buttons are keyboard accessible (Tab key)
- [ ] Enter/Space activates buttons
- [ ] Tab order is logical
- [ ] Focus is visible on all interactive elements

#### Test: Screen Reader Support
- [ ] Button labels are announced correctly
- [ ] Mood emoji provides context
- [ ] Track information is properly announced
- [ ] Errors are announced to screen readers

#### Test: Color Contrast
- [ ] Text has sufficient contrast ratio (4.5:1)
- [ ] Button states are distinguishable without color alone
- [ ] Error messages are visible

---

## Manual Testing Checklist

### Setup
- [ ] Clone/download project
- [ ] Run `npm install`
- [ ] Create `.env.local` with Spotify credentials
- [ ] Run `npm run dev`
- [ ] Open http://localhost:3000

### Mood Selection (Test Case Priority: HIGH)
- [ ] [ ] Happy mood button works
- [ ] [ ] Sad mood button works
- [ ] [ ] Energetic mood button works
- [ ] [ ] Relaxed mood button works
- [ ] [ ] Romantic mood button works
- [ ] [ ] Focused mood button works
- [ ] [ ] Loading state appears while fetching
- [ ] [ ] Tracks load successfully

### Music Player (Test Case Priority: HIGH)
- [ ] [ ] First track displays
- [ ] [ ] Album artwork loads
- [ ] [ ] Artist names display correctly
- [ ] [ ] Album name displays correctly
- [ ] [ ] Audio player controls work
- [ ] [ ] Previous button navigates
- [ ] [ ] Next button navigates
- [ ] [ ] Track counter updates
- [ ] [ ] Clicking playlist item changes track
- [ ] [ ] Playlist scrolls

### Error Scenarios (Test Case Priority: MEDIUM)
- [ ] [ ] Missing Spotify credentials show error
- [ ] [ ] Invalid mood shows error
- [ ] [ ] Network error shows error message
- [ ] [ ] "Try Again" button retries API call
- [ ] [ ] "Change Mood" button works from error state

### Edge Cases (Test Case Priority: LOW)
- [ ] [ ] Very long artist names display correctly
- [ ] [ ] Very long track names display correctly
- [ ] [ ] Tracks without preview show Spotify link
- [ ] [ ] Tracks without album images show placeholder
- [ ] [ ] Single artist displays correctly
- [ ] [ ] Multiple artists display correctly

---

## Test Results Summary

### Unit Tests
- **Status**: ✅ PASSING
- **Total Tests**: 9
- **Passed**: 9
- **Failed**: 0
- **Coverage**: 100% for types

### Component Tests (Manual)
- **Status**: PENDING (Manual testing required)
- **Priority**: HIGH - Core user-facing functionality

### API Integration Tests (Manual)
- **Status**: PENDING (Requires Spotify credentials)
- **Priority**: MEDIUM - Backend functionality

### E2E Tests (Manual)
- **Status**: PENDING (Full user journey)
- **Priority**: HIGH - Overall system functionality

---

## Running Tests

### Unit Tests
```bash
npm run test:ci          # Run all tests with coverage
npm test                 # Run tests in watch mode
```

### Manual Testing
1. Set up environment: `cp .env.local.example .env.local`
2. Add Spotify API credentials to `.env.local`
3. Start dev server: `npm run dev`
4. Open browser: `http://localhost:3000`
5. Follow checklist above

### Browser DevTools Testing
- Open DevTools (F12)
- Check Network tab for API calls
- Check Console for errors
- Check Performance tab for metrics

---

## Known Limitations & Future Improvements

### Current Limitations
- Audio previews limited to 30 seconds (Spotify API limit)
- Only fetches 10 recommendations per mood
- No user authentication (uses Client Credentials flow only)
- No track persistence/favorites

### Recommended Improvements
- [ ] Add E2E tests with Playwright
- [ ] Add visual regression tests
- [ ] Implement user authentication (OAuth)
- [ ] Add favorites/playlist save feature
- [ ] Add more mood categories
- [ ] Add search functionality
- [ ] Add history tracking

