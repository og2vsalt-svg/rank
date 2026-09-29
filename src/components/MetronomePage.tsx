import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function MetronomePage() {
  const [bpm, setBpm] = useState(96);
  const [on, setOn] = useState(false);
  const [beat, setBeat] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!on) return;
    const interval = 60000 / Math.max(30, Math.min(240, bpm));
    const id = window.setInterval(() => {
      setBeat((b) => (b + 1) % 4);
      try {
        const ctx = ctxRef.current || new AudioContext();
        ctxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = beat % 4 === 3 ? 880 : 660;
        gain.gain.value = 0.04;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      } catch {}
    }, interval);
    return () => window.clearInterval(id);
  }, [on, bpm, beat]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">metronome</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet click. nothing leaves the room.</h1>
          <p className="text-neutral-400 text-sm mb-8">keep time while you name a file. this is not a vault.</p>
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-6xl font-semibold tracking-tight tabular-nums">{bpm}</p>
              <p className="text-neutral-500 text-sm mt-1">beats each minute</p>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-150 ${
                    on && beat === i ? 'bg-[#0a84ff] scale-125' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>
          </div>
          <input
            type="range"
            min={40}
            max={208}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-[#0a84ff] mb-6"
          />
          <button
            onClick={() => setOn((v) => !v)}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium"
          >
            {on ? 'rest' : 'keep time'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
