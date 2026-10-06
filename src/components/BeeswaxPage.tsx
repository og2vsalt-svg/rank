import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = {
  id: string;
  pane: string;
  note?: string | null;
  author?: string | null;
  file_name?: string | null;
  size?: number;
};

function pretty(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BeeswaxPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('warming the wax…');

  useEffect(() => {
    let live = true;
    fetch(`${SB_URL}/rest/v1/deadlight_panes?select=id,pane,note,author,file_name,size&order=created_at.desc&limit=40`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        const list = Array.isArray(data) ? data : [];
        setRows(list);
        setStatus(list.length ? '' : 'no panes yet. file one on deadlight. older desks stay on their routes.');
      })
      .catch(() => {
        if (live) setStatus('could not read the pane table.');
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">index</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">beeswax</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Panes already filed from deadlight. This is not a vault drawer. Discord unfurls /beeswax.
          </p>
        </motion.div>
        {status && <p className="mt-8 text-sm text-white/45">{status}</p>}
        <div className="mt-6 space-y-2">
          {rows.map((row, i) => (
            <motion.button
              key={row.id}
              type="button"
              onClick={() => navigate('deadlight', row.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"
            >
              <span>
                <span className="block text-sm text-white">{row.pane}</span>
                <span className="mt-0.5 block text-[12px] text-white/40">{row.note || row.file_name || 'pane'}{row.author ? ` · ${row.author}` : ''}</span>
              </span>
              <span className="text-[12px] text-white/35">{pretty(Number(row.size) || 0)}</span>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
