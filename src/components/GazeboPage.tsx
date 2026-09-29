import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function GazeboPage() {
  const [id, setId] = useState('');
  const [row, setRow] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const look = async () => {
    const clean = id.trim().replace(/^.*[/=]/, '');
    if (!clean) return;
    setBusy(true);
    setErr('');
    setRow(null);
    try {
      const meta = await fetchShare(clean);
      if (!meta) throw new Error('no public drop under that id');
      setRow(meta);
      setId(clean);
    } catch (e) {
      setErr(e?.message || 'not found');
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
          <p className="text-[#0a84ff] text-sm mb-2">gazebo</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">sit with a public id.</h1>
          <p className="text-neutral-400 text-sm mb-6">paste a share id. copy the discord embed path without touching the vault.</p>
          <div className="flex gap-2">
            <input value={id} onChange={(e) => setId(e.target.value)} className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" placeholder="share id" />
            <button onClick={look} disabled={busy} className="rounded-full bg-[#0a84ff] text-white text-sm px-5 py-2.5 disabled:opacity-40">{busy ? 'looking' : 'open'}</button>
          </div>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {row && urls && (
            <div className="mt-6 space-y-2 text-sm">
              <p className="text-white">{row.name}</p>
              <p className="text-xs text-neutral-500">{row.type} · {row.size} bytes</p>
              <p className="text-xs text-neutral-400 break-all">discord: {urls.embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {urls.app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
