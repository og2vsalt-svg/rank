import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function HushPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    listPublicShares(40)
      .then(setRows)
      .catch((e) => setErr(e?.message || 'could not load public drops'));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => (r.name || '').toLowerCase().includes(s) || (r.id || '').toLowerCase().includes(s));
  }, [q, rows]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">hush</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">listen to live public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. just a quiet board of what already lives in the share db, with discord cards ready.</p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter by name or id"
            className="w-full mb-6 rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3 text-sm outline-none focus:border-white/20"
          />
          {err && <p className="text-xs text-red-300/80 mb-4">{err}</p>}
          <div className="space-y-3">
            {filtered.map((r) => {
              const urls = shareUrls(r.id);
              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{r.name}</p>
                    <p className="text-xs text-neutral-500">{formatBytes(r.size)} · {r.type}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(urls.embed);
                        setCopied(r.id);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium"
                    >
                      {copied === r.id ? 'copied' : 'discord'}
                    </button>
                    <a href={urls.app} className="px-3 py-1.5 rounded-full bg-white/8 text-xs">open</a>
                  </div>
                </motion.div>
              );
            })}
            {!filtered.length && <p className="text-sm text-neutral-500">nothing public right now.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
