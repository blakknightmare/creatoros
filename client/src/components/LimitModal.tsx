import { Link } from 'react-router-dom';

const STRIPE_PRO_LINK = 'https://buy.stripe.com/6oU7sN2Xjc5lcn1aB82wU00';

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyCount: number;
}

export default function LimitModal({ isOpen, onClose, dailyCount }: LimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-5 mx-auto">
          <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
          You've used all {dailyCount} generations today
        </h2>
        <p className="text-slate-500 text-center text-sm mb-6">
          The free tier includes 10 generations per day. Upgrade to Pro for unlimited generations and unlock your full content potential.
        </p>

        {/* Pricing highlight */}
        <div className="bg-gradient-to-br from-brand-50 to-accent-50 border border-brand-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-brand-800">KREO Pro</span>
            <span className="text-lg font-bold text-brand-700">£19<span className="text-sm font-normal text-brand-500">/month</span></span>
          </div>
          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Unlimited generations
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Batch content from transcripts
            </li>
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              AI content calendar (coming soon)
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <a
            href={STRIPE_PRO_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 px-6 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 transition-all shadow-sm hover:shadow-md text-center active:scale-[0.99]"
          >
            Upgrade to Pro — £19/month
          </a>

          <Link
            to="/pricing"
            onClick={onClose}
            className="block w-full py-3 px-6 rounded-xl text-slate-700 font-medium text-sm bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-center"
          >
            View Pricing
          </Link>

          <button
            onClick={onClose}
            className="block w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
