const DISCORD = 'https://discord.gg/jfDBYWq6Ax';

export default function Hero() {
  return (
    <section className="relative pt-28 pb-20 px-5 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-green-500/[0.04] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        <p className="text-green-400 text-sm font-mono mb-4">// boosting service</p>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
          Stop grinding.<br />
          We handle the boring part.
        </h1>

        <p className="text-neutral-400 text-lg leading-relaxed max-w-xl mb-8">
          Rank boosts, level boosts, win boosts. You pick what you need, we get it done.
          Pay with PayPal or crypto (BTC, ETH, LTC, SOL).
        </p>

        <div className="flex flex-wrap gap-3 mb-12">
          <a
            href={DISCORD}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-500 text-black font-semibold text-sm hover:bg-green-400 transition-colors shadow-lg shadow-green-500/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            Order on Discord
          </a>
          <a
            href="#ranks"
            className="inline-flex px-5 py-2.5 rounded-lg glass glass-shine text-neutral-300 text-sm font-medium hover:text-white transition-colors"
          >
            See prices
          </a>
        </div>

        <div className="inline-flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500 glass-subtle rounded-xl px-5 py-3">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            PayPal accepted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Crypto accepted (BTC, ETH, LTC, SOL)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Fast delivery
          </span>
        </div>
      </div>
    </section>
  );
}
