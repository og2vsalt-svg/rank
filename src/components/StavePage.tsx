import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = { id: string; title: string; note: string | null; author: string | null; file_ids: string[]; created_at: string };

export default function StavePage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let stop = false;
    fetch(`${SB_URL}/rest/v1/casks?select=id,title,note,author,file_ids,created_at&order=created_at.desc&limit=40`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!stop) setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!stop) setRows([]);
      });
    return () => {
      stop = true;
    };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-xs uppercase tracking-[0.18em] text-[#64d2ff] mb-2">stave</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">the public cask list</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            Recent bundles, not the vault. Open one to see the files that already landed in the share table. Discord unfurls /stave and /cask.
          </p>
          <button type="button" onClick={() => navigate('cask')} className="text-sm text-[#64d2ff] mb-6">seal a new cask</button>
        </motion.div>
        {rows === null && <p className="text-sm text-neutral-500">reading the list…</p>}
        {rows && !rows.length && <p className="text-sm text-neutral-400">no casks yet. the first one can come from this machine.</p>}
        <div className="space-y-3">
          {(rows || []).map((row, i) => (
            <motion.button
              key={row.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              onClick={() => navigate('cask', row.id)}
              className="w-full text-left glass rounded-3xl p-5 hover:-translate-y-0.5 transition-transform duration-200"
            >
              <p className="text-white font-medium">{row.title || 'untitled'}</p>
              <p className="text-xs text-neutral-500 mt-1">{(row.file_ids || []).length} files · {row.author || 'unsigned'}</p>
              {row.note && <p className="text-sm text-neutral-400 mt-2 line-clamp-2">{row.note}</p>}
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
