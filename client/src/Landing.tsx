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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm tracking-tight">KR</span>
          </div>
          <span className="font-semibold text-lg tracking-tight text-slate-800">
            KREO
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/pricing"
            className="hidden sm:block text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Pricing
          </Link>
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Now in Beta
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
          Your AI-Powered{' '}
          <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            Content Manager
          </span>
        </h1>
        <p className="mt-5 text-2xl md:text-3xl font-bold text-brand-600 tracking-tight">
          Create more, Post Less.
        </p>
        <p className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed">
          Describe your business once. KREO learns your brand and generates
          on-brand content across every platform — TikTok, LinkedIn, blogs,
          newsletters, and more. No re-explaining, ever.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            Get Started Free
          </Link>
          <Link
            to="/pricing"
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            See Pricing
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          No credit card required. Set up your brand in 2 minutes.
        </p>
      </main>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-2">
            How it works
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            On-brand content in 3 steps
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <div key={step.title} className="text-center md:text-left">
              <div className="mx-auto md:mx-0 w-12 h-12 rounded-xl bg-brand-600 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-brand-600/20">
                {i + 1}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-2">
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Everything you need to stay visible
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-600 mb-2">
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Simple, honest pricing
          </h2>
          <p className="mt-3 text-slate-500 max-w-xl mx-auto">
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
                  ? 'border-2 border-brand-500 bg-white shadow-xl shadow-brand-100/60 md:scale-[1.02]'
                  : 'border border-slate-200 bg-white shadow-sm'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-brand-600 to-brand-700 text-white text-xs font-bold rounded-full uppercase tracking-wider whitespace-nowrap">
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
                      className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5"
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
                className={`mt-8 block w-full py-3 px-6 rounded-xl text-center font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.99] ${
                  plan.highlight
                    ? 'text-white bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800'
                    : 'text-brand-700 bg-white border-2 border-brand-300 hover:border-brand-400 hover:bg-brand-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center mt-8 text-sm text-slate-500">
          Need more detail?{' '}
          <Link to="/pricing" className="text-brand-600 font-medium hover:text-brand-700">
            See the full plan comparison →
          </Link>
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        <div className="flex items-center justify-center gap-6 mb-3">
          <Link to="/pricing" className="hover:text-slate-600 transition-colors">
            Pricing
          </Link>
          <Link to="/signup" className="hover:text-slate-600 transition-colors">
            Get Started
          </Link>
          <Link to="/login" className="hover:text-slate-600 transition-colors">
            Sign in
          </Link>
        </div>
        &copy; {new Date().getFullYear()} KREO. All rights reserved.
      </footer>
    </div>
  );
}
