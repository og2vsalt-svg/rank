import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const BODIES = [
  { name: 'mercury', days: 88, size: 6 },
  { name: 'venus', days: 225, size: 9 },
  { name: 'earth', days: 365, size: 10 },
  { name: 'mars', days: 687, size: 8 },
  { name: 'jupiter', days: 4333, size: 16 },
];

export default function OrreryPage() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const day = Math.floor(now.getTime() / 86400000);

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
          <p className="text-[#0a84ff] text-sm mb-2">orrery</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a desk clock that pretends to be the solar system.</h1>
          <p className="text-neutral-400 text-sm mb-8">
            {now.toLocaleString()} · no files, no upload. just a spinning reminder that time is moving.
          </p>
          <div className="relative mx-auto w-72 h-72 mb-6">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#ffd60a] shadow-[0_0_24px_#ffd60a88]" />
            {BODIES.map((b, i) => {
              const r = 28 + i * 22;
              const ang = ((day % b.days) / b.days) * Math.PI * 2;
              const x = Math.cos(ang) * r;
              const y = Math.sin(ang) * r;
              return (
                <div key={b.name}>
                  <div
                    className="absolute left-1/2 top-1/2 rounded-full border border-white/8"
                    style={{ width: r * 2, height: r * 2, marginLeft: -r, marginTop: -r }}
                  />
                  <div
                    className="absolute left-1/2 top-1/2 rounded-full bg-white/80"
                    style={{
                      width: b.size,
                      height: b.size,
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                    title={b.name}
                  />
                </div>
              );
            })}
          </div>
          <ul className="grid grid-cols-2 gap-2 text-sm text-neutral-400">
            {BODIES.map((b) => (
              <li key={b.name} className="flex justify-between rounded-2xl bg-black/20 px-3 py-2">
                <span>{b.name}</span>
                <span className="tabular-nums text-neutral-500">{b.days}d</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
