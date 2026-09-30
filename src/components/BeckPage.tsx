import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function BeckPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    listPublicShares(48)
      .then(setRows)
      .catch(() => setErr('the beck is quiet — could not read the share db'));
  }, []);

  const shown = rows.filter((r) => {
    const hay = `${r.name} ${r.type} ${r.id}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">beck</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">wade the public stream.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not your vault. just the water already running through supabase. copy a discord card when you like one.
          </p>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="filter by name, type, or id"
            className="w-full rounded-2xl bg-white/[0.05] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/50 transition-colors"
          />
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          <div className="mt-5 space-y-2">
            {shown.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3"
              >
                <p className="text-sm text-white truncate">{r.name}</p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {pretty(r.size)} · {r.type || 'file'} · {r.author || 'anon'}
                </p>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrls(r.id).embed);
                    } catch {}
                  }}
                  className="mt-2 text-[12px] text-[#0a84ff] hover:text-white transition-colors"
                >
                  copy /s/{r.id}
                </button>
              </motion.div>
            ))}
            {!shown.length && !err && <p className="text-sm text-neutral-500">nothing in the current.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
