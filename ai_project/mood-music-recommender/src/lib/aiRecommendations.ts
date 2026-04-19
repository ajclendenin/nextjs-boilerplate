import Anthropic from '@anthropic-ai/sdk';
import { Mood } from "../types";

export interface SongSuggestion {
  title: string;
  artist: string;
}

export interface SongSuggestionOptions {
  isAlternative?: boolean;
  excludedTitles?: string[];
  feedback?: string;
  rejectedTrackTitle?: string;
  requestSeed?: string;
}

const curatedMoodSuggestions: Record<string, SongSuggestion[]> = {
  happy: [
    { title: 'As It Was', artist: 'Harry Styles' },
    { title: 'Good Vibrations', artist: 'The Beach Boys' },
    { title: 'Dancing Queen', artist: 'ABBA' },
    { title: 'Walking on Sunshine', artist: 'Katrina and the Waves' },
    { title: 'Dog Days Are Over', artist: 'Florence + The Machine' },
    { title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars' },
    { title: 'September', artist: 'Earth, Wind & Fire' },
    { title: 'Shut Up and Dance', artist: 'WALK THE MOON' },
  ],
  sad: [
    { title: 'Someone Like You', artist: 'Adele' },
    { title: 'Skinny Love', artist: 'Bon Iver' },
    { title: 'Liability', artist: 'Lorde' },
    { title: 'Hurt', artist: 'Johnny Cash' },
    { title: 'Fix You', artist: 'Coldplay' },
    { title: 'All I Want', artist: 'Kodaline' },
    { title: 'The Night We Met', artist: 'Lord Huron' },
    { title: 'Nothing Compares 2 U', artist: 'Sinead O Connor' },
  ],
  relaxed: [
    { title: 'Weightless', artist: 'Marconi Union' },
    { title: 'Banana Pancakes', artist: 'Jack Johnson' },
    { title: 'Sunset Lover', artist: 'Petit Biscuit' },
    { title: 'Better Together', artist: 'Jack Johnson' },
    { title: 'Holocene', artist: 'Bon Iver' },
    { title: 'Pink Moon', artist: 'Nick Drake' },
    { title: 'Breathe', artist: 'Telepopmusik' },
    { title: 'Come Away With Me', artist: 'Norah Jones' },
  ],
  excited: [
    { title: 'Titanium', artist: 'David Guetta ft. Sia' },
    { title: 'Levitating', artist: 'Dua Lipa' },
    { title: 'Blinding Lights', artist: 'The Weeknd' },
    { title: 'Cant Hold Us', artist: 'Macklemore & Ryan Lewis' },
    { title: 'Wake Me Up', artist: 'Avicii' },
    { title: 'Feel So Close', artist: 'Calvin Harris' },
    { title: 'Dont Start Now', artist: 'Dua Lipa' },
    { title: 'On Top of the World', artist: 'Imagine Dragons' },
  ],
  romantic: [
    { title: 'At Last', artist: 'Etta James' },
    { title: 'Adore You', artist: 'Harry Styles' },
    { title: 'Lover', artist: 'Taylor Swift' },
    { title: 'Best Part', artist: 'Daniel Caesar ft. H.E.R.' },
    { title: 'Lets Stay Together', artist: 'Al Green' },
    { title: 'Kiss Me', artist: 'Sixpence None the Richer' },
    { title: 'Dreaming of You', artist: 'Selena' },
    { title: 'Just the Way You Are', artist: 'Bruno Mars' },
  ],
  nostalgic: [
    { title: 'Dreams', artist: 'Fleetwood Mac' },
    { title: 'Take On Me', artist: 'a-ha' },
    { title: 'Fast Car', artist: 'Tracy Chapman' },
    { title: 'Everybody Wants to Rule the World', artist: 'Tears for Fears' },
    { title: 'Landslide', artist: 'Fleetwood Mac' },
    { title: 'Time After Time', artist: 'Cyndi Lauper' },
    { title: 'Africa', artist: 'Toto' },
    { title: 'Vienna', artist: 'Billy Joel' },
  ],
  adventurous: [
    { title: 'Send Me On My Way', artist: 'Rusted Root' },
    { title: 'Mountain Sound', artist: 'Of Monsters and Men' },
    { title: 'Home', artist: 'Edward Sharpe & The Magnetic Zeros' },
    { title: 'Riptide', artist: 'Vance Joy' },
    { title: 'Ends of the Earth', artist: 'Lord Huron' },
    { title: 'Geronimo', artist: 'Sheppard' },
    { title: 'Adventure of a Lifetime', artist: 'Coldplay' },
    { title: 'Ho Hey', artist: 'The Lumineers' },
  ],
};

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shuffleSongs(songs: SongSuggestion[]): SongSuggestion[] {
  const shuffled = [...songs];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function getMoodTokens(mood: Mood): Set<string> {
  return new Set(
    normalizeText(String(mood))
      .split(' ')
      .filter((token) => token.length > 2)
  );
}

function isGenericMoodTitle(title: string, moodTokens: Set<string>): boolean {
  const normalizedTitle = normalizeText(title);

  if (!normalizedTitle) {
    return true;
  }

  const titleTokens = normalizedTitle.split(' ').filter(Boolean);
  if (titleTokens.length === 0) {
    return true;
  }

  const genericTitleWords = new Set([
    'happy',
    'sad',
    'upbeat',
    'chill',
    'relaxed',
    'relaxing',
    'calm',
    'mood',
    'vibes',
    'vibe',
    'energy',
    'playlist',
    'song',
    'songs',
    'music',
  ]);

  const allTokensAreGeneric = titleTokens.every(
    (token) => genericTitleWords.has(token) || moodTokens.has(token)
  );

  if (allTokensAreGeneric) {
    return true;
  }

  return titleTokens.every((token) => moodTokens.has(token));
}

function sanitizeSongSuggestions(
  songs: SongSuggestion[],
  mood: Mood,
  maxSongs: number = 8
): SongSuggestion[] {
  const moodTokens = getMoodTokens(mood);
  const seenTitles = new Set<string>();
  const seenTitleArtistPairs = new Set<string>();

  return songs
    .map((song) => ({
      title: song.title.trim(),
      artist: song.artist.trim(),
    }))
    .filter((song) => song.title.length > 0 && song.artist.length > 0)
    .filter((song) => !isGenericMoodTitle(song.title, moodTokens))
    .filter((song) => {
      const normalizedTitle = normalizeText(song.title);
      const normalizedArtist = normalizeText(song.artist);
      const pairKey = `${normalizedTitle}::${normalizedArtist}`;

      if (
        normalizedTitle.length === 0 ||
        normalizedArtist.length === 0 ||
        seenTitles.has(normalizedTitle) ||
        seenTitleArtistPairs.has(pairKey)
      ) {
        return false;
      }

      seenTitles.add(normalizedTitle);
      seenTitleArtistPairs.add(pairKey);
      return true;
    })
    .slice(0, maxSongs);
}

function getCuratedFallbackSongSuggestions(mood: Mood): SongSuggestion[] {
  const normalizedMood = normalizeText(String(mood));

  for (const [key, songs] of Object.entries(curatedMoodSuggestions)) {
    if (normalizedMood.includes(key)) {
      return shuffleSongs(songs);
    }
  }

  return [];
}

function extractTextFromMessageContent(content: any): string {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (!block) return '';
        return typeof block === 'string' ? block : block.text ?? '';
      })
      .filter(Boolean)
      .join(' ');
  }

  return '';
}

