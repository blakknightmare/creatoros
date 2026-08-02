import { Router, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { checkUsageLimit, incrementUsage } from '../middleware/usage.js';
import { getOpenAIClient } from '../openai.js';

const router = Router();

router.use(authMiddleware);

// In-memory transcript store (shared with transcript route via module-level)
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

function buildBrandVoiceSample(brandProfile: any): string {
  const tone = brandProfile.tone_of_voice || brandProfile.tone || 'Friendly and professional';
  const niche = brandProfile.niche || 'their niche';
  const audience = brandProfile.audience || 'their audience';

  return `You are a ${tone} expert in ${niche} who speaks directly to ${audience}. 
Your content feels like advice from a trusted insider — someone who deeply understands this audience's pain points, desires, and daily reality.
You use the vocabulary, reference points, and insider language that ${audience} actually use.
Every single piece of content — whether a TikTok idea, a newsletter, or a blog article — must sound like it could only come from THIS brand.
Never write generic advice. Never sound like a content mill. Never use templated language.
If ${audience} read your content, they should feel: "This person GETS me."`;
}

function buildBatchPrompt(transcript: string, brandProfile: any): string {
  const tone = brandProfile.tone_of_voice || brandProfile.tone || 'Friendly and professional';
  const niche = brandProfile.niche || 'Not specified';
  const audience = brandProfile.audience || 'Not specified';
  const goals = brandProfile.goals || 'Not specified';
  const offers = brandProfile.key_offers || brandProfile.offers || 'Not specified';

  const brandVoiceSample = buildBrandVoiceSample(brandProfile);
  const hasStrongBrand = niche !== 'Not specified' && audience !== 'Not specified';

  return `===== BRAND IDENTITY — THIS DEFINES EVERYTHING YOU WRITE =====

YOUR BRAND:
- Niche/Topic: ${niche}
- Target Audience: ${audience}
- Tone of Voice: ${tone}
- Business Goals: ${goals}
- Key Products/Offers: ${offers}

BRAND VOICE IDENTITY:
${brandVoiceSample}

===== SOURCE TRANSCRIPT =====
${transcript}

===== YOUR TASK =====
You are an expert content strategist and copywriter. Repurpose the transcript above into multiple content formats. Every piece you create must feel like it was written by THIS specific brand — the ${tone} voice, the ${niche} expertise, speaking to ${audience}.

===== OUTPUT FORMAT =====
Return a single valid JSON object (no markdown fences, no explanation) with exactly these keys:

1. "tiktok_ideas": An array of exactly 30 TikTok video ideas. Each is a single string (15-30 words) combining a hook + concept. Make them punchy, trend-aware, and specific — as if ${niche} is the creator's whole world. Use the brand's ${tone} tone. Format: "Hook-driven concept that makes ${audience} stop scrolling instantly."

2. "reels_concepts": An array of exactly 10 Instagram Reels concepts. Each is an object with:
   - "hook": opening text overlay or spoken line (5-12 words) that grabs ${audience}'s attention immediately
   - "visual": description of the visual/action on screen (10-20 words)
   - "caption": the Instagram caption (30-60 words) in the brand's voice, including a CTA

3. "captions": An array of exactly 20 social media captions. Mix of short (1-2 sentences), medium (3-4 sentences), and long (5+ sentences). Vary the platforms they'd suit. Each must sound like the brand — the ${tone} tone must be unmistakable. Use the niche's specific terminology. Include CTAs that connect to ${offers} where natural.

4. "hooks": An array of exactly 50 attention-grabbing opening lines. Each 1-2 sentences. Vary styles: curiosity gaps, bold claims, questions, relatable statements, contrarian takes, storytelling openers, "I wish I knew" style, listicles teasers, emotional triggers, surprising statistics. Every single hook must feel like ${niche} expertise speaking to ${audience} — not generic content hooks. Make them distinct and compelling.

5. "email_newsletter": An object with:
   - "subject": compelling subject line (5-10 words) that ${audience} would actually click
   - "body": full newsletter body (300-500 words) with a warm greeting, valuable content drawn from the transcript, 1-2 clear CTAs that connect to ${offers}, and a personality-filled sign-off. Short paragraphs (2-3 sentences). Sound conversational — like writing to one person, not a broadcast list.

6. "carousel": An object with:
   - "title": overall carousel title (5-8 words) that speaks to ${audience}'s specific desires or pain points
   - "slides": array of 6 slide objects, each with "title" (3-7 words, bold statement) and "body" (15-40 words, explanation). Slide 1 is the hook/cover — must stop ${audience} from scrolling. Slide 6 is the CTA/conclusion — naturally connect to ${offers}.

7. "blog_article": An object with:
   - "title": compelling blog post title (8-15 words, SEO-friendly but human-first) that ${audience} would click on
   - "content": full blog post (800-1200 words) with: a hook-driven introduction that names ${audience}'s specific pain point, 4-6 body sections with H2 subheadings (use "## " prefix), actionable takeaways that feel earned from experience in ${niche}, and a conclusion with a natural CTA connected to ${offers}. The ${tone} brand voice must be consistent from first word to last.

===== CRITICAL CONSTRAINTS =====

VIOLATING ANY OF THESE MAKES THE OUTPUT UNUSABLE:

1. TONE CONSISTENCY: All content across all formats MUST use the same brand voice: "${tone}". A TikTok idea and a blog article from this batch should feel like they came from the exact same person. Zero drift between pieces. Not one sentence should sound generic.

2. ${hasStrongBrand ? `NICHE AUTHENTICITY: Reference ${niche} naturally throughout. Use domain-specific language, insider terminology, and reference points that signal deep expertise — not surface-level knowledge. Every piece should make ${audience} think "this person really knows ${niche}."` : 'DOMAIN EXPERTISE: Use domain-specific language and reference points that signal real expertise. No surface-level advice anyone could give.'}

3. AUDIENCE PRECISION: Every line is written for ${audience}. Use their language. Name their specific problems. Reference their aspirations. If a ${audience} reads any piece and doesn't feel seen, it fails.

4. OFFER INTEGRATION: Naturally weave in ${offers} where relevant — never hard-sell. The offer should feel like a helpful next step, not a pitch. If the transcript naturally connects to what the brand offers, make that connection. If not, don't force it.

5. CROSS-FORMAT COHERENCE: The TikTok ideas, Reels concepts, captions, newsletter, carousel, and blog should form a coherent content ecosystem. Different angles on the same core insights. Same voice. Same expertise. Different formats for different moments in ${audience}'s day.

6. ZERO GENERIC CONTENT: No placeholder text like "[Your name]" or "[insert...]". No generic statements that could apply to any brand. No "In today's fast-paced world..." openings. Every word must feel specific to THIS brand.

7. VALID JSON: The JSON must be valid and complete — all array/item counts exact as specified. No markdown fences. No text outside the JSON object.`;
}

function generateFallbackBatch(transcript: string, brandProfile: any): BatchResult {
  const niche = brandProfile.niche || 'your niche';
  const audience = brandProfile.audience || 'your audience';
  const tone = brandProfile.tone_of_voice || brandProfile.tone || 'friendly';
  const offers = brandProfile.key_offers || brandProfile.offers || 'what you offer';

  // Extract first ~300 chars for context
  const excerpt = transcript.slice(0, 300).replace(/"/g, '').replace(/\n/g, ' ');

  // Generate a variety of hook styles for TikTok ideas
  const tiktokHookStyles = [
    `The one thing about ${niche} that changed everything for me. If you're ${audience}, you need to hear this.`,
    `Stop making this mistake in ${niche}. I see ${audience} do it daily — here's the fix.`,
    `What I wish I knew before starting in ${niche} (as someone who works with ${audience}).`,
    `The uncomfortable truth about ${niche} that nobody's talking about. Your audience needs this.`,
    `How I'd start from zero in ${niche} in 2024. No fluff — just what actually works for ${audience}.`,
    `This ${niche} mindset shift doubled my results. Most ${audience} ignore it.`,
    `The framework I use to create content that actually converts ${audience}. Steal this.`,
    `3 years in ${niche} taught me this one thing. Wish someone told me on day 1.`,
    `Why ${audience} struggle with consistency (and the simple system that fixes it).`,
    `The ${niche} strategy that took me from invisible to booked. ${audience} — pay attention.`,
  ];

  // Generate diverse Reels hooks  
  const reelsHooks = [
    `The #1 myth about ${niche}`,
    `This is why ${audience} stay stuck`,
    `Stop doing this in ${niche}`,
    `What actually works for ${audience}`,
    `I tried the trending ${niche} advice`,
    `${niche} in 60 seconds`,
    `The truth about ${offers}`,
    `${audience} — watch this before you post`,
    `How I grew in ${niche}`,
    `The ${niche} secret nobody shares`,
  ];

  return {
    tiktok_ideas: Array.from({ length: 30 }, (_, i) => {
      const hook = tiktokHookStyles[i % tiktokHookStyles.length];
      const variant = i < tiktokHookStyles.length ? '' : ` (Angle #${Math.floor(i / tiktokHookStyles.length) + 1})`;
      return `${hook}${variant}`;
    }),
    reels_concepts: Array.from({ length: 10 }, (_, i) => ({
      hook: reelsHooks[i],
      visual: i % 2 === 0
        ? `You speaking directly to camera with ${niche}-related b-roll cuts`
        : `Split screen: you explaining while showing examples from ${niche}`,
      caption: `The ${tone} truth about ${niche} that most ${audience} overlook — this one shift can change everything. Drop a 💡 if you're taking action on this.${i % 3 === 0 ? ` Want help with this? ${offers} was built for exactly this.` : ''}`,
    })),
    captions: Array.from({ length: 20 }, (_, i) => {
      if (i % 4 === 0) {
        return `Hot take: the biggest thing holding ${audience} back in ${niche} isn't skill — it's perfectionism. Ship the messy draft. Iterate. That's the whole game. 🔥`;
      }
      if (i % 4 === 1) {
        return `Here's what I've learned from working with ${audience} in ${niche}: the ones who win aren't the most talented. They're the most consistent. And consistency comes from systems, not willpower. Build the system. Show up. Trust the process.`;
      }
      if (i % 4 === 2) {
        return `One thing I wish every ${audience} understood about ${niche}: your unique perspective IS your competitive advantage. Nobody has your exact combination of experience, perspective, and personality. Stop trying to sound like everyone else.`;
      }
      return `Quick value drop for my ${audience} 💫\n\n1. Done > perfect\n2. Consistency > intensity\n3. Your voice > the "right" way\n\nThat's it. That's the ${niche} playbook.\n\nSave this for later.`;
    }),
    hooks: Array.from({ length: 50 }, (_, i) => {
      const hookVariants = [
        `"I wasted 3 years trying to master ${niche}. Here's what I wish I knew on day one."`,
        `"Most ${audience} are making this ONE mistake right now — and it's costing them."`,
        `"The ${niche} secret nobody talks about but everyone should know."`,
        `"What if everything you've been told about ${niche} is wrong?"`,
        `"I asked 100 successful ${audience} their #1 strategy. The answer surprised me."`,
        `"Stop doing THIS if you want to grow in ${niche}."`,
        `"The exact framework I use to create ${niche} content that actually converts."`,
        `"3 things I stopped doing that changed my ${niche} game overnight."`,
        `"Why ${audience} burn out (and the counterintuitive fix)."`,
        `"The uncomfortable truth about ${offers} that ${audience} need to hear."`,
        `"How I'd grow from zero in ${niche} knowing what I know now."`,
        `"The ${niche} advice that's holding ${audience} back in 2024."`,
        `"One sentence that changed how I think about ${niche} forever."`,
        `"Why being 'good' at ${niche} isn't enough anymore."`,
        `"The difference between ${audience} who grow and those who stay stuck."`,
        `"I tracked every ${niche} strategy for 12 months. Here's what actually worked."`,
      ];
      return hookVariants[i % hookVariants.length];
    }),
    email_newsletter: {
      subject: `The ${niche} insight that changed everything`,
      body: `Hey there,

I recently shared something about ${niche} that really resonated with ${audience}. So I wanted to expand on it here — because this one shift has been a game-changer.

When I first started in ${niche}, I made every mistake in the book. But the biggest one? Overthinking. I'd spend hours perfecting details that didn't matter, while ignoring the fundamentals that actually move the needle for ${audience}.

Here are 3 things I've learned the hard way:

1. **Start before you're ready.** The people you admire in ${niche} didn't wait until they felt qualified. They started messy and improved along the way. Your ${audience} don't need perfection — they need your perspective, now.

2. **Consistency is the only real competitive advantage.** Anyone can have one great day. Very few show up every single week for years. The compounding effect of consistent output in ${niche} is genuinely life-changing — but you have to stay in the game long enough to see it compound.

3. **Listen more than you talk.** Your audience is telling you exactly what they want — in comments, DMs, questions, objections. That's pure content gold. The best ${niche} creators aren't the most creative — they're the best listeners.

Ready to take action? Pick ONE of these and implement it today — not next week, not when you feel ready. Today.

If you're looking for more structured support, ${offers} is designed specifically for ${audience} who are done spinning their wheels and ready for real momentum.

Talk soon,
[KREO Demo]

P.S. Forward this to a ${audience} friend who needs to hear it. And if you reply with your biggest ${niche} challenge, I'll send you my best resource for it.`,
    },
    carousel: {
      title: `7 Truths About ${niche} Every ${audience} Should Know`,
      slides: [
        { title: 'Perfection is the real enemy', body: `Waiting until everything is perfect means you never start. Your ${audience} need your voice right now — not in 6 months when you feel "ready."` },
        { title: 'Consistency beats intensity', body: 'Showing up daily for 30 minutes beats a once-a-month marathon. Every single time. Build the daily habit — let compounding do the rest.' },
        { title: 'Your story is your edge', body: `Nobody has your exact journey through ${niche}. Your unique perspective is literally your biggest competitive advantage. Don't hide it.` },
        { title: 'Simplicity converts', body: `Complex strategies confuse ${audience}. Simple, clear frameworks build trust and drive action. The best ${niche} advice fits on a napkin.` },
        { title: 'Feedback is free research', body: `Every comment, DM, and objection from ${audience} is market research you'd pay thousands for. Pay attention and iterate relentlessly.` },
        { title: 'Start where you are', body: `You don't need more credentials or a bigger following. ${audience} are waiting for exactly what you have. Ready to take action? ${offers} was built for this moment.` },
      ],
    },
    blog_article: {
      title: `${topicFromTranscript(transcript, niche)}: What Every ${audience} Needs to Know`,
      content: buildFallbackBlogContent(transcript, niche, audience, tone, offers),
    },
  };
}

function topicFromTranscript(transcript: string, niche: string): string {
  // Try to extract a sensible topic from the transcript or fall back to niche
  const firstSentence = transcript.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 10 && firstSentence.length < 100) {
    return `The Complete Guide to ${firstSentence.slice(0, 60)}`;
  }
  return `The Complete Guide to ${niche}`;
}

function buildFallbackBlogContent(
  transcript: string,
  niche: string,
  audience: string,
  tone: string,
  offers: string
): string {
  return `## Introduction

In ${niche}, there's no shortage of advice. But most of it misses the mark — especially for ${audience}. After spending years in this space, I've learned that the real keys to success are simpler than most people think. And they rarely get talked about.

This guide breaks down what actually works — not the theory, not the hype, but the practical, repeatable strategies that move the needle.

## The Problem with Most ${niche} Advice

The internet is flooded with "growth hacks" and "secret formulas." But here's the truth nobody wants to admit: there are no secrets. Just fundamentals executed consistently over time by people who were willing to look foolish at the beginning.

The real problem? Most ${audience} are drowning in information but starving for clarity. Every guru has a different "proven system." Every platform has a new algorithm change to panic about. It's exhausting — and it keeps you stuck in learning mode instead of doing mode.

## Strategy #1: Know Your Audience Better Than They Know Themselves

Your ${audience} aren't just demographics on a persona doc. They're real people with real problems, real desires, and real fears. The better you understand what keeps them up at night and what they secretly dream about, the more magnetic your content becomes.

This isn't about surveys or analytics dashboards. It's about paying obsessive attention to comments, DMs, questions, and the exact language people use when they describe their struggles. That language? That's your content gold.

## Strategy #2: Build Systems That Make Consistency Inevitable

One viral post won't change your business. But a system that produces quality content every single week for two years? That changes everything.

The ${audience} who succeed aren't relying on inspiration. They've built workflows — batch creation days, content calendars, repurposing pipelines — that make showing up the path of least resistance. When the system does the heavy lifting, motivation becomes optional.

## Strategy #3: Repurpose Ruthlessly

Every piece of long-form content you create contains dozens of shorter pieces waiting to be extracted. A single video becomes tweets, carousels, reels, newsletters, and blog posts. A single blog post becomes social captions, email content, and thread ideas.

Stop creating from scratch every time. Start treating your content like a renewable resource. Extract. Adapt. Distribute. This is how the most prolific ${audience} in ${niche} seem to be everywhere at once.

## Strategy #4: Pick One Platform and Dominate It

Spreading yourself across five platforms dilutes your effort and your energy. Pick one — the one where your ${audience} already spends the most time — and commit to it for 12 months. Master its format. Understand its rhythm. Build a real presence before expanding.

Depth beats breadth every single time. One strong platform is worth more than five neglected ones.

## Strategy #5: Measure What Actually Matters

Vanity metrics lie. Follower count. Likes. Impressions that don't convert. These numbers feel good but don't pay the bills.

Focus instead on: engagement rate (are people actually interacting?), conversion rate (are people taking the next step?), email signups (are you building an asset you own?), and revenue per piece of content (is this actually driving your business forward?).

## Conclusion

${niche} success isn't about finding a magic bullet. It never was. It's about showing up consistently, delivering genuine value, and getting a little better every single day — while everyone else is still looking for shortcuts.

Pick one strategy from this guide. Implement it this week. Not next month. Not when you "feel ready." This week.

If you're looking for personalized guidance tailored specifically to ${audience}, ${offers} was built for exactly this moment. Let's make it happen.`;
}

// POST /api/generate/batch — batch generate all content types from a transcript
router.post('/', checkUsageLimit, async (req: AuthRequest, res: Response) => {
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

    const effectiveTone = brandProfile.tone_of_voice || brandProfile.tone || 'Friendly and professional';
    const niche = brandProfile.niche || 'their niche';
    const audience = brandProfile.audience || 'their audience';

    let batchResult: BatchResult;

    if (oai) {
      try {
        const response = await oai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are an expert content strategist and copywriter who specializes in ${niche}. You repurpose long-form content into multiple formats for ${audience}. Your content voice is: ${effectiveTone}. Every piece you write — from a TikTok idea to a full blog article — must feel like it came from the SAME brand. Consistent tone. Consistent expertise. Consistent audience understanding. Always respond with valid JSON only — no markdown, no explanations, no text outside the JSON object. Never write generic content.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
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

    // Increment batch generation counter
    try {
      const db2 = await getDb();
      db2.run(
        `UPDATE users SET batch_generation_count = COALESCE(batch_generation_count, 0) + 1 WHERE id = ?`,
        [req.userId!]
      );
      saveDb();
    } catch (e) {
      console.error('Failed to increment batch count:', e);
    }

    // Increment usage count after successful batch generation (counts as 1)
    await incrementUsage(req.userId!);
  } catch (err) {
    console.error('Batch generate error:', err);
    res.status(500).json({ error: 'Failed to generate batch content' });
  }
});

export default router;
