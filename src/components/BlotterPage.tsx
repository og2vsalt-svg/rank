import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { sbRest } from '../lib/supabase';

type Mark = { id: string; share_id: string; margin: string; author: string | null; created_at: string };

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function BlotterPage() {
  const [shareId, setShareId] = useState('');
  const [margin, setMargin] = useState('');
  const [author, setAuthor] = useState('');
  const [rows, setRows] = useState<Mark[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

  async function load() {
    const res = await sbRest('blotter_marks?select=id,share_id,margin,author,created_at&order=created_at.desc&limit=18');
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) setRows(data);
  }

  useEffect(() => { load(); }, []);

  async function send() {
    setError('');
    const sid = shareId.trim();
    const note = margin.trim();
    if (!sid || !note) return;
    setBusy(true);
    const id = uid();
    const res = await sbRest('blotter_marks', {
      method: 'POST',
      body: JSON.stringify({ id, share_id: sid, margin: note.slice(0, 500), author: author.trim() || null }),
    });
    setBusy(false);
    if (!res.ok) {
      setError('the blotter did not take that line. try a shorter note.');
      return;
    }
    setMargin('');
    await load();
  }

  function copy(id: string) {
    const url = `${location.origin}/blotter/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(''), 1200);
    });
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs uppercase tracking-[0.18em] text-neutral-500">margin, not a drawer</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 text-4xl font-semibold tracking-tight text-white">blotter</motion.h1>
        <p className="mt-3 text-neutral-400 text-[15px] leading-relaxed">write in the margin of a file that already landed. the note lives in its own table. discord unfurls /blotter.</p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 26 }} className="glass rounded-3xl p-6 mt-6">
          <label className="block text-xs text-neutral-500">share id
            <input value={shareId} onChange={(e) => setShareId(e.target.value)} placeholder="the id from /s" className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/30" />
          </label>
          <label className="block text-xs text-neutral-500 mt-3">margin
            <textarea value={margin} onChange={(e) => setMargin(e.target.value)} rows={3} placeholder="a line beside the file, not inside it" className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/30" />
          </label>
          <label className="block text-xs text-neutral-500 mt-3">signed
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="optional" className="mt-1 w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/30" />
          </label>
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <motion.button whileTap={{ scale: 0.98 }} disabled={!shareId.trim() || !margin.trim() || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'inking…' : 'ink the margin'}</motion.button>
        </motion.div>
        <div className="mt-8 space-y-2">
          {rows.map((row, i) => (
            <motion.article key={row.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass rounded-2xl px-4 py-3">
              <p className="text-white text-sm">{row.margin}</p>
              <p className="text-xs text-neutral-500 mt-1">on {row.share_id}{row.author ? ` · ${row.author}` : ''}</p>
              <button onClick={() => copy(row.id)} className="mt-2 text-xs text-[#64d2ff]">{copied === row.id ? 'copied' : 'copy discord link'}</button>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
