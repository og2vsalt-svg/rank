import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';

type Note = { id: string; body: string; author: string | null; tone: string; created_at: string };
const tones = ['note', 'handoff', 'later'] as const;

export default function CuddyPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [tone, setTone] = useState<(typeof tones)[number]>('note');
  const [status, setStatus] = useState('the cuddy is a note shelf, not a file drawer.');
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await fetch('/api/cuddy');
    const data = await r.json();
    if (data.notes) setNotes(data.notes);
    else setStatus(data.error || 'could not read notes');
  }

  useEffect(() => { load(); }, []);

  async function send() {
    if (!body.trim()) return;
    setBusy(true);
    setStatus('filing the line…');
    const r = await fetch('/api/cuddy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, author, tone }),
    });
    const data = await r.json();
    setBusy(false);
    if (!r.ok) {
      setStatus(data.error || 'the note did not land');
      return;
    }
    setBody('');
    setStatus('filed. paste /cuddy in Discord for the desk card.');
    load();
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-20">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium">a small shelf for lines</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="mt-3 text-4xl font-semibold tracking-tight">cuddy</motion.h1>
        <p className="mt-3 text-neutral-400">{status}</p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="a handoff, a reminder, a line you want on the desk" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-[#0a84ff]/50" />
          <div className="mt-3 flex flex-wrap gap-2">
            {tones.map((t) => (
              <button key={t} onClick={() => setTone(t)} className={`px-3 py-1.5 rounded-full text-sm ${tone === t ? 'bg-white text-black' : 'bg-white/5 text-neutral-300'}`}>{t}</button>
            ))}
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-sm outline-none" />
            <button disabled={busy} onClick={send} className="ml-auto px-4 py-1.5 rounded-full bg-[#0a84ff] text-white text-sm disabled:opacity-50">{busy ? 'filing' : 'file note'}</button>
          </div>
        </motion.div>
        <div className="mt-6 space-y-3">
          {notes.map((n, i) => (
            <motion.article key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.03 }} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{n.body}</p>
              <p className="mt-2 text-xs text-neutral-500">{n.tone}{n.author ? ` · ${n.author}` : ''} · {new Date(n.created_at).toLocaleString()}</p>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
