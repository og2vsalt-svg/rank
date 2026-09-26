import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function TrussPage() {
  const [raw, setRaw] = useState('');
  const id = raw.trim().replace(/^.*[?#/](?:f=)?/, '').replace(/[^a-z0-9_-]/gi, '');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const cards = id
    ? [
        `${origin}/s/${id}`,
        `${origin}/f/${id}`,
        `${origin}/embed/${id}`,
        `${origin}/share/${id}`,
        `${origin}/drop/${id}`,
        `${origin}/card/${id}`,
        `${origin}/flitch/${id}`,
      ]
    : [];

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
          <p className="text-[#0a84ff] text-sm mb-2">truss</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">every discord card for one drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. copy the pretty unfurl urls. same file, different beams.</p>
          <input
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-5"
            placeholder="share id or link"
          />
          <div className="space-y-2">
            {cards.map((u) => (
              <button
                key={u}
                onClick={async () => { try { await navigator.clipboard.writeText(u); } catch {} }}
                className="block w-full text-left text-xs text-neutral-300 bg-white/5 hover:bg-white/8 rounded-2xl px-4 py-3 break-all transition"
              >
                {u}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
