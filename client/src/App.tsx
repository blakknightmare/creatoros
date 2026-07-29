function App() {
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
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Features
          </a>
          <a
            href="#"
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            About
          </a>
          <button className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
            Join Waitlist
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Coming Soon
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
          Your AI-Powered{' '}
          <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
            Content Manager
          </span>
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-xl leading-relaxed">
          Describe your business once. CreatorOS learns your brand and generates
          on-brand content across every platform — TikTok, LinkedIn, blogs,
          newsletters, and more. No re-explaining, ever.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-4 py-3 w-72 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-sm"
          />
          <button className="px-6 py-3 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
            Get Early Access
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          No spam, ever. We'll notify you when we launch.
        </p>
      </main>

      {/* Feature teasers */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
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
        ].map((feature) => (
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
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} CreatorOS. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
