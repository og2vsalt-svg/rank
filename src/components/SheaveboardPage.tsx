import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = {
  id: string;
  title: string;
  note: string | null;
  author: string | null;
  file_name: string;
  size: number;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function SheaveboardPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetch(`${SB_URL}/rest/v1/sheaves?select=id,title,note,author,file_name,size,created_at&order=created_at.desc&limit=40`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!live) return;
        setRows(Array.isArray(data) ? data : []);
        if (!Array.isArray(data)) setErr('the board did not load.');
      })
      .catch(() => {
        if (live) setErr('the board did not load.');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">sheaveboard</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">files already in the table.</h1>
          <p className="text-neutral-400 text-sm mb-6">metadata only. the bytes stay on the row until you open one. paste /trunnion/id in Discord for a card. the older sheave pack desk is still at /sheave.</p>
          <button type="button" onClick={() => navigate('trunnion')} className="mb-6 text-xs text-[#6eb6ff]">file a local file</button>
          {loading && <p className="text-sm text-neutral-500">opening…</p>}
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="space-y-3">
            {rows.map((row, i) => (
              <motion.button
                key={row.id}
                type="button"
                onClick={() => navigate('trunnion', row.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-full text-left glass rounded-3xl px-5 py-4 hover:-translate-y-0.5 transition-transform duration-200"
              >
                <p className="text-white font-medium">{row.title || row.file_name}</p>
                <p className="text-xs text-neutral-500 mt-1">{row.file_name} · {pretty(Number(row.size) || 0)}{row.author ? ` · ${row.author}` : ''}</p>
                {row.note && <p className="text-sm text-neutral-400 mt-2">{row.note}</p>}
              </motion.button>
            ))}
            {!loading && !rows.length && <p className="text-sm text-neutral-500">nothing filed yet.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
