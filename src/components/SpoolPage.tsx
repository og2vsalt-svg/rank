import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function SpoolPage() {
  const [id, setId] = useState('');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const clean = id.trim();
  const links = clean
    ? [
        { label: 'app', href: `${origin}/#share?f=${clean}` },
        { label: 'discord card', href: `${origin}/s/${clean}` },
        { label: 'file alias', href: `${origin}/file/${clean}` },
        { label: 'short g', href: `${origin}/g/${clean}` },
      ]
    : [];

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">spool</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">spin share urls.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. get every embed-friendly alias so discord unfurls a clean card.</p>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="share id"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 transition"
          />
          <div className="mt-6 space-y-2">
            {links.map((l) => (
              <div key={l.label} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500">{l.label}</p>
                  <p className="text-sm text-neutral-200 truncate">{l.href}</p>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(l.href)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
                >
                  copy
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
