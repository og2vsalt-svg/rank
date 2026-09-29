import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function TransomPage() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [row, setRow] = useState<CloudMeta | null>(null);

  const look = async () => {
    setErr('');
    setRow(null);
    const clean = id.trim().replace(/^.*[/=]/, '');
    if (!clean) {
      setErr('paste a drop id or /s link');
      return;
    }
    setBusy(true);
    try {
      const meta = await fetchShare(clean);
      if (!meta) throw new Error('no live public drop for that id');
      setRow(meta);
    } catch (e: any) {
      setErr(e?.message || 'lookup failed');
    } finally {
      setBusy(false);
    }
  };

  const urls = row ? shareUrls(row.id) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">transom</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">peek through a public drop before you pass it on.</h1>
          <p className="text-neutral-400 text-sm mb-6">look up an id from the share db. copy the discord card. nothing else is a vault.</p>
          <div className="flex gap-2 mb-4">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="id or /s/ link" className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none" />
            <button onClick={look} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? 'looking…' : 'open'}</button>
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          {row && urls && (
            <div className="mt-4 space-y-3">
              <p className="text-white font-medium">{row.name}</p>
              <p className="text-xs text-neutral-500">{pretty(row.size)} · {row.type}{row.author ? ' · ' + row.author : ''}</p>
              {row.type.startsWith('image/') && row.url && <img src={row.url} alt="" className="w-full rounded-2xl" />}
              <p className="text-xs text-neutral-400 break-all">discord: {urls.embed}</p>
              <button
                onClick={() => navigator.clipboard.writeText(urls.embed)}
                className="px-5 py-2.5 rounded-full bg-white/8 text-sm"
              >
                copy discord link
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
