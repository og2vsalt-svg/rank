import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Line = { id: string; line: string; source: string | null; author: string | null; created_at: string };

export default function CommonplacePage() {
  const { shareId } = useRouter();
  const [line, setLine] = useState('');
  const [source, setSource] = useState('');
  const [author, setAuthor] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [open, setOpen] = useState<Line | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');

  async function load() {
    const r = await fetch('/api/commonplace');
    const data = await r.json().catch(() => ({}));
    setLines(Array.isArray(data.lines) ? data.lines : []);
  }

  useEffect(() => { load().catch(() => {}); }, []);
  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/commonplace?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing line');
        setOpen(data);
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'could not open that line'));
  }, [shareId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/commonplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line, source, author }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'could not keep that line');
      setLink(data.link || '');
      setLine('');
      setSource('');
      await load();
      history.pushState(null, '', `/commonplace/${data.id}`);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">commonplace</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">A book of lines, not a cabinet.</motion.h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">Keep a sentence you want to find later. No file. Paste /commonplace/id in Discord and the card shows the line.</p>
        {open ? (
          <blockquote className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-2xl leading-snug tracking-tight">{open.line}</p>
            <p className="mt-4 text-sm text-[#8e8e93]">{open.author || 'unsigned'}{open.source ? ` · ${open.source}` : ''}</p>
          </blockquote>
        ) : null}
        <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 space-y-3">
          <textarea value={line} onChange={(e) => setLine(e.target.value)} maxLength={500} placeholder="the line" className="w-full min-h-28 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="who said it" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]" />
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="where you found it" className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]" />
          </div>
          {err ? <p className="text-sm text-[#ff453a]">{err}</p> : null}
          {link ? <p className="text-sm text-[#64d2ff] break-all">{link}</p> : null}
          <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">{busy ? 'Keeping…' : 'Keep the line'}</button>
        </form>
        <ul className="mt-8 space-y-2">
          {lines.map((row) => (
            <li key={row.id}>
              <a href={`/commonplace/${row.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition">
                <span className="text-white">{row.line}</span>
                <span className="block text-sm text-[#8e8e93]">{row.author || 'unsigned'}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
