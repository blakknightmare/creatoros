import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

const FEATURES = [
  {
    title: '2-Minute Onboarding',
    desc: 'Tell us about your business in a quick conversation. We build a brand profile that every piece of content draws from.',
    icon: '⚡',
  },
  {
    title: 'Multi-Platform Generation',
    desc: 'Instagram, LinkedIn, X, blogs, newsletters — generate on-brand content for every channel from one place.',
    icon: '🎯',
  },
  {
    title: 'Always On-Brand',
    desc: 'Every generation uses your stored brand profile. No re-typing your niche, audience, or tone — ever.',
    icon: '🧠',
  },
  {
    title: 'Batch Video-to-Content',
    desc: 'Drop in one video — a podcast, webinar, or TikTok — and get 60+ ready-to-post pieces across every platform.',
    icon: '🎬',
  },
  {
    title: 'Content Calendar',
    desc: 'Schedule everything with a drag-and-drop calendar. Plan a month of posts in minutes, not weekends.',
    icon: '📅',
  },
  {
    title: 'Analytics Dashboard',
    desc: 'Track 30-day trends and see which posts actually perform, so your next piece is better than the last.',
    icon: '📊',
  },
];

const STEPS = [
  {
    title: 'Describe your business',
    desc: 'Answer a short, conversational onboarding — what you do, who you serve, and how you sound.',
  },
  {
    title: 'AI builds your brand profile',
    desc: 'KREO distills your answers into a persistent profile: niche, audience, tone, goals, and offers.',
  },
  {
    title: 'Generate content everywhere',
    desc: 'TikTok, LinkedIn, blogs, newsletters — every piece is instantly on-brand, with zero re-explaining.',
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '£0',
    period: 'forever',
    tagline: 'Perfect for trying KREO out.',
    features: ['10 generations per day', 'Watermarked content', 'Basic content types'],
    cta: 'Get Started Free',
    to: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '£19',
    period: '/month',
    tagline: 'For serious creators and small businesses.',
    features: ['Unlimited generations', 'No watermark', 'Content calendar & analytics'],
    cta: 'Go Pro',
    to: '/pricing',
    highlight: true,
  },
  {
    name: 'Agency',
    price: '£79',
    period: '/month',
    tagline: 'For agencies and high-volume teams.',
    features: ['Everything in Pro', 'White-label exports', 'Copy Clean'],
    cta: 'Go Agency',
    to: '/pricing',
    highlight: false,
  },
];

export default function Landing() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-brand-950 text-slate-100">
      {/* Nav — dark, over the dark hero */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-brand-950/80 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-md shadow-brand-500/30">
            <span className="text-white font-bold text-sm tracking-tight">KR</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">
            KREO
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/pricing"
            className="hidden sm:block text-sm text-brand-200 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm text-brand-200 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-sm text-brand-200 hover:text-white transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-brand-200 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-lg hover:from-brand-400 hover:to-accent-400 transition-all shadow-md shadow-brand-500/30"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero — dark gradient */}
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800" />
        <div className="absolute inset-0 bg-grid-dark" />
        {/* Glow orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-accent-500/20 blur-3xl" />

        <div className="relative flex flex-col items-center justify-center px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-brand-200 text-xs font-medium mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
            Now in Beta
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
            Your AI-Powered{' '}
            <span className="text-gradient-brand">
              Content Manager
            </span>
          </h1>
          <p className="mt-5 text-2xl md:text-3xl font-bold text-brand-200 tracking-tight">
            Create more, Post Less.
          </p>
          <p className="mt-5 text-lg text-brand-100/80 max-w-xl leading-relaxed">
            Describe your business once. KREO learns your brand and generates
            on-brand content across every platform — TikTok, LinkedIn, blogs,
            newsletters, and more. No re-explaining, ever.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-xl hover:from-brand-400 hover:to-accent-400 transition-all shadow-lg shadow-brand-600/40 hover:shadow-accent-500/40 hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Get Started Free
            </Link>
            <Link
              to="/pricing"
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-medium text-brand-100 border border-white/25 rounded-xl hover:bg-white/10 transition-colors"
            >
              See Pricing
            </Link>
          </div>

          <p className="mt-4 text-xs text-brand-200/70">
            No credit card required. Set up your brand in 2 minutes.
          </p>
        </div>
      </main>

      {/* How it works */}
      <section className="bg-white text-slate-900">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-2">
              How it works
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              On-brand content in 3 steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {STEPS.map((step, i) => (
              <div key={step.title} className="text-center md:text-left">
                <div className="mx-auto md:mx-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-brand-600/30">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature highlights */}
      <section className="bg-gradient-to-b from-white to-brand-50 text-slate-900">
        <div className="max-w-5xl mx-auto px-6 pb-24 pt-4">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-2">
              Features
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Everything you need to stay visible
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-brand-100 bg-white p-6 shadow-sm hover:shadow-lg hover:shadow-brand-500/10 hover:-translate-y-1 transition-all duration-200"
              >
                {/* Gradient border glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-brand-500/20 to-accent-500/20" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 border border-brand-100 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gradient-to-b from-brand-50 to-brand-100/60 text-slate-900">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-2">
              Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Simple, honest pricing
            </h2>
            <p className="mt-3 text-slate-600 max-w-xl mx-auto">
              Start free. Upgrade when you're ready to post more. Your brand
              profile stays with you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  plan.highlight
                    ? 'border-2 border-brand-500 bg-white shadow-glow-brand md:scale-[1.02] md:-translate-y-2'
                    : 'border border-brand-200/70 bg-white/80 shadow-sm backdrop-blur-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-brand-600 to-accent-500 text-white text-xs font-bold rounded-full uppercase tracking-wider whitespace-nowrap shadow-md shadow-accent-500/30">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>
                <p className="text-sm text-slate-500 mt-3">{plan.tagline}</p>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <svg
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          plan.highlight ? 'text-accent-500' : 'text-brand-500'
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.to}
                  className={`mt-8 block w-full py-3 px-6 rounded-xl text-center font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
                    plan.highlight
                      ? 'text-white bg-gradient-to-r from-brand-600 to-accent-500 hover:from-brand-700 hover:to-accent-600 shadow-accent-500/30'
                      : 'text-brand-700 bg-white border-2 border-brand-300 hover:border-brand-400 hover:bg-brand-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center mt-10 text-sm text-slate-600">
            Need more detail?{' '}
            <Link to="/pricing" className="text-brand-600 font-medium hover:text-brand-700">
              See the full plan comparison →
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-950 border-t border-white/10 py-8 text-center text-sm text-brand-200/60">
        <div className="flex items-center justify-center gap-6 mb-3">
          <Link to="/pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
          <Link to="/signup" className="hover:text-white transition-colors">
            Get Started
          </Link>
          <Link to="/login" className="hover:text-white transition-colors">
            Sign in
          </Link>
        </div>
        &copy; {new Date().getFullYear()} KREO. All rights reserved.
      </footer>
    </div>
  );
}
