import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Mark = { id: string; title: string; body: string; author: string | null; created_at: string };

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function KeelPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    const res = await fetch(
      `${SB_URL}/rest/v1/keel_marks?page_ref=eq.keel&select=id,title,body,author,created_at&order=created_at.desc&limit=24`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } },
    );
    if (!res.ok) return;
    const rows = await res.json();
    if (Array.isArray(rows)) setMarks(rows);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!title.trim() || !body.trim()) return;
    setBusy(true);
    setErr('');
    const res = await fetch(`${SB_URL}/rest/v1/keel_marks`, {
      method: 'POST',
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        title: title.trim().slice(0, 140),
        body: body.trim().slice(0, 4000),
        author: author.trim() || null,
        page_ref: 'keel',
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setErr((await res.text()).slice(0, 180) || 'the shelf did not take that mark');
      return;
    }
    setTitle('');
    setBody('');
    load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-24 pb-20">
        <motion.div initial="hidden" animate="show" variants={rise}>
          <p className="text-[12px] tracking-[0.16em] uppercase text-white/45">reading shelf</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">keel</h1>
          <p className="mt-3 text-neutral-400 max-w-xl leading-relaxed">
            A place for a line you want to come back to. Marks live in their own table, not the file cabinet. Paste <span className="text-white/80">/keel</span> in Discord and the card unfurls.
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass mt-8 rounded-3xl p-5 sm:p-6"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="the line, the page, the thing you do not want to lose"
            rows={4}
            className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="name, optional"
            className="mt-3 w-full rounded-2xl bg-white/5 border border-white/10 px-3.5 py-2.5 text-sm outline-none focus:border-white/25"
          />
          <button
            onClick={save}
            disabled={!title.trim() || !body.trim() || busy}
            className="mt-5 rounded-full bg-white text-black px-5 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'setting the mark' : 'set the mark'}
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        </motion.section>

        <div className="mt-4 space-y-3">
          {marks.map((mark, i) => (
            <motion.article
              key={mark.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="glass rounded-3xl px-5 py-4"
            >
              <h2 className="text-[15px] font-medium text-white">{mark.title}</h2>
              <p className="mt-1.5 text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{mark.body}</p>
              <p className="mt-2 text-[12px] text-white/35">
                {mark.author || 'unsigned'} · {new Date(mark.created_at).toLocaleString()}
              </p>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
