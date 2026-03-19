### Step 1: Set Up Your Next.js Project

1. **Install Node.js**: Make sure you have Node.js installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).

2. **Create a New Next.js Project**:
   Open your terminal and run the following command to create a new Next.js application:

   ```bash
   # Mood Music Recommender

A Next.js application that recommends music based on your current mood using the Spotify API.

## Features

- Select from 6 different moods: Happy, Sad, Energetic, Relaxed, Romantic, Focused
- Get personalized music recommendations from Spotify
- Play 30-second previews of tracks
- Browse through recommended tracks
- Responsive design with Tailwind CSS

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Spotify API credentials:**

   Create a Spotify app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).

   Create a `.env.local` file in the root directory and add your credentials:
   ```
   SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How it works

1. Select a mood from the available options
2. The app calls the Spotify Recommendations API with mood-specific parameters:
   - **Genres**: Different genres are seeded based on the mood
   - **Valence**: How positive/happy the music sounds (0.0 to 1.0)
   - **Energy**: How energetic/intense the music is (0.0 to 1.0)
3. Recommended tracks are displayed with album art and playback controls
4. Click on tracks to play 30-second previews or open in Spotify

## Mood Configurations

- **Happy**: Pop, Dance, Happy genres (High valence, medium-high energy)
- **Sad**: Indie, Folk, Acoustic genres (Low valence, low energy)
- **Energetic**: Electronic, Rock, Dance genres (Medium-high valence, high energy)
- **Relaxed**: Ambient, Jazz, Classical genres (Medium valence, low energy)
- **Romantic**: R&B, Pop, Indie genres (Medium-high valence, medium energy)
- **Focused**: Classical, Ambient, Instrumental genres (Medium valence, low energy)

## Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Spotify Web API
   ```

   Navigate into your project directory:

   ```bash
   cd mood-music-recommender
   ```

3. **Install Required Packages**:
   You will need Axios for making API requests. Install it using:

   ```bash
   npm install axios
   ```

### Step 2: Set Up Spotify API

1. **Create a Spotify Developer Account**: Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/) and log in or create an account.

2. **Create a New App**:
   - Click on "Create an App".
   - Fill in the required details and agree to the terms.
   - Once created, you will get a Client ID and Client Secret.

3. **Set Up Redirect URI**:
   - In your app settings, set a redirect URI (e.g., `http://localhost:3000/api/auth/callback`).

4. **Get Access Token**: You will need to authenticate your application to access the Spotify API. You can use the Client Credentials flow for this purpose.

### Step 3: Create API Routes in Next.js

1. **Create an API Route for Authentication**:
   Create a new folder called `api` inside the `pages` directory, and then create a file named `auth.js`:

   ```javascript
   // pages/api/auth.js
   import axios from 'axios';

   const clientId = process.env.SPOTIFY_CLIENT_ID;
   const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

   export default async function handler(req, res) {
       const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

       try {
           const response = await axios.post('https://accounts.spotify.com/api/token', null, {
               headers: {
                   'Authorization': `Basic ${auth}`,
                   'Content-Type': 'application/x-www-form-urlencoded',
               },
               params: {
                   grant_type: 'client_credentials',
               },
           });

           res.status(200).json(response.data);
       } catch (error) {
           res.status(500).json({ error: 'Failed to authenticate with Spotify' });
       }
   }
   ```

2. **Create an API Route for Music Recommendations**:
   Create another file named `recommendations.js` in the `api` folder:

   ```javascript
   // pages/api/recommendations.js
   import axios from 'axios';

   export default async function handler(req, res) {
       const { mood } = req.query; // Get mood from query parameters
       const tokenResponse = await axios.get('http://localhost:3000/api/auth'); // Call your auth endpoint
       const accessToken = tokenResponse.data.access_token;

       try {
           const response = await axios.get(`https://api.spotify.com/v1/recommendations`, {
               headers: {
                   'Authorization': `Bearer ${accessToken}`,
               },
               params: {
                   seed_genres: mood, // Use mood as seed genre
                   limit: 10,
               },
           });

           res.status(200).json(response.data);
       } catch (error) {
           res.status(500).json({ error: 'Failed to fetch recommendations' });
       }
   }
   ```

### Step 4: Create the Frontend

1. **Create a Simple Form**:
   Edit the `pages/index.js` file to create a simple form for users to select their mood:

   ```javascript
   // pages/index.js
   import { useState } from 'react';
   import axios from 'axios';

   export default function Home() {
       const [mood, setMood] = useState('');
       const [recommendations, setRecommendations] = useState([]);

       const handleSubmit = async (e) => {
           e.preventDefault();
           const response = await axios.get(`/api/recommendations?mood=${mood}`);
           setRecommendations(response.data.tracks);
       };

       return (
           <div>
               <h1>Mood-Based Music Recommender</h1>
               <form onSubmit={handleSubmit}>
                   <select value={mood} onChange={(e) => setMood(e.target.value)}>
                       <option value="">Select Mood</option>
                       <option value="happy">Happy</option>
                       <option value="sad">Sad</option>
                       <option value="chill">Chill</option>
                       <option value="party">Party</option>
                   </select>
                   <button type="submit">Get Recommendations</button>
               </form>
               <div>
                   {recommendations.map((track) => (
                       <div key={track.id}>
                           <h3>{track.name}</h3>
                           <p>{track.artists.map(artist => artist.name).join(', ')}</p>
                           <a href={track.external_urls.spotify} target="_blank" rel="noopener noreferrer">Listen</a>
                       </div>
                   ))}
               </div>
           </div>
       );
   }
   ```

### Step 5: Environment Variables

1. **Create a `.env.local` file** in the root of your project and add your Spotify credentials:

   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

### Step 6: Run Your Application

1. **Start the Development Server**:
   Run the following command in your terminal:

   ```bash
   npm run dev
   ```

2. **Open Your Browser**:
   Navigate to `http://localhost:3000` to see your mood-based music recommender application in action.

### Conclusion

You now have a basic mood-based music recommender application using Next.js and the Spotify API. You can enhance this application by adding more features, improving the UI, or integrating additional APIs. Happy coding!