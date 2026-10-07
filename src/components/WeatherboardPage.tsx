import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Note = {
  id: string;
  title: string | null;
  body: string;
  author: string | null;
  accent?: string | null;
  created_at: string;
};

export default function WeatherboardPage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [open, setOpen] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    fetch('/api/weatherboard')
      .then((r) => r.json())
      .then((data) => setNotes(Array.isArray(data.notes) ? data.notes : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!shareId) return;
    fetch(`/api/weatherboard?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing notice');
        setOpen(data);
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'could not open that notice'));
  }, [shareId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/weatherboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, author, accent: '#FFD60A' }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'the notice did not land');
      setLink(data.link || '');
      history.pushState(null, '', `/weatherboard/${data.id}`);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'notice failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">weatherboard</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Pin a notice. No file.</motion.h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">A board for a line, not a cabinet. The row lands in weatherboard_notes. Paste /weatherboard/id in Discord for the card. Older desks stay.</p>
        {open ? (
          <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-[#8e8e93]">{open.author || 'someone'}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{open.title || 'notice'}</h2>
            <p className="mt-3 text-[#d1d1d6] leading-relaxed">{open.body}</p>
          </section>
        ) : (
          <form onSubmit={onSubmit} className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#ffd60a]" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#ffd60a]" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} placeholder="the notice" className="w-full min-h-28 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#ffd60a]" />
            {err ? <p className="text-sm text-[#ff453a]">{err}</p> : null}
            {link ? <p className="text-sm text-[#64d2ff] break-all">{link}</p> : null}
            <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">{busy ? 'Pinning…' : 'Pin the notice'}</button>
          </form>
        )}
        <ul className="mt-10 space-y-2">
          {notes.map((row) => (
            <li key={row.id}>
              <a href={`/weatherboard/${row.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.05] transition">
                <span className="text-white">{row.title || 'notice'}</span>
                <span className="block text-sm text-[#8e8e93]">{row.author || 'someone'} · {row.body}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
