import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function TimerPage() {
  const [mins, setMins] = useState(5);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(5 * 60);
  const [label, setLabel] = useState('focus');

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const display = useMemo(() => {
    const m = Math.floor(left / 60);
    const s = left % 60;
    return `${pad(m)}:${pad(s)}`;
  }, [left]);

  const start = () => {
    setLeft(Math.max(1, mins) * 60);
    setRunning(true);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[36px] p-10 text-center">
          <p className="text-[#0a84ff] text-sm mb-2">timer desk</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a clock that is not a vault.</h1>
          <p className="text-neutral-400 text-sm mb-8">set a quiet countdown while a file encodes. no files live here.</p>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="mb-6 bg-transparent text-center text-neutral-400 text-sm outline-none border-b border-white/10 pb-1 w-40" />
          <motion.p key={display} initial={{ opacity: 0.6, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-7xl font-semibold tracking-tight mb-8 tabular-nums">
            {display}
          </motion.p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <input type="number" min={1} value={mins} onChange={(e) => setMins(Number(e.target.value) || 1)} className="w-20 text-center rounded-full bg-white/5 border border-white/10 py-2 text-sm" />
            <span className="text-xs text-neutral-500">minutes</span>
          </div>
          <div className="flex justify-center gap-2">
            <button onClick={start} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">start</button>
            <button onClick={() => setRunning((v) => !v)} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">{running ? 'pause' : 'resume'}</button>
            <button onClick={() => { setRunning(false); setLeft(mins * 60); }} className="px-5 py-2.5 rounded-full bg-white/5 text-sm">reset</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
