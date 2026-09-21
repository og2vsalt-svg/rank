import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function fmt(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function GaugePage() {
  const [quota, setQuota] = useState<{ usage: number; quota: number } | null>(null);
  const [ls, setLs] = useState(0);

  useEffect(() => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      total += k.length + (localStorage.getItem(k) || '').length;
    }
    setLs(total * 2);
    const est = (navigator as any).storage?.estimate;
    if (est) {
      est().then((e: any) => setQuota({ usage: e.usage || 0, quota: e.quota || 0 })).catch(() => {});
    }
  }, []);

  const warn = ls > 4 * 1024 * 1024 || (quota && quota.usage > 80 * 1024 * 1024);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">gauge</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">device pulse</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">no hard file cap. just a heads up when this browser might feel slow.</p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-6 space-y-4">
            <div>
              <p className="text-xs text-neutral-500">local storage footprint</p>
              <p className="text-2xl font-semibold tracking-tight mt-1">{fmt(ls)}</p>
            </div>
            {quota && (
              <div>
                <p className="text-xs text-neutral-500">browser storage estimate</p>
                <p className="text-2xl font-semibold tracking-tight mt-1">{fmt(quota.usage)} <span className="text-sm text-neutral-500 font-normal">of {fmt(quota.quota)}</span></p>
              </div>
            )}
            {warn && <p className="text-sm text-amber-300/90">this tab might get sluggish with huge drops. nothing is blocked — just a slowness warning.</p>}
            {!warn && <p className="text-sm text-neutral-500">looking light. drop files as you like.</p>}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
