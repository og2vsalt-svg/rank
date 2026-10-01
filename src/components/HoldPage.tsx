import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Shelf = { id: string; title: string; note: string | null; share_ids: string[]; created_at: string };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function HoldPage() {
  const [rows, setRows] = useState<CloudMeta[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    listPublicShares(30).then(setRows);
    fetch(`${SB_URL}/rest/v1/shelves?select=id,title,note,share_ids,created_at&order=created_at.desc&limit=12`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setShelves(Array.isArray(data) ? data : []))
      .catch(() => setShelves([]));
  }, []);

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] uppercase tracking-[0.16em] text-white/45">hold</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">what is already on the deck</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">Recent public drops and bulkhead shelves. Each /s link unfurls in Discord.</p>
        </motion.div>
        {!!shelves.length && (
          <div className="mt-8 space-y-2">
            <p className="text-[12px] uppercase tracking-[0.14em] text-white/40">shelves</p>
            {shelves.map((s) => (
              <div key={s.id} className="glass rounded-2xl px-4 py-3">
                <p className="text-[15px]">{s.title}</p>
                <p className="mt-1 text-[12px] text-white/45">{s.share_ids?.length || 0} files{s.note ? ` · ${s.note}` : ''}</p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 space-y-2">
          {!rows.length && <p className="text-[14px] text-white/45">no public drops yet.</p>}
          {rows.map((r) => {
            const embed = shareUrls(r.id).embed;
            return (
              <div key={r.id} className="glass rounded-2xl px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px]">{r.name}</p>
                    <p className="text-[12px] text-white/40">{pretty(r.size)}{r.author ? ` · ${r.author}` : ''}</p>
                  </div>
                  <button onClick={() => copy(embed)} className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px]">{copied === embed ? 'copied' : 'copy /s'}</button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
