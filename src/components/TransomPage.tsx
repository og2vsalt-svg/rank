import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Share = { id: string; name: string; type?: string; size?: number; mime?: string };

function pretty(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function loadShare(id: string): Promise<Share | null> {
  const r = await fetch(`/api/share?id=${encodeURIComponent(id.trim())}`);
  if (!r.ok) return null;
  return r.json();
}

export default function TransomPage() {
  const [leftId, setLeftId] = useState('');
  const [rightId, setRightId] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [left, setLeft] = useState<Share | null>(null);
  const [right, setRight] = useState<Share | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState('');

  const weigh = async () => {
    setBusy(true);
    setError('');
    setCard('');
    const [a, b] = await Promise.all([loadShare(leftId), loadShare(rightId)]);
    setBusy(false);
    if (!a || !b) {
      setError('both share ids need to already be in the share table');
      setLeft(a);
      setRight(b);
      return;
    }
    setLeft(a);
    setRight(b);
  };

  const verdict = () => {
    if (!left || !right) return '';
    const ls = Number(left.size) || 0;
    const rs = Number(right.size) || 0;
    const heavier = ls === rs ? 'same weight' : ls > rs ? `${left.name} is heavier` : `${right.name} is heavier`;
    const types = (left.type || left.mime || 'file') === (right.type || right.mime || 'file') ? 'same type' : 'types differ';
    return `${heavier}. ${types}.`;
  };

  const file = async () => {
    if (!left || !right) return;
    setBusy(true);
    setError('');
    const saved = await fetch('/api/transom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leftShare: left.id,
        rightShare: right.id,
        verdict: verdict(),
        note: note.trim(),
        author: author.trim(),
      }),
    }).then((r) => r.json()).catch(() => ({}));
    setBusy(false);
    if (!saved?.ok) {
      setError(saved?.error || 'comparison did not land');
      return;
    }
    setCard(`${location.origin}/transom/${saved.transom.id}`);
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { setError(value); }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[#64d2ff] text-sm font-medium mb-2 tracking-wide">transom</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">weigh two drops that already landed.</h1>
          <p className="text-neutral-400 max-w-xl mb-8">not another drawer. paste two share ids, read size and type, then file the comparison. Discord unfurls /transom. no size gate on either side.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-6 sm:p-8">
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={leftId} onChange={(e) => setLeftId(e.target.value)} placeholder="left share id" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50 transition" />
            <input value={rightId} onChange={(e) => setRightId(e.target.value)} placeholder="right share id" className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50 transition" />
          </div>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="your name, optional" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50 transition" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="what the stern should remember" className="mt-3 w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#64d2ff]/50 transition" />
          {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
          <div className="flex flex-wrap gap-2 mt-5">
            <button disabled={!leftId || !rightId || busy} onClick={weigh} className="px-5 py-2.5 rounded-full bg-white/10 text-white text-sm disabled:opacity-40 active:scale-[0.98] transition">weigh</button>
            <button disabled={!left || !right || busy} onClick={file} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 active:scale-[0.98] transition">{busy ? 'filing…' : 'file the comparison'}</button>
          </div>
          {left && right && (
            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              {[left, right].map((row) => (
                <div key={row.id} className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
                  <p className="text-white text-sm font-medium truncate">{row.name}</p>
                  <p className="text-xs text-neutral-500 mt-1">{pretty(Number(row.size) || 0)} · {row.type || row.mime || 'file'}</p>
                </div>
              ))}
            </div>
          )}
          {left && right && <p className="mt-4 text-sm text-neutral-300">{verdict()}</p>}
        </motion.div>
        {card && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-5">
            <p className="text-white font-medium">filed</p>
            <p className="text-xs text-neutral-500 mt-2 break-all">{card}</p>
            <button onClick={() => copy(card)} className="mt-4 text-xs px-3 py-1.5 rounded-full bg-white text-black">copy Discord link</button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
