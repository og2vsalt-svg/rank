import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import { useRouter } from './Router';

type Note = { id: string; name: string; caption: string; author: string | null; created_at: string };

export default function HearthPage() {
  const { shareId } = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const res = await fetch('/api/hearth');
    const data = await res.json();
    setNotes(Array.isArray(data.notes) ? data.notes : []);
  }

  useEffect(() => {
    load().catch(() => setError('hearth is quiet right now'));
  }, []);

  const focus = shareId ? notes.find((n) => n.id === shareId) : null;

  async function keep(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/hearth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, note, author }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'could not keep the note');
      setTitle('');
      setNote('');
      history.pushState(null, '', `/hearth/${data.id}`);
      await load();
    } catch (err: any) {
      setError(err.message || 'hearth failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl mx-auto">
          <p className="text-[#ff9f0a] text-sm font-medium mb-2">notes, not files</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">sit by the hearth.</h1>
          <p className="text-neutral-400 mb-8 leading-relaxed">A short line kept in the same database as the shares. No upload, no drawer. The link still unfurls as a Discord card.</p>
          {focus && (
            <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-3xl p-6 mb-6">
              <h2 className="text-xl text-white font-semibold">{focus.name}</h2>
              <p className="text-neutral-300 mt-2 leading-relaxed">{focus.caption}</p>
              <p className="text-xs text-neutral-500 mt-3">{focus.author || 'someone'} · {new Date(focus.created_at).toLocaleString()}</p>
            </motion.article>
          )}
          <form onSubmit={keep} className="glass rounded-3xl p-6 space-y-3 mb-8">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="a title" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#ff9f0a]/50" />
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="what you wanted to leave" rows={4} className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-[#ff9f0a]/50" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, if you want it" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none" />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button disabled={busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-60 active:scale-[0.99] transition">{busy ? 'keeping…' : 'keep the note'}</button>
          </form>
          <div className="space-y-3">
            {notes.map((n) => (
              <a key={n.id} href={`/hearth/${n.id}`} className="block glass rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition">
                <p className="text-white font-medium">{n.name}</p>
                <p className="text-neutral-400 text-sm line-clamp-2">{n.caption}</p>
              </a>
            ))}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
