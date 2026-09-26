import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare } from '../lib/cloudShare';

export default function CloisterPage() {
  const [id, setId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [meta, setMeta] = useState<any>(null);

  const look = async () => {
    const key = id.trim();
    if (!key) return;
    setBusy(true);
    setErr('');
    setMeta(null);
    try {
      const row = await fetchShare(key);
      if (!row) {
        setErr('nothing in the cloister for that id');
        return;
      }
      setMeta(row);
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
          <p className="text-[#0a84ff] text-sm mb-2">cloister</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read a drop without the noise.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. we pull metadata from the db and keep the room quiet.</p>
          <div className="flex gap-2">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="share id"
              className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50"
            />
            <button onClick={look} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">
              {busy ? 'looking…' : 'open'}
            </button>
          </div>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {meta && (
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-white">{meta.name}</p>
              <p className="text-neutral-500">{meta.type} · {meta.size} bytes</p>
              {meta.author && <p className="text-neutral-500">by {meta.author}</p>}
              <a className="text-[#0a84ff] text-xs break-all block" href={meta.url} target="_blank" rel="noreferrer">open bytes</a>
              <p className="text-xs text-neutral-500 break-all">discord card: {typeof window !== 'undefined' ? window.location.origin : ''}/s/{meta.id}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
