import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = '/api';

interface ReelConcept {
  hook: string;
  visual: string;
  caption: string;
}

interface CarouselSlide {
  title: string;
  body: string;
}

interface BatchResult {
  tiktok_ideas: string[];
  reels_concepts: ReelConcept[];
  captions: string[];
  hooks: string[];
  email_newsletter: { subject: string; body: string };
  carousel: { title: string; slides: CarouselSlide[] };
  blog_article: { title: string; content: string };
}

interface BatchSummary {
  tiktok_ideas: number;
  reels_concepts: number;
  captions: number;
  hooks: number;
  email_newsletter: number;
  carousel_slides: number;
  blog_article: number;
  total_pieces: number;
}

type TabId = 'tiktok' | 'reels' | 'captions' | 'hooks' | 'newsletter' | 'carousel' | 'blog';

interface Tab {
  id: TabId;
  label: string;
  count: number;
  icon: string;
}

const SAMPLE_TRANSCRIPT = `You know, I've been thinking a lot about content creation lately. And here's the thing that keeps coming up — most creators are working way too hard for way too little return. They're burning out creating one piece of content at a time, for one platform at a time.

Here's what I've learned after years of doing this: your content should work harder than you do. Every single piece of long-form content you create — whether it's a YouTube video, a podcast episode, or even a long blog post — contains dozens of smaller content pieces hiding inside it.

Think about it. A 20-minute video probably has 5-7 distinct points. Each of those points can become a Twitter thread, an Instagram carousel, a LinkedIn post, or several TikTok videos. Your Q&A section can spawn weeks of social content. Your personal stories can become newsletter material.

The system I use is simple: Create once, distribute everywhere. I call it the Hub and Spoke model. Your long-form content is the hub — the central piece. And from that hub, spokes go out to every platform, in the format that platform loves most.

TikTok wants short, punchy hooks with a quick payoff. LinkedIn wants thought leadership with a professional tone. Instagram wants visually-driven concepts with engaging captions. Email wants a personal, direct connection with your most engaged audience.

The magic isn't in creating more — it's in extracting more from what you already create. When I switched to this model, my content output 5x'd while my creation time stayed the same.

Let me give you a concrete example. Last month, I recorded a 25-minute video about productivity tips for creators. From that single video, I got: 18 TikTok ideas, 7 Instagram Reels, 12 LinkedIn posts, a full email newsletter, a blog article, and about 40 different social media hooks. All from one recording session.

The key is having a system. You finish your long-form content, and immediately — while the ideas are still fresh — you go through a deconstruction process. What were the strongest points? What stories resonated? What questions did you answer? Write them down. Then map each to the platform it fits best.

And don't try to be everywhere. Pick 3-4 platforms where your audience actually hangs out and focus there. Better to dominate on a few than be mediocre on many.

One more thing: consistency beats perfection. I'd rather you publish good-enough content every day than perfect content once a month. Your audience needs to hear from you regularly. The algorithm rewards consistency. And honestly, most of the things you obsess over — the exact wording, the perfect hook — your audience won't even notice.

So here's your action step: take your next piece of long-form content and challenge yourself to extract 20 pieces of short-form content from it. Just 20. See what happens. I guarantee you'll be surprised by how much gold is hiding in there.

That's it for today. If this resonated, share it with a creator friend who needs to hear it. And if you want my full content repurposing framework, it's linked below. Talk soon!`;

const PROGRESS_MESSAGES = [
  'Analyzing transcript content...',
  'Extracting key themes and insights...',
  'Generating TikTok ideas...',
  'Crafting Instagram Reels concepts...',
  'Writing social media captions...',
  'Creating attention-grabbing hooks...',
  'Composing email newsletter...',
  'Building carousel slides...',
  'Writing blog article...',
  'Polishing and refining...',
];

