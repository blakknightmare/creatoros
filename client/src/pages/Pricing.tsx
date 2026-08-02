import { useAuth } from '../contexts/AuthContext';

const STRIPE_PRO_LINK = 'https://buy.stripe.com/6oU7sN2Xjc5lcn1aB82wU00';
const STRIPE_AGENCY_LINK = 'https://buy.stripe.com/3cI28tapL3yP2Mr9x42wU01';

interface TierFeature {
  text: string;
  included: boolean;
  badge?: string;
}

interface Tier {
  name: string;
  price: string;
  period: string;
  description: string;
  stripeLink: string | null;
  features: TierFeature[];
  current: boolean;
  highlight: boolean;
}

const tiers: Tier[] = [
  {
    name: 'Free',
    price: '£0',
    period: '',
    description: 'Get started with on-brand AI content generation.',
    stripeLink: null,
    features: [
      { text: '10 generations per day', included: true },
      { text: '8 content types (Instagram, LinkedIn, X, Blog, Email, Hooks, CTAs, Hashtags)', included: true },
      { text: 'Brand memory & tone lock', included: true },
      { text: 'Save projects to dashboard', included: true },
      { text: 'Batch content from transcripts', included: false },
      { text: '50 generations per day', included: false },
      { text: 'AI content calendar', included: false },
      { text: 'Priority support', included: false },
      { text: 'White-label content', included: false },
    ],
    current: true,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '£19',
    period: '/month',
    description: '50 generations/day for serious creators and small businesses.',
    stripeLink: STRIPE_PRO_LINK,
    features: [
      { text: '50 generations per day', included: true },
      { text: '8 content types (Instagram, LinkedIn, X, Blog, Email, Hooks, CTAs, Hashtags)', included: true },
      { text: 'Brand memory & tone lock', included: true },
      { text: 'Save projects to dashboard', included: true },
      { text: 'Batch content from transcripts', included: true },
      { text: 'AI content calendar', included: true, badge: 'Coming soon' },
      { text: 'Priority support', included: false },
      { text: 'White-label content', included: false },
    ],
    current: false,
    highlight: true,
  },
  {
    name: 'Agency',
    price: '£79',
    period: '/month',
    description: 'For agencies managing multiple brands and high-volume output.',
    stripeLink: STRIPE_AGENCY_LINK,
    features: [
      { text: 'Unlimited generations', included: true },
      { text: '8 content types (Instagram, LinkedIn, X, Blog, Email, Hooks, CTAs, Hashtags)', included: true },
      { text: 'Brand memory & tone lock', included: true },
      { text: 'Save projects to dashboard', included: true },
      { text: 'Batch content from transcripts', included: true },
      { text: 'AI content calendar', included: true, badge: 'Coming soon' },
      { text: 'Priority support', included: true },
      { text: 'White-label content', included: true, badge: 'Coming soon' },
    ],
    current: false,
    highlight: false,
  },
];

export default function Pricing() {
  const { tier, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-100 via-brand-50 to-white">
      {/* Header */}
      <header className="text-center pt-16 pb-8 px-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Simple, transparent pricing</h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto">
          Choose the plan that fits your content needs. Upgrade anytime — your brand profile stays with you.
        </p>
        {user && (
          <p className="text-sm text-slate-400 mt-3">
            You're currently on the <span className="font-semibold text-slate-600 capitalize">{tier}</span> tier
          </p>
        )}
      </header>

      {/* Pricing cards */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((t) => {
            const isCurrentTier = tier === t.name.toLowerCase();
            return (
              <div
                key={t.name}
                className={`relative rounded-2xl border-2 p-8 flex flex-col ${
                  t.highlight
                    ? 'border-brand-500 bg-white shadow-glow-brand scale-[1.02]'
                    : 'border-slate-200 bg-white shadow-sm'
                }`}
              >
                {t.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-brand-600 to-accent-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">{t.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">{t.price}</span>
                    <span className="text-slate-400">{t.period}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{t.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      {f.included ? (
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={f.included ? 'text-slate-700' : 'text-slate-400'}>
                        {f.text}
                        {f.badge && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-brand-100 text-brand-700 rounded-full">
                            {f.badge}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrentTier ? (
                  <div className="w-full py-3 px-6 rounded-xl text-center text-brand-700 font-semibold text-sm bg-brand-50 border-2 border-brand-200">
                    Current Plan
                  </div>
                ) : t.stripeLink ? (
                  <a
                    href={t.stripeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block w-full py-3 px-6 rounded-xl text-center font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.99] ${
                      t.highlight
                        ? 'text-white bg-gradient-to-r from-brand-600 to-accent-500 hover:from-brand-700 hover:to-accent-600 shadow-accent-500/30'
                        : 'text-brand-700 bg-white border-2 border-brand-300 hover:border-brand-400 hover:bg-brand-50'
                    }`}
                  >
                    Upgrade to {t.name}
                  </a>
                ) : (
                  <div className="w-full py-3 px-6 rounded-xl text-center text-slate-400 font-medium text-sm bg-slate-50 border border-slate-200">
                    Current Plan
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
