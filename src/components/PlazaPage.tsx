import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

type Row = { id: string; name: string; mime?: string; size?: number; created_at?: string; author?: string | null };

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function PlazaPage() {
  const { navigate } = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${SB_URL}/rest/v1/public_shares?is_public=eq.true&select=id,name,mime,size,created_at,author&order=created_at.desc&limit=40`, {
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        });
        if (!r.ok) throw new Error('feed failed');
        const data = await r.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setErr(e?.message || 'could not load plaza');
      }
    })();
  }, []);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">plaza</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">public drops, latest first.</h1>
          <p className="text-neutral-400 text-sm mb-6">reads the share db. tap one to open the embed-ready card.</p>
          {err && <p className="text-xs text-rose-300 mb-3">{err}</p>}
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id}>
                <button onClick={() => navigate('share', row.id)} className="w-full text-left rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 hover:bg-white/[0.06] transition">
                  <p className="text-sm text-white truncate">{row.name}</p>
                  <p className="text-xs text-neutral-500">{pretty(Number(row.size) || 0)} · {shareUrls(row.id).embed}</p>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
