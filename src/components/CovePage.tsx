import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = { id: string; name: string; mime: string; size: number; created_at: string; download_count: number };

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function CovePage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(
          `${SB_URL}/rest/v1/public_shares?is_public=eq.true&select=id,name,mime,size,created_at,download_count&order=created_at.desc&limit=40`,
          {
            headers: {
              apikey: SB_KEY,
              Authorization: `Bearer ${SB_KEY}`,
            },
          },
        );
        if (!r.ok) throw new Error('could not read the share table');
        const data = await r.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message || 'cove is quiet');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">cove</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">recent public drops.</h1>
          <p className="text-neutral-400 text-sm mb-6">pulled live from the share database. tap one to open the embed-ready page.</p>
          {loading && <p className="text-sm text-neutral-500">listening…</p>}
          {err && <p className="text-sm text-red-400">{err}</p>}
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  onClick={() => navigate('share', row.id)}
                  className="w-full text-left rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 hover:bg-white/[0.06] transition-colors"
                >
                  <p className="text-sm text-white truncate">{row.name}</p>
                  <p className="text-xs text-neutral-500">
                    {row.mime || 'file'} · {formatBytes(Number(row.size) || 0)} · {row.download_count || 0} opens
                  </p>
                </button>
              </li>
            ))}
          </ul>
          {!loading && !err && rows.length === 0 && <p className="text-sm text-neutral-500">no public drops yet. flint one first.</p>}
        </motion.div>
      </div>
    </div>
  );
}
