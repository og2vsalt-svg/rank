import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const A = ['quiet', 'amber', 'slate', 'pine', 'dusk', 'hollow', 'brine', 'copper', 'mist', 'sable'];
const B = ['harbor', 'loft', 'ridge', 'well', 'orchard', 'kiln', 'quay', 'grove', 'hearth', 'nook'];

function nick(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const x = Math.abs(h);
  return `${A[x % A.length]}-${B[(x >> 4) % B.length]}-${(x % 97).toString().padStart(2, '0')}`;
}

export default function TetherPage() {
  const [seed, setSeed] = useState(() => {
    try {
      return localStorage.getItem('rank.tether') || 'desk';
    } catch {
      return 'desk';
    }
  });
  const name = useMemo(() => nick(seed || 'desk'), [seed]);

  const persist = (v: string) => {
    setSeed(v);
    try {
      localStorage.setItem('rank.tether', v);
    } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">tether</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a stable nickname for this browser.</h1>
          <p className="text-neutral-400 text-sm mb-6">hash a phrase locally. useful when you share drops and want a human tag, not an account.</p>
          <input
            value={seed}
            onChange={(e) => persist(e.target.value)}
            placeholder="any phrase"
            className="w-full bg-white/5 rounded-2xl px-4 py-3 text-white outline-none mb-6"
          />
          <p className="text-4xl font-semibold tracking-tight text-white">{name}</p>
          <button
            onClick={() => navigator.clipboard.writeText(name).catch(() => {})}
            className="mt-6 text-sm text-[#0a84ff]"
          >
            copy name
          </button>
        </motion.div>
      </div>
    </div>
  );
}
