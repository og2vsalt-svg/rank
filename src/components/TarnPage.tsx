import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function prettySize(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function TarnPage() {
  const [rows, setRows] = useState<CloudMeta[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [pick, setPick] = useState<CloudMeta | null>(null);

  const load = async () => {
    setBusy(true);
    setErr('');
    try {
      const list = await listPublicShares(40);
      setRows(list);
      if (!list.length) setErr('tarn is still. nothing public right now.');
    } catch (e: any) {
      setErr(e?.message || 'could not read the pool');
    } finally {
      setBusy(false);
    }
  };

  const draw = () => {
    if (!rows?.length) return;
    const item = rows[Math.floor(Math.random() * rows.length)];
    setPick(item);
    const urls = shareUrls(item.id);
    navigator.clipboard.writeText(urls.embed).catch(() => {});
  };

  const urls = useMemo(() => (pick ? shareUrls(pick.id) : null), [pick]);

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
          <h1 className="text-3xl font-semibold tracking-tight mb-3">skim a public drop from the pool.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            pulls recent public shares from the db and hands you one. copies the discord /s card. not your private vault.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={load} disabled={busy} className="px-4 py-2.5 rounded-2xl bg-white text-black text-sm font-medium hover:bg-neutral-200 transition disabled:opacity-50">
              {busy ? 'reading…' : rows ? 'refresh pool' : 'fill the tarn'}
            </button>
            <button type="button" onClick={draw} disabled={!rows?.length} className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 text-sm text-white hover:bg-white/15 transition disabled:opacity-40">
              draw one
            </button>
          </div>
          {rows && <p className="text-xs text-neutral-500 mt-3">{rows.length} public drops in the pool</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {pick && urls && (
            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5 space-y-2">
              <p className="text-white font-medium truncate">{pick.name}</p>
              <p className="text-xs text-neutral-500">{pick.type} · {prettySize(pick.size)}{pick.author ? ` · ${pick.author}` : ''}</p>
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {urls.embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {urls.app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
