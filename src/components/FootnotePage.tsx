import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useRouter } from './Router';
import { sbRest } from '../lib/supabase';

type Note = { id: string; body: string; author: string | null; created_at: string };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// public margin board
export default function FootnotePage() {
  const { shareId } = useRouter();
  const [body, setBody] = useState('');
  const [author, setAuthor] = useState('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const load = async () => {
    const path = shareId
      ? `footnotes?id=eq.${encodeURIComponent(shareId)}&select=*`
      : 'footnotes?select=*&order=created_at.desc&limit=24';
    const res = await sbRest(path);
    if (!res.ok) {
      setErr('the margin board did not answer');
      return;
    }
    const rows = await res.json();
    setNotes(Array.isArray(rows) ? rows : []);
  };

  useEffect(() => {
    load().catch(() => setErr('the margin board did not answer'));
  }, [shareId]);

  const save = async () => {
    const text = body.trim();
    if (!text) return;
    if (text.length > 1800) {
      setErr('long note. it will still save, but the card only shows the first lines.');
    } else setErr('');
    const id = uid();
    const res = await sbRest('footnotes', {
      method: 'POST',
      body: JSON.stringify({ id, body: text.slice(0, 2000), author: author.trim() || null }),
    });
    if (!res.ok) {
      setErr('could not pin that note');
      return;
    }
    setBody('');
    setLink(`${location.origin}/footnote/${id}`);
    await load();
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[13px] text-[#ffd60a] mb-2">footnote</p>
          <h1 className="text-4xl font-semibold tracking-tight">A margin, not a cabinet.</h1>
          <p className="mt-3 text-sm text-neutral-400 leading-relaxed">Short notes live in their own table. Paste the link in Discord and it unfurls. Files stay on the mail slot.</p>
          {!shareId && (
            <div className="mt-6 glass rounded-3xl p-5">
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="signed" className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" />
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="write in the margin" className="mt-3 w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-none" />
              <button onClick={save} className="mt-3 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium active:scale-[0.98] transition-transform">pin note</button>
              {link && <p className="mt-3 text-xs text-neutral-400 break-all">{link}</p>}
            </div>
          )}
          {err && <p className="mt-3 text-sm text-amber-200/90">{err}</p>}
          <div className="mt-6 space-y-3">
            {notes.map((n) => (
              <article key={n.id} className="glass rounded-2xl px-5 py-4">
                <p className="text-sm text-white whitespace-pre-wrap">{n.body}</p>
                <p className="mt-2 text-xs text-neutral-500">{n.author || 'unsigned'} · {new Date(n.created_at).toLocaleString()}</p>
              </article>
            ))}
            {!notes.length && <p className="text-sm text-neutral-500">no notes yet.</p>}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
