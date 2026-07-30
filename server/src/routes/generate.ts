import { Router, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { checkUsageLimit, incrementUsage } from '../middleware/usage.js';
import { getOpenAIClient } from '../openai.js';

const router = Router();

router.use(authMiddleware);

// Content type definitions
const TYPE_CONFIGS: Record<string, {
  label: string;
  platform: string;
  instructions: string;
  defaultLength: string;
}> = {
  instagram: {
    label: 'Instagram Caption',
    platform: 'Instagram',
    instructions: `Instagram caption requirements:
- Write an engaging, scroll-stopping caption that sounds exactly like the brand
- Use the brand's specific tone of voice — do not sound like a generic social media manager
- Start with a strong first line as a hook (make it impossible to scroll past)
- Use line breaks for readability — short paragraphs, 1-2 sentences each
- Include 2-4 relevant emojis, used naturally (not forced)
- End with a call-to-action that aligns with the brand's goals and offers
- Include 5-8 relevant hashtags at the end that reflect the brand's niche`,
    defaultLength: 'medium',
  },
  linkedin: {
    label: 'LinkedIn Post',
    platform: 'LinkedIn',
    instructions: `LinkedIn post requirements:
- Write in a professional, thought-leadership style that reflects the brand's expertise
- Start with a strong hook (question, bold statement, surprising insight)
- Use short paragraphs with line breaks — LinkedIn rewards scannable content
- Include actionable insights or specific takeaways tied to the brand's domain
- Show personality — LinkedIn is not corporate-speak; it's personal brand storytelling
- End with a question to drive engagement or a clear CTA
- Aim for 1,200-2,000 characters
- 1-2 tasteful emojis are okay if they match the brand's tone`,
    defaultLength: 'medium',
  },
  x_post: {
    label: 'X (Twitter) Post',
    platform: 'X/Twitter',
    instructions: `X/Twitter post requirements:
- Write a concise, punchy post — max 280 characters
- Make every word count — cut filler words ruthlessly
- Sound like someone with authority in the brand's niche
- Can include 1-2 relevant hashtags
- Strong, opinionated, or insightful tone that reflects the brand voice
- Thread-friendly: if the topic needs more space, write a main tweet that teases a thread
- No formal sign-offs — X is conversational and direct`,
    defaultLength: 'short',
  },
  blog_post: {
    label: 'Blog Post',
    platform: 'Blog',
    instructions: `Blog post requirements:
- Write a well-structured blog post that reads like it was written by the brand owner themselves
- Include a clear, compelling title (H1) that speaks to the target audience
- Use subheadings (H2/H3) for sections — each should promise a clear benefit
- Opening paragraph must hook the reader by naming their specific pain point or desire
- Body should deliver on the promise with actionable advice, real examples, or practical frameworks
- Every section should feel like it could only come from THIS brand — use the niche's specific language
- Include a conclusion with a natural call-to-action tied to the brand's offers
- Naturally reference the brand's key offers where relevant (not forced — only where it fits)
- Aim for 400-800 words`,
    defaultLength: 'long',
  },
  email_newsletter: {
    label: 'Email Newsletter',
    platform: 'Email',
    instructions: `Email newsletter requirements:
- Start with a compelling subject line on its own line prefixed with "Subject: "
- Write a warm, personal greeting that feels like a message from a trusted advisor
- Lead with the most valuable content first — respect the reader's time
- Keep paragraphs short (2-3 sentences max) for easy mobile reading
- Sound conversational, like writing to one person — not a broadcast
- Include 1-2 clear CTAs that naturally connect to the brand's offers
- Sign off with personality — the closing should feel like the brand
- Aim for 200-400 words`,
    defaultLength: 'medium',
  },
  hooks: {
    label: 'Hooks & Openers',
    platform: 'Social Media',
    instructions: `Generate attention-grabbing hooks and opening lines.
Requirements:
- Write 5 different hooks/opening lines
- Each hook should be 1-2 sentences max
- Vary the style: curiosity gaps, bold claims, questions, relatable statements, contrarian takes
- Every hook must feel authentic to the brand — anyone reading should think "this sounds like [brand]"
- Use the brand's specific niche language and terminology
- Number them 1-5
- These should work as opening lines for social posts, videos, or articles in the brand's domain`,
    defaultLength: 'short',
  },
  ctas: {
    label: 'CTAs (Call-to-Actions)',
    platform: 'Marketing',
    instructions: `Generate effective call-to-action variations.
Requirements:
- Write 5 different CTAs
- Vary the approach: direct, soft, community-driven, urgency/value-driven, curiosity
- Each CTA must directly connect to the brand's goals and key offers — do NOT use generic CTAs
- If the brand has specific offers (coaching, newsletter, products, services), craft CTAs around them
- Keep each CTA to 1 sentence
- Number them 1-5`,
    defaultLength: 'short',
  },
  hashtags: {
    label: 'Hashtags',
    platform: 'Social Media',
    instructions: `Generate a curated list of relevant hashtags.
Requirements:
- Provide 15-20 hashtags
- Mix of popular (broad reach), niche (targeted to the brand's specific audience), and branded
- Group them: 5-7 broad/popular hashtags, 5-7 niche-specific hashtags that match the brand's industry, 3-5 branded/specific to the brand
- Each hashtag on its own line
- No descriptions, just the hashtags
- Make sure niche hashtags are specific to the brand's actual niche, not generic social media tags`,
    defaultLength: 'short',
  },
};

function buildBrandVoiceSample(brandProfile: any): string {
  const tone = brandProfile.tone_of_voice || brandProfile.tone || 'Friendly and professional';
  const niche = brandProfile.niche || 'their niche';
  const audience = brandProfile.audience || 'their audience';

  return `Write as if you are a ${tone} expert in ${niche} who speaks directly to ${audience}. 
Your content should feel like advice from a trusted insider — someone who deeply understands this audience's pain points, desires, and language. 
Use the vocabulary and reference points that resonate specifically with ${audience}. 
Every sentence should sound like it could only come from this brand — never generic, never templated, never like a "social media manager" wrote it.`;
}

function buildPrompt(
  type: string,
  topic: string,
  toneOverride: string | undefined,
  length: string | undefined,
  brandProfile: any
): string {
  const config = TYPE_CONFIGS[type];
  if (!config) {
    throw new Error(`Unknown content type: ${type}`);
  }

  const effectiveTone = toneOverride || brandProfile.tone_of_voice || brandProfile.tone || 'Friendly and professional';
  const effectiveLength = length || config.defaultLength;

  const lengthGuide: Record<string, string> = {
    short: 'Keep it concise and brief — every word must earn its place.',
    medium: 'Aim for a moderate, well-paced length — say what matters, nothing more.',
    long: 'Go in-depth — this is a long-form piece. Give the reader real substance and actionable value.',
  };

  const brandVoiceSample = buildBrandVoiceSample(brandProfile);

  // Determine if we have strong brand details to work with
  const hasStrongBrand =
    brandProfile.niche && brandProfile.niche !== 'Not specified' &&
    brandProfile.audience && brandProfile.audience !== 'Not specified';

  return `===== BRAND IDENTITY (READ THIS FIRST — EVERYTHING BELOW DEPENDS ON IT) =====

YOUR BRAND:
- Niche/Topic: ${brandProfile.niche || 'Not specified'}
- Target Audience: ${brandProfile.audience || 'Not specified'} 
- Tone of Voice: ${effectiveTone}
- Business Goals: ${brandProfile.goals || 'Not specified'}
- Key Products/Offers: ${brandProfile.key_offers || brandProfile.offers || 'Not specified'}

BRAND VOICE IDENTITY:
${brandVoiceSample}

===== CONTENT REQUEST =====
- Type: ${config.label} (for ${config.platform})
- Topic: "${topic}"
- Length: ${effectiveLength} (${lengthGuide[effectiveLength] || 'Use your best judgment.'})

===== PLATFORM-SPECIFIC INSTRUCTIONS =====
${config.instructions}

===== CRITICAL CONSTRAINTS (VIOLATE THESE AND THE CONTENT IS UNUSABLE) =====

1. TONE LOCK: You MUST write in the brand's exact tone of voice: "${effectiveTone}". Never deviate from this tone. Not even slightly. If the tone is casual, don't go formal. If it's professional, don't be sloppy. Every sentence must pass the "does this sound like this specific brand?" test.

2. AUDIENCE AWARENESS: Every line should feel like it was written specifically for ${brandProfile.audience || 'the target audience'}. Use their language, reference their problems, speak to their aspirations. If you don't know who you're writing for, the reader won't feel seen.

3. NICHE AUTHENTICITY: ${hasStrongBrand ? `Naturally reference the brand's niche (${brandProfile.niche}) throughout. Use domain-specific terminology and insights that signal real expertise — not surface-level knowledge anyone could Google.` : 'Draw on domain-specific insights and terminology that signal real expertise.'}

4. OFFER INTEGRATION: Where it flows naturally, reference the brand's key offers (${brandProfile.key_offers || brandProfile.offers || 'their products/services'}). Do NOT hard-sell. The offer should feel like a natural next step someone genuinely wants, not a pitch.

5. NO GENERIC CONTENT: Never use placeholder phrases like "[Your name]", "[insert here]", or generic statements that could apply to any business. Every response must feel UNIQUE to this brand.

6. OUTPUT ONLY THE CONTENT: Write ONLY the content itself — no introductions like "Here is your..." or "Sure, here's a..." No meta-commentary. No explanations. Ready to copy-paste and publish immediately.`;
}

function generateFallback(type: string, topic: string, brandProfile: any): string {
  const config = TYPE_CONFIGS[type];
  const label = config?.label || type;
  const tone = brandProfile.tone_of_voice || brandProfile.tone || 'friendly';
  const niche = brandProfile.niche || 'your niche';
  const audience = brandProfile.audience || 'your audience';
  const offers = brandProfile.key_offers || brandProfile.offers || 'what you offer';

  const fallbacks: Record<string, string> = {
    instagram: `✨ The truth about ${topic} that nobody in ${niche} is talking about? It's simpler than you think. 💡

Most ${audience} overcomplicate this — but once it clicks, everything shifts.

Here's what actually moves the needle:
✅ Small consistent actions always beat sporadic big efforts
✅ Your unique perspective in ${niche} is your biggest advantage
✅ The people winning aren't smarter — they're more consistent

Drop a 🔥 if this hits home, and save this for later — you'll want to come back to it.

#${niche.replace(/\s+/g, '')} #ContentCreator #${niche.replace(/\s+/g, '')}Tips #CreatorEconomy #BuildInPublic #SocialMediaStrategy #GrowYourAudience`,

    linkedin: `I was completely wrong about ${topic}.

For years, I bought into the common advice. But after working directly with ${audience} in ${niche}, I've done a full 180.

Here are 3 counter-intuitive lessons I've learned the hard way:

1. Speed beats perfection. Every. Single. Time. Ship the messy draft. The market's feedback is worth 100x more than your inner critic's opinion.

2. Your "obvious" knowledge is someone else's breakthrough. What feels basic to you after years in ${niche} is genuinely transformative to a newcomer. Stop assuming everyone knows what you know.

3. Consistency is the only real competitive advantage. Anyone can have one great moment. Very few have the discipline to show up every week for years.

I share these because I wish someone had told me this when I was starting out.

What's a belief about ${topic} you've completely changed your mind on? I'd genuinely love to hear your perspective.

#ContentCreation #PersonalBrand #${niche.replace(/\s+/g, '')}`,

    x_post: `${topic} hot take: most people in ${niche} overcomplicate this. Strip it back to fundamentals, do them consistently, and you're already ahead of 90% of ${audience}.`,

    blog_post: `# ${topic}: What Every ${audience} Needs to Know

If you're in ${niche}, you've probably noticed how noisy everything has gotten. Everyone has a "secret formula." Everyone's selling a shortcut.

But after working with ${audience}, here's what I've learned: sustainable success isn't about finding one magic trick. It's about doing the fundamentals better and more consistently than anyone else.

## Why Most ${audience} Struggle with ${topic}

The biggest killer? Overthinking.

When you try to optimize every variable before you've even started, you never actually begin. Paralysis by analysis is the silent killer of progress — especially in ${niche} where there's endless advice and conflicting opinions.

Here's what actually moves the needle:

### 1. Start Before You're Ready

The people you admire in ${niche} didn't wait until they felt qualified. They started messy, learned in public, and improved along the way. Your first attempt will be imperfect — and that's exactly how it should be. The only failed start is the one that never happens.

### 2. Build Systems, Not Just Motivation

Motivation fades. Systems endure. Whether it's a content calendar, a batch-creation day, or a simple pre-publish checklist — structure is what carries you through the days when inspiration doesn't show up. ${audience} who rely on motivation alone never build momentum.

### 3. Listen to Your Audience

Your audience is telling you exactly what they want — in comments, DMs, questions, and objections. Every interaction is content gold. The creators who grow fastest in ${niche} aren't the most talented — they're the ones who pay closest attention and adapt.

## The Bottom Line

${topic} isn't about a single breakthrough moment. It's about showing up consistently, learning from every interaction, and getting a little better each day.

Ready to take action? Start with one small step today — and keep going. If you're looking for more personalized guidance on ${topic}, ${offers} is designed specifically for ${audience} who want to stop spinning their wheels and start seeing real results.`,

    email_newsletter: `Subject: ${topic} — here's what nobody tells you

Hey there,

Let me ask you something: when was the last time you felt truly confident about ${topic}?

If you're like most ${audience} I talk to, the answer is probably "not recently." And I get it. The ${niche} space is so noisy that it's easy to feel like everyone else has it figured out while you're still trying to piece it together.

Here's the truth nobody says out loud: they don't have it figured out either.

After years in ${niche}, I've realized that the people who seem most confident are often just the ones who've gotten comfortable with being uncomfortable. They ship before they're ready. They learn in public. They treat every "failure" as data.

This week, I want to share three mindset shifts that have completely changed how I approach ${topic}:

1. **Embrace the learning curve.** Nobody masters anything overnight. Every "overnight success" story in ${niche} conveniently leaves out the years of invisible work. The curve isn't a bug — it's the whole game.

2. **Find your unique angle.** You don't need to be the best at ${topic}. You just need to be the best at being YOU while talking about it. Your specific experience with ${audience} is an asset nobody else can replicate.

3. **Take imperfect action.** A published "good enough" post beats a perfect draft that never sees the light of day. Every single time.

I'd love to hear — what's your biggest challenge with ${topic} right now? Hit reply and let me know. I read every response and it helps me create better content for you.

Talk soon,
[Your name]

P.S. If this resonated, forward it to someone in ${niche} who needs to hear it. And if you're ready to go deeper, check out ${offers} — built specifically for ${audience}.`,

    hooks: `1. "Most ${audience} are making this one ${topic} mistake daily — and they don't even realize it."
2. "I spent 3 years getting ${topic} wrong in ${niche}. Here's what finally made it click."
3. "The ${topic} advice everyone in ${niche} gives is actually holding ${audience} back. Here's why."
4. "What if everything you've been told about ${topic} is backwards? I asked 100 ${audience} and the answers shocked me."
5. "The uncomfortable truth about ${topic} that nobody in ${niche} wants to admit."`,

    ctas: `1. Ready to finally get ${topic} right? ${offers} is built specifically for ${audience} — let's make it happen.
2. Want weekly insights like this? Join ${audience} who get my newsletter on ${niche} — link in bio.
3. Save this for later — when you're ready to take action on ${topic}, you'll want these frameworks.
4. Share this with another ${audience} who's grinding in ${niche} — they'll thank you.
5. Drop a comment with your biggest struggle around ${topic} and I'll send you my best resource for it.`,

    hashtags: `#${niche.replace(/\s+/g, '')}
#${topic.replace(/\s+/g, '')}
#${audience.replace(/\s+/g, '')}
#ContentCreator
#${niche.replace(/\s+/g, '')}Tips
#DigitalCreator
#CreatorEconomy
#BuildInPublic
#SocialMediaStrategy
#GrowYourAudience
#ContentStrategy
#OnlineBusiness
#PersonalBrand
#${niche.replace(/\s+/g, '')}Community
#CreatorLife
#MonetizeYourContent
#AudienceGrowth
#ContentMarketing
#Solopreneur
#CreativeBusiness`,
  };

  return fallbacks[type] || `[${label} about "${topic}" — for ${audience} in ${niche}]

Weave ${offers} naturally into your content. Keep the tone ${tone} and speak directly to ${audience}.

Enable AI generation (set OPENAI_API_KEY) for fully customized content that matches your exact brand voice.`;
}

