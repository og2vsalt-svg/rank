import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function SummitPage() {
  const { files } = useVault() as any;
  const stats = useMemo(() => {
    const list = files || [];
    const total = list.reduce((a: number, f: any) => a + (Number(f.size) || 0), 0);
    const kinds: Record<string, number> = {};
    list.forEach((f: any) => {
      const k = (f.type || 'other').split('/')[0] || 'other';
      kinds[k] = (kinds[k] || 0) + 1;
    });
    const biggest = [...list].sort((a: any, b: any) => (b.size || 0) - (a.size || 0))[0];
    return { count: list.length, total, kinds, biggest, sleepy: total > 80 * 1024 * 1024 };
  }, [files]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">summit</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">how tall is this vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">counts and weights from whatever is already on this device. no upload, no cap.</p>
          {stats.sleepy && <p className="text-xs text-amber-300/80 mb-4">this pile is heavy. scrolling previews might hitch.</p>}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
              <p className="text-xs text-neutral-500">files</p>
              <p className="text-2xl font-semibold">{stats.count}</p>
            </div>
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4">
              <p className="text-xs text-neutral-500">weight</p>
              <p className="text-2xl font-semibold">{pretty(stats.total)}</p>
            </div>
          </div>
          <ul className="space-y-2 mb-6">
            {Object.entries(stats.kinds).map(([k, v]) => (
              <li key={k} className="flex justify-between text-sm text-neutral-300">
                <span className="capitalize">{k}</span>
                <span className="text-neutral-500">{v}</span>
              </li>
            ))}
          </ul>
          {stats.biggest && (
            <p className="text-xs text-neutral-500 truncate">largest · {stats.biggest.name} · {pretty(stats.biggest.size || 0)}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
