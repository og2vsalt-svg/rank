import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const rooms = [
  { to: 'rivulet', title: 'rivulet', blurb: 'label a file then send it downstream' },
  { to: 'oxbow', title: 'oxbow', blurb: 'wander public drops already on the water' },
  { to: 'spar', title: 'spar', blurb: 'inspect a local file without uploading' },
  { to: 'trestle', title: 'trestle', blurb: 'walk several files onto the share db' },
  { to: 'vault', title: 'vault', blurb: 'the quiet locker you already know' },
  { to: 'drop', title: 'drop', blurb: 'single file, straight to a share card' },
];

export default function CopsePage() {
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const shown = rooms.filter((r) => r.title.includes(q.toLowerCase()) || r.blurb.includes(q.toLowerCase()));

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[#0a84ff] text-sm mb-2">copse</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a small stand of rooms around the vault.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            file hosting stays the center. these are just other trees in the same clearing.
          </p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter rooms"
            className="w-full mb-6 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            {shown.map((r) => (
              <button
                key={r.to}
                onClick={() => navigate(r.to)}
                className="text-left glass rounded-[24px] p-5 hover:border-[#0a84ff]/40 border border-transparent transition"
              >
                <p className="text-white font-medium">{r.title}</p>
                <p className="text-xs text-neutral-500 mt-1">{r.blurb}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
