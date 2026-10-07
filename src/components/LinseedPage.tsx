import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { sbRest } from '../lib/supabase';

type Board = {
  id: string;
  title: string;
  note: string | null;
  author: string | null;
  file_name: string | null;
  size: number;
  created_at: string;
};

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function LinseedPage() {
  const [rows, setRows] = useState<Board[]>([]);

  useEffect(() => {
    sbRest('sideboards?select=id,title,note,author,file_name,size,created_at&order=created_at.desc&limit=40')
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]));
  }, []);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">
          public index
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="mt-2 text-4xl font-semibold tracking-tight">
          Linseed
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          A reading list of sideboards already in the database. Open one to see the file and the replies. This is not a vault. Paste /linseed in Discord for a card, or /sideboard/id for a single table.
        </p>
        <section className="mt-8 space-y-2">
          {rows.map((row, i) => (
            <motion.a
              key={row.id}
              href={`/sideboard/${row.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), type: 'spring', stiffness: 260, damping: 28 }}
              className="block rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]"
            >
              <span className="block text-[15px] font-medium">{row.title}</span>
              <span className="mt-1 block text-[13px] text-white/50">{row.note || row.file_name || 'no note'}</span>
              <span className="mt-1 block text-[12px] text-white/35">{row.author || 'unsigned'} · {pretty(Number(row.size) || 0)}</span>
            </motion.a>
          ))}
          {rows.length === 0 && <p className="text-[13px] text-white/40">Nothing on the sideboard yet. Put a file out from /sideboard.</p>}
        </section>
      </main>
    </div>
  );
}
