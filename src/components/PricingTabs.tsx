import { useState, useRef, useEffect } from 'react';
import { useCart } from './CartContext';

// ─── Data ───────────────────────────────────────────

const rankColor: Record<string, string> = {
  Bronze: 'text-amber-600',
  Silver: 'text-neutral-400',
  Gold: 'text-yellow-500',
  Platinum: 'text-cyan-400',
  Diamond: 'text-blue-400',
  Onyx: 'text-neutral-300',
  Nemesis: 'text-red-400',
  Archnemesis: 'text-rose-300',
};

interface RankBoost {
  id: string;
  from: string;
  to: string;
  note: string;
  price: number;
  eta: string;
  highlight?: boolean;
}

const rankBoosts: RankBoost[] = [
  { id: 'r1', from: 'Bronze III', to: 'Silver III', note: '~1-2 hrs of play saved', price: 3, eta: '1-2 hours' },
  { id: 'r2', from: 'Silver III', to: 'Gold III', note: '~3-5 hrs of play saved', price: 5, eta: '3-5 hours' },
  { id: 'r3', from: 'Gold III', to: 'Platinum III', note: '~5-8 hrs of play saved', price: 7, eta: '5-8 hours' },
  { id: 'r4', from: 'Platinum III', to: 'Diamond III', note: '~8-12 hrs of play saved', price: 10, eta: '8-12 hours' },
  { id: 'r5', from: 'Diamond III', to: 'Onyx III', note: '~12-20 hrs of play saved', price: 15, eta: '12-20 hours' },
  { id: 'r6', from: 'Onyx III', to: 'Nemesis', note: '~20-30 hrs of play saved', price: 22, eta: '20-30 hours' },
  { id: 'r7', from: 'Nemesis', to: 'Archnemesis', note: 'Top rank — hardest grind', price: 35, eta: '30-48 hours' },
  { id: 'r8', from: 'Bronze III', to: 'Archnemesis', note: 'Full run — one order covers everything', price: 75, eta: '3-5 days', highlight: true },
];

interface LevelBoost { id: string; from: number; to: number; price: number; eta: string; }
const levelBoosts: LevelBoost[] = [
  { id: 'l1', from: 1, to: 25, price: 4, eta: '2-3 hours' },
  { id: 'l2', from: 25, to: 50, price: 6, eta: '3-5 hours' },
  { id: 'l3', from: 50, to: 100, price: 11, eta: '6-10 hours' },
  { id: 'l4', from: 100, to: 200, price: 19, eta: '12-20 hours' },
  { id: 'l5', from: 200, to: 500, price: 35, eta: '1-2 days' },
  { id: 'l6', from: 500, to: 1000, price: 65, eta: '2-4 days' },
];

interface WinPack { id: string; wins: number; price: number; eta: string; }
const winPacks: WinPack[] = [
  { id: 'w1', wins: 5, price: 2.5, eta: '2-4 hours' },
  { id: 'w2', wins: 10, price: 5, eta: '4-8 hours' },
  { id: 'w3', wins: 25, price: 11, eta: '10-18 hours' },
  { id: 'w4', wins: 50, price: 19, eta: '1-2 days' },
  { id: 'w5', wins: 100, price: 34, eta: '2-4 days' },
];

interface BundleDeal { id: string; name: string; desc: string; discount: string; best?: boolean; }
const bundles: BundleDeal[] = [
  { id: 'b1', name: 'Rank + 50 Levels', desc: 'Any rank boost combined with level grind', discount: '15% off' },
  { id: 'b2', name: 'Rank + 25 Wins', desc: 'Climb rank and stack wins together', discount: '10% off' },
  { id: 'b3', name: 'Full Package', desc: 'Rank + Levels + Wins in one order', discount: '20% off', best: true },
];

const tabs = ['Ranks', 'Levels', 'Wins', 'Bundles'] as const;
type Tab = typeof tabs[number];

