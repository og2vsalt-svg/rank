import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { sbRest } from '../lib/supabase';
import { useRouter } from './Router';

type Note = { id: string; share_id: string; author: string | null; body: string; created_at: string };

export default function MarginPage() {
  const { shareId } = useRouter();
  const [target, setTarget] = useState(shareId || '');
  const [author, setAuthor] = useState('');
  const [body, setBody] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const load = (id: string) => {
    if (!id) { setNotes([]); return; }
    sbRest(`margin_notes?share_id=eq.${encodeURIComponent(id)}&select=*&order=created_at.asc&limit=40`)
      .then((r) => r.json())
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => setNotes([]));
  };

  useEffect(() => { if (shareId) { setTarget(shareId); load(shareId); } }, [shareId]);

  const send = async () => {
    if (!target.trim() || !body.trim()) return;
    setErr('');
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const res = await sbRest('margin_notes', {
      method: 'POST',
      body: JSON.stringify({ id, share_id: target.trim(), author: author || null, body: body.trim().slice(0, 500) }),
    });
    if (!res.ok) { setErr((await res.text()).slice(0, 180)); return; }
    setLink(`${window.location.origin}/margin/${id}`);
    setBody('');
    load(target.trim());
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">beside the file</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-4xl font-semibold tracking-tight">Margin</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">Notes on a share that already exists. No new file, no size gate. Paste a share id, write in the margin, and /margin/id unfurls in Discord without leaking the file itself.</p>
        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="share id" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]" />
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="a line in the margin" className="mt-3 min-h-28 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]" />
          <div className="mt-3 flex gap-2">
            <button onClick={() => load(target.trim())} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">load notes</button>
            <button onClick={send} className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition-transform duration-200 hover:scale-[1.02]">leave a note</button>
          </div>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
          {link && <p className="mt-3 text-sm"><a className="text-[#0a84ff]" href={link}>{link}</a></p>}
        </section>
        <ul className="mt-8 space-y-3">
          {notes.map((row, i) => (
            <motion.li key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-[15px] leading-relaxed">{row.body}</p>
              <p className="mt-1 text-xs text-white/40">{row.author || 'unsigned'} · {row.share_id}</p>
            </motion.li>
          ))}
        </ul>
      </main>
    </div>
  );
}
