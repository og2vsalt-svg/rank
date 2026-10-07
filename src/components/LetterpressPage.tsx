import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Card = {
  id: string;
  title: string;
  body: string;
  author: string | null;
  accent: string | null;
  created_at: string;
};

const ease = [0.22, 1, 0.36, 1] as const;
const accents = ['#0A84FF', '#64D2FF', '#30D158', '#FFD60A', '#FF9F0A', '#FF375F', '#BF5AF2'];

export default function LetterpressPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState(accents[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [open, setOpen] = useState<Card | null>(null);
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    fetch('/api/letterpress')
      .then((r) => r.json())
      .then((data) => setCards(Array.isArray(data.cards) ? data.cards : []))
      .catch(() => {});
  }, [shareId]);

  useEffect(() => {
    if (!shareId) { setOpen(null); return; }
    fetch(`/api/letterpress?id=${encodeURIComponent(shareId)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'missing card');
        setOpen(data);
        setErr('');
      })
      .catch((error) => setErr(error instanceof Error ? error.message : 'could not open that card'));
  }, [shareId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/letterpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, author, accent }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'the card did not set');
      setLink(data.link || '');
      navigate('letterpress', data.id);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'letterpress failed');
    } finally {
      setBusy(false);
    }
  }

  const preview = open || { title: title || 'Untitled card', body: body || 'The line you set appears here, and in Discord.', author, accent };

  return (
    <div className="mesh min-h-screen text-[#f5f5f7]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[13px] tracking-[0.14em] uppercase text-[#8e8e93]">letterpress</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }} className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Set a card, not a cabinet.</motion.h1>
        <p className="mt-4 text-[17px] leading-relaxed text-[#a1a1aa] max-w-xl">A title and a line, stored as a card. Paste /letterpress/id in Discord and the unfurl uses the words. No file, no vault.</p>
        <motion.article initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }} className="mt-8 rounded-3xl border border-white/10 bg-[#0c0c0e] p-6 overflow-hidden" style={{ boxShadow: `inset 0 0 0 1px ${preview.accent || '#0A84FF'}22` }}>
          <div className="h-1.5 w-16 rounded-full" style={{ background: preview.accent || '#0A84FF' }} />
          <p className="mt-4 text-[12px] tracking-[0.16em] uppercase text-[#8e8e93]">rankvault</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">{preview.title}</h2>
          <p className="mt-3 text-[#d1d1d6] leading-relaxed">{preview.body}</p>
          {preview.author ? <p className="mt-4 text-sm text-[#8e8e93]">{preview.author}</p> : null}
        </motion.article>
        {open ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <p className="text-sm text-[#64d2ff] break-all">{link || `${window.location.origin}/letterpress/${open.id}`}</p>
            <button onClick={() => navigate('letterpress')} className="text-sm text-[#8e8e93] hover:text-white">set another</button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="card title" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff] transition" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} placeholder="the line Discord should show" className="w-full min-h-28 rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff] transition" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={80} placeholder="signed by" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff] transition" />
            <div className="flex gap-2">
              {accents.map((c) => (
                <button type="button" key={c} onClick={() => setAccent(c)} aria-label={c} className="h-7 w-7 rounded-full transition active:scale-95" style={{ background: c, outline: accent === c ? '2px solid white' : 'none', outlineOffset: 2 }} />
              ))}
            </div>
            {err ? <p className="text-sm text-[#ff453a]">{err}</p> : null}
            <button disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-60 active:scale-[0.98] transition">{busy ? 'Setting…' : 'Set the card'}</button>
          </form>
        )}
        <ul className="mt-10 space-y-2">
          {cards.map((row) => (
            <li key={row.id}>
              <a href={`/letterpress/${row.id}`} className="block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.06] transition">
                <span className="text-white">{row.title}</span>
                <span className="block text-sm text-[#8e8e93] truncate">{row.body}</span>
              </a>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
}
