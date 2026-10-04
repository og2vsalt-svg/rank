import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const SB_URL = ((import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co').replace(/\/$/, '');
const SB_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Drop = {
  id: string;
  name: string;
  mime: string | null;
  size: number;
  file_url: string;
  author: string | null;
  caption: string | null;
  created_at: string;
  download_count: number;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function BinnaclePage() {
  const [rows, setRows] = useState<Drop[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    const load = async () => {
      const res = await fetch(
        `${SB_URL}/rest/v1/public_shares?is_public=eq.true&select=id,name,mime,size,file_url,author,caption,created_at,download_count&order=created_at.desc&limit=24`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
      );
      if (!res.ok) {
        setError('the compass could not read the share table');
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) setRows(data);
    };
    load();
  }, []);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => `${row.name} ${row.caption || ''} ${row.author || ''}`.toLowerCase().includes(needle));
  }, [rows, q]);

  const copy = async (id: string) => {
    const link = `${location.origin}/s/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(id);
    } catch {
      setError(link);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64d2ff] text-sm font-medium mb-2 tracking-wide">binnacle</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">read the compass, don’t open another drawer.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">public drops already sitting in the share table. search a name, copy the Discord card. nothing new is stored here, and nothing is capped.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="glass rounded-3xl p-4 sm:p-5 mb-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search a drop" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-[#64d2ff]/50" />
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
        </motion.div>
        <div className="grid gap-2">
          {shown.map((row, i) => {
            const image = String(row.mime || '').startsWith('image/') && /^https?:\/\//i.test(row.file_url || '');
            const heavy = Number(row.size) > 12 * 1024 * 1024;
            return (
              <motion.article key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} className="glass rounded-3xl p-4 flex gap-3">
                {image ? <img src={row.file_url} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" /> : <div className="w-16 h-16 rounded-2xl bg-white/5 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm truncate">{row.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{pretty(Number(row.size) || 0)}{row.author ? ` · ${row.author}` : ''}{row.download_count ? ` · ${row.download_count} opens` : ''}</p>
                  {row.caption && <p className="text-sm text-neutral-300 mt-1 line-clamp-2">{row.caption}</p>}
                  {heavy && <p className="text-xs text-amber-200/90 mt-1">large drop. preview may feel slow.</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button onClick={() => copy(row.id)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">{copied === row.id ? 'copied' : 'copy Discord link'}</button>
                    <a href={`/s/${row.id}`} className="text-xs px-3 py-1.5 rounded-full glass text-neutral-200">open card</a>
                  </div>
                </div>
              </motion.article>
            );
          })}
          {shown.length === 0 && <p className="text-sm text-neutral-500 px-1">no public drops match that yet.</p>}
        </div>
      </main>
    </div>
  );
}
