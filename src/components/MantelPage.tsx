import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Letter = { id: string; title: string; body?: string; author: string | null; created_at: string };

export default function MantelPage() {
  const { shareId, navigate } = useRouter();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [focus, setFocus] = useState<Letter | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');

  async function load() {
    const res = await fetch('/api/mantel');
    const data = await res.json();
    setLetters(Array.isArray(data.letters) ? data.letters : []);
  }

  useEffect(() => {
    load().catch(() => setError('mantel is quiet right now'));
  }, []);

  useEffect(() => {
    if (!shareId) {
      setFocus(null);
      return;
    }
    fetch(`/api/mantel?id=${encodeURIComponent(shareId)}`)
      .then((r) => r.json())
      .then((data) => setFocus(data.ok ? data : null))
      .catch(() => setFocus(null));
  }, [shareId]);

  async function keep(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/mantel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, author }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'mantel did not keep it');
      const path = data.sharePath || `/mantel/${data.id}`;
      setLink(window.location.origin + path);
      navigate('mantel', data.id);
      load().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'mantel did not keep it');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <main className="pt-28 pb-20 px-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="max-w-2xl mx-auto">
          <p className="text-[11px] tracking-[0.22em] uppercase text-[#64d2ff] mb-3">letters</p>
          <h1 className="text-4xl font-semibold tracking-tight">mantel</h1>
          <p className="text-neutral-400 mt-3">A letter shelf beside the files. No upload, no drawer. Discord still unfurls the link.</p>
          {focus ? (
            <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[28px] p-6 mt-8">
              <h2 className="text-2xl font-medium">{focus.title}</h2>
              <p className="text-neutral-300 mt-4 whitespace-pre-wrap leading-relaxed">{focus.body}</p>
              {focus.author && <p className="text-sm text-neutral-500 mt-4">from {focus.author}</p>}
            </motion.article>
          ) : (
            <form onSubmit={keep} className="glass rounded-[28px] p-6 mt-8 space-y-4">
              <label className="block text-sm text-neutral-300">
                title
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" />
              </label>
              <label className="block text-sm text-neutral-300">
                letter
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" />
              </label>
              <label className="block text-sm text-neutral-300">
                from
                <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="mt-1 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#0a84ff]/60 transition" />
              </label>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {link && <p className="text-sm text-[#64d2ff] break-all">{link}</p>}
              <button disabled={busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.99] transition">{busy ? 'setting it down…' : 'set it on the mantel'}</button>
            </form>
          )}
          {letters.length > 0 && (
            <ul className="mt-8 space-y-2">
              {letters.map((row) => (
                <li key={row.id}>
                  <button onClick={() => navigate('mantel', row.id)} className="w-full text-left glass rounded-2xl px-4 py-3 hover:-translate-y-0.5 transition-transform">
                    <span className="text-white">{row.title}</span>
                    {row.author && <span className="text-neutral-500 text-sm"> · {row.author}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
