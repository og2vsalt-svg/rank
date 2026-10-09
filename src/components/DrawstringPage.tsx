import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = { id: string; recipient: string; phrase: string; file_name?: string | null; size?: number | null; created_at?: string };

function pretty(n: number) {
  if (!n) return '';
  if (n < 1048576) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
  return `${(n / 1073741824).toFixed(2)} GB`;
}

export default function DrawstringPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/reticules?select=id,recipient,phrase,file_name,size,created_at&order=created_at.desc&limit=40`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('board unavailable');
        return r.json();
      })
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs tracking-[0.18em] uppercase text-neutral-500 mb-3">public board</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Drawstring</h1>
          <p className="text-neutral-400 mb-8 max-w-xl">Reticules already filed. Open one to read the line and take the file. This is not the vault.</p>
        </motion.div>
        {err && <p className="text-sm text-red-400 mb-4">{err}</p>}
        <div className="space-y-3">
          {rows.map((row, i) => (
            <motion.button
              key={row.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              onClick={() => navigate('reticule', row.id)}
              className="w-full text-left glass rounded-2xl px-5 py-4 hover:bg-white/5"
            >
              <p className="font-medium">{row.recipient}</p>
              <p className="text-sm text-neutral-400 truncate">{row.phrase || row.file_name || 'file'}</p>
              <p className="text-xs text-neutral-500 mt-1">{row.file_name} {pretty(Number(row.size) || 0)}</p>
            </motion.button>
          ))}
          {!err && rows.length === 0 && <p className="text-sm text-neutral-500">Nothing on the board yet.</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
