import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';

const API_BASE = '/api';

interface BrandProfile {
  id: number;
  raw_description: string | null;
  niche: string | null;
  audience: string | null;
  tone_of_voice: string | null;
  goals: string | null;
  key_offers: string | null;
  updated_at: string | null;
  created_at: string | null;
}

type EditableField = 'niche' | 'audience' | 'tone_of_voice' | 'goals' | 'key_offers';

const FIELD_META: Record<EditableField, { label: string; icon: string; placeholder: string }> = {
  niche: { label: 'Niche / Topic', icon: '🎯', placeholder: 'e.g. Fitness coaching for busy dads' },
  audience: { label: 'Target Audience', icon: '👥', placeholder: 'e.g. Dads in their 30s–40s with limited time' },
  tone_of_voice: { label: 'Tone of Voice', icon: '🎙️', placeholder: 'e.g. Friendly, motivational, no-nonsense' },
  goals: { label: 'Content Goals', icon: '🎯', placeholder: 'e.g. Build authority, drive coaching sign-ups' },
  key_offers: { label: 'Key Offers', icon: '💎', placeholder: 'e.g. 1:1 coaching, group programs, meal plans' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BrandProfile() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editValues, setEditValues] = useState<Partial<Record<EditableField, string>>>({});

  // Re-parsing state
  const [isReparsing, setIsReparsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/brand-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      setProfile(data.profile);
    } catch (err: any) {
      setError(err.message || 'Failed to load brand profile');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const startEdit = (field: EditableField) => {
    setEditValues((prev) => ({ ...prev, [field]: profile?.[field] || '' }));
    setEditingField(field);
  };

  const cancelEdit = () => {
    setEditingField(null);
  };

  const saveField = async () => {
    if (!editingField || !profile) return;
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const body: Record<string, string | null> = {
        niche: profile.niche,
        audience: profile.audience,
        tone_of_voice: profile.tone_of_voice,
        goals: profile.goals,
        key_offers: profile.key_offers,
        raw_description: profile.raw_description,
      };
      body[editingField] = editValues[editingField] || null;

      const res = await fetch(`${API_BASE}/brand-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      // Update local state
      setProfile((prev) =>
        prev ? { ...prev, [editingField]: editValues[editingField] || null, updated_at: new Date().toISOString() } : prev
      );
      setEditingField(null);
      setSuccessMsg(`${FIELD_META[editingField].label} updated successfully.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReparse = async () => {
    if (!profile?.raw_description) {
      setError('No raw description to re-parse. Complete onboarding again to provide one.');
      return;
    }

    setIsReparsing(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${API_BASE}/brand-profile/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: profile.raw_description,
          extraContext: '',
          tonePreference: profile.tone_of_voice || '',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to re-parse');
      }

      const data = await res.json();
      const parsed = data.profile;

      // Save the parsed fields
      const saveRes = await fetch(`${API_BASE}/brand-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          raw_description: profile.raw_description,
          niche: parsed.niche,
          audience: parsed.audience,
          tone_of_voice: parsed.tone_of_voice,
          goals: parsed.goals,
          key_offers: parsed.key_offers,
        }),
      });

      if (!saveRes.ok) {
        const saveData = await saveRes.json();
        throw new Error(saveData.error || 'Failed to save re-parsed profile');
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              niche: parsed.niche,
              audience: parsed.audience,
              tone_of_voice: parsed.tone_of_voice,
              goals: parsed.goals,
              key_offers: parsed.key_offers,
              updated_at: new Date().toISOString(),
            }
          : prev
      );
      setSuccessMsg('Brand profile re-parsed and updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to re-parse');
    } finally {
      setIsReparsing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">🏷️</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">No brand profile yet</h1>
            <p className="text-slate-600 mb-6">
              Complete the onboarding wizard to set up your brand profile. It only takes 2 minutes.
            </p>
            <Link
              to="/onboarding"
              className="inline-block px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-lg hover:from-brand-700 hover:to-brand-600 transition-all shadow-sm"
            >
              Set up your brand →
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const fieldKeys: EditableField[] = ['niche', 'audience', 'tone_of_voice', 'goals', 'key_offers'];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Brand Profile</h1>
            <p className="text-sm text-slate-500 mt-1">
              {profile.updated_at ? `Last updated ${formatDate(profile.updated_at)}` : 'No update timestamp available'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReparse}
              disabled={isReparsing || !profile.raw_description}
              className="px-4 py-2 text-sm font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isReparsing ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-600" />
                  Re-parsing…
                </>
              ) : (
                <>
                  <span>🔄</span>
                  Re-parse with AI
                </>
              )}
            </button>
            <Link
              to="/onboarding"
              className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Re-do onboarding
            </Link>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 ml-4">
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 flex items-center justify-between">
            <span>✅ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-green-500 hover:text-green-700 ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Profile fields */}
        <div className="space-y-4">
          {fieldKeys.map((field) => {
            const meta = FIELD_META[field];
            const isEditing = editingField === field;
            const value = profile[field];

            return (
              <div
                key={field}
                className={`rounded-2xl border bg-white p-5 transition-all ${
                  isEditing ? 'border-brand-400 shadow-md ring-2 ring-brand-100' : 'border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {meta.label}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="mt-2 space-y-3">
                        <input
                          value={editValues[field] || ''}
                          onChange={(e) =>
                            setEditValues((prev) => ({ ...prev, [field]: e.target.value }))
                          }
                          placeholder={meta.placeholder}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveField();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={saveField}
                            disabled={isSaving}
                            className="px-3 py-1.5 text-xs font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                          >
                            {isSaving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-sm mt-1 ${value ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                        {value || 'Not set — click Edit to add'}
                      </p>
                    )}
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => startEdit(field)}
                      className="shrink-0 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Raw description card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📝</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Raw Description
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {profile.raw_description || 'No description provided.'}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              This is the original description used to parse your brand profile. The "Re-parse with AI" button uses this text.
            </p>
          </div>

          {/* Timeline card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🕐</span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Timeline</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Created:</span>{' '}
                <span className="text-slate-700 font-medium">{formatDate(profile.created_at)}</span>
              </div>
              <div>
                <span className="text-slate-500">Last updated:</span>{' '}
                <span className="text-slate-700 font-medium">{formatDate(profile.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
