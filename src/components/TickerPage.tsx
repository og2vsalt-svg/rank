import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function TickerPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    listPublicShares(48).then((list) => {
      setRows(list);
      setBusy(false);
    });
  }, []);

  const total = rows.reduce((n, r) => n + (r.size || 0), 0);
  const opens = rows.reduce((n, r) => n + (r.downloads || 0), 0);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">ticker</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">public drops, live-ish.</h1>
          <p className="text-neutral-400 text-sm mb-6">reads the cloud table. not your private vault. /s/id links unfurl on discord.</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { k: 'drops', v: String(rows.length) },
              { k: 'opens', v: String(opens) },
              { k: 'bytes', v: pretty(total) },
            ].map((s) => (
              <div key={s.k} className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-[11px] text-neutral-500">{s.k}</p>
                <p className="text-lg font-semibold tracking-tight">{busy ? '…' : s.v}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {rows.map((r) => {
              const urls = shareUrls(r.id);
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.03] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{r.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{pretty(r.size)} · {r.type || 'file'}</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(urls.embed).catch(() => {})}
                    className="shrink-0 px-3 py-1.5 rounded-full bg-white/8 text-xs text-neutral-200"
                  >
                    copy embed
                  </button>
                </div>
              );
            })}
            {!busy && !rows.length && <p className="text-sm text-neutral-500">nothing public yet.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
