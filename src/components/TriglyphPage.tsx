import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { sbRest } from '../lib/supabase';

type Row = {
  id: string;
  groove_a: string;
  groove_b: string;
  groove_c: string;
  author: string | null;
  created_at: string;
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function TriglyphPage() {
  const { shareId } = useRouter();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [c, setC] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [row, setRow] = useState<Row | null>(null);
  const [recent, setRecent] = useState<Row[]>([]);

  const loadRecent = () => {
    sbRest('triglyphs?select=*&order=created_at.desc&limit=8')
      .then((r) => r.json())
      .then((data) => setRecent(Array.isArray(data) ? data : []))
      .catch(() => setRecent([]));
  };

  useEffect(() => {
    loadRecent();
  }, []);

  useEffect(() => {
    if (!shareId) return;
    sbRest(`triglyphs?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((data) => setRow(Array.isArray(data) ? data[0] || null : null))
      .catch(() => setRow(null));
  }, [shareId]);

  const cut = async () => {
    if (!a.trim() || !b.trim() || !c.trim()) return;
    setBusy(true);
    setErr('');
    const id = uid();
    const res = await sbRest('triglyphs', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        id,
        groove_a: a.trim(),
        groove_b: b.trim(),
        groove_c: c.trim(),
        author: author.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.text()).slice(0, 180));
      return;
    }
    const saved = await res.json();
    const next = Array.isArray(saved) ? saved[0] : null;
    setRow(next);
    setLink(`${location.origin}/triglyph/${id}`);
    if (next) setRecent((prev) => [next, ...prev].slice(0, 8));
    history.pushState(null, '', `/triglyph/${id}`);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">
          three grooves
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-4xl font-semibold tracking-tight"
        >
          Triglyph
        </motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
          Three short lines, no file. They land in the triglyphs table. Paste /triglyph/id in Discord for a card. The vault and the other desks stay where they were.
        </p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-8 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <input value={a} onChange={(e) => setA(e.target.value)} placeholder="first groove" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30d158]" />
          <input value={b} onChange={(e) => setB(e.target.value)} placeholder="second groove" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30d158]" />
          <input value={c} onChange={(e) => setC(e.target.value)} placeholder="third groove" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30d158]" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="cut by, optional" className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition focus:border-[#30d158]" />
          <button disabled={!a.trim() || !b.trim() || !c.trim() || busy} onClick={cut} className="mt-1 w-fit rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02] disabled:opacity-40">
            {busy ? 'cutting…' : 'cut the grooves'}
          </button>
          {err && <p className="text-sm text-red-300">{err}</p>}
          {link && (
            <button onClick={() => navigator.clipboard.writeText(link)} className="text-left text-sm text-[#b7f5c8]">
              {link} — copied on click
            </button>
          )}
        </motion.div>

        {row && (
          <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 grid grid-cols-3 gap-2 rounded-3xl border border-[#30d158]/30 bg-white/[0.04] p-4">
            {[row.groove_a, row.groove_b, row.groove_c].map((g) => (
              <p key={g} className="rounded-2xl bg-black/30 px-3 py-6 text-center text-sm leading-relaxed text-white/80">{g}</p>
            ))}
          </motion.article>
        )}

        <ul className="mt-8 space-y-2">
          {recent.map((item) => (
            <li key={item.id}>
              <a href={`/triglyph/${item.id}`} className="block rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.06]">
                {item.groove_a} · {item.groove_b} · {item.groove_c}
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
