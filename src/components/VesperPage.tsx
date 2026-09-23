import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { useRouter } from './Router';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function VesperPage() {
  const { files } = useVault();
  const { navigate } = useRouter();
  const stats = useMemo(() => {
    const total = files.reduce((n, f) => n + f.size, 0);
    const today = new Date().toDateString();
    const fresh = files.filter((f) => new Date(f.createdAt).toDateString() === today);
    const pub = files.filter((f) => f.public);
    const latest = [...files].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);
    return { total, fresh: fresh.length, pub: pub.length, latest, count: files.length };
  }, [files]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">vesper</p>
          <h1 className="text-3xl font-semibold mb-3">tonight’s readout.</h1>
          <p className="text-neutral-400 text-sm mb-6">what landed today, what’s public, how heavy the vault feels. no caps.</p>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              [String(stats.count), 'files'],
              [pretty(stats.total), 'held'],
              [String(stats.fresh), 'today'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-white/5 p-4">
                <p className="text-white text-lg font-medium">{v}</p>
                <p className="text-xs text-neutral-500">{l}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-neutral-500 mb-3">{stats.pub} public drops</p>
          <div className="space-y-2">
            {stats.latest.map((f) => (
              <button key={f.id} onClick={() => navigate('share', f.id)} className="w-full text-left text-sm text-neutral-300 hover:text-white">
                {f.name}
              </button>
            ))}
            {!stats.latest.length && <p className="text-sm text-neutral-600">nothing in the vault yet.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
