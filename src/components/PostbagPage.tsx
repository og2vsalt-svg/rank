import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { sbRest } from '../lib/supabase';

type Drop = {
  id: string;
  name: string;
  mime: string | null;
  size: number;
  file_url: string;
  note: string | null;
  sent_to: string | null;
  author: string | null;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PostbagPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [q, setQ] = useState('');
  const [who, setWho] = useState('all');

  useEffect(() => {
    sbRest('outbox_drops?select=id,name,mime,size,file_url,note,sent_to,author,created_at&order=created_at.desc&limit=40')
      .then((r) => r.json())
      .then((data) => setDrops(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const people = useMemo(() => ['all', ...Array.from(new Set(drops.map((d) => d.sent_to).filter(Boolean) as string[]))], [drops]);
  const shown = drops.filter((d) => {
    const blob = `${d.name} ${d.note || ''} ${d.author || ''}`.toLowerCase();
    if (q && !blob.includes(q.toLowerCase())) return false;
    if (who !== 'all' && d.sent_to !== who) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070709] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">reading room</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-4xl font-semibold tracking-tight">Postbag</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          Not a vault. This is the mail that already left the outbox: filter by who it was for, open the note, download the file. Cards still unfurl in Discord.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search notes and names" className="min-w-[220px] flex-1 rounded-full bg-white/[0.04] px-4 py-2.5 text-[14px] outline-none ring-1 ring-white/10 focus:ring-[#0A84FF]" />
          <select value={who} onChange={(e) => setWho(e.target.value)} className="rounded-full bg-white/[0.04] px-4 py-2.5 text-[14px] outline-none ring-1 ring-white/10">
            {people.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="mt-6 space-y-3">
          {shown.map((d, i) => (
            <motion.article key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.28), type: 'spring', stiffness: 280, damping: 30 }} className="rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-medium">{d.name}</h2>
                  <p className="mt-1 text-[12px] text-white/40">{pretty(Number(d.size) || 0)}{d.sent_to ? ` · for ${d.sent_to}` : ''}{d.author ? ` · ${d.author}` : ''}</p>
                </div>
                <a href={`/outbox/${d.id}`} className="text-[12px] text-[#7ec8ff]">card link</a>
              </div>
              {d.note && <p className="mt-3 text-[15px] leading-relaxed text-white/75">{d.note}</p>}
              <a href={d.file_url} className="mt-3 inline-flex text-[13px] text-white/70 underline-offset-4 hover:underline">download</a>
            </motion.article>
          ))}
          {shown.length === 0 && <p className="text-[13px] text-white/40">Nothing in the bag yet.</p>}
        </div>
      </main>
    </div>
  );
}
