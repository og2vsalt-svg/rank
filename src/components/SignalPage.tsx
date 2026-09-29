import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function SignalPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(true);

  const load = async () => {
    setBusy(true);
    setErr('');
    try {
      const list = await listPublicShares(32);
      setRows(list);
    } catch (e: any) {
      setErr(e?.message || 'could not read the public table');
    }
    setBusy(false);
  };

  useEffect(() => {
    load();
  }, []);

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
          <p className="text-[#0a84ff] text-sm mb-2">signal</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a pulse of public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            reads the share table. open a card to get the discord embed path.
          </p>
          <button onClick={load} className="text-xs text-neutral-400 hover:text-white mb-5">
            {busy ? 'listening…' : 'refresh'}
          </button>
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}
          <div className="space-y-2">
            {rows.map((r) => {
              const urls = shareUrls(r.id);
              return (
                <a
                  key={r.id}
                  href={urls.embed}
                  className="block rounded-2xl border border-white/10 bg-black/20 px-4 py-3 hover:border-[#0a84ff]/40 transition"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm text-white truncate">{r.name}</p>
                    <p className="text-xs text-neutral-500 shrink-0">{pretty(r.size)}</p>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1 truncate">{urls.embed}</p>
                </a>
              );
            })}
            {!busy && rows.length === 0 && (
              <p className="text-sm text-neutral-500">no public drops yet. use drop or parcel to send one into the table.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
