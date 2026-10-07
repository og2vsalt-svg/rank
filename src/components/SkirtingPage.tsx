import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

type Panel = {
  id: string;
  room: string | null;
  caption: string | null;
  file_name: string;
  size: number;
  created_at: string;
};

export default function SkirtingPage() {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/beading')
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'could not read the index');
        setPanels(Array.isArray(data.panels) ? data.panels : []);
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'index failed'));
  }, []);

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">skirting</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Panels already set.</motion.h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">A public index, not a cabinet. Open a panel to download the file that already lives in the database. Paste /skirting in Discord for the card.</p>
        {err ? <p className="mt-6 text-sm text-[#ff453a]">{err}</p> : null}
        <ul className="mt-8 space-y-2">
          {panels.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
              <a href={`/beading/${row.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] hover:-translate-y-0.5 transition">
                <span className="text-white">{row.file_name}</span>
                <span className="block text-sm text-[#8e8e93]">{row.room || 'unnamed room'}{row.caption ? ` · ${row.caption}` : ''}</span>
              </a>
            </motion.li>
          ))}
          {!panels.length && !err ? <li className="text-sm text-[#8e8e93]">Nothing set yet. The first panel goes up at /beading.</li> : null}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
