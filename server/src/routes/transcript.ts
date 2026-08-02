import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

// In-memory transcript store (keyed by userId)
const transcriptStore = new Map<number, string>();

// POST /api/transcript — accept transcript text or YouTube URL
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { transcript, youtubeUrl } = req.body;

    // Case 1: transcript text provided directly
    if (transcript && typeof transcript === 'string' && transcript.trim().length > 0) {
      const cleaned = transcript.trim();
      transcriptStore.set(req.userId!, cleaned);
      res.json({
        transcript: cleaned,
        wordCount: cleaned.split(/\s+/).length,
        source: 'pasted',
      });
      return;
    }

    // Case 2: YouTube URL provided
    if (youtubeUrl && typeof youtubeUrl === 'string') {
      const videoId = extractYouTubeVideoId(youtubeUrl);
      if (!videoId) {
        res.status(400).json({ error: 'Invalid YouTube URL. Please provide a valid YouTube video URL.' });
        return;
      }

      try {
        const transcriptText = await extractYouTubeTranscript(videoId);
        transcriptStore.set(req.userId!, transcriptText);
        res.json({
          transcript: transcriptText,
          wordCount: transcriptText.split(/\s+/).length,
          source: 'youtube',
          videoId,
        });
        return;
      } catch (err: any) {
        // YouTube extraction failed — return a clear, helpful error
        res.status(422).json({
          error: "YouTube transcript extraction isn't available yet — please paste your transcript directly.",
          videoId,
          detail: err.message || 'Could not extract transcript from this video.',
        });
        return;
      }
    }

    // Neither provided
    res.status(400).json({ error: 'Either transcript text or youtubeUrl is required.' });
  } catch (err) {
    console.error('Transcript intake error:', err);
    res.status(500).json({ error: 'Failed to process transcript' });
  }
});

// GET /api/transcript — retrieve stored transcript for the current user
router.get('/', (req: AuthRequest, res: Response) => {
  const stored = transcriptStore.get(req.userId!);
  if (!stored) {
    res.json({ transcript: null });
    return;
  }
  res.json({
    transcript: stored,
    wordCount: stored.split(/\s+/).length,
  });
});

function extractYouTubeVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Try URL parsing fallback
  try {
    const parsed = new URL(url);
    const v = parsed.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
  } catch {
    // ignore
  }

  return null;
}

async function extractYouTubeTranscript(videoId: string): Promise<string> {
  // Fetch the YouTube video page
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; KREO/1.0)',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch video page (status ${response.status})`);
  }

  const html = await response.text();

  // Try to find caption track data in the initial player response
  // YouTube stores this in ytInitialPlayerResponse
  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
  if (!playerResponseMatch) {
    throw new Error('Could not find player data on the YouTube page');
  }

  let playerResponse: any;
  try {
    playerResponse = JSON.parse(playerResponseMatch[1]);
  } catch {
    throw new Error('Could not parse YouTube player data');
  }

  const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!captions || !Array.isArray(captions) || captions.length === 0) {
    throw new Error('This video does not have captions/subtitles available');
  }

  // Prefer English, fall back to first available
  let captionUrl: string | null = null;
  const englishTrack = captions.find((t: any) => t.languageCode === 'en');
  if (englishTrack?.baseUrl) {
    captionUrl = englishTrack.baseUrl;
  } else if (captions[0]?.baseUrl) {
    captionUrl = captions[0].baseUrl;
  }

  if (!captionUrl) {
    throw new Error('No transcript URL found');
  }

  // Fetch the actual transcript XML
  const transcriptResponse = await fetch(captionUrl);
  if (!transcriptResponse.ok) {
    throw new Error(`Could not fetch transcript (status ${transcriptResponse.status})`);
  }

  const transcriptXml = await transcriptResponse.text();

  // Parse the XML-like transcript (it's actually XML, not SRT)
  const textMatches = transcriptXml.matchAll(/<text[^>]*>(.*?)<\/text>/g);
  const lines: string[] = [];
  for (const match of textMatches) {
    // Decode HTML entities
    const decoded = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'");
    lines.push(decoded);
  }

  if (lines.length === 0) {
    throw new Error('Transcript was empty or could not be parsed');
  }

  return lines.join(' ');
}

export default router;
