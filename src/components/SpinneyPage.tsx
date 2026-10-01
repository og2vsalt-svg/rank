import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function syllables(word: string) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  const m = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

export default function SpinneyPage() {
  const [text, setText] = useState('quiet file hosting, a spinney of words');
  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const letters = text.replace(/\s/g, '');
    const syl = words.reduce((n, w) => n + syllables(w), 0);
    const unique = new Set(words.map((w) => w.toLowerCase())).size;
    const reading = Math.max(1, Math.round(words.length / 200)) + ' min';
    return { words: words.length, letters: letters.length, syl, unique, reading };
  }, [text]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">spinney</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">count a thicket of words</h1>
          <p className="text-sm text-neutral-500 mb-6">a writing desk, not a file cabinet. paste anything. it stays here.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full min-h-40 rounded-2xl bg-black/30 border border-white/10 p-4 text-sm outline-none" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            {[
              ['words', stats.words],
              ['letters', stats.letters],
              ['syllables', stats.syl],
              ['unique', stats.unique],
              ['read', stats.reading],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-2xl bg-white/5 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-neutral-500">{k}</p>
                <p className="text-lg font-medium mt-1">{v}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
