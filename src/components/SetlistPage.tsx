import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

type Take = {
  id: string;
  title: string;
  note: string | null;
  author: string | null;
  file_name: string;
  pretty?: string;
  mime: string | null;
};

const ease = [0.22, 1, 0.36, 1] as const;

export default function SetlistPage() {
  const [takes, setTakes] = useState<Take[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/setlist')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'setlist did not load');
        setTakes(Array.isArray(data.takes) ? data.takes : []);
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'setlist did not load'));
  }, []);

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">setlist</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Takes already filed.</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.45 }} className="mt-4 text-[17px] text-[#a1a1aa] max-w-xl">A public index of listening takes. No upload lives on this page. Paste /setlist in Discord for the card. Older desks stay on their routes.</motion.p>
        {err ? <p className="mt-6 text-sm text-[#ff453a]">{err}</p> : null}
        <ul className="mt-8 space-y-2">
          {takes.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.04, duration: 0.35, ease }}>
              <a href={`/listening/${row.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] transition">
                <span className="text-white">{row.title || row.file_name}</span>
                <span className="block text-sm text-[#8e8e93]">{row.author || 'someone'}{row.pretty ? ` · ${row.pretty}` : ''}{row.note ? ` · ${row.note}` : ''}</span>
              </a>
            </motion.li>
          ))}
          {!takes.length && !err ? <li className="text-sm text-[#8e8e93]">no takes yet. leave one on /listening.</li> : null}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
