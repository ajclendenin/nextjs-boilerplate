# Manual Testing Guide - Mood Music Recommender

## Quick Start

### Prerequisites
1. Node.js 16+ installed
2. npm 7+ installed
3. Spotify API credentials (see setup below)

### Environment Setup

1. **Create environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Get Spotify API Credentials:**
   - Visit https://developer.spotify.com/dashboard
   - Log in or create an account
   - Create a new application
   - Accept terms and create app
   - Copy your Client ID and Client Secret

3. **Update .env.local:**
   ```
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   ```
   http://localhost:3000
   ```

---

## Test Scenarios

### Scenario 1: Happy Path - Select Happy Mood

**Steps:**
1. See mood selection screen with 6 options
2. Click "Happy" button (😊)
3. See loading spinner
4. See list of 10 happy tracks load
5. First track displays with album artwork

**Expected Results:**
- [ ] All 6 mood buttons visible
- [ ] Happy button click triggers API call
- [ ] Loading state displays
- [ ] Music player shows with first track
- [ ] Album artwork loads
- [ ] Artist name displays
- [ ] Audio controls are visible

**API Call Verification:**
```
Request: GET /api/spotify?mood=happy
Response: {
  "tracks": [
    {
      "id": "...",
      "name": "Track Name",
      "artists": [...],
      "album": {...},
      "external_urls": {...},
      "preview_url": "https://..."
    },
    ...
  ]
}
```

---

### Scenario 2: Audio Playback

**Setup:** Complete Scenario 1 first

**Steps:**
1. Click play button on audio player
2. Hear 30-second preview (if available)
3. Audio auto-advances to next track when finished

**Expected Results:**
- [ ] Play button controls audio
- [ ] Volume slider works
- [ ] Progress bar advances
- [ ] Audio automatically moves to next track
- [ ] Audio indicator shows time

**DevTools Verification:**
- Open DevTools → Network tab
- Filter by media/preview
- Verify audio file downloads: `https://p.scdn.co/mp3-preview/...`

---

### Scenario 3: Navigation

**Setup:** Complete Scenario 1

**Steps:**
1. See track counter "1 of 10"
2. Click "Next" button
3. Track counter changes to "2 of 10"
4. Track information updates
5. Click "Previous" button
6. Track counter changes to "1 of 10"

**Expected Results:**
- [ ] Track counter displays correct position
- [ ] Previous button goes to prior track
- [ ] Next button goes to next track
- [ ] Track name and artist update
- [ ] Album art updates
- [ ] Playlist item highlights current track

**Edge Case:** Navigation wrapping
- [ ] At track 10, click "Next" → goes to track 1
- [ ] At track 1, click "Previous" → goes to track 10

---

### Scenario 4: Playlist Item Selection

**Setup:** Complete Scenario 1

**Steps:**
1. See list of 10 tracks in player
2. Scroll down to see all tracks
3. Click on track #3 in playlist
4. Track counter shows "3 of 10"
5. Track information updates
6. Click on track #1 in playlist
7. Track counter shows "1 of 10"

**Expected Results:**
- [ ] Playlist is scrollable
- [ ] Current track is highlighted in blue
- [ ] Clicking playlist item plays that track
- [ ] Track counter updates
- [ ] Player UI reflects selection

---

### Scenario 5: Spotify Links (No Preview)

**Setup:** Complete Scenario 1

**Steps:**
1. Identify a track without preview_url
2. See "Preview not available" message
3. See "Open in Spotify" link
4. Click the link

**Expected Results:**
- [ ] Some tracks have no preview (valid scenario)
- [ ] Fallback message displays
- [ ] Spotify link is provided
- [ ] Link opens in new tab
- [ ] Link points to correct track on Spotify

---

### Scenario 6: Change Mood

**Setup:** Complete Scenario 1

**Steps:**
1. See "Change Mood" button at top
2. Click "Change Mood"
3. Return to mood selection screen
4. All 6 mood buttons visible
5. Select "Relaxed" mood
6. Different tracks load

**Expected Results:**
- [ ] Change Mood button is clickable
- [ ] Returns to mood selection
- [ ] New mood can be selected
- [ ] Different tracks load for new mood
- [ ] Correct genres/parameters sent:
  - Relaxed: ambient, jazz, classical
  - Valence: 0.6, Energy: 0.2

