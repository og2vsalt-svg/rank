import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function BuoyPage() {
  const [id, setId] = useState('');
  const [err, setErr] = useState('');
  const [card, setCard] = useState<any>(null);

  const look = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = id.trim().replace(/^.*[\/=]/, '');
    if (!raw) return;
    setErr('');
    setCard(null);
    try {
      const meta = await fetchShare(raw);
      if (!meta) {
        setErr('no live public drop for that id');
        return;
      }
      const urls = shareUrls(meta.id);
      setCard({ ...meta, ...urls });
    } catch (e: any) {
      setErr(e?.message || 'lookup failed');
    }
  };

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
          <p className="text-[#0a84ff] text-sm mb-2">buoy</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">preview the discord card for a drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            paste a share id or /s link. we read the public row and show the title discord will unfurl.
          </p>
          <form onSubmit={look} className="flex gap-2">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="id or /s/…"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            />
            <button type="submit" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              mark
            </button>
          </form>
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {card && (
            <div className="mt-6 rounded-2xl border border-white/10 overflow-hidden">
              <div className="h-1.5 bg-[#0A84FF]" />
              <div className="p-5">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">rankvault</p>
                <p className="text-lg font-medium mt-1">{card.name}</p>
                <p className="text-sm text-neutral-400 mt-1">
                  {card.type} · {pretty(card.size)}
                  {card.author ? ` · ${card.author}` : ''}
                </p>
                <p className="text-xs text-neutral-500 mt-3 break-all">{card.embed}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
