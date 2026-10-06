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

type Row = { id: string; question: string; author: string | null; replies: unknown[]; created_at: string };

export default function GangwayPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let stop = false;
    (async () => {
      const res = await fetch(
        `${SB_URL}/rest/v1/tenders?select=id,question,author,replies,created_at&order=created_at.desc&limit=40`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
      );
      if (!res.ok) {
        if (!stop) setErr('could not read the gangway');
        return;
      }
      const data = await res.json();
      if (!stop) setRows(Array.isArray(data) ? data : []);
    })();
    return () => {
      stop = true;
    };
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-xs uppercase tracking-[0.18em] text-[#0a84ff] mb-2">gangway</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">questions already asked</h1>
          <p className="text-sm text-neutral-400 mb-6 leading-relaxed">
            A public index of tenders. Each file still lives in the share table. This is not a vault drawer. Discord unfurls /gangway.
          </p>
        </motion.div>
        {err && <p className="text-xs text-rose-300 mb-3">{err}</p>}
        {rows === null && !err && <p className="text-sm text-neutral-500">opening the gangway…</p>}
        <div className="space-y-3">
          {(rows || []).map((row, i) => (
            <motion.button
              key={row.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => navigate('tender', row.id)}
              className="w-full text-left glass rounded-3xl p-4 hover:-translate-y-0.5 transition-transform duration-200"
            >
              <p className="text-sm text-white">{row.question}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {row.author || 'unsigned'} · {Array.isArray(row.replies) ? row.replies.length : 0} replies
              </p>
            </motion.button>
          ))}
          {rows && rows.length === 0 && <p className="text-sm text-neutral-500">nothing on the gangway yet. send one from /tender.</p>}
        </div>
      </main>
    </div>
  );
}
