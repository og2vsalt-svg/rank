import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function SiloPage() {
  const vault = useVault() as any;
  const { navigate } = useRouter();
  const [filter, setFilter] = useState('');
  const files = (vault?.files || vault?.items || []) as any[];
  const list = Array.isArray(files) ? files : [];

  const stats = useMemo(() => {
    const total = list.reduce((s, f) => s + (Number(f.size) || 0), 0);
    const heavy = list.filter((f) => (Number(f.size) || 0) > 40 * 1024 * 1024);
    return { total, count: list.length, heavy: heavy.length };
  }, [list]);

  const shown = list.filter((f) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return String(f.name || '').toLowerCase().includes(q);
  });

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">silo</p>
          <h1 className="text-3xl font-semibold mb-3">how heavy is this vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">no cap on size. just a glance so you know when the tab might start dragging.</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { k: 'files', v: String(stats.count) },
              { k: 'held', v: pretty(stats.total) },
              { k: 'chunky', v: String(stats.heavy) },
            ].map((c) => (
              <div key={c.k} className="rounded-2xl bg-white/5 border border-white/8 px-4 py-4">
                <p className="text-[11px] text-neutral-500 uppercase tracking-wide">{c.k}</p>
                <p className="text-xl font-semibold mt-1">{c.v}</p>
              </div>
            ))}
          </div>
          {stats.heavy > 0 && (
            <p className="text-xs text-amber-300/80 mb-4">a few files are over 40mb. preview and encode can feel slow. still allowed.</p>
          )}
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="filter by name"
            className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {shown.length === 0 && <p className="text-sm text-neutral-500">nothing in the silo yet. drop something first.</p>}
            {shown.slice(0, 80).map((f) => (
              <div key={f.id || f.name} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm truncate">{f.name || 'untitled'}</p>
                  <p className="text-[11px] text-neutral-500">{pretty(Number(f.size) || 0)}{f.public ? ' · public' : ''}</p>
                </div>
                {f.id && (
                  <button onClick={() => navigate('share', f.id)} className="text-xs text-[#0a84ff] shrink-0">open</button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
