import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function RafterPage() {
  const [usage, setUsage] = useState<{ used: number; quota: number } | null>(null);
  const [keys, setKeys] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (navigator.storage?.estimate) {
          const est = await navigator.storage.estimate();
          if (alive) setUsage({ used: Number(est.usage) || 0, quota: Number(est.quota) || 0 });
        }
      } catch {}
      try {
        setKeys(localStorage.length);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  const pct = usage && usage.quota ? Math.min(100, Math.round((usage.used / usage.quota) * 100)) : 0;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">rafter</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">how heavy this browser is.</h1>
          <p className="text-neutral-400 text-sm mb-6">storage glance only. nothing uploads. if the vault feels slow, this is why — not a hard file limit.</p>
          <div className="rounded-[24px] bg-white/[0.03] border border-white/8 p-5">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: pct + '%' }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-[#0a84ff]"
              />
            </div>
            <p className="text-sm text-white mt-4">{usage ? `${pretty(usage.used)} used of ${pretty(usage.quota)}` : 'storage estimate not available'}</p>
            <p className="text-xs text-neutral-500 mt-1">{keys} local keys sitting in this origin</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
