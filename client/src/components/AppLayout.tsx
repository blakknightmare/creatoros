import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const STRIPE_PRO_LINK = 'https://buy.stripe.com/6oU7sN2Xjc5lcn1aB82wU00';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { tier, dailyUsage, logout } = useAuth();
  const location = useLocation();

  const isFree = tier === 'free';
  const usagePercent = dailyUsage.limit ? Math.min((dailyUsage.count / dailyUsage.limit) * 100, 100) : 0;
  const isNearLimit = isFree && dailyUsage.count >= 7;
  const isAtLimit = isFree && dailyUsage.limit !== null && dailyUsage.count >= dailyUsage.limit;

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/generate', label: 'Generate' },
    { to: '/batch', label: 'Video to Content' },
    { to: '/brand-profile', label: 'Brand Profile' },
  ];

  // Calendar link — only for Pro/Agency users
  if (tier === 'pro' || tier === 'agency') {
    navLinks.push({ to: '/calendar', label: 'Calendar' });
    navLinks.push({ to: '/analytics', label: 'Analytics' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-brand-900 border-r border-brand-800">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-md shadow-brand-500/30">
            <span className="text-white font-semibold text-sm">KR</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-lg tracking-tight text-white">KREO</span>
            <span className="text-[10px] text-brand-300 tracking-wide uppercase">Create more, Post Less</span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                location.pathname === link.to
                  ? 'font-semibold text-white bg-gradient-to-r from-brand-700 to-brand-800 shadow-inner'
                  : 'text-brand-200 hover:text-white hover:bg-brand-800/60'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  location.pathname === link.to ? 'bg-accent-400' : 'bg-brand-500'
                }`}
              />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Tier badge / Upgrade */}
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
          {tier === 'pro' && (
            <span className="inline-flex px-3 py-1 bg-gradient-to-r from-brand-700 to-brand-600 text-brand-100 text-xs font-semibold rounded-full border border-brand-500/50">
              Pro
            </span>
          )}
          {tier === 'agency' && (
            <span className="inline-flex px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/40">
              Agency
            </span>
          )}

          {isFree && (
            <a
              href={STRIPE_PRO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-2.5 text-xs font-medium text-white bg-gradient-to-r from-brand-600 to-accent-500 hover:from-brand-700 hover:to-accent-600 rounded-lg transition-all shadow-md shadow-brand-500/25 text-center"
            >
              Upgrade to Pro
            </a>
          )}

          {/* Usage indicator — free tier only */}
          {isFree && dailyUsage.limit !== null && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-brand-300">Daily generations</span>
                <span className={`text-[11px] font-semibold ${isAtLimit ? 'text-accent-400' : isNearLimit ? 'text-amber-400' : 'text-brand-200'}`}>
                  {dailyUsage.count}/{dailyUsage.limit}
                </span>
              </div>
              <div className="h-1.5 bg-brand-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isAtLimit ? 'bg-accent-500' : isNearLimit ? 'bg-amber-500' : 'bg-brand-500'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full py-2.5 px-3 text-sm font-medium text-brand-200 hover:text-white hover:bg-brand-800/60 rounded-lg transition-colors text-left"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <nav className="md:hidden sticky top-0 z-20 bg-brand-900 border-b border-brand-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
              <span className="text-white font-semibold text-xs">KR</span>
            </div>
            <span className="font-semibold text-white">KREO</span>
          </Link>
          <div className="flex items-center gap-2">
            {isFree && (
              <a
                href={STRIPE_PRO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-brand-600 to-accent-500 rounded-lg"
              >
                Upgrade
              </a>
            )}
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs font-medium text-brand-200 hover:text-white rounded-lg"
            >
              Log out
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3 overflow-x-auto -mx-4 px-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                location.pathname === link.to
                  ? 'font-semibold text-white bg-brand-700'
                  : 'text-brand-200 hover:text-white hover:bg-brand-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
