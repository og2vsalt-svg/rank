import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { sbRest } from '../lib/supabase';
import { useRouter } from './Router';

type Row = {
  id: string;
  name: string;
  mime: string | null;
  size: number;
  author: string | null;
  created_at: string;
  download_count: number;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function QuayPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    let live = true;
    sbRest('public_shares?select=id,name,mime,size,author,created_at,download_count&is_public=eq.true&order=created_at.desc&limit=40')
      .then(async (r) => {
        if (!r.ok) throw new Error('the quay could not read the share table');
        const data = await r.json();
        if (live) setRows(Array.isArray(data) ? data : []);
      })
      .catch((e) => live && setErr(e.message || 'quiet failure'));
    return () => {
      live = false;
    };
  }, []);

  const shown = rows.filter((r) => !q || `${r.name} ${r.author || ''}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">
          quay
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="text-4xl font-semibold tracking-tight text-white mb-3">
          what already landed.
        </motion.h1>
        <p className="text-neutral-400 mb-6 leading-relaxed">
          a public log of drops in the share database. not a vault drawer — nothing here is stored on this device.
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="filter by name"
          className="w-full mb-5 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50"
        />
        {err && <p className="text-sm text-amber-300 mb-4">{err}</p>}
        <div className="space-y-2">
          {shown.map((row, i) => (
            <motion.button
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.03 }}
              onClick={() => navigate('share', row.id)}
              className="w-full text-left glass rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-white text-sm truncate">{row.name}</p>
                <span className="text-[12px] text-neutral-500 shrink-0">{pretty(Number(row.size) || 0)}</span>
              </div>
              <p className="text-[12px] text-neutral-500 mt-1">
                {(row.mime || 'file').split(';')[0]} · {row.author || 'anon'} · {row.download_count || 0} opens · /s/{row.id}
              </p>
            </motion.button>
          ))}
          {!err && shown.length === 0 && <p className="text-sm text-neutral-500">nothing on the quay yet.</p>}
        </div>
      </main>
    </div>
  );
}
