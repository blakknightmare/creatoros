import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';

const API_BASE = '/api';

interface Stats {
  totalProjects: number;
  mostUsedType: string | null;
  projectsThisWeek: number;
  projectsThisMonth: number;
  generationsByType: Record<string, number>;
  generationsByDay: { date: string; count: number }[];
  mostUsedTopic: string | null;
  batchGenerations: number;
}

const TYPE_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x_post: 'X Post',
  blog_post: 'Blog Post',
  email_newsletter: 'Newsletter',
  hooks: 'Hooks',
  ctas: 'CTAs',
  hashtags: 'Hashtags',
};

const TYPE_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-pink-400 to-rose-400',
  linkedin: 'bg-gradient-to-r from-brand-400 to-brand-600',
  x_post: 'bg-gradient-to-r from-slate-700 to-slate-900',
  blog_post: 'bg-gradient-to-r from-emerald-400 to-teal-500',
  email_newsletter: 'bg-gradient-to-r from-amber-400 to-orange-400',
  hooks: 'bg-gradient-to-r from-brand-500 to-brand-700',
  ctas: 'bg-gradient-to-r from-accent-400 to-accent-600',
  hashtags: 'bg-gradient-to-r from-brand-500 to-accent-500',
};

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

const STATS_PRO_LINK = 'https://buy.stripe.com/6oU7sN2Xjc5lcn1aB82wU00';

