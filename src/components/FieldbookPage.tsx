import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { sbRest } from '../lib/supabase';

type Note = {
  id: string;
  title: string;
  body: string;
  place: string | null;
  author: string | null;
  created_at?: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

export default function FieldbookPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [place, setPlace] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('a fieldbook is a page of notes. no file, no drawer.');
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    sbRest('fieldbook_notes?select=id,title,body,place,author,created_at&order=created_at.desc&limit=16')
      .then((r) => r.json())
      .then((rows) => setNotes(Array.isArray(rows) ? rows : []))
      .catch(() => setNotes([]));
  }, [tick]);

  useEffect(() => {
    if (!shareId) {
      setOpened(null);
      return;
    }
    sbRest(`fieldbook_notes?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((rows) => setOpened(Array.isArray(rows) ? rows[0] || null : null))
      .catch(() => setOpened(null));
  }, [shareId]);

  const save = async () => {
    if (!title.trim() || !body.trim()) {
      setStatus('a page needs a title and a few lines.');
      return;
    }
    setBusy(true);
    const id = uid();
    const res = await sbRest('fieldbook_notes', {
      method: 'POST',
      body: JSON.stringify({
        id,
        title: title.trim().slice(0, 140),
        body: body.trim().slice(0, 8000),
        place: place.trim() || null,
        author: author.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setStatus('the page did not land. try again in a moment.');
      return;
    }
    setTitle('');
    setBody('');
    setStatus('filed. the link unfurls in discord.');
    setTick((n) => n + 1);
    navigate('fieldbook', id);
  };

  return (
    <div className="min-h-screen mesh">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">fieldbook</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl font-semibold tracking-tight text-white">a page, not a cabinet</motion.h1>
        <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">{status}</p>

        {opened && (
          <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="apple-card mt-8 rounded-3xl p-6">
            <p className="text-xs text-neutral-500">{opened.place || 'somewhere'} · {opened.author || 'unsigned'}</p>
            <h2 className="mt-2 text-2xl text-white tracking-tight">{opened.title}</h2>
            <p className="mt-4 whitespace-pre-wrap text-neutral-300 leading-relaxed">{opened.body}</p>
            <p className="mt-6 text-xs text-neutral-500">discord card · /fieldbook/{opened.id}</p>
          </motion.article>
        )}

        <div className="apple-card mt-8 rounded-3xl p-6 space-y-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full bg-transparent border-b border-white/10 py-2 text-white outline-none placeholder:text-neutral-600" />
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="place, optional" className="w-full bg-transparent border-b border-white/10 py-2 text-white outline-none placeholder:text-neutral-600" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="w-full bg-transparent border-b border-white/10 py-2 text-white outline-none placeholder:text-neutral-600" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="what you noticed" rows={7} className="w-full bg-white/[0.03] rounded-2xl p-4 text-white outline-none placeholder:text-neutral-600" />
          <button type="button" onClick={save} disabled={busy} className="rounded-full bg-white text-black px-5 py-2 text-sm font-medium disabled:opacity-50">{busy ? 'filing…' : 'file the page'}</button>
        </div>

        <ul className="mt-10 space-y-3">
          {notes.map((note) => (
            <li key={note.id}>
              <button type="button" onClick={() => navigate('fieldbook', note.id)} className="w-full text-left apple-card rounded-2xl px-4 py-3">
                <span className="text-white">{note.title}</span>
                <span className="block text-xs text-neutral-500 mt-1">{note.place || 'unsigned place'}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
