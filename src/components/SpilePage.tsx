import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = { id: string; name: string; mime: string; size: number; created_at: string; author?: string };

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function SpilePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const tap = async () => {
    setBusy(true); setErr('');
    try {
      const r = await fetch(`${SB_URL}/rest/v1/public_shares?is_public=eq.true&select=id,name,mime,size,created_at,author&order=created_at.desc`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      });
      if (!r.ok) throw new Error('db glance failed');
      const data = await r.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr(e?.message || 'could not tap the table');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">spile</p>
          <h1 className="text-3xl font-semibold mb-3">tap the public table.</h1>
          <p className="text-neutral-400 text-sm mb-6">read-only glance at live shares. not a vault. useful when a discord card looks stale.</p>
          <button onClick={tap} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'tapping…' : 'refresh public list'}</button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          <ul className="mt-6 space-y-2">
            {rows.map((row) => (
              <li key={row.id} className="rounded-2xl bg-white/[0.04] px-4 py-3">
                <p className="text-sm text-white truncate">{row.name}</p>
                <p className="text-[11px] text-neutral-500">{pretty(row.size)} · {row.mime || 'file'} · {row.id}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
