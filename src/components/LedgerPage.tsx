import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare, shareUrls, type CloudMeta } from '../lib/cloudShare';

const KEY = 'rankvault-ledger';

export default function LedgerPage() {
  const [id, setId] = useState('');
  const [rows, setRows] = useState<string[]>([]);
  const [hit, setHit] = useState<CloudMeta | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setRows(JSON.parse(raw));
    } catch {}
  }, []);

  const save = (next: string[]) => {
    setRows(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const look = async (target?: string) => {
    const q = (target || id).trim();
    if (!q) return;
    setBusy(true);
    setErr('');
    setHit(null);
    try {
      const meta = await fetchShare(q);
      if (!meta) {
        setErr('nothing live for that id');
        return;
      }
      setHit(meta);
      if (!rows.includes(q)) save([q, ...rows].slice(0, 40));
    } catch (e: any) {
      setErr(e?.message || 'ledger miss');
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
          <p className="text-[#0a84ff] text-sm mb-2">ledger</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">keep the ids you already shipped.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            look up a live share, stash the id in this browser, copy the discord /s card. not a vault.
          </p>
          <div className="flex gap-2">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="share id"
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/40"
            />
            <button onClick={() => look()} className="px-4 rounded-2xl bg-white text-black text-sm font-medium">
              {busy ? 'looking' : 'look'}
            </button>
          </div>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {hit && (
            <div className="mt-5 text-sm text-neutral-300 space-y-1">
              <p>{hit.name}</p>
              <p className="text-xs text-neutral-500">{hit.type} · {hit.size} b</p>
              <p className="text-xs text-neutral-400 break-all">{shareUrls(hit.id).embed}</p>
            </div>
          )}
          <div className="mt-8 space-y-1">
            {rows.map((r) => (
              <button
                key={r}
                onClick={() => { setId(r); look(r); }}
                className="w-full text-left text-xs text-neutral-400 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5"
              >
                {r}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
