import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

type Row = {
  id: string;
  name: string;
  mime?: string;
  size?: number;
  note?: string;
  author?: string;
  created_at?: string;
};

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function RackPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch('/api/inlay?list=1');
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'rack unavailable');
        if (!dead) setRows(data.rows || []);
      } catch (e) {
        if (!dead) setErr(e instanceof Error ? e.message : 'could not load the rack');
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">rack</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">files already in the inlay table</h1>
          <p className="text-sm text-neutral-400 mb-8">an index, not a vault. open a row for the download and the discord link.</p>
          <button onClick={() => navigate('inlay')} className="mb-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">file a new one</button>
          {loading ? <p className="text-sm text-neutral-500">looking up the table…</p> : null}
          {err ? <p className="text-sm text-red-300">{err}</p> : null}
          <div className="space-y-3">
            {rows.map((row, i) => (
              <motion.button
                key={row.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => navigate('inlay', row.id)}
                className="w-full text-left glass rounded-2xl px-5 py-4 hover:bg-white/[0.04]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium tracking-tight">{row.name}</span>
                  <span className="text-xs text-neutral-500">{pretty(Number(row.size) || 0)}</span>
                </div>
                <p className="text-sm text-neutral-400 mt-1">{row.note || row.author || row.mime || 'no note'}</p>
              </motion.button>
            ))}
            {!loading && !rows.length && !err ? <p className="text-sm text-neutral-500">nothing filed yet.</p> : null}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
