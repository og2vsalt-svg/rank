import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const ease = [0.22, 1, 0.36, 1] as const;

type Row = {
  id: string;
  name: string;
  size?: number;
  author?: string;
  caption?: string;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function when(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function KelsonPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('pulling receipts…');

  useEffect(() => {
    let stop = false;
    (async () => {
      try {
        const r = await fetch('/api/chock?list=1&page=kelson');
        const data = await r.json();
        if (!stop) {
          setRows(Array.isArray(data.files) ? data.files : []);
          setStatus('');
        }
      } catch {
        if (!stop) setStatus('kelson could not reach the database.');
      }
    })();
    return () => { stop = true; };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }} className="text-[13px] text-white/45">kelson</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="mt-2 text-[40px] leading-none tracking-tight font-semibold">
          A receipt, not a vault.
        </motion.h1>
        <p className="mt-4 text-[15px] leading-relaxed text-white/60">
          Who left a file, when, and how heavy it was. Paste /kelson in Discord for a card. Uploads still live on chock.
        </p>
        {status && <p className="mt-6 text-sm text-white/45">{status}</p>}
        <ol className="mt-8 divide-y divide-white/8 rounded-3xl border border-white/10 bg-white/[0.03]">
          {rows.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: Math.min(i, 10) * 0.03 }} className="px-5 py-4">
              <div className="flex items-baseline justify-between gap-4">
                <a href={`/chock/${row.id}`} className="truncate text-[15px] hover:text-[#0A84FF]">{row.name}</a>
                <span className="shrink-0 text-xs text-white/40">{pretty(Number(row.size) || 0)}</span>
              </div>
              <p className="mt-1 text-xs text-white/40">{row.author || 'someone'} · {when(row.created_at)}{row.caption ? ` · ${row.caption}` : ''}</p>
            </motion.li>
          ))}
          {!status && rows.length === 0 && <li className="px-5 py-6 text-sm text-white/45">no receipts yet. store something on chock.</li>}
        </ol>
      </main>
    </div>
  );
}
