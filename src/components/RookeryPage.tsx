import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function RookeryPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listPublicShares(48);
        if (alive) setRows(list);
      } catch (e: any) {
        if (alive) setErr(e?.message || 'could not load roost');
      } finally {
        if (alive) setBusy(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[#0a84ff] text-sm mb-2">rookery</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a roost of live public drops.</h1>
          <p className="text-neutral-400 text-sm mb-8">
            not a vault. just what is already on the wing. paste a /s link in discord for the card.
          </p>
          {busy && <p className="text-sm text-neutral-500">listening…</p>}
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            {rows.map((row, i) => {
              const urls = shareUrls(row.id);
              return (
                <motion.a
                  key={row.id}
                  href={urls.embed}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="glass rounded-[24px] p-5 block hover:border-[#0a84ff]/30"
                >
                  <p className="text-white font-medium truncate">{row.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {pretty(row.size)} · {(row.type || '').split(';')[0] || 'file'}
                    {row.author ? ` · ${row.author}` : ''}
                  </p>
                  <p className="text-[11px] text-[#0a84ff]/80 mt-3 break-all">{urls.embed}</p>
                </motion.a>
              );
            })}
          </div>
          {!busy && rows.length === 0 && (
            <p className="text-sm text-neutral-500">the roost is empty right now.</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
