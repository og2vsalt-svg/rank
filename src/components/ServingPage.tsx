import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const SB_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = {
  id: string;
  title: string | null;
  left_name: string | null;
  right_name: string | null;
  left_size: number;
  right_size: number;
  left_hash: string | null;
  right_hash: string | null;
};

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function ServingPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch(`${SB_URL}/rest/v1/splices?select=id,title,left_name,right_name,left_size,right_size,left_hash,right_hash&order=created_at.desc&limit=24`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setErr('could not read the serving.'));
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">serving</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">pairs already filed.</h1>
          <p className="text-neutral-400 text-sm mb-6">an index, not a vault. each row is two files already in the share table. discord unfurls /serving.</p>
          <button type="button" onClick={() => navigate('splice')} className="mb-6 text-xs text-[#6eb6ff]">make a splice</button>
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <div className="space-y-3">
            {rows.map((row, i) => (
              <motion.button
                key={row.id}
                type="button"
                onClick={() => navigate('splice', row.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full text-left glass rounded-3xl px-5 py-4 hover:-translate-y-0.5 transition-transform"
              >
                <p className="text-white text-sm font-medium">{row.title || 'untitled pair'}</p>
                <p className="text-xs text-neutral-500 mt-1">{row.left_name || 'left'} · {pretty(Number(row.left_size) || 0)}  /  {row.right_name || 'right'} · {pretty(Number(row.right_size) || 0)}</p>
                <p className="text-[11px] text-neutral-600 mt-1">{row.left_hash && row.right_hash && row.left_hash === row.right_hash ? 'matching hashes' : 'different hashes'}</p>
              </motion.button>
            ))}
            {!rows.length && !err && <p className="text-sm text-neutral-500">nothing filed yet.</p>}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
