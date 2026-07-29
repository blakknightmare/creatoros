import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, logout, hasBrandProfile } = useAuth();

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
            Welcome to CreatorOS! Your projects and content will appear here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Projects', value: '0', icon: '📝' },
            { label: 'Content Types', value: '6', icon: '🎯' },
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
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 shadow-sm text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Brand profile ready
            </h2>
            <p className="text-slate-600 max-w-md mx-auto mb-6">
              Your brand profile is set up. Content generation is coming soon — you'll be able to create on-brand content for every platform.
            </p>
            <Link
              to="/onboarding"
              className="inline-block px-6 py-2.5 text-sm font-semibold text-brand-600 border border-brand-300 rounded-lg hover:bg-brand-50 transition-colors"
            >
              Edit your brand profile
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
