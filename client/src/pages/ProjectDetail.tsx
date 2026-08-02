import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import { addWatermark } from '../utils/watermark';

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

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tier } = useAuth();
  const token = localStorage.getItem('token');

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`${API_BASE}/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setProject(data.project);
        } else if (res.status === 404) {
          setNotFound(true);
        }
      } catch {
        // ignore
      }
      setLoading(false);
    }
    if (token && id) fetchProject();
  }, [id, token]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'Z').toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleCopy = async () => {
    if (!project) return;
    const watermarked = addWatermark(project.generated_content, tier);
    try {
      await navigator.clipboard.writeText(watermarked);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="space-y-2 mt-8">
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-5/6" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-2/3" />
              <div className="h-4 bg-slate-200 rounded w-4/5" />
            </div>
          </div>
        ) : notFound ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">Project not found</h2>
            <p className="text-slate-500 mb-6">
              This project may have been deleted or you don't have access to it.
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-6 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : project ? (
          <>
            {/* Project header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
                  {TYPE_ICONS[project.content_type] || '📄'}
                </div>
                <div>
                  <h1 className="text-2xl font-light text-slate-900">
                    {TYPE_LABELS[project.content_type] || project.content_type}
                  </h1>
                  {project.topic && (
                    <p className="text-slate-500">{project.topic}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-400 ml-[52px]">
                Generated {formatDate(project.created_at)}
              </p>
            </div>

            {/* Content */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-8">
                <div className="prose prose-slate max-w-none text-slate-800 whitespace-pre-wrap font-sans leading-relaxed text-sm">
                  {project.generated_content}
                </div>
              </div>

              {/* Actions */}
              <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-3">
                <button
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
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
                      Copy Content
                    </>
                  )}
                </button>

                <Link
                  to="/generate"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Generate More
                </Link>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
