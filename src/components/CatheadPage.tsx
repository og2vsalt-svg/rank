import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CatheadPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [copied, setCopied] = useState('');
  const [quiet, setQuiet] = useState(false);

  useEffect(() => {
    listPublicShares(24).then((list) => {
      setRows(list);
      setQuiet(list.length === 0);
    });
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] uppercase tracking-[0.16em] text-zinc-500">cathead</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl font-semibold tracking-tight">What already landed.</motion.h1>
        <p className="mt-3 text-zinc-400">A public log of the share database. Copy a Discord card without opening the vault grid.</p>
        {quiet && <p className="mt-8 text-sm text-zinc-500">the board is quiet.</p>}
        <div className="mt-8 space-y-3">
          {rows.map((row, i) => (
            <motion.article key={row.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
              <div className="min-w-0 pr-3">
                <p className="truncate text-sm text-zinc-100">{row.name}</p>
                <p className="text-xs text-zinc-500">{pretty(row.size)} · {row.downloads || 0} opens</p>
              </div>
              <button onClick={async () => { await navigator.clipboard.writeText(shareUrls(row.id).embed); setCopied(row.id); }} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black">{copied === row.id ? 'copied' : 'copy card'}</button>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