---

### Scenario 7: Test All Moods

Repeat this for each mood:

**Happy (😊)**
- Genres: pop, dance, happy
- Expected characteristics: Upbeat, positive
- [ ] Loads 10 tracks
- [ ] Tracks sound happy

**Sad (😢)**
- Genres: indie, folk, acoustic
- Expected characteristics: Melancholic, emotional
- [ ] Loads 10 tracks
- [ ] Tracks sound sad

**Energetic (⚡)**
- Genres: electronic, rock, dance
- Expected characteristics: High energy, intense
- [ ] Loads 10 tracks
- [ ] Tracks sound energetic

**Relaxed (😌)**
- Genres: ambient, jazz, classical
- Expected characteristics: Calm, peaceful
- [ ] Loads 10 tracks
- [ ] Tracks sound relaxing

**Romantic (💕)**
- Genres: r&b, pop, indie
- Expected characteristics: Emotional, love-themed
- [ ] Loads 10 tracks
- [ ] Tracks sound romantic

**Focused (🎯)**
- Genres: classical, ambient, instrumental
- Expected characteristics: Concentration, instrumental
- [ ] Loads 10 tracks
- [ ] Tracks are instrumental

---

### Scenario 8: Error Handling

#### 8a: Missing Spotify Credentials
**Steps:**
1. Remove or blank out SPOTIFY_CLIENT_ID
2. Try to select a mood
3. See error message "Failed to fetch recommendations"

**Expected Results:**
- [ ] Error message displays
- [ ] "Try Again" button appears
- [ ] User can fix credentials and retry
- [ ] No console errors with stack traces shown

#### 8b: Invalid Mood Parameter
**Steps:**
1. Manually modify URL: `?mood=invalid`
2. API returns 400 error
3. UI displays error gracefully

**Expected Results:**
- [ ] Invalid mood shows error message
- [ ] Error message is clear
- [ ] No crash or blank screen

#### 8c: Network Error
**Steps:**
1. Open DevTools Network tab
2. Throttle network (Slow 3G)
3. Select a mood
4. See timeout or error

**Expected Results:**
- [ ] Error message shows
- [ ] Retry button available
- [ ] Can retry after network restored

---

### Scenario 9: Responsive Design

#### Desktop (1920x1080)
- [ ] All elements visible
- [ ] Grid layout displays 3 columns for moods
- [ ] Music player centered
- [ ] Playlist scrolls vertically

#### Tablet (768x1024)
- [ ] Mood buttons stack properly
- [ ] Music player is readable
- [ ] Audio controls accessible

#### Mobile (375x812)
- [ ] Mood buttons stack in single column
- [ ] Music player fits on screen
- [ ] Buttons are touch-friendly (min 44x44px)
- [ ] Playlist scrolls in viewport

**Testing Steps:**
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Test different screen sizes
4. Verify touch on physical device

---

### Scenario 10: Browser DevTools Testing

#### Network Analysis
```
1. Open DevTools (F12)
2. Go to Network tab
3. Clear network log
4. Select a mood
5. Verify:
```
- [ ] First request: POST to Spotify token endpoint
  - URL: `https://accounts.spotify.com/api/token`
  - Status: 200
  - Response contains: `access_token`

- [ ] Second request: GET Spotify recommendations
  - URL: `https://api.spotify.com/v1/recommendations?...`
  - Status: 200
  - Response contains: 10 tracks array

- [ ] Audio files: MP3 preview files
  - URL: `https://p.scdn.co/mp3-preview/...`
  - Status: 206 (Partial Content)

#### Console Analysis
```
1. Open DevTools → Console tab
2. Select a mood
3. Verify:
```
- [ ] No errors in console
- [ ] No warnings about deprecated APIs
- [ ] No CORS errors
- [ ] Clean console output

#### Performance Analysis
```
1. Open DevTools → Network tab
2. Throttle to Fast 3G:
   - 1.6 Mbps download
   - 750 Kbps upload
   - 150ms latency
3. Select a mood
4. Verify:
```
- [ ] API response time < 2 seconds
- [ ] Audio file loads within 3 seconds
- [ ] UI responsive during loading
- [ ] No janky animations (60 FPS)

