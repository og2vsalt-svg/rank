import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';

const SB = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = { id: string; name: string; mime: string; size: number; created_at: string; download_count: number };

export default function NavePage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const r = await fetch(
          `${SB.replace(/\/$/, '')}/rest/v1/public_shares?is_public=eq.true&select=id,name,mime,size,created_at,download_count&order=created_at.desc&limit=24`,
          { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }
        );
        if (!r.ok) throw new Error('could not read the public aisle');
        setRows(await r.json());
      } catch (e: any) {
        setErr(e?.message || 'nave is quiet');
      }
    };
    run();
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#0a84ff] text-sm mb-2">nave</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">walk the public aisle.</h1>
          <p className="text-neutral-400 text-sm mb-8">latest cloud drops. not your private vault — just what people chose to leave unlocked.</p>
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            {rows.map((row, i) => (
              <motion.button
                key={row.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate('share', row.id)}
                className="text-left glass rounded-3xl p-5 hover:-translate-y-0.5 transition"
              >
                <p className="text-sm text-white truncate">{row.name}</p>
                <p className="text-[11px] text-neutral-500 mt-1">{row.mime || 'file'} · {Math.max(1, Math.round((row.size || 0) / 1024))} kb · {row.download_count || 0} hits</p>
              </motion.button>
            ))}
          </div>
          {!err && rows.length === 0 && <p className="text-sm text-neutral-500">nobody left a drop in the aisle yet.</p>}
        </motion.div>
      </div>
    </div>
  );
}
