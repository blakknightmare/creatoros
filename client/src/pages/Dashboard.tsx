import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = '/api';

interface Project {
  id: number;
  content_type: string;
  topic: string | null;
  generated_content: string;
  created_at: string;
}

interface Stats {
  totalProjects: number;
  mostUsedType: string | null;
  projectsThisWeek: number;
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

const ALL_TYPES = Object.keys(TYPE_LABELS);

export default function Dashboard() {
  const { user, logout, hasBrandProfile } = useAuth();

  // Project list state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Stats state
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    mostUsedType: null,
    projectsThisWeek: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // UI state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  const token = localStorage.getItem('token');

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
    setLoadingStats(false);
  }, [token]);

  // Fetch projects with filters
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      params.set('sort', sortOrder);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('limit', '100');

      const res = await fetch(`${API_BASE}/projects?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        setTotalCount(data.count || 0);
      }
    } catch {
      // ignore
    }
    setLoadingProjects(false);
  }, [token, typeFilter, sortOrder, searchQuery]);

  useEffect(() => {
    if (hasBrandProfile) {
      fetchStats();
      fetchProjects();
    } else {
      setLoadingProjects(false);
      setLoadingStats(false);
    }
  }, [hasBrandProfile, fetchStats, fetchProjects]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'Z');
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const truncateContent = (content: string, maxLen: number = 150) => {
    return content.length > maxLen ? content.slice(0, maxLen).trim() + '...' : content;
  };

  const handleCopy = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(project.generated_content);
      setCopiedId(project.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = project.generated_content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(project.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = async (projectId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(projectId);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        setTotalCount((prev) => prev - 1);
        setStats((prev) => ({
          ...prev,
          totalProjects: prev.totalProjects - 1,
        }));
        if (expandedId === projectId) setExpandedId(null);
      }
    } catch {
      // ignore
    }
    setDeletingId(null);
    setShowDeleteConfirm(null);
  };

  const toggleExpand = (projectId: number) => {
    setExpandedId((prev) => (prev === projectId ? null : projectId));
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setSortOrder('newest');
    setSearchInput('');
    setSearchQuery('');
  };

  // Nav component (shared)
  const Nav = (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">CO</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-800">
            CreatorOS
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1">
          <Link
            to="/dashboard"
            className="px-3 py-1.5 text-sm font-medium text-brand-700 bg-brand-50 rounded-lg"
          >
            Dashboard
          </Link>
          <Link
            to="/generate"
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Generate
          </Link>
          <Link
            to="/brand-profile"
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Brand Profile
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">{user?.email}</span>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Log out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      {Nav}

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back! Here's an overview of your content.
          </p>
        </div>

        {!hasBrandProfile ? (
          /* No brand profile state */
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm text-center">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Ready to create content?
            </h2>
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              Complete your brand onboarding to start generating on-brand content
              across every platform. It only takes 2 minutes.
            </p>
            <Link
              to="/onboarding"
              className="inline-block px-6 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
            >
              Set up your brand
            </Link>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {/* Total Projects */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-xl">
                    📝
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {loadingStats ? (
                        <span className="inline-block w-8 h-7 bg-slate-200 rounded animate-pulse" />
                      ) : (
                        stats.totalProjects
                      )}
                    </div>
                    <div className="text-xs text-slate-500">Total Projects</div>
                  </div>
                </div>
              </div>

              {/* Most Used Type */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">
                    🎯
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {loadingStats ? (
                        <span className="inline-block w-20 h-7 bg-slate-200 rounded animate-pulse" />
                      ) : stats.mostUsedType ? (
                        TYPE_LABELS[stats.mostUsedType] || stats.mostUsedType
                      ) : (
                        <span className="text-sm font-normal text-slate-400">—</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">Most Used Type</div>
                  </div>
                </div>
              </div>

              {/* This Week */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">
                    ⚡
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {loadingStats ? (
                        <span className="inline-block w-8 h-7 bg-slate-200 rounded animate-pulse" />
                      ) : (
                        stats.projectsThisWeek
                      )}
                    </div>
                    <div className="text-xs text-slate-500">This Week</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="mb-8 flex flex-wrap gap-3">
              <Link
                to="/generate"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate New Content
              </Link>
              <Link
                to="/brand-profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-brand-600 border border-brand-300 rounded-xl hover:bg-brand-50 transition-colors"
              >
                Edit Brand Profile
              </Link>
            </div>

            {/* Video to Content — flagship feature card */}
            <Link
              to="/batch"
              className="block mb-8 rounded-2xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group"
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-2xl shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                  🎬
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-slate-900">Video to Content</h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white">NEW</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">
                    Drop in a long-form video transcript and get <strong>weeks</strong> of content out — TikTok ideas, Reels, captions, hooks, newsletter, carousel, and a full blog article. All generated in one batch, perfectly on-brand.
                  </p>
                  <div className="flex items-center gap-1 text-sm font-semibold text-purple-700 group-hover:text-purple-800">
                    <span>Try it now</span>
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>

            {/* All Projects Section */}
            <div>
              {/* Section header with filter controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-slate-700">
                  All Projects
                  {totalCount > 0 && (
                    <span className="text-sm font-normal text-slate-400 ml-2">
                      ({totalCount})
                    </span>
                  )}
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Search */}
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search topics..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-44 pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-slate-400"
                    />
                    {searchInput && (
                      <button
                        onClick={() => setSearchInput('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Type filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-slate-700"
                  >
                    <option value="all">All Types</option>
                    {ALL_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {TYPE_ICONS[t]} {TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>

                  {/* Sort toggle */}
                  <button
                    onClick={() =>
                      setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'))
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={
                          sortOrder === 'newest'
                            ? 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12'
                            : 'M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4'
                        }
                      />
                    </svg>
                    {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  </button>
                </div>
              </div>

              {/* Active filters indicator */}
              {(typeFilter !== 'all' || searchQuery.trim()) && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-brand-50 border border-brand-200 rounded-lg text-sm">
                  <span className="text-brand-700 font-medium">Active filters:</span>
                  {typeFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-brand-200 rounded-full text-xs text-brand-700">
                      {TYPE_LABELS[typeFilter] || typeFilter}
                      <button onClick={() => setTypeFilter('all')} className="hover:text-brand-900">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {searchQuery.trim() && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-brand-200 rounded-full text-xs text-brand-700">
                      "{searchQuery.trim()}"
                      <button onClick={() => { setSearchInput(''); setSearchQuery(''); }} className="hover:text-brand-900">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  )}
                  <button onClick={clearFilters} className="ml-auto text-xs text-brand-600 hover:text-brand-800 font-medium">
                    Clear all
                  </button>
                </div>
              )}

              {/* Project list */}
              {loadingProjects ? (
                /* Loading skeleton */
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-200" />
                        <div className="h-4 bg-slate-200 rounded w-24" />
                        <div className="h-3 bg-slate-200 rounded w-16 ml-auto" />
                      </div>
                      <div className="h-4 bg-slate-200 rounded w-full" />
                      <div className="h-4 bg-slate-200 rounded w-3/4 mt-2" />
                    </div>
                  ))}
                </div>
              ) : projects.length === 0 ? (
                /* Empty state */
                totalCount === 0 && !searchQuery.trim() && typeFilter === 'all' ? (
                  /* No projects at all */
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center">
                    <div className="text-5xl mb-4">✨</div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                      No projects yet
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                      Head over to the Generate page to create your first piece of on-brand
                      content. Your generations will appear here.
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
                ) : (
                  /* No results matching filters */
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center">
                    <div className="text-5xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                      No projects match your filters
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                      Try adjusting your search or filters to find what you're looking for.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-brand-600 border border-brand-300 rounded-xl hover:bg-brand-50 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                )
              ) : (
                /* Project cards */
                <div className="space-y-3">
                  {projects.map((project) => {
                    const isExpanded = expandedId === project.id;
                    const isCopied = copiedId === project.id;
                    const isDeleting = deletingId === project.id;

                    return (
                      <div
                        key={project.id}
                        className={`rounded-xl border bg-white shadow-sm transition-all duration-200 ${
                          isExpanded
                            ? 'border-brand-300 ring-1 ring-brand-200 shadow-md'
                            : 'border-slate-200 hover:shadow-md hover:border-slate-300'
                        }`}
                      >
                        {/* Card header — clickable */}
                        <div
                          onClick={() => toggleExpand(project.id)}
                          className="p-5 cursor-pointer"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base flex-shrink-0">
                              {TYPE_ICONS[project.content_type] || '📄'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-slate-700">
                                {TYPE_LABELS[project.content_type] || project.content_type}
                              </span>
                              {project.topic && (
                                <span className="text-sm text-slate-400 ml-2 truncate">
                                  · {project.topic}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 flex-shrink-0">
                              {formatDate(project.created_at)}
                            </span>
                          </div>

                          {/* Content preview */}
                          <p className={`text-sm text-slate-600 leading-relaxed ${
                            isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'
                          }`}>
                            {isExpanded ? project.generated_content : truncateContent(project.generated_content, 200)}
                          </p>

                          {/* Expand indicator */}
                          <div className="flex items-center justify-center mt-2">
                            <svg
                              className={`w-5 h-5 text-slate-300 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Actions bar — always visible */}
                        <div className="px-5 pb-4 flex flex-wrap items-center gap-2">
                          <button
                            onClick={(e) => handleCopy(project, e)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isCopied
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                              </>
                            )}
                          </button>

                          {project.topic && (
                            <Link
                              to={`/projects/${project.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Detail
                            </Link>
                          )}

                          {/* Delete button */}
                          {showDeleteConfirm === project.id ? (
                            <div className="inline-flex items-center gap-2 ml-auto">
                              <span className="text-xs text-slate-500">Delete?</span>
                              <button
                                onClick={(e) => handleDelete(project.id, e)}
                                disabled={isDeleting}
                                className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                {isDeleting ? '...' : 'Yes'}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(null);
                                }}
                                className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(project.id);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all ml-auto"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