function AddBtn({ onClick, added }: { onClick: () => void; added: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-semibold px-2.5 py-1 rounded transition-all duration-200 shrink-0 ${
        added
          ? 'bg-green-500/15 text-green-400'
          : 'bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {added ? 'Added' : '+ Add'}
    </button>
  );
}

function rName(rank: string) { return rank.split(' ')[0]; }

function EtaBadge({ eta }: { eta: string }) {
  const isLong = eta.includes('day');
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${isLong ? 'text-yellow-500' : 'text-neutral-500'}`}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      {eta}
    </span>
  );
}

export default function PricingTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('Ranks');
  const [direction, setDirection] = useState(0);
  const [animating, setAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { add, items } = useCart();
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const isInCart = (id: string) => items.some(x => x.id === id) || justAdded === id;

  const handleAdd = (id: string, category: string, label: string, price: number, eta: string) => {
    add({ id, category, label, price, eta });
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 1200);
  };

  const switchTab = (tab: Tab) => {
    if (tab === activeTab || animating) return;
    const oldIndex = tabs.indexOf(activeTab);
    const newIndex = tabs.indexOf(tab);
    setDirection(newIndex > oldIndex ? 1 : -1);
    setAnimating(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTimeout(() => setAnimating(false), 30);
    }, 150);
  };

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = tabs.indexOf(activeTab);
    const el = tabRefs.current[idx];
    if (el) {
      const parent = el.parentElement;
      if (parent) {
        setIndicator({ left: el.offsetLeft - parent.offsetLeft, width: el.offsetWidth });
      }
    }
  }, [activeTab]);

  return (
    <section className="py-16 px-5" id="ranks">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-1">Pricing</h2>
        <p className="text-neutral-500 text-sm mb-6">Pick what you need, add it to your cart, then order on Discord.</p>

        {/* Tab bar — glass */}
        <div className="relative mb-8">
          <div className="inline-flex gap-1 p-1 glass rounded-xl relative">
            <div
              className="absolute top-1 bottom-1 bg-white/[0.08] rounded-lg transition-all duration-300 ease-out"
              style={{ left: indicator.left + 4, width: indicator.width }}
            />
            {tabs.map((tab, i) => (
              <button
                key={tab}
                ref={(el) => { tabRefs.current[i] = el; }}
                onClick={() => switchTab(tab)}
                className={`relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  activeTab === tab ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden min-h-[300px]" ref={contentRef}>
          <div
            className={`transition-all duration-300 ease-out ${
              animating
                ? `opacity-0 ${direction > 0 ? '-translate-x-4' : 'translate-x-4'}`
                : 'opacity-100 translate-x-0'
            }`}
          >
            {activeTab === 'Ranks' && <RanksPanel isInCart={isInCart} onAdd={handleAdd} />}
            {activeTab === 'Levels' && <LevelsPanel isInCart={isInCart} onAdd={handleAdd} />}
            {activeTab === 'Wins' && <WinsPanel isInCart={isInCart} onAdd={handleAdd} />}
            {activeTab === 'Bundles' && <BundlesPanel />}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Ranks Panel ────────────────────────────────────

function RanksPanel({ isInCart, onAdd }: { isInCart: (id: string) => boolean; onAdd: (id: string, cat: string, label: string, price: number, eta: string) => void }) {
  return (
    <div>
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Boost</th>
              <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Time saved</th>
              <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Delivery</th>
              <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Price</th>
              <th className="px-4 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {rankBoosts.map(b => (
              <tr
                key={b.id}
                className={`border-b border-white/[0.03] last:border-0 transition-colors hover:bg-white/[0.03] ${
                  b.highlight ? 'bg-green-500/[0.03]' : ''
                }`}
              >
                <td className="px-4 py-3.5">
                  <span className={`font-medium ${rankColor[rName(b.from)]}`}>{b.from}</span>
                  <span className="text-neutral-600 mx-1.5">{'\u2192'}</span>
                  <span className={`font-medium ${rankColor[rName(b.to)]}`}>{b.to}</span>
                </td>
                <td className="px-4 py-3.5 text-neutral-500 hidden md:table-cell">{b.note}</td>
                <td className="px-4 py-3.5 hidden sm:table-cell"><EtaBadge eta={b.eta} /></td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`font-semibold ${b.highlight ? 'text-green-400' : 'text-white'}`}>${b.price.toFixed(2)}</span>
                  {b.highlight && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded hidden sm:inline">best value</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <AddBtn onClick={() => onAdd(b.id, 'Rank', `${b.from} \u2192 ${b.to}`, b.price, b.eta)} added={isInCart(b.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-neutral-600">
        Single division boost (e.g. Gold I {'\u2192'} Gold II) — <span className="text-neutral-400">$1.50</span>
      </p>
      <div className="mt-4 p-3 rounded-xl glass-subtle flex items-start gap-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-yellow-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p className="text-xs text-neutral-500 leading-relaxed">
          <span className="text-neutral-400 font-medium">Higher rank boosts take longer.</span> Onyx+ boosts can take 1-2 days. The full Bronze {'\u2192'} Archnemesis run can take 3-5 days depending on queue times and matchmaking.
        </p>
      </div>
    </div>
  );
}

// ─── Levels Panel ───────────────────────────────────

function LevelsPanel({ isInCart, onAdd }: { isInCart: (id: string) => boolean; onAdd: (id: string, cat: string, label: string, price: number, eta: string) => void }) {
  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {levelBoosts.map(l => {
          const count = l.to - l.from;
          return (
            <div key={l.id} className="glass glass-shine rounded-xl p-4 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-start justify-between mb-1">
                <div className="text-white font-semibold">Lvl {l.from} <span className="text-neutral-600 mx-1">{'\u2192'}</span> {l.to}</div>
                <span className="text-lg font-bold text-white">${l.price}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-neutral-600">{count} levels</span>
                <EtaBadge eta={l.eta} />
              </div>
              <div className="w-full bg-white/5 rounded-full h-1 mb-3">
                <div className="bg-green-500/60 h-1 rounded-full" style={{ width: `${Math.round((l.to / 1000) * 100)}%` }} />
              </div>
              <AddBtn onClick={() => onAdd(l.id, 'Level', `Level ${l.from} \u2192 ${l.to}`, l.price, l.eta)} added={isInCart(l.id)} />
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-neutral-600">Per 10 levels (any range) — <span className="text-neutral-400">$1.25</span></p>
      <div className="mt-4 p-3 rounded-xl glass-subtle flex items-start gap-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-yellow-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p className="text-xs text-neutral-500 leading-relaxed">
          <span className="text-neutral-400 font-medium">Level 200+ boosts take serious time.</span> The 500 {'\u2192'} 1000 grind can take 2-4 days of play.
        </p>
      </div>
    </div>
  );
}

// ─── Wins Panel ─────────────────────────────────────

function WinsPanel({ isInCart, onAdd }: { isInCart: (id: string) => boolean; onAdd: (id: string, cat: string, label: string, price: number, eta: string) => void }) {
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {winPacks.map(p => {
          const perWin = p.price / p.wins;
          return (
            <div
              key={p.id}
              className={`rounded-xl p-5 text-center glass-shine transition-colors hover:bg-white/[0.04] ${
                p.wins === 100 ? 'glass-green' : 'glass'
              }`}
            >
              <div className="text-3xl font-bold text-white mb-0.5">{p.wins}</div>
              <div className="text-xs text-neutral-500 mb-2">wins</div>
              <div className="text-lg font-bold text-white mb-0.5">${p.price.toFixed(2)}</div>
              <div className="text-[11px] text-neutral-600 mb-2">${perWin.toFixed(2)}/win</div>
              <EtaBadge eta={p.eta} />
              <div className="mt-3">
                <AddBtn onClick={() => onAdd(p.id, 'Wins', `${p.wins} wins`, p.price, p.eta)} added={isInCart(p.id)} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-neutral-600">Per single win — <span className="text-neutral-400">$0.50</span></p>
      <div className="mt-4 p-3 rounded-xl glass-subtle flex items-start gap-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-yellow-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p className="text-xs text-neutral-500 leading-relaxed">
          <span className="text-neutral-400 font-medium">50+ win packs take 1-4 days.</span> Wins depend on match length and queue times.
        </p>
      </div>
    </div>
  );
}

// ─── Bundles Panel ──────────────────────────────────

function BundlesPanel() {
  const DISCORD = 'https://discord.gg/jfDBYWq6Ax';
  return (
    <div>
      <p className="text-sm text-neutral-400 mb-4">
        Bundles are custom — pick your rank boost, level boost, and/or win boost then message me on Discord. I will apply the discount to your total.
      </p>
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        {bundles.map(b => (
          <div key={b.id} className={`rounded-xl p-6 glass-shine transition-colors ${b.best ? 'glass-green' : 'glass hover:bg-white/[0.04]'}`}>
            {b.best && (
              <span className="inline-block text-[10px] font-semibold uppercase tracking-wide bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded mb-3">best deal</span>
            )}
            <div className="text-2xl font-bold text-green-400 mb-2">{b.discount}</div>
            <h3 className="text-white font-semibold mb-1">{b.name}</h3>
            <p className="text-neutral-500 text-sm">{b.desc}</p>
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl glass flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="text-white font-medium text-sm">Want a bundle?</p>
          <p className="text-neutral-500 text-xs mt-0.5">Add items to your cart, then mention you want the bundle discount on Discord.</p>
        </div>
        <a href={DISCORD} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg bg-green-500 text-black hover:bg-green-400 transition-colors">
          Message on Discord
        </a>
      </div>
      <div className="mt-4 p-3 rounded-xl glass-subtle flex items-start gap-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5 text-yellow-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p className="text-xs text-neutral-500 leading-relaxed">
          <span className="text-neutral-400 font-medium">Bundle orders are big orders.</span> A full package can take several days to complete.
        </p>
      </div>
    </div>
  );
}
