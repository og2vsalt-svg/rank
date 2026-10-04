import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Line = { id: string; share_id: string | null; line: string; author: string | null; created_at: string };

export default function StringerPage() {
  const [line, setLine] = useState('');
  const [shareId, setShareId] = useState('');
  const [author, setAuthor] = useState('');
  const [rows, setRows] = useState<Line[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');

  const load = async () => {
    const res = await fetch('/api/stringer').then((r) => r.json()).catch(() => null);
    if (res?.ok && Array.isArray(res.lines)) setRows(res.lines);
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!line.trim()) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/stringer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: line.trim(), shareId: shareId.trim(), author: author.trim() }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    if (!res?.ok) { setError(res?.error || 'the shelf did not take that line'); return; }
    setCard(`${location.origin}/stringer/${res.line.id}`);
    setLine('');
    load();
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { setError(value); }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#ffd60a] text-sm font-medium mb-2 tracking-wide">stringer</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">a line along a file that already landed.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">not a vault. pin a short note to a share id, or leave the id blank. Discord unfurls /stringer. nothing here refuses a long file, because this desk does not take the bytes.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="glass rounded-3xl p-6 sm:p-8">
          <input value={line} onChange={(e) => setLine(e.target.value)} maxLength={280} placeholder="a line, up to 280" className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#ffd60a]/50" />
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <input value={shareId} onChange={(e) => setShareId(e.target.value)} placeholder="share id, optional" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#ffd60a]/50" />
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#ffd60a]/50" />
          </div>
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <button disabled={!line.trim() || busy} onClick={send} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'laying…' : 'lay the line'}</button>
          {card && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <p className="text-xs text-neutral-500 break-all">{card}</p>
              <button onClick={() => copy(card)} className="text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
            </div>
          )}
        </motion.div>
        <div className="mt-6 space-y-2">
          {rows.map((row) => (
            <motion.article key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl px-4 py-3">
              <p className="text-sm text-white">{row.line}</p>
              <p className="text-[12px] text-neutral-500 mt-1">{row.author || 'stringer'}{row.share_id ? ` · ${row.share_id}` : ''}</p>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
