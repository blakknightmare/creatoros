import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const STEPS = ['Describe', 'More Context', 'Vibe', 'Review'];
const API_BASE = '/api';

interface ParsedProfile {
  niche: string;
  audience: string;
  tone_of_voice: string;
  goals: string;
  key_offers: string;
}

const TONE_OPTIONS = [
  { value: 'friendly/casual', label: '😊 Friendly / Casual', desc: 'Warm, approachable, conversational' },
  { value: 'professional/formal', label: '💼 Professional / Formal', desc: 'Polished, authoritative, business-like' },
  { value: 'bold/edgy', label: '🔥 Bold / Edgy', desc: 'Daring, provocative, stands out' },
  { value: 'inspirational', label: '✨ Inspirational', desc: 'Uplifting, motivational, aspirational' },
  { value: 'educational', label: '📚 Educational', desc: 'Informative, teaching, knowledge-first' },
  { value: 'humorous', label: '😂 Humorous', desc: 'Funny, witty, entertaining' },
];

export default function Onboarding() {
  const { token, setHasBrandProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [description, setDescription] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [selectedTone, setSelectedTone] = useState('');
  const [parsedProfile, setParsedProfile] = useState<ParsedProfile | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Editable fields for step 4
  const [editNiche, setEditNiche] = useState('');
  const [editAudience, setEditAudience] = useState('');
  const [editToneOfVoice, setEditToneOfVoice] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const [editKeyOffers, setEditKeyOffers] = useState('');

  const canNextStep = (): boolean => {
    if (step === 0) return description.trim().length > 0;
    if (step === 1) return true; // optional
    if (step === 2) return selectedTone !== '';
    return true;
  };

  const handleParse = async () => {
    setIsParsing(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/brand-profile/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description, extraContext, tonePreference: selectedTone }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to parse');
      }

      const data = await res.json();
      setParsedProfile(data.profile);
      setEditNiche(data.profile.niche);
      setEditAudience(data.profile.audience);
      setEditToneOfVoice(data.profile.tone_of_voice);
      setEditGoals(data.profile.goals);
      setEditKeyOffers(data.profile.key_offers);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/brand-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          raw_description: `${description}\n\n${extraContext}`.trim(),
          niche: editNiche,
          audience: editAudience,
          tone_of_voice: editToneOfVoice,
          goals: editGoals,
          key_offers: editKeyOffers,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      setHasBrandProfile(true);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 2) {
      handleParse();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">CO</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Set up your brand</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tell us about your business — takes about 2 minutes.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${i < step ? 'bg-brand-600 text-white' : ''}
                  ${i === step ? 'bg-brand-600 text-white ring-4 ring-brand-100' : ''}
                  ${i > step ? 'bg-slate-200 text-slate-500' : ''}
                `}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  i <= step ? 'text-brand-700' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 hidden sm:block ${i < step ? 'bg-brand-600' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          {/* Error banner */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
              <button onClick={() => setError('')} className="ml-2 underline hover:no-underline">Dismiss</button>
            </div>
          )}

          {/* Step 0: Describe */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Describe your business in a sentence</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Just one sentence is enough — the AI will do the rest.
                </p>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. I'm a fitness coach who helps busy dads lose weight and build muscle in 30 minutes a day."
                className="w-full h-24 px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none text-sm"
                autoFocus
              />
              <div className="flex flex-wrap gap-2">
                {[
                  "I'm a fitness coach who helps busy dads lose weight.",
                  "I run a bakery that makes artisanal sourdough bread.",
                  "I'm a freelance designer helping SaaS startups with branding.",
                  "I teach piano to kids and adults online.",
                ].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setDescription(ex)}
                    className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-brand-50 hover:text-brand-700 transition-colors border border-transparent hover:border-brand-200"
                  >
                    {ex.length > 55 ? ex.slice(0, 55) + '…' : ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: More context */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Tell us more about what you do</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Share additional context about your business — your story, your products, your audience. This helps the AI understand your brand better.
                </p>
              </div>
              <textarea
                value={extraContext}
                onChange={(e) => setExtraContext(e.target.value)}
                placeholder="e.g. I started coaching 3 years ago after losing 40 lbs myself. I specialize in home workouts that don't need equipment. My clients are mostly dads in their 30s–40s who have 30 minutes or less to work out. I offer 1:1 coaching, group programs, and a meal planning app."
                className="w-full h-36 px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none text-sm"
                autoFocus
              />
              <p className="text-xs text-slate-400">This is optional — you can skip if you're happy with your one-liner.</p>
            </div>
          )}

          {/* Step 2: Tone */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">What's your vibe?</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Choose the tone that best matches your brand voice. This will influence all future content.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TONE_OPTIONS.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setSelectedTone(tone.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedTone === tone.value
                        ? 'border-brand-500 bg-brand-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-900">{tone.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{tone.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && parsedProfile && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Review your brand profile</h2>
                <p className="text-sm text-slate-500 mt-1">
                  The AI has parsed your description. Edit any field that needs tweaking — this is the profile every future generation will use.
                </p>
              </div>

              <div className="space-y-4">
                {/* Niche */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Niche / Topic</span>
                  <input
                    value={editNiche}
                    onChange={(e) => setEditNiche(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                </label>

                {/* Audience */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Target Audience</span>
                  <input
                    value={editAudience}
                    onChange={(e) => setEditAudience(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                </label>

                {/* Tone */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tone of Voice</span>
                  <input
                    value={editToneOfVoice}
                    onChange={(e) => setEditToneOfVoice(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                </label>

                {/* Goals */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Goals</span>
                  <input
                    value={editGoals}
                    onChange={(e) => setEditGoals(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                </label>

                {/* Key Offers */}
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Key Offers</span>
                  <input
                    value={editKeyOffers}
                    onChange={(e) => setEditKeyOffers(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={nextStep}
                disabled={!canNextStep() || isParsing}
                className="px-6 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {isParsing ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Parsing…
                  </span>
                ) : step === 2 ? (
                  'Generate Profile →'
                ) : (
                  'Continue →'
                )}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving…
                  </>
                ) : (
                  'Save & Continue →'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Skip option */}
        {step < 3 && (
          <p className="text-center mt-6 text-sm text-slate-400">
            Want to skip for now?{' '}
            <button
              onClick={() => navigate('/dashboard')}
              className="underline hover:text-slate-600 transition-colors"
            >
              Go to dashboard
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
