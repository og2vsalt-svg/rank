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

function parseId(raw: string) {
  const t = raw.trim();
  try {
    const u = new URL(t, window.location.origin);
    const f = u.hash.includes('f=') ? new URLSearchParams(u.hash.split('?')[1] || '').get('f') : null;
    if (f) return f;
    const m = u.pathname.match(/\/(s|e)\/([^/?#]+)/);
    if (m) return decodeURIComponent(m[2]);
  } catch {}
  return t.replace(/^#?share\?f=/, '').replace(/^\/?s\//, '');
}

export default function WellPage() {
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [meta, setMeta] = useState<CloudMeta | null>(null);

  const look = async () => {
    const id = parseId(raw);
    if (!id) return;
    setBusy(true);
    setErr('');
    setMeta(null);
    try {
      const row = await fetchShare(id);
      if (!row) setErr('nothing in the well for that id');
      else setMeta(row);
    } catch (e: any) {
      setErr(e?.message || 'lookup failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">well</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">peer into a share without opening it.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a /s link, a hash share, or a raw id. reads the public db only.</p>
          <div className="flex gap-2">
            <input
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && look()}
              placeholder="/s/abc or #share?f=abc"
              className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50"
            />
            <button onClick={look} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'looking…' : 'look'}
            </button>
          </div>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {meta && (
            <div className="mt-6 space-y-2 text-sm text-neutral-300">
              <p className="text-white font-medium">{meta.name}</p>
              <p className="text-xs text-neutral-500">{meta.type} · {pretty(meta.size)} · {meta.downloads || 0} opens</p>
              {meta.author && <p className="text-xs text-neutral-500">by {meta.author}</p>}
              <p className="text-xs text-neutral-400 break-all">{shareUrls(meta.id).embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
