import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import LimitModal from '../components/LimitModal';
import { addWatermark } from '../utils/watermark';

const API_BASE = '/api';

interface ContentType {
  id: string;
  label: string;
  platform: string;
}

const TYPE_ICONS: Record<string, string> = {
  instagram: '📸',
  linkedin: '💼',
  x_post: '🐦',
  blog_post: '📝',
  email_newsletter: '📧',
  hooks: '🪝',
  ctas: '🎯',
  hashtags: '#️⃣',
};

const TYPE_COLORS: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-500',
  linkedin: 'from-blue-600 to-blue-400',
  x_post: 'from-slate-800 to-slate-600',
  blog_post: 'from-emerald-600 to-teal-400',
  email_newsletter: 'from-amber-500 to-orange-400',
  hooks: 'from-violet-600 to-purple-400',
  ctas: 'from-rose-600 to-pink-400',
  hashtags: 'from-cyan-600 to-blue-400',
};

interface GenerationResult {
  content: string;
  type: string;
  topic: string;
  brand_profile_used: {
    niche: string;
    audience: string;
    tone: string;
  };
}

export default function Generate() {
  const { token, hasBrandProfile, tier, dailyUsage, refreshUsage } = useAuth();
  const navigate = useNavigate();
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [toneOverride, setToneOverride] = useState('');
  const [length, setLength] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Redirect if no brand profile
  useEffect(() => {
    if (!hasBrandProfile) {
      navigate('/onboarding', { replace: true });
    }
  }, [hasBrandProfile, navigate]);

  // Fetch content types
  useEffect(() => {
    async function fetchTypes() {
      try {
        const res = await fetch(`${API_BASE}/generate/types`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setContentTypes(data.types);
        }
      } catch {
        // ignore
      }
    }
    if (token) fetchTypes();
  }, [token]);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setResult(null);
    setError(null);
    setSaved(false);
    // Set default length based on type
    const lengthDefaults: Record<string, string> = {
      instagram: 'medium',
      linkedin: 'medium',
      x_post: 'short',
      blog_post: 'long',
      email_newsletter: 'medium',
      hooks: 'short',
      ctas: 'short',
      hashtags: 'short',
    };
    setLength(lengthDefaults[typeId] || 'medium');
  };

  const handleGenerate = useCallback(async () => {
    if (!selectedType || !topic.trim()) return;

    setGenerating(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: selectedType,
          topic: topic.trim(),
          tone_override: toneOverride || undefined,
          length: length || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setShowLimitModal(true);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Generation failed');
        return;
      }

      setResult(data);
      // Refresh usage count after successful generation
      await refreshUsage();
    } catch {
      setError('Network error — please try again');
    } finally {
      setGenerating(false);
    }
  }, [selectedType, topic, toneOverride, length, token, refreshUsage]);

  const handleCopy = async () => {
    if (!result) return;
    const watermarked = addWatermark(result.content, tier);
    try {
      await navigator.clipboard.writeText(watermarked);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = watermarked;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: result.type,
          topic: result.topic,
          content: result.content,
        }),
      });

      if (res.ok) {
        setSaved(true);
      }
    } catch {
      // ignore
    }
  };

  if (!hasBrandProfile) {
    return null; // Will redirect
  }

  return (
    <AppLayout>
      <LimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        dailyCount={dailyUsage.count}
      />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Generate Content</h1>
          <p className="text-slate-500 mt-1">
            Select a content type, describe your topic, and get on-brand content instantly.
          </p>
        </div>

        {/* Step 1: Type selector */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">1. Choose content type</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {contentTypes.map((ct) => (
              <button
                key={ct.id}
                onClick={() => handleTypeSelect(ct.id)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${
                  selectedType === ct.id
                    ? 'border-brand-500 bg-brand-50 shadow-sm ring-2 ring-brand-200'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg bg-gradient-to-br ${TYPE_COLORS[ct.id] || 'from-slate-500 to-slate-400'} flex items-center justify-center mb-2 text-lg`}
                >
                  {TYPE_ICONS[ct.id] || '📄'}
                </div>
                <div className="font-medium text-sm text-slate-800">{ct.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">{ct.platform}</div>
                {selectedType === ct.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Content form */}
        {selectedType && (
          <div className="mb-10 animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">2. Describe what you want</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Topic / What to write about <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="topic"
                  rows={3}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Tips for staying consistent with your fitness routine while working a 9-5 job"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tone" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Tone override (optional)
                  </label>
                  <select
                    id="tone"
                    value={toneOverride}
                    onChange={(e) => setToneOverride(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    <option value="">Use brand default</option>
                    <option value="Professional and authoritative">Professional / authoritative</option>
                    <option value="Casual and conversational">Casual / conversational</option>
                    <option value="Inspirational and motivational">Inspirational / motivational</option>
                    <option value="Humorous and witty">Humorous / witty</option>
                    <option value="Educational and informative">Educational / informative</option>
                    <option value="Bold and provocative">Bold / provocative</option>
                    <option value="Warm and empathetic">Warm / empathetic</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="length" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Length
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'short', label: 'Short' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'long', label: 'Long' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setLength(opt.value)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          length === opt.value
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !topic.trim()}
                className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  '⚡ Generate Content'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="ml-3 px-3 py-1.5 text-xs font-medium bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {generating && (
          <div className="mb-10 animate-pulse">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Generating...</h2>
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-4/5" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        )}

        {/* Results */}
        {result && !generating && (
          <div className="mb-10 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-700">Generated Content</h2>
              <div className="flex items-center gap-2">
                {saved && (
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">
                    ✓ Saved to projects
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Brand context badge */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-slate-600">Brand context:</span>
                {result.brand_profile_used.niche && (
                  <span className="bg-white px-2 py-0.5 rounded-full border border-slate-200">{result.brand_profile_used.niche}</span>
                )}
                {result.brand_profile_used.tone && (
                  <span className="bg-white px-2 py-0.5 rounded-full border border-slate-200">{result.brand_profile_used.tone}</span>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="prose prose-sm max-w-none text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {result.content}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    copied
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>

                {!saved && (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    Save to Projects
                  </button>
                )}

                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state for no type selected */}
        {!selectedType && !result && !generating && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center">
            <div className="text-5xl mb-4">👆</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a content type above</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Choose from 8 content types — from Instagram captions to blog posts to email newsletters — and we'll generate on-brand content using your brand profile.
            </p>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
