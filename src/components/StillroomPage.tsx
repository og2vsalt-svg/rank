import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { sbRest } from '../lib/supabase';

type Note = {
  id: string;
  title: string;
  body: string;
  mood: string | null;
  author: string | null;
  created_at?: string;
};

const MOODS = ['quiet', 'warm', 'late', 'clear'];

function uid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

export default function StillroomPage() {
  const { shareId, navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [mood, setMood] = useState('quiet');
  const [status, setStatus] = useState('a stillroom is for a short note. no file, no vault.');
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<Note | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    sbRest('stillroom_notes?select=id,title,body,mood,author,created_at&order=created_at.desc&limit=16')
      .then((r) => r.json())
      .then((rows) => setNotes(Array.isArray(rows) ? rows : []))
      .catch(() => setNotes([]));
  }, [tick]);

  useEffect(() => {
    if (!shareId) {
      setOpened(null);
      return;
    }
    sbRest(`stillroom_notes?id=eq.${encodeURIComponent(shareId)}&select=*&limit=1`)
      .then((r) => r.json())
      .then((rows) => setOpened(Array.isArray(rows) && rows[0] ? rows[0] : null))
      .catch(() => setOpened(null));
  }, [shareId]);

  async function leave() {
    if (busy || title.trim().length < 1 || body.trim().length < 1) return;
    setBusy(true);
    const id = uid();
    try {
      const saved = await sbRest('stillroom_notes', {
        method: 'POST',
        body: JSON.stringify({
          id,
          title: title.trim().slice(0, 140),
          body: body.trim().slice(0, 4000),
          mood,
          author: author.trim() || null,
        }),
      });
      if (!saved.ok) throw new Error((await saved.text()).slice(0, 160) || 'could not leave the note');
      setTitle('');
      setBody('');
      setStatus('left on the shelf. paste /stillroom/' + id + ' in Discord for a card.');
      setTick((n) => n + 1);
      navigate('stillroom', id);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'could not leave that');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24 apple-in">
        <p className="text-[12px] uppercase tracking-[0.16em] text-white/40">stillroom</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">Leave a note, not a file.</h1>
        <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
          The stillroom is beside the hosting desks. It keeps a title, a mood, and a paragraph in stillroom_notes. File sharing stays on linen, courier, and keepsake.
        </p>

        {opened && (
          <article className="glass apple-card rounded-3xl p-6 mt-8">
            <p className="text-xs text-white/40">{opened.mood || 'quiet'}{opened.author ? ` · ${opened.author}` : ''}</p>
            <h2 className="text-2xl text-white mt-2 tracking-tight">{opened.title}</h2>
            <p className="text-neutral-300 mt-3 leading-relaxed whitespace-pre-wrap">{opened.body}</p>
          </article>
        )}

        <section className="glass apple-card rounded-3xl p-6 mt-8">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="a short title" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          <div className="flex flex-wrap gap-2 mt-3">
            {MOODS.map((item) => (
              <button key={item} type="button" onClick={() => setMood(item)} className={`text-[13px] px-3 py-1.5 rounded-full transition ${mood === item ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}>{item}</button>
            ))}
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="what you wanted to leave" className="mt-3 w-full min-h-32 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="mt-3 w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none" />
          <button onClick={leave} disabled={busy || !title.trim() || !body.trim()} className="mt-4 text-sm font-medium px-4 py-2.5 rounded-full bg-white text-black disabled:opacity-40 active:scale-[0.98] transition">{busy ? 'leaving…' : 'leave it'}</button>
          <p className="text-sm text-neutral-400 mt-3">{status}</p>
        </section>

        <section className="mt-10 space-y-2">
          {notes.map((note) => (
            <button key={note.id} onClick={() => navigate('stillroom', note.id)} className="w-full text-left glass rounded-2xl px-4 py-3 lift">
              <span className="text-white text-sm">{note.title}</span>
              <span className="block text-xs text-neutral-500 mt-1">{note.mood || 'quiet'} · {note.body.slice(0, 90)}</span>
            </button>
          ))}
          {!notes.length && <p className="text-sm text-neutral-500">nothing on the shelf yet.</p>}
        </section>
      </main>
    </div>
  );
}
