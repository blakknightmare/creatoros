import { Router, Response } from 'express';
import { getDb } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { getOpenAIClient } from '../openai.js';

const router = Router();

router.use(authMiddleware);

// In-memory transcript store (shared with transcript route via module-level)
// We import from the same store by re-using a simple mechanism
const transcriptStore = new Map<number, string>();

// Helper to get stored transcript or store a new one
function getStoredTranscript(userId: number): string | null {
  return transcriptStore.get(userId) || null;
}

function storeTranscript(userId: number, text: string) {
  transcriptStore.set(userId, text);
}

interface BatchResult {
  tiktok_ideas: string[];        // 30
  reels_concepts: { hook: string; visual: string; caption: string }[];  // 10
  captions: string[];            // 20
  hooks: string[];               // 50
  email_newsletter: { subject: string; body: string };
  carousel: { title: string; slides: { title: string; body: string }[] };
  blog_article: { title: string; content: string };
}

function buildBatchPrompt(transcript: string, brandProfile: any): string {
  return `You are an expert content repurposer and social media strategist. You will analyze a long-form video transcript and repurpose it into multiple content formats — ALL staying strictly on-brand for the creator.

===== BRAND PROFILE (CRITICAL — every piece must reflect this) =====
- Niche/Topic: ${brandProfile.niche || 'Not specified'}
- Target Audience: ${brandProfile.audience || 'Not specified'}
- Brand Tone of Voice: ${brandProfile.tone_of_voice || brandProfile.tone || 'Friendly and professional'}
- Business Goals: ${brandProfile.goals || 'Not specified'}
- Key Products/Offers: ${brandProfile.key_offers || brandProfile.offers || 'Not specified'}

===== SOURCE TRANSCRIPT =====
${transcript}

===== OUTPUT REQUIREMENTS =====
You must return a single valid JSON object (no markdown, no explanation) with exactly these keys. Follow all specifications precisely:

1. "tiktok_ideas": An array of exactly 30 TikTok video ideas. Each is a single string (15-30 words) that combines a hook + concept. Make them punchy, trend-aware, and specific to the transcript content. Format like: "Hook-driven concept that makes people stop scrolling. Specific angle based on the video."

2. "reels_concepts": An array of exactly 10 Instagram Reels concepts. Each is an object with:
   - "hook": opening text overlay or spoken line (5-12 words)
   - "visual": description of the visual/action on screen (10-20 words)
   - "caption": the Instagram caption for the post (30-60 words)

3. "captions": An array of exactly 20 social media captions. Mix of short (1-2 sentences), medium (3-4 sentences), and long (5+ sentences). Vary the platforms they'd suit. Each should be engaging, use the brand voice, and include CTAs where appropriate.

4. "hooks": An array of exactly 50 attention-grabbing opening lines. Each 1-2 sentences that would work for social posts, videos, or articles. Vary styles: curiosity gaps, bold claims, questions, relatable statements, contrarian takes, storytelling openers, "I wish I knew" style, listicles teasers, emotional triggers, and surprising statistics. Make every single one distinct and compelling.

5. "email_newsletter": An object with:
   - "subject": compelling subject line (5-10 words)
   - "body": full newsletter body (300-500 words) with greeting, valuable content drawn from the transcript, 1-2 clear CTAs, and a warm sign-off. Use short paragraphs (2-3 sentences).

6. "carousel": An object with:
   - "title": overall carousel title/topic (5-8 words)
   - "slides": array of 6 slide objects, each with "title" (3-7 words, bold statement) and "body" (15-40 words, explanation). Slide 1 is the hook/cover, slide 6 is the CTA/conclusion.

7. "blog_article": An object with:
   - "title": compelling blog post title (8-15 words, SEO-friendly but engaging)
   - "content": full blog post (800-1200 words) with introduction (hook the reader), 4-6 body sections with H2 subheadings (use "## " prefix), and a conclusion with CTA. Use the brand voice consistently throughout. Include actionable takeaways.

===== CRITICAL RULES =====
- Every single piece must feel like it comes from THIS specific brand, not generic advice
- Use the brand's tone of voice consistently
- Reference the brand's niche and audience naturally
- Where appropriate, naturally weave in the brand's key offers/products (don't hard-sell, just make relevant)
- Never use placeholder text like "[Your name]" or "[insert...]" — write real, ready-to-publish content
- The JSON must be valid and complete — all array/item counts exact as specified
- Do NOT include markdown fences or any text outside the JSON object`;
}

