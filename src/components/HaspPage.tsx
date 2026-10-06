import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = {
  id: string;
  phrase: string;
  note: string | null;
  author: string | null;
  file_name: string | null;
  size: number;
  created_at: string;
};

function pretty(bytes: number) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HaspPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('loading filed latches…');

  useEffect(() => {
    let live = true;
    fetch(`${SB_URL}/rest/v1/latches?select=id,phrase,note,author,file_name,size,created_at&order=created_at.desc&limit=40`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        const list = Array.isArray(data) ? data : [];
        setRows(list);
        setStatus(list.length ? `${list.length} on the hasp` : 'nothing filed yet. latch a file first.');
      })
      .catch(() => {
        if (live) setStatus('the hasp did not answer. try again in a moment.');
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#070708] text-white">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-28">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">hasp</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">latches already filed</h1>
          <p className="mt-3 text-[15px] text-white/55">A board, not a vault. Open a row for the file. Discord unfurls /hasp and each /latch/id.</p>
          <p className="mt-2 text-[13px] text-white/40">{status}</p>
        </motion.div>
        <div className="mt-6 space-y-2">
          {rows.map((row, i) => (
            <motion.button
              key={row.id}
              type="button"
              onClick={() => navigate('latch', row.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-4 text-left backdrop-blur transition hover:-translate-y-0.5 hover:border-white/20"
            >
              <span>
                <span className="block text-[15px] font-medium">{row.phrase}</span>
                <span className="mt-1 block text-[13px] text-white/45">{row.file_name || 'file'} · {pretty(Number(row.size) || 0)}{row.author ? ` · ${row.author}` : ''}</span>
              </span>
              <span className="text-[12px] text-white/35">open</span>
            </motion.button>
          ))}
        </div>
        <button type="button" onClick={() => navigate('latch')} className="mt-6 text-[13px] text-[#6eb6ff]">file a new latch</button>
      </main>
    </div>
  );
}
