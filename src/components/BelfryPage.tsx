import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function BelfryPage() {
  const [secs, setSecs] = useState(0);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => setSecs((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [running]);

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">belfry</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet chime for this tab.</h1>
          <p className="text-neutral-400 text-sm mb-8">not a vault. keep time while a file encodes. nothing leaves the device.</p>
          <p className="text-6xl font-semibold tracking-tight tabular-nums mb-6">{mm}:{ss}</p>
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setRunning(true)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">start</button>
            <button onClick={() => setRunning(false)} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">pause</button>
            <button onClick={() => { setRunning(false); setSecs(0); }} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">reset</button>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-3xl bg-white/5 border border-white/10 text-sm outline-none"
            placeholder="a local slip while you wait"
          />
        </motion.div>
      </div>
    </div>
  );
}
