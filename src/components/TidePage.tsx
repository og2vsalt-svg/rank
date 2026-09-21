import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Tide = { id: string; label: string; at: number };
const KEY = 'rankvault-tide';

export default function TidePage() {
  const [label, setLabel] = useState('');
  const [when, setWhen] = useState('');
  const [now, setNow] = useState(Date.now());
  const [tides, setTides] = useState<Tide[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(tides));
  }, [tides]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  function add() {
    if (!when) return;
    setTides((t) => [{ id: crypto.randomUUID(), label: label.trim() || 'unnamed tide', at: +new Date(when) }, ...t]);
    setLabel('');
  }

  function left(at: number) {
    const d = at - now;
    if (d <= 0) return 'passed';
    const s = Math.floor(d / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m ${s % 60}s`;
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">tide</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">share timers</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">track when a public drop should fade. timers live here, files stay in the vault.</p>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-5 space-y-3">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="what expires" className="w-full bg-black/30 rounded-2xl px-4 py-3 text-sm text-white outline-none border border-white/10" />
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full bg-black/30 rounded-2xl px-4 py-3 text-sm text-white outline-none border border-white/10" />
            <motion.button whileTap={{ scale: 0.98 }} onClick={add} className="w-full rounded-full bg-white text-black text-sm font-medium py-2.5">set tide</motion.button>
          </motion.div>
          <ul className="mt-6 space-y-2">
            {tides.map((t) => (
              <li key={t.id} className="glass rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-white">{t.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{left(t.at)}</p>
                </div>
                <button onClick={() => setTides((all) => all.filter((x) => x.id !== t.id))} className="text-xs text-neutral-500">clear</button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
