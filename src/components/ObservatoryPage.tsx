import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function ObservatoryPage() {
  const vault = useVault() as any;
  const files: any[] = vault?.files || vault?.items || [];

  const stats = useMemo(() => {
    const list = Array.isArray(files) ? files : [];
    const total = list.reduce((s, f) => s + (Number(f.size) || 0), 0);
    const types = new Map<string, number>();
    for (const f of list) {
      const t = String(f.type || f.mime || 'other').split('/')[0] || 'other';
      types.set(t, (types.get(t) || 0) + 1);
    }
    return {
      count: list.length,
      total,
      types: [...types.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [files]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">observatory</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a glance at what is already in the vault.</h1>
          <p className="text-neutral-400 text-sm mb-7">counts only. no new upload path.</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="glass rounded-[24px] p-5">
              <p className="text-xs text-neutral-500 mb-1">files</p>
              <p className="text-3xl font-semibold tracking-tight">{stats.count}</p>
            </div>
            <div className="glass rounded-[24px] p-5">
              <p className="text-xs text-neutral-500 mb-1">weight</p>
              <p className="text-3xl font-semibold tracking-tight">{pretty(stats.total)}</p>
            </div>
          </div>
          <div className="glass rounded-[28px] p-5 space-y-3">
            {stats.types.map(([t, n]) => (
              <div key={t} className="flex items-center justify-between text-sm">
                <span className="text-neutral-300 capitalize">{t}</span>
                <span className="text-neutral-500">{n}</span>
              </div>
            ))}
            {!stats.types.length && <p className="text-sm text-neutral-500">vault is empty on this device</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