**Check FPS:**
1. DevTools → Rendering (or Performance)
2. Select a mood and watch frame rate
3. Should maintain 60 FPS
4. No dropped frames

---

### Scenario 11: Accessibility Testing

#### Keyboard Navigation
```
1. Start app
2. Press Tab repeatedly
3. Verify:
```
- [ ] All buttons receive focus
- [ ] Focus indicator is visible (blue outline)
- [ ] Tab order is logical (left to right, top to bottom)
- [ ] Enter/Space activates buttons

#### Screen Reader (NVDA on Windows, JAWS)
```
1. Enable screen reader
2. Navigate to mood buttons
3. Verify:
```
- [ ] Button labels are announced (e.g., "Happy button")
- [ ] Emoji is announced or skipped appropriately
- [ ] Current track plays when selected
- [ ] Track information is announced

#### Color Contrast
```
1. Open DevTools
2. Use axe DevTools extension
3. Run scan
4. Verify:
```
- [ ] Text contrast ratio ≥ 4.5:1
- [ ] All color information is redundant (icon used too)
- [ ] No color-only indicators

---

## Test Results Template

### Test Run Summary
**Date:** ____________  
**Tester:** ____________  
**Browser:** ____________  
**OS:** ____________  
**Build Version:** ____________  

### Mood Selection Tests
| Mood | Renders | Clickable | Triggers API | Works |
|------|---------|-----------|--------------|-------|
| Happy | ✓ | ✓ | ✓ | ✓ |
| Sad | ✓ | ✓ | ✓ | ✓ |
| Energetic | ✓ | ✓ | ✓ | ✓ |
| Relaxed | ✓ | ✓ | ✓ | ✓ |
| Romantic | ✓ | ✓ | ✓ | ✓ |
| Focused | ✓ | ✓ | ✓ | ✓ |

### Music Player Tests
| Feature | Works | Notes |
|---------|-------|-------|
| Track Display | ✓ | |
| Album Artwork | ✓ | |
| Audio Player | ✓ | |
| Previous Button | ✓ | |
| Next Button | ✓ | |
| Playlist Navigation | ✓ | |
| Track Counter | ✓ | |

### Error Handling
| Error Scenario | Handled | Message Clear | Recoverable |
|---|---|---|---|
| Missing Credentials | ✓ | ✓ | ✓ |
| Network Error | ✓ | ✓ | ✓ |
| Invalid Mood | ✓ | ✓ | ✓ |

### Overall Result
- **Status**: ✓ PASS / ✗ FAIL
- **Issues Found**: 
- **Recommendations**:

---

## Debugging Tips

### Issue: "Failed to fetch recommendations"
```
Solution:
1. Check .env.local exists
2. Verify SPOTIFY_CLIENT_ID is not empty
3. Verify SPOTIFY_CLIENT_SECRET is not empty
4. Test credentials at https://developer.spotify.com/console
5. Check DevTools Network tab for actual error
```

### Issue: Audio doesn't play
```
Solution:
1. Check DevTools Console for errors
2. Verify preview_url exists in API response
3. Check browser audio is not muted
4. Test audio in different browser
5. Verify speaker/headphones connected
```

### Issue: Tracks don't load
```
Solution:
1. Open DevTools Network tab
2. Look for failed requests
3. Check HTTP status codes
4. Verify API response format
5. Check rate limits not exceeded
```

### Issue: Responsive design broken
```
Solution:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Test in incognito mode
4. Check DevTools Device Toolbar is enabled
5. Verify viewport meta tag in HTML
```

---

## Performance Baselines

### Expected Performance
- API Response Time: < 2 seconds
- Page Load Time: < 1.5 seconds  
- Time to Interactive: < 3 seconds
- Audio Load Time: < 1 second
- First Contentful Paint: < 800ms

### How to Measure
1. DevTools → Network tab
2. DevTools → Performance tab
3. Throttle to "Fast 3G"
4. Record and analyze

---

## Sign Off

- **Tester Name**: ___________
- **Date**: ___________
- **Overall Status**: ☐ PASS ☐ FAIL
- **Issues Blocking Release**: ___________

