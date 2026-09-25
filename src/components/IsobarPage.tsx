import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function IsobarPage() {
  const { files, usedBytes } = useVault();
  const pressure = useMemo(() => {
    const mb = usedBytes / (1024 * 1024);
    const count = files.length;
    const heavies = files.filter((f) => f.size > 20 * 1024 * 1024).length;
    const score = Math.min(100, Math.round(mb * 2 + count * 1.4 + heavies * 8));
    return { mb, count, heavies, score };
  }, [files, usedBytes]);

  const label = pressure.score < 25 ? 'calm' : pressure.score < 55 ? 'steady' : pressure.score < 80 ? 'dense' : 'heavy air';

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">isobar</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">file weather, not storage.</h1>
          <p className="text-sm text-neutral-400 mb-8">reads what is already in the vault and paints pressure. no extra upload desk.</p>
          <div className="relative h-36 rounded-[24px] bg-white/5 overflow-hidden mb-6">
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-[#0a84ff]/40"
              initial={{ height: 0 }}
              animate={{ height: `${pressure.score}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="relative z-10 p-6">
              <p className="text-4xl font-semibold tracking-tight">{pressure.score}</p>
              <p className="text-sm text-neutral-400">{label}</p>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-wide text-neutral-500">held</dt>
              <dd className="text-lg">{pressure.mb.toFixed(1)} mb</dd>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-wide text-neutral-500">items</dt>
              <dd className="text-lg">{pressure.count}</dd>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <dt className="text-[11px] uppercase tracking-wide text-neutral-500">chunky</dt>
              <dd className="text-lg">{pressure.heavies}</dd>
            </div>
          </dl>
          <p className="text-xs text-neutral-500 mt-6">we never block a drop. high pressure just means the tab might feel slower.</p>
        </motion.div>
      </div>
    </div>
  );
}
