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
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">CO</span>
            </div>
            <span className="font-semibold text-lg tracking-tight text-slate-800">
              KREO
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  location.pathname === link.to
                    ? 'font-medium text-brand-700 bg-brand-50'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tier badge / Upgrade button */}
          {tier === 'pro' && (
            <span className="px-3 py-1 bg-gradient-to-r from-brand-100 to-purple-100 text-brand-700 text-xs font-semibold rounded-full border border-brand-200">
              Pro
            </span>
          )}
          {tier === 'agency' && (
            <span className="px-3 py-1 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
              Agency
            </span>
          )}
          {tier === 'agency' && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-white/60 text-amber-600 text-xs rounded-full border border-amber-300">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              White-label
            </span>
          )}
          {isFree && (
            <a
              href={STRIPE_PRO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
            >
              Upgrade
            </a>
          )}

          {/* Usage indicator — free tier only */}
          {isFree && dailyUsage.limit !== null && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-brand-500'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${
                isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-slate-500'
              }`}>
                {dailyUsage.count}/{dailyUsage.limit}
              </span>
            </div>
          )}

          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Main content */}
      {children}
    </div>
  );
}
