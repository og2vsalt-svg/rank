import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { shareUrls } from '../lib/cloudShare';

const SB = 'https://tqfocdktvjuwoiyfgesb.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Row = { id: string; name: string; mime: string; size: number; created_at: string; download_count: number };

export default function EstuaryPage() {
  const { navigate } = useRouter();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${SB}/rest/v1/public_shares?is_public=eq.true&select=id,name,mime,size,created_at,download_count&order=created_at.desc&limit=60`, {
          headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
        });
        if (!r.ok) throw new Error('could not reach share db');
        setRows(await r.json());
      } catch (e: any) {
        setErr(e.message || 'db miss');
      }
    })();
  }, []);

  const filtered = rows.filter((x) => !q || `${x.name} ${x.mime} ${x.id}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">estuary</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">wade the public tide.</h1>
          <p className="text-neutral-400 text-sm mb-6">live search across public drops in the share db. open any one with a discord-ready /s link.</p>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter by name, type, id" className="w-full mb-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50" />
          {err && <p className="text-xs text-rose-300 mb-3">{err}</p>}
          <ul className="space-y-2">
            {filtered.map((r) => (
              <li key={r.id} className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm truncate">{r.name}</p>
                  <p className="text-[11px] text-neutral-500">{r.mime} · {(r.size / 1024).toFixed(1)} kb · {r.download_count || 0} opens</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(shareUrls(r.id).embed).catch(() => {}); navigate('share', r.id); }} className="text-xs text-[#0a84ff] shrink-0">open</button>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
