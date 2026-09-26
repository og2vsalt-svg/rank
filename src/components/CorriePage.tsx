import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

function prettySize(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function CorriePage() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [card, setCard] = useState<{ name: string; type: string; size: number; embed: string; app: string; author?: string | null } | null>(null);

  const look = async () => {
    const clean = id.trim();
    if (!clean) return;
    setBusy(true);
    setErr('');
    setCard(null);
    try {
      const row = await fetchShare(clean);
      if (!row) {
        setErr('nothing sitting in that hollow');
        return;
      }
      const urls = shareUrls(row.id);
      setCard({
        name: row.name,
        type: row.type,
        size: row.size,
        embed: urls.embed,
        app: urls.app,
        author: row.author,
      });
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'corrie went quiet');
    } finally {
      setBusy(false);
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
          <p className="text-[#0a84ff] text-sm mb-2">corrie</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sit with a live share. copy the card.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            look up an id already on the share db. preview the facts, copy the discord /s embed. not a vault grid.
          </p>
          <div className="flex gap-2">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') look(); }}
              className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-[#0a84ff]/50"
              placeholder="share id"
            />
            <button
              type="button"
              onClick={look}
              disabled={busy}
              className="px-4 py-2.5 rounded-2xl bg-white text-black text-sm font-medium hover:bg-neutral-200 transition disabled:opacity-50"
            >
              {busy ? 'looking…' : 'look'}
            </button>
          </div>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {card && (
            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5 space-y-2">
              <p className="text-white font-medium truncate">{card.name}</p>
              <p className="text-xs text-neutral-500">{card.type || 'file'} · {prettySize(card.size)}{card.author ? ` · ${card.author}` : ''}</p>
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {card.embed}</p>
              <p className="text-xs text-neutral-500 break-all">app link: {card.app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