// POST /api/generate — generate content
router.post('/', checkUsageLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { type, topic, tone_override, length } = req.body;

    if (!type || !topic) {
      res.status(400).json({ error: 'type and topic are required' });
      return;
    }

    if (!TYPE_CONFIGS[type]) {
      res.status(400).json({ error: `Unknown content type: ${type}. Valid types: ${Object.keys(TYPE_CONFIGS).join(', ')}` });
      return;
    }

    // Fetch brand profile
    const db = await getDb();
    const result = db.exec(
      `SELECT niche, audience, tone, tone_of_voice, goals, offers, key_offers
       FROM brand_profiles WHERE user_id = ?`,
      [req.userId!]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      res.status(400).json({ error: 'No brand profile found. Please complete onboarding first.' });
      return;
    }

    const row = result[0].values[0];
    const brandProfile = {
      niche: row[0],
      audience: row[1],
      tone: row[2],
      tone_of_voice: row[3],
      goals: row[4],
      offers: row[5],
      key_offers: row[6],
    };

    const prompt = buildPrompt(type, topic, tone_override, length, brandProfile);
    const oai = getOpenAIClient();

    // Build a stronger system prompt with brand identity
    const effectiveTone = tone_override || brandProfile.tone_of_voice || brandProfile.tone || 'Friendly and professional';
    const niche = brandProfile.niche || 'their niche';
    const audience = brandProfile.audience || 'their audience';

    let content: string;

    if (oai) {
      try {
        const response = await oai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an elite content creator and copywriter who specializes in ${niche}. You write for ${audience} with a ${effectiveTone} tone. Your content is always: (1) unmistakably on-brand — it sounds like a real person with expertise, not a generic AI, (2) specific and actionable — never vague advice anyone could give, (3) audience-obsessed — every line is crafted for the specific reader. Never include meta-commentary, introductions like "Here is your...", or any explanation. Output only the finished content — ready to publish immediately.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 2000,
        });

        content = response.choices[0]?.message?.content || generateFallback(type, topic, brandProfile);

        // Strip any leading/trailing quotes or markdown code blocks
        content = content.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '').trim();
      } catch (err) {
        console.error('OpenAI generation error:', err);
        content = generateFallback(type, topic, brandProfile);
      }
    } else {
      // No API key — use fallback
      console.log('No OpenAI client available, using fallback generation');
      content = generateFallback(type, topic, brandProfile);
    }

    res.json({
      content,
      type,
      topic,
      brand_profile_used: {
        niche: brandProfile.niche,
        audience: brandProfile.audience,
        tone: brandProfile.tone_of_voice || brandProfile.tone,
      },
    });

    // Increment usage count after successful generation
    await incrementUsage(req.userId!);
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: 'Failed to generate content' });
  }
});

// GET /api/generate/types — list available content types
router.get('/types', (_req: AuthRequest, res: Response) => {
  const types = Object.entries(TYPE_CONFIGS).map(([key, config]) => ({
    id: key,
    label: config.label,
    platform: config.platform,
  }));
  res.json({ types });
});

export default router;
