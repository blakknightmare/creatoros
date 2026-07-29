import { useState, useEffect } from 'react';
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

export default function Dashboard() {
  const { user, logout, hasBrandProfile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/projects?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch {
        // ignore
      }
      setLoadingProjects(false);
    }

    if (hasBrandProfile) {
      fetchProjects();
    } else {
      setLoadingProjects(false);
    }
  }, [hasBrandProfile]);

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
    return date.toLocaleDateString();
  };

  const truncateContent = (content: string, maxLen: number = 150) => {
    return content.length > maxLen ? content.slice(0, maxLen).trim() + '...' : content;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      {/* Nav */}
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

      {/* Dashboard content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back! Here's an overview of your content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Projects', value: String(projects.length), icon: '📝' },
            { label: 'Content Types', value: '8', icon: '🎯' },
            { label: 'Brand Profile', value: hasBrandProfile ? '✓ Set' : 'Not set', icon: '🏷️' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`text-2xl font-bold ${stat.label === 'Brand Profile' && hasBrandProfile ? 'text-green-600' : 'text-slate-900'}`}>{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {!hasBrandProfile ? (
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
            {/* Quick action */}
            <div className="mb-10 flex flex-wrap gap-4">
              <Link
                to="/generate"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate New Content
              </Link>
              <Link
                to="/brand-profile"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-brand-600 border border-brand-300 rounded-xl hover:bg-brand-50 transition-colors"
              >
                Edit Brand Profile
              </Link>
            </div>

            {/* Recent generations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-700">Recent Generations</h2>
                {projects.length > 0 && (
                  <span className="text-sm text-slate-400">Last {Math.min(projects.length, 5)}</span>
                )}
              </div>

              {loadingProjects ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
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
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-10 text-center">
                  <div className="text-4xl mb-3">✨</div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No content yet</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-6">
                    Head over to the Generate page to create your first piece of on-brand content.
                  </p>
                  <Link
                    to="/generate"
                    className="inline-block px-5 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                  >
                    Start Creating
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm">
                          {TYPE_ICONS[project.content_type] || '📄'}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-700">
                            {TYPE_LABELS[project.content_type] || project.content_type}
                          </span>
                          {project.topic && (
                            <span className="text-sm text-slate-400 ml-2">· {project.topic}</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 ml-auto">
                          {formatDate(project.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {truncateContent(project.generated_content)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
