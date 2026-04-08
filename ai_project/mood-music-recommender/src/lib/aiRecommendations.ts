import Anthropic from '@anthropic-ai/sdk';
import { Mood } from "../types";

interface ArtistSuggestions {
  artists: string[];
  searchTerms: string[];
}

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateArtistSuggestions(
  mood: Mood
): Promise<ArtistSuggestions> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicApiKey) {
    console.error('ANTHROPIC_API_KEY not found');
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  try {
    const prompt = `Generate music recommendations for the following mood or emotion: "${mood}"

Please provide exactly 8 diverse artists and 5 search terms/genres that would be perfect for this mood. Format your response as valid JSON (no additional text before or after):

{
  "artists": ["Artist 1", "Artist 2", "Artist 3", "Artist 4", "Artist 5", "Artist 6", "Artist 7", "Artist 8"],
  "searchTerms": ["term 1", "term 2", "term 3", "term 4", "term 5"]
}

Ensure the artists are well-known and popular on Spotify, and the search terms are specific to the mood. Vary the recommendations to include different genres and styles that fit the mood.`;

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const responseText = textContent.text;
    console.log('Claude response:', responseText);

    // Try to parse JSON from the response
    try {
      // Extract JSON from the response (it might have extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.artists && parsed.searchTerms && Array.isArray(parsed.artists) && Array.isArray(parsed.searchTerms)) {
        console.log(`Claude generated recommendations for "${mood}":`, parsed);
        return {
          artists: parsed.artists.slice(0, 8),
          searchTerms: parsed.searchTerms.slice(0, 5)
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse Claude response as JSON:', parseError);
      throw new Error('Failed to parse recommendations from Claude');
    }

  } catch (error) {
    console.error('Claude API call failed:', error);
    throw error;
  }
}

