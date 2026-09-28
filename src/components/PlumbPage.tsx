import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function PlumbPage() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [row, setRow] = useState<any>(null);

  const look = async () => {
    const clean = id.trim();
    if (!clean) return;
    setBusy(true);
    setErr('');
    setRow(null);
    try {
      const meta = await fetchShare(clean);
      if (!meta) throw new Error('no live public drop for that id');
      setRow(meta);
    } catch (e: any) {
      setErr(e?.message || 'plumb failed');
    } finally {
      setBusy(false);
    }
  };

  const urls = row ? shareUrls(row.id) : null;

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
          <p className="text-[#0a84ff] text-sm mb-2">plumb</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">look up a public drop by id.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            checks the share db. useful when a discord card should exist and you want the facts.
          </p>
          <div className="flex gap-2">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && look()}
              className="flex-1 rounded-full bg-black/30 border border-white/10 px-4 py-2 text-sm outline-none focus:border-[#0a84ff]/50"
              placeholder="share id"
            />
            <button onClick={look} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'checking…' : 'plumb'}
            </button>
          </div>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {row && (
            <div className="mt-6 text-sm text-neutral-300 space-y-1">
              <p>{row.name}</p>
              <p className="text-neutral-500">{pretty(row.size)} · {row.type}</p>
              {urls && <p className="text-xs text-neutral-400 break-all">discord: {urls.embed}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
