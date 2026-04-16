import Anthropic from '@anthropic-ai/sdk';
import { Mood } from "../types";

export interface SongSuggestion {
  title: string;
  artist: string;
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

async function getAiGeneratedSongSuggestions(mood: Mood, isAlternative: boolean = false): Promise<SongSuggestion[] | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY is not set. Falling back to generic mood-based search queries.');
    return null;
  }

  // Add randomness to ensure varied responses even for repeated calls
  const randomSeed = Math.floor(Math.random() * 10000);

  const alternativeText = isAlternative 
    ? ' Provide completely different and less common song recommendations for this mood.' 
    : '';

  const prompt = `You are a creative music recommendation assistant. For the mood "${mood}", recommend 8 diverse and creative songs that evoke or match this emotional state. Think outside the box - include lesser-known gems, unique interpretations, and songs from various genres, eras, and cultures that all align with "${mood}", not necessarily having the word "${mood}" in the title.${alternativeText}

Be imaginative: mix popular hits with hidden treasures, different musical styles, and unexpected choices that still capture the essence of "${mood}".

Random variation ${randomSeed}: Ensure this recommendation is fresh and different from typical suggestions.

Return only a valid JSON object with exactly one key: "songs". "songs" should be an array of 8 objects, each with "title" and "artist" string values.

Examples:
- For "happy": upbeat pop like "Uptown Funk" by Mark Ronson ft. Bruno Mars, joyful indie like "Dog Days Are Over" by Florence + The Machine, and eclectic choices
- For "sad": emotional ballads like "Someone Like You" by Adele, haunting folk like "Hurt" by Johnny Cash, and varied melancholic music
- For "relaxed": ambient tracks like "Weightless" by Marconi Union, soothing jazz like "What a Wonderful World" by Louis Armstrong, and diverse calming music

Do not include any explanation or extra text.`;

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-3',
      max_tokens: 260,
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
      return parsed.songs;
    }

    console.warn('Anthropic response JSON did not match expected shape:', parsed);
  } catch (error) {
    console.warn('Failed to parse Anthropic response as JSON:', textResponse, error);
  }

  return null;
}

export async function generateSongSuggestions(
  mood: Mood,
  isAlternative: boolean = false
): Promise<SongSuggestion[]> {
  const aiSongs = await getAiGeneratedSongSuggestions(mood, isAlternative);
  return aiSongs ?? [];
}

