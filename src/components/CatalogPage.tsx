import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const desks = [
  ['vault', 'your files, local first'],
  ['drop', 'upload then publish'],
  ['gauge', 'weigh files on device'],
  ['share', 'open a public drop'],
  ['gnomon', 'file clock'],
  ['laneway', 'short names'],
  ['thimble', 'tiny notes'],
  ['kindling', 'note plus file'],
  ['nave', 'signed drop'],
  ['bazaar', 'browse public files'],
  ['moss', 'discord card'],
  ['lichen', 'preview card'],
  ['glacier', 'file fingerprint'],
  ['copper', 'compare hashes'],
  ['willow', 'strip photo tags'],
  ['studio', 'write then publish'],
].map(([id, blurb]) => ({ id, blurb }));

export default function CatalogPage() {
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return desks;
    return desks.filter((d) => d.id.includes(s) || d.blurb.toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">catalog</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">find a desk without hunting the menu.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just a quiet index of rooms.</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search desks"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            {list.map((d, i) => (
              <motion.button
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03 }}
                onClick={() => navigate(d.id)}
                className="text-left glass rounded-2xl p-5 hover:-translate-y-0.5 transition"
              >
                <p className="text-white font-medium">{d.id}</p>
                <p className="text-xs text-neutral-500 mt-1">{d.blurb}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