export default function Analytics() {
  const { tier } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  const fetchStats = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setError('Failed to load analytics data.');
      }
    } catch {
      setError('Network error — could not load analytics.');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ---- Pro+ gating ----
  if (tier === 'free') {
    return (
      <AppLayout>
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-purple-50 p-12 text-center shadow-lg">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-100 flex items-center justify-center text-3xl">
              📊
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">
              Analytics — Pro Feature
            </h1>
            <p className="text-slate-600 max-w-md mx-auto mb-2">
              Unlock in-depth content analytics to see what's working, spot trends, and make
              data-driven decisions about your content strategy.
            </p>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-8">
              Track generation trends, content type breakdowns, 30-day activity, and more.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href={STATS_PRO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
              >
                <span>⚡</span> Upgrade to Pro — £19/month
              </a>
              <Link
                to="/pricing"
                className="px-5 py-3 text-sm font-semibold text-brand-600 border border-brand-300 rounded-xl hover:bg-brand-50 transition-colors"
              >
                View Plans
              </Link>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  // ---- Loading skeleton ----
  if (loading) {
    return (
      <AppLayout>
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-10">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
          </div>
          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div>
                    <div className="w-12 h-7 bg-slate-200 rounded mb-1" />
                    <div className="w-20 h-3 bg-slate-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Bars skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
              <div className="h-5 w-40 bg-slate-200 rounded mb-5" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <div className="w-24 h-4 bg-slate-200 rounded" />
                  <div className="flex-1 h-4 bg-slate-200 rounded" />
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
              <div className="h-5 w-40 bg-slate-200 rounded mb-5" />
              <div className="flex items-end gap-1 h-32">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-slate-200 rounded-t" style={{ height: `${30 + Math.random() * 70}%` }} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <AppLayout>
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-500 mt-1">
              Track your content generation over time.
            </p>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-12 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Could not load analytics
            </h2>
            <p className="text-sm text-red-600 max-w-md mx-auto mb-6">
              {error}
            </p>
            <button
              onClick={fetchStats}
              className="px-6 py-3 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-sm"
            >
              Retry
            </button>
          </div>
        </main>
      </AppLayout>
    );
  }

  // ---- Empty state ----
  if (!stats || stats.totalProjects === 0) {
    return (
      <AppLayout>
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
            <p className="text-slate-500 mt-1">
              Track your content generation over time.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Start generating to see analytics
            </h2>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Once you start creating content, your analytics will appear here — trends,
              breakdowns, and insights about your content generation.
            </p>
            <Link
              to="/generate"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Generate your first piece of content
            </Link>
          </div>
        </main>
      </AppLayout>
    );
  }

  // ---- Content type breakdown ----
  const typeEntries = Object.entries(stats.generationsByType)
    .sort((a, b) => b[1] - a[1]);

  const maxTypeCount = typeEntries.length > 0 ? typeEntries[0][1] : 1;

  // ---- 30-day trend ----
  const dayEntries = stats.generationsByDay;
  const maxDayCount = dayEntries.length > 0
    ? Math.max(...dayEntries.map((d) => d.count), 1)
    : 1;

  // Format date for display
  const formatDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <AppLayout>
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 mt-1">
            Track your content generation over time.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Projects */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-xl">
                📝
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.totalProjects}
                </div>
                <div className="text-xs text-slate-500">Total Projects</div>
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">
                📅
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.projectsThisMonth}
                </div>
                <div className="text-xs text-slate-500">This Month</div>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">
                ⚡
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.projectsThisWeek}
                </div>
                <div className="text-xs text-slate-500">This Week</div>
              </div>
            </div>
          </div>

          {/* Most Used Type */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-xl">
                🎯
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 truncate max-w-[120px]">
                  {stats.mostUsedType
                    ? TYPE_LABELS[stats.mostUsedType] || stats.mostUsedType
                    : '—'}
                </div>
                <div className="text-xs text-slate-500">Most Used Type</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Content type breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              Content Type Breakdown
            </h2>
            {typeEntries.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-3">
                {typeEntries.map(([type, count]) => {
                  const pct = Math.round((count / maxTypeCount) * 100);
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="w-16 text-xs font-medium text-slate-600 flex-shrink-0 text-right">
                        {TYPE_ICONS[type] || '📄'} {TYPE_LABELS[type] || type}
                      </span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${TYPE_COLORS[type] || 'bg-brand-500'}`}
                          style={{ width: `${Math.max(pct, 3)}%` }}
                        />
                      </div>
                      <span className="w-8 text-xs font-semibold text-slate-500 flex-shrink-0">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 30-day trend */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-5">
              30-Day Trend
            </h2>
            {dayEntries.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No data yet</p>
            ) : (
              <div>
                <div className="flex items-end gap-[2px] h-36 mb-2">
                  {dayEntries.map((day) => {
                    const heightPct = (day.count / maxDayCount) * 100;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center justify-end group relative"
                      >
                        <div
                          className="w-full bg-brand-500 hover:bg-brand-600 rounded-t-sm transition-all cursor-default min-h-[2px]"
                          style={{ height: `${Math.max(heightPct, 2)}%` }}
                          title={`${day.date}: ${day.count} projects`}
                        />
                        {/* Tooltip on hover */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {formatDayLabel(day.date)}: {day.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* X-axis labels — show ~5 evenly spaced */}
                <div className="flex justify-between text-[10px] text-slate-400 px-0">
                  {dayEntries.length > 0 && (
                    <>
                      <span>{formatDayLabel(dayEntries[0].date)}</span>
                      {dayEntries.length > 10 && (
                        <span>{formatDayLabel(dayEntries[Math.floor(dayEntries.length / 4)].date)}</span>
                      )}
                      {dayEntries.length > 10 && (
                        <span>{formatDayLabel(dayEntries[Math.floor(dayEntries.length / 2)].date)}</span>
                      )}
                      {dayEntries.length > 10 && (
                        <span>{formatDayLabel(dayEntries[Math.floor(dayEntries.length * 3 / 4)].date)}</span>
                      )}
                      <span>{formatDayLabel(dayEntries[dayEntries.length - 1].date)}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Most used topic */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-xl">
                🔥
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800 truncate">
                  {stats.mostUsedTopic || '—'}
                </div>
                <div className="text-xs text-slate-500">Most Used Topic</div>
              </div>
            </div>
          </div>

          {/* Batch generations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-xl">
                🎬
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.batchGenerations}
                </div>
                <div className="text-xs text-slate-500">Batch Generations</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