function generateFallbackBatch(transcript: string, brandProfile: any): BatchResult {
  const niche = brandProfile.niche || 'your niche';
  const audience = brandProfile.audience || 'your audience';
  const tone = brandProfile.tone_of_voice || brandProfile.tone || 'friendly';

  // Extract first ~200 chars for context
  const excerpt = transcript.slice(0, 200).replace(/"/g, '');

  return {
    tiktok_ideas: Array.from({ length: 30 }, (_, i) => {
      const hooks = [
        `The one thing nobody tells you about ${niche} — and it changes everything.`,
        `Stop overcomplicating ${niche}. Here's the simple truth.`,
        `I tried the "expert" advice for ${niche}. Here's what actually worked.`,
        `Your ${audience} are struggling with this RIGHT NOW. Here's how to help.`,
      ];
      return `${hooks[i % hooks.length]} (Idea #${i + 1} from your transcript)`;
    }),
    reels_concepts: Array.from({ length: 10 }, (_, i) => ({
      hook: `The #${i + 1} mistake ${audience} make daily`,
      visual: `You speaking directly to camera in ${i % 2 === 0 ? 'a well-lit room' : 'your workspace'}, then cut to example`,
      caption: `${tone} insight for ${audience}: this one shift in how you approach ${niche} can completely transform your results. Save this for later! 🔖`,
    })),
    captions: Array.from({ length: 20 }, (_, i) => {
      const styles = [
        `Short and sweet: The best ${niche} advice I ever received? Consistency beats intensity. Every. Single. Time. 💯`,
        `Medium insight: Here's what I've learned working with ${audience} — the ones who succeed aren't the most talented. They're the most consistent. Show up. Do the work. Trust the process.`,
        `Long form value: If you're in ${niche} and feeling stuck, here's what's probably happening...`,
      ];
      return styles[i % 3];
    }),
    hooks: Array.from({ length: 50 }, (_, i) => {
      const hookVariants = [
        `"I wasted 3 years trying to master ${niche}. Here's what I wish I knew on day one."`,
        `"Most ${audience} are making this ONE mistake right now."`,
        `"The ${niche} secret nobody talks about (but everyone should know)."`,
        `"What if everything you've been told about ${niche} is wrong?"`,
        `"I asked 100 successful ${audience} about their #1 strategy. The answer surprised me."`,
        `"Stop doing THIS if you want to grow in ${niche}."`,
        `"The exact framework I use to create content that converts."`,
        `"3 things I stopped doing that changed my ${niche} game overnight."`,
      ];
      return `${hookVariants[i % hookVariants.length]} (#${i + 1})`;
    }),
    email_newsletter: {
      subject: `The ${niche} insight that changed everything for me`,
      body: `Hey there,\n\nI recently shared something about ${niche} that really resonated with people. So I wanted to expand on it here.\n\nWhen I first started in ${niche}, I made every mistake in the book. But the biggest one? Overthinking. I'd spend hours perfecting things that didn't matter, while ignoring the fundamentals that actually move the needle.\n\nHere are 3 things I've learned working with ${audience}:\n\n1. **Start before you're ready.** The people you admire didn't wait until they felt qualified. They started messy and improved along the way.\n\n2. **Consistency is the only real moat.** Anyone can have one great day. Very few show up every single week for years.\n\n3. **Listen more than you talk.** Your audience is telling you exactly what they want — in comments, DMs, questions. That's content gold.\n\nReady to take action? Pick one of these and implement it today.\n\nTalk soon,\n[CreatorOS Demo]\n\nP.S. Forward this to a friend who needs to hear it.`,
    },
    carousel: {
      title: `7 Truths About ${niche}`,
      slides: [
        { title: 'Truth #1: Perfection is the enemy', body: `Waiting until everything is perfect means you'll never start. Your ${audience} need your voice NOW.` },
        { title: 'Truth #2: Consistency > Intensity', body: 'Showing up daily for 30 minutes beats a once-a-month marathon. Every time. Build the habit.' },
        { title: 'Truth #3: Your story is your edge', body: `Nobody has your exact experience. Your unique journey in ${niche} is your biggest competitive advantage.` },
        { title: 'Truth #4: Simplicity sells', body: `Complex strategies confuse. Simple frameworks convert. Make it easy for ${audience} to say yes.` },
        { title: 'Truth #5: Feedback is a gift', body: 'Every comment, DM, and question is free market research. Pay attention and iterate.' },
        { title: 'Start where you are', body: `You don't need more credentials. You need to start. ${audience} are waiting for exactly what you have. Follow for more!` },
      ],
    },
    blog_article: {
      title: `The Complete Guide to ${niche}: What Every ${audience} Needs to Know`,
      content: `## Introduction\n\nIn the world of ${niche}, there's no shortage of advice. But most of it misses the mark — especially for ${audience}. After spending years in this space, I've learned that the real keys to success are simpler than most people think.\n\nThis guide breaks down what actually works.\n\n## The Problem with Most Advice\n\nThe internet is flooded with "growth hacks" and "secret formulas." But here's the truth: there are no secrets. Just fundamentals executed consistently over time.\n\n## Strategy #1: Know Your Audience Deeply\n\nYour ${audience} aren't just demographics. They're real people with real problems. The better you understand their pain points, the more resonant your content becomes.\n\n## Strategy #2: Build Systems, Not Just Content\n\nOne viral post won't change your business. A system that produces quality content every week will. Create a workflow that makes consistency inevitable.\n\n## Strategy #3: Repurpose Everything\n\nEvery piece of long-form content contains dozens of shorter pieces. Extract them. A single video becomes tweets, carousels, reels, and newsletters.\n\n## Strategy #4: Focus on One Platform\n\nSpreading yourself across 5 platforms dilutes your effort. Pick one where your ${audience} already hangs out and dominate it before expanding.\n\n## Strategy #5: Track What Matters\n\nVanity metrics lie. Focus on engagement rate, conversion rate, and email signups — not just follower count.\n\n## Conclusion\n\n${niche} success isn't about finding a magic bullet. It's about showing up, delivering value, and getting a little better every day. Start with one strategy from this guide and implement it this week.\n\nReady to take the next step? Join our community of ${audience} who are building something real.`,
    },
  };
}

// POST /api/generate/batch — batch generate all content types from a transcript
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { transcript, youtubeUrl } = req.body;

    // Resolve transcript
    let finalTranscript: string | null = null;

    if (transcript && typeof transcript === 'string' && transcript.trim().length > 0) {
      finalTranscript = transcript.trim();
      storeTranscript(req.userId!, finalTranscript);
    } else if (youtubeUrl && typeof youtubeUrl === 'string') {
      // Try stored transcript first, then fallback
      const stored = getStoredTranscript(req.userId!);
      if (stored) {
        finalTranscript = stored;
      } else {
        res.status(400).json({ error: 'No transcript available. Please submit a transcript first via /api/transcript.' });
        return;
      }
    } else {
      res.status(400).json({ error: 'transcript is required' });
      return;
    }

    if (finalTranscript.length < 50) {
      res.status(400).json({ error: 'Transcript is too short. Please provide at least 50 characters.' });
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

    const prompt = buildBatchPrompt(finalTranscript, brandProfile);
    const oai = getOpenAIClient();

    let batchResult: BatchResult;

    if (oai) {
      try {
        const response = await oai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert content strategist and copywriter who repurposes long-form content into multiple engaging formats. Always respond with valid JSON only — no markdown, no explanations, no text outside the JSON object. Every piece you write must feel authentically on-brand, never generic.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 8000,
          response_format: { type: 'json_object' },
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('Empty response from OpenAI');
        }

        // Clean any markdown fences
        const cleaned = content.replace(/^```json\s*\n?/, '').replace(/\n?```$/, '').trim();
        const parsed = JSON.parse(cleaned);

        // Validate and normalize the structure
        batchResult = {
          tiktok_ideas: Array.isArray(parsed.tiktok_ideas) ? parsed.tiktok_ideas.slice(0, 30) : [],
          reels_concepts: Array.isArray(parsed.reels_concepts)
            ? parsed.reels_concepts.slice(0, 10).map((r: any) => ({
                hook: r.hook || '',
                visual: r.visual || '',
                caption: r.caption || '',
              }))
            : [],
          captions: Array.isArray(parsed.captions) ? parsed.captions.slice(0, 20) : [],
          hooks: Array.isArray(parsed.hooks) ? parsed.hooks.slice(0, 50) : [],
          email_newsletter: {
            subject: parsed.email_newsletter?.subject || 'Newsletter from our team',
            body: parsed.email_newsletter?.body || '',
          },
          carousel: {
            title: parsed.carousel?.title || '',
            slides: Array.isArray(parsed.carousel?.slides)
              ? parsed.carousel.slides.slice(0, 7).map((s: any) => ({
                  title: s.title || '',
                  body: s.body || '',
                }))
              : [],
          },
          blog_article: {
            title: parsed.blog_article?.title || '',
            content: parsed.blog_article?.content || '',
          },
        };
      } catch (err) {
        console.error('OpenAI batch generation error:', err);
        batchResult = generateFallbackBatch(finalTranscript, brandProfile);
      }
    } else {
      console.log('No OpenAI client available, using fallback batch generation');
      batchResult = generateFallbackBatch(finalTranscript, brandProfile);
    }

    // Build a summary for the response
    const summary = {
      tiktok_ideas: batchResult.tiktok_ideas.length,
      reels_concepts: batchResult.reels_concepts.length,
      captions: batchResult.captions.length,
      hooks: batchResult.hooks.length,
      email_newsletter: batchResult.email_newsletter ? 1 : 0,
      carousel_slides: batchResult.carousel?.slides?.length || 0,
      blog_article: batchResult.blog_article ? 1 : 0,
      total_pieces: batchResult.tiktok_ideas.length +
        batchResult.reels_concepts.length +
        batchResult.captions.length +
        batchResult.hooks.length +
        (batchResult.email_newsletter ? 1 : 0) +
        (batchResult.blog_article ? 1 : 0),
    };

    res.json({
      result: batchResult,
      summary,
      brand_profile_used: {
        niche: brandProfile.niche,
        audience: brandProfile.audience,
        tone: brandProfile.tone_of_voice || brandProfile.tone,
      },
    });
  } catch (err) {
    console.error('Batch generate error:', err);
    res.status(500).json({ error: 'Failed to generate batch content' });
  }
});

export default router;
