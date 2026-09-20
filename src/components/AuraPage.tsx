import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function AuraPage() {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const [on, setOn] = useState(false);
  const [hz, setHz] = useState(220);

  function toggle() {
    if (on) {
      oscRef.current?.stop();
      oscRef.current = null;
      setOn(false);
      return;
    }
    const ctx = ctxRef.current || new AudioContext();
    ctxRef.current = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = 0.04;
    osc.type = 'sine';
    osc.frequency.value = hz;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    oscRef.current = osc;
    setOn(true);
  }

  function setTone(v: number) {
    setHz(v);
    if (oscRef.current) oscRef.current.frequency.setTargetAtTime(v, 0, 0.05);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">aura</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">quiet tone</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">a sine in the tab. nothing to host, nothing to vault.</p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8 text-center">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={toggle}
              className="w-28 h-28 rounded-full mx-auto bg-white text-black font-medium"
            >
              {on ? 'stop' : 'hum'}
            </motion.button>
            <p className="text-xs text-neutral-500 mt-6">{hz} hz</p>
            <input
              type="range"
              min={80}
              max={880}
              value={hz}
              onChange={(e) => setTone(Number(e.target.value))}
              className="w-full mt-4"
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
