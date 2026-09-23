import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Shot = { name: string; url: string; size: number };

function pretty(n: number) {
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / 1024 / 1024).toFixed(1) + ' mb';
}

export default function LumenPage() {
  const input = useRef<HTMLInputElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [active, setActive] = useState(0);
  const [warn, setWarn] = useState('');

  function onFiles(list: FileList | null) {
    if (!list?.length) return;
    const next: Shot[] = [];
    let heavy = false;
    Array.from(list).forEach((f) => {
      if (!f.type.startsWith('image/')) return;
      if (f.size > 25 * 1024 * 1024) heavy = true;
      next.push({ name: f.name, url: URL.createObjectURL(f), size: f.size });
    });
    setWarn(heavy ? 'no limit. giant stills just take a beat to paint.' : '');
    setShots((prev) => [...next, ...prev]);
    setActive(0);
  }

  const shot = shots[active];

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">lumen</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a light table, not a vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            preview stills on this device before they ever hit the share db. nothing leaves the tab unless you take them to quay or drop.
          </p>
          <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => input.current?.click()}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium mb-5"
          >
            lay stills down
          </motion.button>
          {warn && <p className="text-[12px] text-amber-300/80 mb-4">{warn}</p>}
          {shot ? (
            <div>
              <motion.img
                key={shot.url}
                src={shot.url}
                alt={shot.name}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-h-[420px] object-contain rounded-2xl bg-black/40 mb-4"
              />
              <p className="text-sm text-white mb-1">{shot.name}</p>
              <p className="text-[11px] text-neutral-500 mb-4">{pretty(shot.size)}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {shots.map((s, i) => (
                  <button
                    key={s.url}
                    onClick={() => setActive(i)}
                    className={`h-14 w-14 rounded-xl overflow-hidden border ${i === active ? 'border-white' : 'border-white/10'}`}
                  >
                    <img src={s.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">table is dark. drop a still.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
