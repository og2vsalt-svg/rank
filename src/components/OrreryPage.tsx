import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const BODIES = [
  { name: 'mercury', period: 8 },
  { name: 'venus', period: 14 },
  { name: 'earth', period: 22 },
  { name: 'mars', period: 34 },
];

export default function OrreryPage() {
  const [now, setNow] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(() => {
    try { return localStorage.getItem('rank-orrery-note') || ''; } catch { return ''; }
  });

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const keep = () => {
    setSaved(note);
    try { localStorage.setItem('rank-orrery-note', note); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7 overflow-hidden">
          <p className="text-[#0a84ff] text-sm mb-2">orrery</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet clock, not a vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">four rings turn against the local time. pin a one-line note in this tab. nothing is hosted.</p>
          <div className="relative mx-auto mb-8 h-56 w-56">
            {BODIES.map((b, i) => (
              <motion.div
                key={b.name}
                className="absolute inset-0 rounded-full border border-white/10"
                style={{ margin: 12 + i * 18 }}
                animate={{ rotate: 360 }}
                transition={{ duration: b.period, repeat: Infinity, ease: 'linear' }}
              >
                <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#0a84ff]" />
              </motion.div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm tabular-nums text-white">{now.toLocaleTimeString()}</p>
            </div>
          </div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="a line to keep by the clock" className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
          <button onClick={keep} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">keep the line</button>
          {saved && <p className="text-xs text-neutral-500 mt-4">kept: {saved}</p>}
        </motion.div>
      </div>
    </div>
  );
}
