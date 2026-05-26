const DISCORD = 'https://discord.gg/jfDBYWq6Ax';

export default function BoostTypes() {
  return (
    <section className="py-16 px-5" id="how-it-works">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2">How it works</h2>
        <p className="text-neutral-500 text-sm mb-8">Two options for every boost — pick whichever you prefer.</p>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Duo Boost */}
          <div className="glass glass-shine rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/15 flex items-center justify-center text-green-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Duo Boost</h3>
                <p className="text-xs text-neutral-500">I play with you</p>
              </div>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              I queue up with you and we play together. You stay on your own account the entire time.
              Good if you want to keep full control and watch the games happen.
            </p>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">+</span>You keep your account logged in</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">+</span>Play alongside a skilled booster</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">+</span>Learn while you rank up</li>
            </ul>
          </div>

          {/* Account Boost */}
          <div className="glass glass-shine rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/15 flex items-center justify-center text-green-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Account Boost</h3>
                <p className="text-xs text-neutral-500">I play on your account</p>
              </div>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-4">
              You share your login, I hop on and grind it out for you.
              Fastest option — you can go do other things while I handle everything.
            </p>
            <ul className="space-y-2 text-sm text-neutral-500">
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">+</span>Hands-off, zero effort from you</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">+</span>Usually faster completion</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">+</span>VPN used to match your region</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl glass-subtle">
          <span className="text-sm text-neutral-400">
            Not sure which to pick? Just message me on Discord and we can figure it out.
          </span>
          <a href={DISCORD} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white transition-colors">
            Join Discord
          </a>
        </div>
      </div>
    </section>
  );
}
