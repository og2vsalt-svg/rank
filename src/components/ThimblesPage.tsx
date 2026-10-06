import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = { id: string; title: string; note: string | null; tone: string | null; size: number; author: string | null; created_at: string };

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function ThimblesPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/thimbles?select=id,title,note,tone,size,author,created_at&order=created_at.desc&limit=24`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setErr('could not load receipts'));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">thimbles</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">filed receipts</h1>
          <p className="text-neutral-400 text-sm mb-8">recent local files that landed in the share table with a short note. paste /thimble/id in Discord for the card.</p>
          <button type="button" onClick={() => navigate('thimble')} className="mb-6 text-sm rounded-full bg-white text-black px-4 py-2 hover:bg-neutral-200 transition">file one</button>
          {err && <p className="text-xs text-red-400 mb-4">{err}</p>}
          <div className="space-y-2">
            {rows.map((row, i) => (
              <motion.button
                key={row.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.35 }}
                onClick={() => navigate('thimble', row.id)}
                className="w-full text-left glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition"
              >
                <p className="text-white text-sm font-medium">{row.title}</p>
                <p className="text-xs text-neutral-500 mt-1">{pretty(Number(row.size) || 0)} · {row.tone || 'quiet'}{row.author ? ` · ${row.author}` : ''}{row.note ? ` · ${row.note}` : ''}</p>
              </motion.button>
            ))}
            {!rows.length && !err && <p className="text-sm text-neutral-500">nothing filed yet.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
