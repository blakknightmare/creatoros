import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useInView } from './hooks/useInView';

type IconName = 'zap' | 'target' | 'sparkles' | 'play' | 'calendar' | 'chart';

function FeatureIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    zap: 'M13 2L4 14h6l-1 8 9-12h-6l1-8z',
    target: 'M12 2v3m0 14v3M2 12h3m14 0h3M12 7a5 5 0 100 10 5 5 0 000-10zm0 3a2 2 0 100 4 2 2 0 000-4z',
    sparkles: 'M12 3l1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3zm7 12l.6 2.4L22 18l-2.4.6L19 21l-.6-2.4L16 18l2.4-.6L19 15z',
    play: 'M5 4.5a1.5 1.5 0 012.3-1.3l11.2 7.3a1.8 1.8 0 010 3L7.3 20.8A1.5 1.5 0 015 19.5v-15z',
    calendar: 'M6 2v4m12-4v4M3 10h18M5 4h14a2 2 0 012 2v14H3V6a2 2 0 012-2zm3 11h3m-3 3h3m2-3h3',
    chart: 'M4 19V5m0 14h17M8 16v-4m4 4V8m4 8V5m4 11v-7',
  };
  return <svg aria-hidden="true" className="w-6 h-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

function AnimatedItem({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const { ref, isInView } = useInView<HTMLDivElement>();
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`${className} opacity-0 translate-y-8 transition-all duration-700 ease-out ${isInView ? 'opacity-100 translate-y-0' : ''}`}>{children}</div>;
}

const FEATURES = [
  {
    title: '2-Minute Onboarding',
    desc: 'Tell us about your business in a quick conversation. We build a brand profile that every piece of content draws from.',
    icon: 'zap',
  },
  {
    title: 'Multi-Platform Generation',
    desc: 'Instagram, LinkedIn, X, blogs, newsletters — generate on-brand content for every channel from one place.',
    icon: 'target',
  },
  {
    title: 'Always On-Brand',
    desc: 'Every generation uses your stored brand profile. No re-typing your niche, audience, or tone — ever.',
    icon: 'sparkles',
  },
  {
    title: 'Batch Video-to-Content',
    desc: 'Drop in one video — a podcast, webinar, or TikTok — and get 60+ ready-to-post pieces across every platform.',
    icon: 'play',
  },
  {
    title: 'Content Calendar',
    desc: 'Schedule everything with a drag-and-drop calendar. Plan a month of posts in minutes, not weekends.',
    icon: 'calendar',
  },
  {
    title: 'Analytics Dashboard',
    desc: 'Track 30-day trends and see which posts actually perform, so your next piece is better than the last.',
    icon: 'chart',
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
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-600/30 blur-3xl animate-pulse-glow" />
        <div className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full bg-accent-500/20 blur-3xl animate-drift-glow" />

        <div className="relative flex flex-col items-center justify-center px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-brand-200 text-xs font-medium mb-6 backdrop-blur-sm animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
            Now in Beta
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight animate-fade-in-up [animation-delay:200ms]">
            Your AI-Powered{' '}
            <span className="text-gradient-brand">
              Content Manager
            </span>
          </h1>
          <p className="mt-5 text-2xl md:text-3xl font-bold text-brand-200 tracking-tight animate-fade-in-up [animation-delay:350ms]">
            Create more, Post Less.
          </p>
          <p className="mt-5 text-lg text-brand-100/80 max-w-xl leading-relaxed animate-fade-in-up [animation-delay:500ms]">
            Describe your business once. KREO learns your brand and generates
            on-brand content across every platform — TikTok, LinkedIn, blogs,
            newsletters, and more. No re-explaining, ever.
          </p>

          <div className="mt-10 w-full max-w-3xl rounded-2xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-sm animate-fade-in-up [animation-delay:575ms] lg:absolute lg:left-[calc(50%+20rem)] lg:top-1/2 lg:w-80 lg:-translate-y-1/2 lg:mt-0">
            <div className="rounded-xl bg-brand-950/80 p-3 text-left">
              <div className="flex gap-1.5 border-b border-white/10 pb-3"><span className="h-2 w-2 rounded-full bg-accent-400" /><span className="h-2 w-2 rounded-full bg-brand-400" /><span className="h-2 w-2 rounded-full bg-white/30" /></div>
              <div className="flex gap-3 pt-3"><div className="w-10 space-y-2"><div className="h-6 rounded bg-brand-500/50" /><div className="h-2 rounded bg-white/15" /><div className="h-2 rounded bg-white/15" /><div className="h-2 rounded bg-white/15" /></div><div className="flex-1 space-y-3"><div><div className="h-2 w-20 rounded bg-brand-200/50" /><div className="mt-2 h-2 w-32 rounded bg-white/20" /></div><div className="grid grid-cols-2 gap-2"><div className="h-16 rounded-lg bg-gradient-to-br from-brand-500/50 to-brand-700/30" /><div className="h-16 rounded-lg bg-gradient-to-br from-accent-500/50 to-brand-700/30" /></div><div className="h-12 rounded-lg bg-white/10" /></div></div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up [animation-delay:650ms]">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-xl hover:from-brand-400 hover:to-accent-400 transition-all shadow-lg shadow-brand-600/40 hover:shadow-accent-500/40 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started Free
            </Link>
            <Link
              to="/pricing"
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-medium text-brand-100 border border-white/25 rounded-xl hover:bg-white/10 hover:scale-[1.02] transition-all"
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
              <AnimatedItem key={step.title} delay={i * 150} className="text-center md:text-left">
                <div className="mx-auto md:mx-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-brand-600/30">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </AnimatedItem>
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
            {FEATURES.map((feature, i) => (
              <AnimatedItem delay={(i % 3) * 150} key={feature.title}>
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-brand-100 bg-white p-6 shadow-sm hover:shadow-lg hover:shadow-brand-500/10 hover:-translate-y-1 transition-all duration-200"
              >
                {/* Gradient border glow on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none bg-gradient-to-br from-brand-500/20 to-accent-500/20" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 border border-brand-100 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
                    <FeatureIcon name={feature.icon as IconName} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
              </AnimatedItem>
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
            {PLANS.map((plan, i) => (
              <AnimatedItem delay={i * 150} key={plan.name}>
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
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
              </AnimatedItem>
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
