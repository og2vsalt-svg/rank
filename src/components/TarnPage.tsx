import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls } from '../lib/cloudShare';

export default function TarnPage() {
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
        setErr('nothing in that tarn');
        return;
      }
      setMeta(row);
    } catch (e: any) {
      setErr(e?.message || 'tarn stayed still');
    } finally {
      setBusy(false);
    }
  };

  const urls = meta ? shareUrls(meta.id) : null;

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
          <p className="text-[#0a84ff] text-sm mb-2">tarn</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">look into a live drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            type a share id. we pull facts from the share db and hand you the discord /s card. no vault grid.
          </p>
          <div className="flex gap-2">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && look()}
              placeholder="share id"
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/40"
            />
            <button
              onClick={look}
              disabled={busy}
              className="px-4 rounded-2xl bg-white text-black text-sm font-medium disabled:opacity-50"
            >
              {busy ? 'looking…' : 'look'}
            </button>
          </div>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {meta && (
            <div className="mt-6 space-y-2 text-sm text-neutral-300">
              <p className="text-white font-medium break-all">{meta.name}</p>
              <p className="text-neutral-500 text-xs">{meta.type} · {meta.size} bytes</p>
              {urls && (
                <>
                  <p className="text-xs text-neutral-400 break-all">discord embed: {urls.embed}</p>
                  <p className="text-xs text-neutral-500 break-all">app link: {urls.app}</p>
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