export default function Batch() {
  const { token, hasBrandProfile } = useAuth();
  const navigate = useNavigate();

  // Input state
  const [transcript, setTranscript] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [inputMethod, setInputMethod] = useState<'paste' | 'url'>('paste');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Results state
  const [result, setResult] = useState<BatchResult | null>(null);
  const [summary, setSummary] = useState<BatchSummary | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<TabId>('tiktok');
  const [editingPiece, setEditingPiece] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [copiedPiece, setCopiedPiece] = useState<string | null>(null);
  const [savedPieces, setSavedPieces] = useState<Set<string>>(new Set());
  const [savingAll, setSavingAll] = useState(false);
  const [allSaved, setAllSaved] = useState(false);

  // Redirect if no brand profile
  useEffect(() => {
    if (!hasBrandProfile) {
      navigate('/onboarding', { replace: true });
    }
  }, [hasBrandProfile, navigate]);

  // Progress animation
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setProgressIndex((prev) => (prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [generating]);

  const handleUseSample = () => {
    setTranscript(SAMPLE_TRANSCRIPT);
    setYoutubeUrl('');
    setInputMethod('paste');
  };

  const handleGenerate = async () => {
    const hasTranscript = inputMethod === 'paste' && transcript.trim().length > 0;
    if (!hasTranscript) {
      setError('Please paste a transcript or provide a YouTube URL.');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);
    setSummary(null);
    setProgressIndex(0);
    setAllSaved(false);
    setSavedPieces(new Set());

    try {
      const res = await fetch(`${API_BASE}/generate/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transcript: transcript.trim(),
          youtubeUrl: youtubeUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Batch generation failed');
        return;
      }

      setResult(data.result);
      setSummary(data.summary);
    } catch {
      setError('Network error — please try again');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPiece(key);
      setTimeout(() => setCopiedPiece(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedPiece(key);
      setTimeout(() => setCopiedPiece(null), 2000);
    }
  };

  const handleSavePiece = async (contentType: string, topic: string, content: string, key: string) => {
    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type: contentType, topic, content }),
      });
      if (res.ok) {
        setSavedPieces((prev) => new Set(prev).add(key));
      }
    } catch {
      // ignore
    }
  };

  const handleSaveAll = async () => {
    if (!result) return;
    setSavingAll(true);

    const pieces: { type: string; topic: string; content: string; key: string }[] = [];

    // Collect all pieces
    result.tiktok_ideas.forEach((idea, i) => {
      pieces.push({ type: 'tiktok_idea', topic: `TikTok Idea #${i + 1}`, content: idea, key: `tiktok-${i}` });
    });
    result.reels_concepts.forEach((reel, i) => {
      pieces.push({
        type: 'reels_concept',
        topic: `Reels Concept #${i + 1}: ${reel.hook}`,
        content: `Hook: ${reel.hook}\n\nVisual: ${reel.visual}\n\nCaption: ${reel.caption}`,
        key: `reel-${i}`,
      });
    });
    result.captions.forEach((caption, i) => {
      pieces.push({ type: 'caption', topic: `Social Caption #${i + 1}`, content: caption, key: `caption-${i}` });
    });
    result.hooks.forEach((hook, i) => {
      pieces.push({ type: 'hook', topic: `Hook #${i + 1}`, content: hook, key: `hook-${i}` });
    });
    pieces.push({
      type: 'email_newsletter',
      topic: result.email_newsletter.subject,
      content: `Subject: ${result.email_newsletter.subject}\n\n${result.email_newsletter.body}`,
      key: 'newsletter',
    });
    result.carousel.slides.forEach((slide, i) => {
      pieces.push({
        type: 'carousel_slide',
        topic: `Carousel: ${result.carousel.title} (Slide ${i + 1})`,
        content: `${slide.title}\n\n${slide.body}`,
        key: `carousel-${i}`,
      });
    });
    pieces.push({
      type: 'blog_article',
      topic: result.blog_article.title,
      content: `# ${result.blog_article.title}\n\n${result.blog_article.content}`,
      key: 'blog',
    });

    // Save sequentially — in batches to not hammer the server
    const newSaved = new Set(savedPieces);
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      try {
        const res = await fetch(`${API_BASE}/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ type: piece.type, topic: piece.topic, content: piece.content }),
        });
        if (res.ok) {
          newSaved.add(piece.key);
          setSavedPieces(new Set(newSaved));
        }
      } catch {
        // continue
      }
    }

    setAllSaved(true);
    setSavingAll(false);
  };

  const startEdit = (key: string, value: string) => {
    setEditingPiece(key);
    setEditValue(value);
  };

  const saveEdit = (key: string) => {
    if (!result) return;
    // The key format is "tab-index" — update the appropriate array
    const [tab, idxStr] = key.split('-');
    const idx = parseInt(idxStr, 10);

    setResult((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      switch (tab) {
        case 'tiktok':
          updated.tiktok_ideas = [...prev.tiktok_ideas];
          updated.tiktok_ideas[idx] = editValue;
          break;
        case 'reel':
          updated.reels_concepts = [...prev.reels_concepts];
          // For reels, we edit the caption field (full object editing is complex)
          updated.reels_concepts[idx] = { ...prev.reels_concepts[idx], caption: editValue };
          break;
        case 'caption':
          updated.captions = [...prev.captions];
          updated.captions[idx] = editValue;
          break;
        case 'hook':
          updated.hooks = [...prev.hooks];
          updated.hooks[idx] = editValue;
          break;
        case 'newsletter':
          updated.email_newsletter = { ...prev.email_newsletter, body: editValue };
          break;
        case 'carousel':
          updated.carousel = { ...prev.carousel, slides: [...prev.carousel.slides] };
          updated.carousel.slides[idx] = { ...prev.carousel.slides[idx], body: editValue };
          break;
        case 'blog':
          updated.blog_article = { ...prev.blog_article, content: editValue };
          break;
      }
      return updated;
    });

    setEditingPiece(null);
    setEditValue('');
  };

  const tabs: Tab[] = result ? [
    { id: 'tiktok', label: 'TikTok Ideas', count: summary?.tiktok_ideas || 0, icon: '🎵' },
    { id: 'reels', label: 'Reels Concepts', count: summary?.reels_concepts || 0, icon: '📱' },
    { id: 'captions', label: 'Captions', count: summary?.captions || 0, icon: '✍️' },
    { id: 'hooks', label: 'Hooks', count: summary?.hooks || 0, icon: '🪝' },
    { id: 'newsletter', label: 'Email Newsletter', count: summary?.email_newsletter || 0, icon: '📧' },
    { id: 'carousel', label: 'Carousel', count: summary?.carousel_slides || 0, icon: '🎠' },
    { id: 'blog', label: 'Blog Article', count: summary?.blog_article || 0, icon: '📝' },
  ] : [];

  if (!hasBrandProfile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CO</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-slate-800">CreatorOS</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <Link to="/dashboard" className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              Dashboard
            </Link>
            <Link to="/generate" className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              Generate
            </Link>
            <Link to="/batch" className="px-3 py-1.5 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg">
              Video to Content
            </Link>
            <Link to="/brand-profile" className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              Brand Profile
            </Link>
          </div>
        </div>
        <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
          Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-xl shadow-sm">
              🎬
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Video to Content</h1>
              <p className="text-slate-500 text-sm">One video transcript in, weeks of content out.</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Input — always visible unless results are shown */}
        {!result && !generating && (
          <div className="mb-10">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-700 mb-1">Paste your video transcript</h2>
              <p className="text-sm text-slate-500 mb-5">
                Copy the transcript from your long-form video (YouTube, podcast, webinar) and we'll turn it into
                dozens of short-form content pieces — all on-brand.
              </p>

              {/* Input method toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setInputMethod('paste')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputMethod === 'paste'
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Paste Transcript
                </button>
                <button
                  onClick={() => setInputMethod('url')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputMethod === 'url'
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  YouTube URL
                </button>
              </div>

              {inputMethod === 'paste' ? (
                <div>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={14}
                    placeholder="Paste your video transcript here... (minimum 50 characters)"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y font-mono"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {transcript.length > 0
                          ? `${transcript.length} characters · ~${transcript.split(/\s+/).filter(Boolean).length} words`
                          : 'Paste at least 50 characters'}
                      </span>
                    </div>
                    <button
                      onClick={handleUseSample}
                      className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      ✨ Use sample transcript
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    YouTube transcript extraction is experimental. For best results, paste your transcript directly.
                  </p>
                </div>
              )}
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={inputMethod === 'paste' && transcript.trim().length < 50}
              className="mt-5 w-full py-4 px-6 rounded-xl text-white font-bold text-base bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate All Content
            </button>
          </div>
        )}

        {/* Loading state */}
        {generating && (
          <div className="mb-10">
            <div className="rounded-2xl border border-purple-200 bg-white p-10 shadow-sm">
              <div className="flex flex-col items-center text-center">
                {/* Animated icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-6 animate-pulse">
                  <svg className="w-10 h-10 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>

                <h2 className="text-xl font-semibold text-slate-800 mb-2">Generating your content...</h2>
                <p className="text-slate-500 mb-8 max-w-md">
                  We're analyzing your transcript and creating 7 content types tailored to your brand. This usually takes 30-60 seconds.
                </p>

                {/* Progress steps */}
                <div className="w-full max-w-md space-y-2">
                  {PROGRESS_MESSAGES.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-all duration-500 ${
                        i < progressIndex
                          ? 'text-green-700 bg-green-50'
                          : i === progressIndex
                          ? 'text-purple-700 bg-purple-50 font-medium'
                          : 'text-slate-300'
                      }`}
                    >
                      {i < progressIndex ? (
                        <svg className="w-4 h-4 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : i === progressIndex ? (
                        <svg className="w-4 h-4 flex-shrink-0 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <div className="w-4 h-4 flex-shrink-0 rounded-full border-2 border-slate-200" />
                      )}
                      <span>{msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !generating && (
          <div className="animate-in fade-in duration-300">
            {/* Summary bar + Save All */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-5 rounded-2xl border border-green-200 bg-green-50">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {summary?.total_pieces || 0} pieces generated from your transcript
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {summary?.tiktok_ideas} TikTok ideas · {summary?.reels_concepts} Reels · {summary?.captions} Captions · {summary?.hooks} Hooks · Newsletter · Carousel · Blog Article
                </p>
              </div>
              <div className="flex gap-3">
                {!allSaved ? (
                  <button
                    onClick={handleSaveAll}
                    disabled={savingAll}
                    className="px-5 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                  >
                    {savingAll ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving {summary?.total_pieces} pieces...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Save All to Projects
                      </>
                    )}
                  </button>
                ) : (
                  <span className="px-5 py-2.5 text-sm font-semibold bg-green-100 text-green-700 rounded-xl flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    All saved!
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 mb-6 pb-2 border-b border-slate-200 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="space-y-4">
              {/* TikTok Ideas */}
              {activeTab === 'tiktok' && result.tiktok_ideas.map((idea, i) => {
                const key = `tiktok-${i}`;
                const isEditing = editingPiece === key;
                const isCopied = copiedPiece === key;
                const isSaved = savedPieces.has(key);

                return (
                  <PieceCard
                    key={key}
                    index={i + 1}
                    label="TikTok Idea"
                    content={isEditing ? editValue : idea}
                    isEditing={isEditing}
                    editValue={editValue}
                    onEditChange={setEditValue}
                    onStartEdit={() => startEdit(key, idea)}
                    onSaveEdit={() => saveEdit(key)}
                    onCancelEdit={() => setEditingPiece(null)}
                    isCopied={isCopied}
                    isSaved={isSaved}
                    onCopy={() => handleCopy(idea, key)}
                    onSave={() => handleSavePiece('tiktok_idea', `TikTok Idea #${i + 1}`, idea, key)}
                  />
                );
              })}

              {/* Reels Concepts */}
              {activeTab === 'reels' && result.reels_concepts.map((reel, i) => {
                const key = `reel-${i}`;
                const isCopied = copiedPiece === key;
                const isSaved = savedPieces.has(key);
                const fullContent = `Hook: ${reel.hook}\n\nVisual: ${reel.visual}\n\nCaption: ${reel.caption}`;
                const isEditing = editingPiece === key;

                return (
                  <div key={key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reels Concept #{i + 1}</span>
                      <div className="flex items-center gap-1.5">
                        {isCopied ? (
                          <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">✓ Copied</span>
                        ) : (
                          <button onClick={() => handleCopy(fullContent, key)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Copy">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </button>
                        )}
                        {isSaved ? (
                          <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">✓ Saved</span>
                        ) : (
                          <button onClick={() => handleSavePiece('reels_concept', `Reels Concept #${i + 1}: ${reel.hook}`, fullContent, key)} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Save to Projects">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-semibold text-purple-600">Hook:</span>
                        {isEditing ? (
                          <div className="flex gap-2 mt-1">
                            <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={2} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                            <button onClick={() => saveEdit(key)} className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium">Save</button>
                            <button onClick={() => setEditingPiece(null)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">Cancel</button>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-700 mt-0.5 font-medium">{reel.hook}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-blue-600">Visual:</span>
                        <p className="text-sm text-slate-600 mt-0.5">{reel.visual}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-pink-600">Caption:</span>
                        <p className="text-sm text-slate-600 mt-0.5">{reel.caption}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Captions */}
              {activeTab === 'captions' && result.captions.map((caption, i) => (
                <PieceCard
                  key={`caption-${i}`}
                  index={i + 1}
                  label="Caption"
                  content={caption}
                  isEditing={editingPiece === `caption-${i}`}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onStartEdit={() => startEdit(`caption-${i}`, caption)}
                  onSaveEdit={() => saveEdit(`caption-${i}`)}
                  onCancelEdit={() => setEditingPiece(null)}
                  isCopied={copiedPiece === `caption-${i}`}
                  isSaved={savedPieces.has(`caption-${i}`)}
                  onCopy={() => handleCopy(caption, `caption-${i}`)}
                  onSave={() => handleSavePiece('caption', `Social Caption #${i + 1}`, caption, `caption-${i}`)}
                />
              ))}

              {/* Hooks */}
              {activeTab === 'hooks' && result.hooks.map((hook, i) => (
                <PieceCard
                  key={`hook-${i}`}
                  index={i + 1}
                  label="Hook"
                  content={hook}
                  isEditing={editingPiece === `hook-${i}`}
                  editValue={editValue}
                  onEditChange={setEditValue}
                  onStartEdit={() => startEdit(`hook-${i}`, hook)}
                  onSaveEdit={() => saveEdit(`hook-${i}`)}
                  onCancelEdit={() => setEditingPiece(null)}
                  isCopied={copiedPiece === `hook-${i}`}
                  isSaved={savedPieces.has(`hook-${i}`)}
                  onCopy={() => handleCopy(hook, `hook-${i}`)}
                  onSave={() => handleSavePiece('hook', `Hook #${i + 1}`, hook, `hook-${i}`)}
                />
              ))}

              {/* Email Newsletter */}
              {activeTab === 'newsletter' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Newsletter</span>
                    <div className="flex items-center gap-1.5">
                      {copiedPiece === 'newsletter' ? (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">✓ Copied</span>
                      ) : (
                        <button onClick={() => handleCopy(`Subject: ${result.email_newsletter.subject}\n\n${result.email_newsletter.body}`, 'newsletter')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Copy">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                      )}
                      {savedPieces.has('newsletter') ? (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">✓ Saved</span>
                      ) : (
                        <button onClick={() => handleSavePiece('email_newsletter', result.email_newsletter.subject, `Subject: ${result.email_newsletter.subject}\n\n${result.email_newsletter.body}`, 'newsletter')} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Save to Projects">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 mb-4">
                    <span className="text-xs font-semibold text-amber-700">Subject:</span>
                    <p className="text-sm font-medium text-slate-800">{result.email_newsletter.subject}</p>
                  </div>
                  {editingPiece === 'newsletter' ? (
                    <div className="space-y-2">
                      <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={12} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit('newsletter')} className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium">Save</button>
                        <button onClick={() => setEditingPiece(null)} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed cursor-pointer hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors"
                      onClick={() => startEdit('newsletter', result.email_newsletter.body)}
                      title="Click to edit"
                    >
                      {result.email_newsletter.body}
                    </div>
                  )}
                </div>
              )}

              {/* Carousel */}
              {activeTab === 'carousel' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Carousel</span>
                      <h3 className="text-lg font-semibold text-slate-800 mt-1">{result.carousel.title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {savedPieces.has('carousel-all') ? (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">✓ All slides saved</span>
                      ) : (
                        <button
                          onClick={async () => {
                            for (let i = 0; i < result.carousel.slides.length; i++) {
                              const slide = result.carousel.slides[i];
                              await handleSavePiece('carousel_slide', `Carousel: ${result.carousel.title} (Slide ${i + 1})`, `${slide.title}\n\n${slide.body}`, `carousel-${i}`);
                            }
                            setSavedPieces((prev) => {
                              const next = new Set(prev);
                              result.carousel.slides.forEach((_, i) => next.add(`carousel-${i}`));
                              next.add('carousel-all');
                              return next;
                            });
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                        >
                          Save all slides
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {result.carousel.slides.map((slide, i) => {
                      const key = `carousel-${i}`;
                      return (
                        <div key={key} className="flex gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{slide.title}</p>
                            {editingPiece === key ? (
                              <div className="flex gap-2 mt-1">
                                <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={2} className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                                <button onClick={() => saveEdit(key)} className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium">Save</button>
                                <button onClick={() => setEditingPiece(null)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">Cancel</button>
                              </div>
                            ) : (
                              <p
                                className="text-sm text-slate-600 mt-0.5 cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 -mx-1 transition-colors"
                                onClick={() => startEdit(key, slide.body)}
                                title="Click to edit"
                              >
                                {slide.body}
                              </p>
                            )}
                          </div>
                          <div className="flex items-start gap-1">
                            {copiedPiece === key ? (
                              <span className="text-xs text-green-600">✓</span>
                            ) : (
                              <button onClick={() => handleCopy(`${slide.title}\n\n${slide.body}`, key)} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Copy slide">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Blog Article */}
              {activeTab === 'blog' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blog Article</span>
                    <div className="flex items-center gap-1.5">
                      {copiedPiece === 'blog' ? (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">✓ Copied</span>
                      ) : (
                        <button onClick={() => handleCopy(`# ${result.blog_article.title}\n\n${result.blog_article.content}`, 'blog')} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Copy full article">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                      )}
                      {savedPieces.has('blog') ? (
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">✓ Saved</span>
                      ) : (
                        <button onClick={() => handleSavePiece('blog_article', result.blog_article.title, `# ${result.blog_article.title}\n\n${result.blog_article.content}`, 'blog')} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Save to Projects">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">{result.blog_article.title}</h2>
                  {editingPiece === 'blog' ? (
                    <div className="space-y-2">
                      <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={20} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono" />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit('blog')} className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium">Save edits</button>
                        <button onClick={() => setEditingPiece(null)} className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed cursor-pointer hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors"
                      onClick={() => startEdit('blog', result.blog_article.content)}
                      title="Click to edit"
                    >
                      {result.blog_article.content}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom actions */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => {
                  setResult(null);
                  setSummary(null);
                  setError(null);
                  setGenerating(false);
                  setActiveTab('tiktok');
                  setEditingPiece(null);
                  setSavedPieces(new Set());
                  setAllSaved(false);
                }}
                className="px-6 py-3 text-sm font-semibold bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Start New Batch
              </button>
              <Link
                to="/dashboard"
                className="px-6 py-3 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                View in Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Reusable piece card component for list items
function PieceCard({
  index,
  label,
  content,
  isEditing,
  editValue,
  onEditChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  isCopied,
  isSaved,
  onCopy,
  onSave,
}: {
  index: number;
  label: string;
  content: string;
  isEditing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  isCopied: boolean;
  isSaved: boolean;
  onCopy: () => void;
  onSave: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start gap-3">
        <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 mt-0.5">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex gap-2">
              <textarea
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                rows={3}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-y"
                autoFocus
              />
              <div className="flex flex-col gap-1">
                <button onClick={onSaveEdit} className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium whitespace-nowrap">
                  Save
                </button>
                <button onClick={onCancelEdit} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium whitespace-nowrap">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p
              className="text-sm text-slate-700 leading-relaxed cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5 -mx-1 transition-colors"
              onClick={onStartEdit}
              title="Click to edit"
            >
              {content}
            </p>
          )}
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 mt-3 ml-10">
        {isCopied ? (
          <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Copied
          </span>
        ) : (
          <button onClick={onCopy} className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Copy
          </button>
        )}
        <span className="text-slate-200">·</span>
        {isSaved ? (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Saved
          </span>
        ) : (
          <button onClick={onSave} className="text-xs text-slate-400 hover:text-brand-600 hover:bg-brand-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            Save
          </button>
        )}
        <span className="text-slate-200">·</span>
        <button onClick={onStartEdit} className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Edit
        </button>
      </div>
    </div>
  );
}
