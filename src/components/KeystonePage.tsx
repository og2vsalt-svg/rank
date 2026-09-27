import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

const KEY = 'rankvault-keystone';

export default function KeystonePage() {
  const [id, setId] = useState('');
  const [pins, setPins] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });
  const [meta, setMeta] = useState<CloudMeta | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(pins.slice(0, 24)));
  }, [pins]);

  const look = async (target: string) => {
    const clean = target.trim();
    if (!clean) return;
    setErr('');
    setMeta(null);
    const row = await fetchShare(clean);
    if (!row) {
      setErr('no live share for that id');
      return;
    }
    setMeta(row);
    setPins((p) => [clean, ...p.filter((x) => x !== clean)].slice(0, 24));
  };

  const urls = meta ? shareUrls(meta.id) : null;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">keystone</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pin a live drop, copy the discord card.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. looks up an id, keeps recent pins in this browser, hands you /s for discord.</p>
          <div className="flex gap-2">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#0a84ff]/50" />
            <button onClick={() => look(id)} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">look</button>
          </div>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {meta && urls && (
            <div className="mt-6 rounded-2xl bg-white/[0.04] border border-white/8 p-5">
              <p className="text-white font-medium">{meta.name}</p>
              <p className="text-xs text-neutral-500 mt-1">{meta.type} · {meta.size} bytes</p>
              <p className="text-xs text-neutral-400 mt-3 break-all">discord: {urls.embed}</p>
              <p className="text-xs text-neutral-500 mt-1 break-all">app: {urls.app}</p>
            </div>
          )}
          {pins.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {pins.map((p) => (
                <button key={p} onClick={() => { setId(p); look(p); }} className="px-3 py-1.5 rounded-full bg-white/5 text-xs text-neutral-300 hover:text-white">{p}</button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
