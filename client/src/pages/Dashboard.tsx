import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">CO</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-800">
            CreatorOS
          </span>
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
            { label: 'Brand Profile', value: 'Not set', icon: '🏷️' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Ready to create content?
          </h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Complete your brand onboarding to start generating on-brand content
            across every platform.
          </p>
          <button className="mt-6 px-6 py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
            Set up your brand
          </button>
        </div>
      </main>
    </div>
  );
}
