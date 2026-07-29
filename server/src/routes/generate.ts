import { Router, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
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
- Write an engaging, scroll-stopping caption
- Use a conversational, relatable tone matching the brand voice
- Include relevant emojis naturally (don't overdo it — 2-4 emojis max)
- End with a call-to-action (save, share, comment, link in bio)
- Include 5-8 relevant hashtags at the end
- Best practices: short first line as hook, line breaks for readability`,
    defaultLength: 'medium',
  },
  linkedin: {
    label: 'LinkedIn Post',
    platform: 'LinkedIn',
    instructions: `LinkedIn post requirements:
- Write a professional, thought-leadership style post
- Start with a strong hook (question, bold statement, or surprising fact)
- Use short paragraphs with line breaks — LinkedIn rewards readability
- Include actionable insights or takeaways
- End with a question to drive engagement or a clear CTA
- No emojis in the hook, but 1-2 tasteful emojis are okay in the body
- Aim for 1,200-2,000 characters`,
    defaultLength: 'medium',
  },
  x_post: {
    label: 'X (Twitter) Post',
    platform: 'X/Twitter',
    instructions: `X/Twitter post requirements:
- Write a concise, punchy post — max 280 characters
- Make every word count — cut filler words
- Can include 1-2 relevant hashtags
- Strong, opinionated, or insightful tone
- Thread-friendly: if the topic needs more space, write a main tweet that teases a thread
- No formal sign-offs`,
    defaultLength: 'short',
  },
  blog_post: {
    label: 'Blog Post',
    platform: 'Blog',
    instructions: `Blog post requirements:
- Write a well-structured blog post with a clear title (H1)
- Include subheadings (H2/H3) for sections
- Opening paragraph should hook the reader and state the problem/value
- Body should deliver on the promise with actionable advice, stories, or data
- Use the brand's tone of voice consistently
- Include a conclusion with a call-to-action
- Aim for 400-800 words`,
    defaultLength: 'long',
  },
  email_newsletter: {
    label: 'Email Newsletter',
    platform: 'Email',
    instructions: `Email newsletter requirements:
- Start with a compelling subject line (put it on its own line prefixed with "Subject: ")
- Write a warm, personal greeting
- Lead with the most valuable content first
- Keep paragraphs short (2-3 sentences max)
- Include 1-2 clear CTAs (buttons or links)
- Sign off with the brand's personality
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
- Each hook should feel natural for the brand's tone of voice
- Number them 1-5
- These should work as opening lines for social posts, videos, or articles`,
    defaultLength: 'short',
  },
  ctas: {
    label: 'CTAs (Call-to-Actions)',
    platform: 'Marketing',
    instructions: `Generate effective call-to-action variations.
Requirements:
- Write 5 different CTAs
- Vary the approach: direct ("Buy now"), soft ("Learn more"), community-driven ("Join 10k+ creators"), urgency ("Limited time"), value-first ("Get your free guide")
- Each CTA should align with the brand's goals and key offers
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
- Mix of popular (broad reach), niche (targeted), and branded (unique to the business)
- Group them: 5-7 broad/popular hashtags, 5-7 niche-specific hashtags, 3-5 branded/specific hashtags
- Each hashtag on its own line
- No descriptions, just the hashtags`,
    defaultLength: 'short',
  },
};

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
    short: 'Keep it concise and brief.',
    medium: 'Aim for a moderate length.',
    long: 'Feel free to go in-depth and write a longer piece.',
  };

  return `You are a professional content creator and copywriter. Generate high-quality ${config.label} content for a brand.

BRAND PROFILE (this is critical context — stay on-brand):
- Niche/Topic: ${brandProfile.niche || 'Not specified'}
- Target Audience: ${brandProfile.audience || 'Not specified'}
- Brand Tone of Voice: ${effectiveTone}
- Business Goals: ${brandProfile.goals || 'Not specified'}
- Key Products/Offers: ${brandProfile.key_offers || brandProfile.offers || 'Not specified'}

CONTENT REQUEST:
- Type: ${config.label} (for ${config.platform})
- Topic: "${topic}"
- Tone: ${effectiveTone}
- Length: ${effectiveLength} (${lengthGuide[effectiveLength] || 'Use your best judgment.'})

PLATFORM-SPECIFIC INSTRUCTIONS:
${config.instructions}

IMPORTANT: 
- Stay true to the brand profile above — the tone, audience, and niche must shine through
- Write ONLY the content itself — no introductions like "Here is your..." or "Sure, here's a..."
- Do not include meta-commentary or explanations
- Make it ready to copy-paste and publish`;
}

function generateFallback(type: string, topic: string, brandProfile: any): string {
  const config = TYPE_CONFIGS[type];
  const label = config?.label || type;
  const tone = brandProfile.tone_of_voice || brandProfile.tone || 'friendly';
  const niche = brandProfile.niche || 'your niche';
  const audience = brandProfile.audience || 'your audience';

  const fallbacks: Record<string, string> = {
    instagram: `✨ Ever wondered how to level up your ${niche} game? Here's the truth — it's simpler than you think. 💡

${topic} is something we've all struggled with at some point. But once you crack the code, everything changes.

Here's what I've learned working with ${audience}:
✅ Consistency beats intensity
✅ Small wins compound fast
✅ Your unique perspective is your superpower

Drop a 🔥 in the comments if this resonates, and save this for later!

#${niche.replace(/\s+/g, '')} #ContentCreator #GrowthMindset #CreatorTips #${niche.replace(/\s+/g, '')}Tips #SocialMediaStrategy #BuildInPublic`,

    linkedin: `I was wrong about ${topic}.

For years, I believed the conventional wisdom. But after working directly with ${audience}, I've completely changed my mind.

Here are 3 counter-intuitive lessons I've learned:

1. Speed matters more than perfection. Ship the messy draft. Iterate based on real feedback — not your inner critic.

2. Your "boring" expertise is someone else's revelation. What feels obvious to you after years in ${niche} is gold to a newcomer.

3. Consistency is the only moat that can't be copied. Anyone can have one viral moment. Very few show up every single week for years.

What's a belief about ${topic} that you've changed your mind on? I'd love to hear your perspective in the comments.

#ContentCreation #PersonalBrand #${niche.replace(/\s+/g, '')}`,

    x_post: `${topic} hot take: most people overcomplicate it. Strip it back to fundamentals, do them consistently, and you're already ahead of 90% of people.`,

    blog_post: `# ${topic}: The Complete Guide for ${audience}

In a world where everyone is shouting for attention, one thing remains true: quality wins.

If you're in the ${niche} space, you've probably noticed how noisy it's gotten. Everyone has a "secret formula" or a "growth hack." But after working with ${audience}, I've learned that sustainable success comes from something much simpler.

## Why Most People Struggle with ${topic}

The biggest mistake? Overthinking. When you try to optimize every variable before you've even started, you never actually begin. Paralysis by analysis is the silent killer of progress.

Here's what actually moves the needle:

### 1. Start Before You're Ready

The people you admire didn't wait until they felt qualified. They started messy, learned in public, and improved along the way. Your first attempt will be imperfect — and that's exactly how it should be.

### 2. Build Systems, Not Just Motivation

Motivation fades. Systems endure. Whether it's a content calendar, a batch-creation day, or a simple checklist — the structure is what carries you through the days when you don't feel inspired.

### 3. Listen to Your Audience

Your ${audience} are telling you what they want — you just need to pay attention. Comments, DMs, questions, objections — these are all content gold.

## The Bottom Line

${topic} isn't about a single breakthrough moment. It's about showing up consistently, learning from every interaction, and getting a little better each day.

Ready to take action? Start with one small step today — and keep going.`,

    email_newsletter: `Subject: ${topic} — what nobody tells you

Hey there,

Let me ask you something: when was the last time you felt completely confident about ${topic}?

If you're like most ${audience}, the answer is probably "not recently." And I get it. There's so much noise out there that it's easy to feel like everyone else has it figured out.

Here's the truth: they don't.

After working in ${niche} for years, I've realized that the people who seem most confident are often just the ones who've gotten comfortable with being uncomfortable.

This week, I want to share three things that have helped me shift my perspective on ${topic}:

1. **Embrace the learning curve.** Nobody masters anything overnight. The "overnight success" stories always leave out the years of invisible work.

2. **Find your unique angle.** You don't need to be the best at ${topic}. You just need to be the best at being YOU while talking about it.

3. **Take imperfect action.** A published "good enough" post beats a perfect draft that never sees the light of day.

I'd love to hear — what's your biggest challenge with ${topic} right now? Hit reply and let me know. I read every response.

Talk soon,
[Your name]

P.S. If you found this helpful, forward it to a friend who needs to hear it.`,

    hooks: `1. "Most ${audience} are making this one ${topic} mistake — are you?"
2. "I spent 3 years getting ${topic} wrong. Here's what finally clicked."
3. "The ${topic} advice everyone gives is actually holding you back."
4. "What if everything you know about ${topic} is backwards?"
5. "I asked 100 ${audience} about ${topic}. Their #1 answer surprised me."`,

    ctas: `1. Ready to transform your approach? Let's work together — link in bio.
2. Want more insights like this? Subscribe to my newsletter for weekly tips.
3. Save this post for later — you'll want to come back to it.
4. Share this with someone who needs to hear it today.
5. Comment "YES" below and I'll send you my free ${topic} checklist.`,

    hashtags: `#${niche.replace(/\s+/g, '')}
#${topic.replace(/\s+/g, '')}
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
#EntrepreneurLife
#CreativeBusiness`,
  };

  return fallbacks[type] || `[${label} about "${topic}" for ${niche} — ${tone} tone]

This is a mock generation. Set OPENAI_API_KEY to enable AI-powered content generation.`;
}

// POST /api/generate — generate content
router.post('/', async (req: AuthRequest, res: Response) => {
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

    let content: string;

    if (oai) {
      try {
        const response = await oai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert content creator and copywriter. Generate high-quality, on-brand content ready to copy-paste and publish. Never include meta-commentary or introductions like "Here is your..." — only the content itself.',
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
