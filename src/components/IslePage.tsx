import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function IslePage() {
  const [id, setId] = useState('');
  const [page, setPage] = useState('vault');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const shareEmbed = useMemo(() => (id.trim() ? `${origin}/s/${id.trim()}` : ''), [id, origin]);
  const pageEmbed = useMemo(() => `${origin}/s?page=${encodeURIComponent(page.trim() || 'home')}`, [page, origin]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">isle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">discord card lab.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            every public link already serves og + twitter tags via /s. this desk just builds the url so you can paste it into discord and see the pro card.
          </p>
          <label className="block text-xs text-neutral-500 mb-2">share id</label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="drop id"
            className="w-full mb-4 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          {shareEmbed && (
            <div className="mb-6">
              <p className="text-xs text-neutral-500 mb-1">file embed</p>
              <p className="text-sm break-all text-white">{shareEmbed}</p>
              <button onClick={() => navigator.clipboard.writeText(shareEmbed)} className="mt-2 px-4 py-2 rounded-full bg-white text-black text-sm font-medium">
                copy file embed
              </button>
            </div>
          )}
          <label className="block text-xs text-neutral-500 mb-2">desk name</label>
          <input
            value={page}
            onChange={(e) => setPage(e.target.value)}
            className="w-full mb-4 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
          />
          <p className="text-xs text-neutral-500 mb-1">page embed</p>
          <p className="text-sm break-all text-white">{pageEmbed}</p>
          <button onClick={() => navigator.clipboard.writeText(pageEmbed)} className="mt-3 px-4 py-2 rounded-full bg-white/10 text-sm">
            copy page embed
          </button>
        </motion.div>
      </div>
    </div>
  );
}
