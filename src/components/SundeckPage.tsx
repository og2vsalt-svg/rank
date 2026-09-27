import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function SundeckPage() {
  const [id, setId] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [card, setCard] = useState<{ name: string; size: number; type: string; embed: string; app: string } | null>(null);

  const peek = async () => {
    setErr('');
    setCard(null);
    const clean = id.trim();
    if (!clean) return;
    const meta = await fetchShare(clean);
    if (!meta) {
      setErr('that id is not live in the share db');
      return;
    }
    const urls = shareUrls(meta.id);
    setCard({
      name: meta.name,
      size: meta.size,
      type: meta.type,
      embed: urls.embed,
      app: urls.app,
    });
    try {
      await navigator.clipboard.writeText(urls.embed);
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
          <p className="text-[#0a84ff] text-sm mb-2">sundeck</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sit with a live drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. paste a share id, attach a private note in this tab, copy the discord /s card.
          </p>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="share id"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 mb-3"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="private note. stays here."
            rows={4}
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 mb-4 resize-none"
          />
          <button
            onClick={peek}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition"
          >
            peek and copy embed
          </button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {card && (
            <div className="mt-6 space-y-1 text-xs text-neutral-400">
              <p className="text-white">{card.name}</p>
              <p>{card.type} · {card.size} bytes</p>
              {note && <p className="text-neutral-500">note: {note}</p>}
              <p className="break-all">discord: {card.embed}</p>
              <p className="break-all text-neutral-500">app: {card.app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
