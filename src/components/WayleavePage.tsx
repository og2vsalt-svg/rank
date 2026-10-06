import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

const SB_URL = (
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://tqfocdktvjuwoiyfgesb.supabase.co'
).replace(/\/$/, '');
const SB_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxZm9jZGt0dmp1d29peWZnZXNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDg0NTIsImV4cCI6MjEwNTQ4NDQ1Mn0.8TW4fQCQHc4c_xTNBEwOK3lSC9HYCbkTbfXuYQB-S8g';

type Leave = {
  id: string;
  title: string;
  body: string;
  author: string | null;
  share_id: string | null;
  accent: string | null;
  created_at: string;
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function WayleavePage() {
  const { shareId } = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [warn, setWarn] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');
  const [rows, setRows] = useState<Leave[]>([]);
  const [open, setOpen] = useState<Leave | null>(null);

  async function load(id?: string | null) {
    const q = id
      ? `id=eq.${encodeURIComponent(id)}&select=*&limit=1`
      : 'select=*&order=created_at.desc&limit=12';
    const res = await fetch(`${SB_URL}/rest/v1/wayleaves?${q}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (id) setOpen(Array.isArray(data) ? data[0] || null : null);
    else if (Array.isArray(data)) setRows(data);
  }

  useEffect(() => {
    load(shareId);
    if (!shareId) load();
  }, [shareId]);

  function pick(next: File | null) {
    setFile(next);
    if (next && next.size > 25 * 1024 * 1024) {
      setWarn('heavy attachment. the browser may feel slow while it sends. it is not refused.');
    } else setWarn('');
  }

  async function leave() {
    if (busy) return;
    if (!title.trim() || !body.trim()) {
      setError('a wayleave needs a title and a line');
      return;
    }
    setBusy(true);
    setError('');
    try {
      let share_id: string | null = null;
      if (file) {
        const sent = await publishLocalFile(file, {
          author: author.trim() || 'wayleave',
          caption: title.trim(),
          cardTitle: file.name,
        });
        if (!sent.ok || !sent.id) throw new Error(sent.error || 'the share table did not take the file');
        share_id = sent.id;
        if (sent.warn) setWarn(sent.warn);
      }
      const id = uid();
      const row = {
        id,
        title: title.trim().slice(0, 140),
        body: body.trim().slice(0, 8000),
        author: author.trim() || null,
        share_id,
        accent: '#0A84FF',
      };
      const res = await fetch(`${SB_URL}/rest/v1/wayleaves`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      if (!res.ok) throw new Error((await res.text()).slice(0, 180) || 'could not leave the note');
      const link = `${window.location.origin}/wayleave/${id}`;
      setCard(link);
      setTitle('');
      setBody('');
      setFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not leave that');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-20 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[12px] tracking-[0.18em] uppercase text-white/40">
          wayleave
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease, delay: 0.04 }} className="mt-2 text-[40px] sm:text-[52px] leading-[0.95] font-semibold tracking-tight text-white">
          A note that can carry a file.
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="mt-3 max-w-xl text-[15px] text-white/55">
          Not another drawer. The line lives in its own table. An optional local file still lands in the share database, and the page link unfurls in Discord.
        </motion.p>

        {open && (
          <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass mt-8 rounded-3xl p-6">
            <p className="text-[12px] uppercase tracking-[0.16em] text-white/40">{open.author || 'unsigned'}</p>
            <h2 className="mt-1 text-[28px] font-semibold tracking-tight">{open.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-white/75">{open.body}</p>
            {open.share_id && (
              <a className="mt-4 inline-flex text-[14px] text-[#64b5ff]" href={`/s/${open.share_id}`}>
                attached file
              </a>
            )}
          </motion.article>
        )}

        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease }} className="glass mt-8 rounded-3xl p-6 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full bg-transparent text-[20px] font-medium outline-none placeholder:text-white/25" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="the line you are leaving" rows={5} className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-white/25" />
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-[14px] outline-none" />
            <label className="rounded-2xl border border-dashed border-white/15 px-4 py-3 text-[14px] text-white/70 cursor-pointer">
              <input type="file" className="sr-only" onChange={(e) => pick(e.target.files?.[0] || null)} />
              {file ? file.name : 'attach a local file, optional'}
            </label>
          </div>
          {warn && <p className="text-[13px] text-amber-200/90">{warn}</p>}
          {error && <p className="text-[13px] text-red-300">{error}</p>}
          <button onClick={leave} disabled={busy} className="rounded-full bg-white text-black px-5 py-2.5 text-[14px] font-medium disabled:opacity-40 transition active:scale-[0.98]">
            {busy ? 'Leaving…' : 'Leave it'}
          </button>
        </motion.section>

        {card && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass mt-4 rounded-2xl px-4 py-3 text-[14px]">
            <p className="text-white/45">discord card</p>
            <p className="mt-1 break-all text-white">{card}</p>
            <button onClick={() => navigator.clipboard.writeText(card)} className="mt-2 text-[12px] rounded-full bg-white text-black px-3 py-1.5">copy</button>
          </motion.div>
        )}

        <div className="mt-8 space-y-2">
          {rows.map((row, i) => (
            <motion.a
              key={row.id}
              href={`/wayleave/${row.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i, ease }}
              className="glass block rounded-2xl px-4 py-3 hover:bg-white/[0.04] transition"
            >
              <div className="text-[15px] font-medium">{row.title}</div>
              <div className="text-[13px] text-white/45 truncate">{row.body}</div>
            </motion.a>
          ))}
        </div>
      </main>
    </div>
  );
}