function parseAnthropicResponse(message: any): string {
  if (!message?.content) return '';

  return Array.isArray(message.content)
    ? message.content.map(extractTextFromMessageContent).join(' ')
    : extractTextFromMessageContent(message.content);
}

async function getAiGeneratedSongSuggestions(
  mood: Mood,
  options: SongSuggestionOptions = {}
): Promise<SongSuggestion[] | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY is not set. Falling back to generic mood-based search queries.');
    return null;
  }

  // Add randomness to ensure varied responses even for repeated calls
  const randomSeed = Math.floor(Math.random() * 10000);
  const excludedTitles = sanitizeSongSuggestions(
    (options.excludedTitles ?? []).map((title) => ({ title, artist: 'placeholder' })),
    mood,
    50
  ).map((song) => song.title);

  const alternativeText = options.isAlternative 
    ? ' Provide completely different and less common song recommendations for this mood.' 
    : '';
  const exclusionText = excludedTitles.length > 0
    ? ` Do not recommend any of these song titles again: ${excludedTitles.map((title) => `"${title}"`).join(', ')}.`
    : '';
  const feedbackText = options.feedback
    ? ` The listener said the previous recommendation was not right because: "${options.feedback}".`
    : '';
  const rejectedTrackText = options.rejectedTrackTitle
    ? ` The rejected track title was "${options.rejectedTrackTitle}". Avoid recommending that song or anything too similar in tone, arrangement, or pacing if it conflicts with the feedback.`
    : '';
  const requestSeedText = options.requestSeed
    ? ` Request seed: ${options.requestSeed}. Use it to vary the selection and avoid repeating a prior set.`
    : '';

  const prompt = `You are a creative music recommendation assistant. For the mood "${mood}", recommend 12 real songs that fit the feeling without repeating titles or falling back to generic mood words.${alternativeText}${exclusionText}${feedbackText}${rejectedTrackText}${requestSeedText}

Rules:
- Recommend real, recognizable songs by real artists.
- Do not repeat any song title, even if it is by a different artist.
- Do not use placeholder or generic titles like "Happy", "Upbeat", "Chill Vibes", "Mood", or titles that simply restate the mood unless the song is a truly iconic, widely known track and you only use that pattern at most once.
- Prefer songs a human would expect from a strong search result set: a mix of popular, critically known, and credible catalog picks.
- Make the list diverse across artists, eras, and genres.
- Favor songs that imply the mood through sound and cultural association, not just title matching.
- When listener feedback is provided, prioritize it over the rejected song and steer the replacement set in the requested direction.

Reference style for a happy mood: "As It Was" by Harry Styles, "Good Vibrations" by The Beach Boys, "Dancing Queen" by ABBA, "Walking on Sunshine" by Katrina and the Waves.

Be imaginative: mix popular hits with hidden treasures, different musical styles, and unexpected choices that still capture the essence of "${mood}".

Random variation ${randomSeed}: Ensure this recommendation is fresh and different from typical suggestions.

Return only a valid JSON object with exactly one key: "songs". "songs" should be an array of 12 objects, each with "title" and "artist" string values.

Examples:
- For "happy": upbeat pop like "Uptown Funk" by Mark Ronson ft. Bruno Mars, joyful indie like "Dog Days Are Over" by Florence + The Machine, and eclectic choices
- For "sad": emotional ballads like "Someone Like You" by Adele, haunting folk like "Hurt" by Johnny Cash, and varied melancholic music
- For "relaxed": ambient tracks like "Weightless" by Marconi Union, soothing jazz like "What a Wonderful World" by Louis Armstrong, and diverse calming music

Do not include any explanation or extra text.`;

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-3',
      max_tokens: 420,
      temperature: 0.8,
      system: 'You are a helpful assistant that suggests song titles and artists based on mood.',
      messages: [
        { role: 'user', content: prompt }
      ]
    });
  } catch (error) {
    console.warn('Anthropic API request failed:', error);
    return null;
  }

  const textResponse = parseAnthropicResponse(message);

  try {
    const parsed = JSON.parse(textResponse) as { songs: SongSuggestion[] };

    if (
      parsed &&
      Array.isArray(parsed.songs) &&
      parsed.songs.length > 0 &&
      parsed.songs.every(
        (song) =>
          song &&
          typeof song.title === 'string' &&
          typeof song.artist === 'string'
      )
    ) {
      const sanitizedSongs = sanitizeSongSuggestions(parsed.songs, mood);

      if (sanitizedSongs.length > 0) {
        return sanitizedSongs;
      }

      console.warn('Anthropic suggestions were filtered out as duplicates or generic mood-title matches.');
      return null;
    }

    console.warn('Anthropic response JSON did not match expected shape:', parsed);
  } catch (error) {
    console.warn('Failed to parse Anthropic response as JSON:', textResponse, error);
  }

  return null;
}

export async function generateSongSuggestions(
  mood: Mood,
  options: SongSuggestionOptions = {}
): Promise<SongSuggestion[]> {
  const aiSongs = await getAiGeneratedSongSuggestions(mood, options);

  if (aiSongs && aiSongs.length > 0) {
    return aiSongs;
  }

  const excludedTitles = new Set(
    (options.excludedTitles ?? []).map((title) => normalizeText(title))
  );

  return getCuratedFallbackSongSuggestions(mood).filter(
    (song) => !excludedTitles.has(normalizeText(song.title))
  );
}

