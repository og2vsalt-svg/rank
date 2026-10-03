import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';

const ease = [0.22, 1, 0.36, 1] as const;

type Share = { id: string; name: string; size: number; mime?: string };
type Seam = { id: string; left_id: string; right_id: string; note: string | null; author: string | null; created_at: string };

function pretty(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function GarboardPage() {
  const [shares, setShares] = useState<Share[]>([]);
  const [seams, setSeams] = useState<Seam[]>([]);
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('a seam between two drops already in the share table. nothing new is uploaded here.');

  async function load() {
    const [shareRes, seamRes] = await Promise.all([
      fetch('/api/share?list=1&limit=16'),
      fetch('/api/garboard'),
    ]);
    const shareData = await shareRes.json();
    const seamData = await seamRes.json();
    if (shareRes.ok) setShares(Array.isArray(shareData.shares) ? shareData.shares : []);
    if (seamRes.ok) setSeams(Array.isArray(seamData.seams) ? seamData.seams : []);
  }

  useEffect(() => {
    load().catch(() => setStatus('could not read the seam table'));
  }, []);

  async function writeSeam() {
    if (!leftId || !rightId || !note.trim() || leftId === rightId) return;
    setBusy(true);
    try {
      const r = await fetch('/api/garboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leftId, rightId, note: note.trim(), author: author.trim() || 'garboard' }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'seam was not written');
      setNote('');
      setStatus('seam written. paste /garboard in Discord for the card.');
      await load();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'seam failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto px-5 pt-28 pb-24">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease }} className="text-[#0a84ff] text-[13px] tracking-wide">seam desk</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">garboard</motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05, ease }} className="mt-4 text-neutral-400 text-lg max-w-xl leading-relaxed">
          Pick two files that already landed and leave a note on the join. The vault stays where it is.
        </motion.p>
        <div className="mt-8 grid sm:grid-cols-2 gap-3">
          <select value={leftId} onChange={(e) => setLeftId(e.target.value)} className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none">
            <option value="">left drop</option>
            {shares.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={rightId} onChange={(e) => setRightId(e.target.value)} className="rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none">
            <option value="">right drop</option>
            {shares.map((s) => <option key={`r-${s.id}`} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25" />
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="what joins them" className="mt-3 w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 outline-none focus:border-white/25 resize-none" />
        <button disabled={!leftId || !rightId || leftId === rightId || !note.trim() || busy} onClick={writeSeam} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition-transform">write the seam</button>
        <div className="mt-8 space-y-2">
          {shares.slice(0, 6).map((s) => (
            <p key={s.id} className="text-xs text-neutral-500">{s.name} · {pretty(Number(s.size) || 0)} · {s.id}</p>
          ))}
          {seams.map((row) => (
            <motion.div key={row.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3">
              <p className="text-sm text-white">{row.note}</p>
              <p className="text-xs text-neutral-500 mt-1">{row.left_id} · {row.right_id} · {row.author || 'garboard'}</p>
            </motion.div>
          ))}
          {!seams.length && <p className="text-sm text-neutral-500">no seams yet.</p>}
        </div>
        <p className="mt-4 text-sm text-neutral-400">{status}</p>
      </main>
    </div>
  );
}
