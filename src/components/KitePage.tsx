import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function KitePage() {
  const [link, setLink] = useState('');
  const [mins, setMins] = useState(15);
  const [end, setEnd] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!end) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [end]);

  const left = end ? Math.max(0, end - now) : 0;
  const label = useMemo(() => {
    const s = Math.floor(left / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  }, [left]);

  const start = () => {
    setEnd(Date.now() + Math.max(1, mins) * 60 * 1000);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">kite</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a timer for a drop link.</h1>
          <p className="text-neutral-400 text-sm mb-6">park a /s or #share url and watch the clock. this is not the vault and it does not upload anything.</p>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="paste a share link"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <div className="flex items-center gap-3 mt-4">
            <input
              type="number"
              min={1}
              value={mins}
              onChange={(e) => setMins(Number(e.target.value) || 1)}
              className="w-24 bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm outline-none"
            />
            <span className="text-xs text-neutral-500">minutes</span>
            <button onClick={start} className="ml-auto px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">fly</button>
          </div>
          {end && (
            <div className="mt-10 text-center">
              <p className="text-6xl font-semibold tracking-tight tabular-nums">{left ? label : 'down'}</p>
              <p className="text-xs text-neutral-500 mt-3 break-all">{link || 'no link parked'}</p>
              {link && (
                <a href={link} className="inline-block mt-5 text-sm text-[#0a84ff]">open the drop</a>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
