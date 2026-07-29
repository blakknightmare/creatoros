import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not set — OpenAI features will use fallback/defaults');
    return null;
  }
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

export interface BrandProfileParsed {
  niche: string;
  audience: string;
  tone_of_voice: string;
  goals: string;
  key_offers: string;
}

/**
 * Parse a user's free-text business description and tone selection
 * into a structured brand profile using OpenAI, or return a sensible
 * default if the API key is unavailable.
 */
export async function parseBrandDescription(
  description: string,
  extraContext: string,
  tonePreference: string
): Promise<BrandProfileParsed> {
  const oai = getOpenAIClient();

  if (!oai) {
    // Fallback: return a reasonable defaults-based parse when no API key
    return defaultParse(description, extraContext, tonePreference);
  }

  const prompt = `You are a brand strategist. A creator has described their business. Extract a structured brand profile from their description. Return ONLY valid JSON (no markdown, no explanation) with these exact keys:
- "niche": a short label for their niche/topic area (e.g., "Fitness coaching for dads")
- "audience": their target audience (e.g., "Busy fathers aged 30-50")
- "tone_of_voice": a short description of their brand tone based on their preference: "${tonePreference}"
- "goals": their likely business goals (e.g., "Grow online coaching business, increase client roster")
- "key_offers": their key products/services/offers (e.g., "1:1 coaching, meal plans, workout programs")

If any field cannot be inferred, use "Not specified" as the value.

Business description: "${description}"
Additional context: "${extraContext || 'None provided'}"
Tone preference: "${tonePreference}"`;

  try {
    const response = await oai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a brand strategist that extracts structured brand profiles from business descriptions. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return defaultParse(description, extraContext, tonePreference);
    }

    const parsed = JSON.parse(content);
    return {
      niche: parsed.niche || 'Not specified',
      audience: parsed.audience || 'Not specified',
      tone_of_voice: parsed.tone_of_voice || tonePreference || 'Not specified',
      goals: parsed.goals || 'Not specified',
      key_offers: parsed.key_offers || 'Not specified',
    };
  } catch (err) {
    console.error('OpenAI parse error:', err);
    return defaultParse(description, extraContext, tonePreference);
  }
}

function defaultParse(
  description: string,
  _extraContext: string,
  tonePreference: string
): BrandProfileParsed {
  const combined = `${description} ${_extraContext}`.trim();
  return {
    niche: description || 'Not specified',
    audience: 'Not specified — edit to refine',
    tone_of_voice: tonePreference || 'Friendly / casual',
    goals: 'Not specified — edit to refine',
    key_offers: 'Not specified — edit to refine',
  };
}
