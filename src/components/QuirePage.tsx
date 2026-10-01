import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare } from '../lib/cloudShare';

export default function QuirePage() {
  const [id, setId] = useState('');
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [size, setSize] = useState(18);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const open = async () => {
    const clean = id.trim().replace(/^.*\//, '');
    if (!clean) return;
    setBusy(true);
    setErr('');
    setText('');
    try {
      const meta = await fetchShare(clean);
      if (!meta?.url) {
        setErr('no public drop with that id');
        return;
      }
      setName(meta.name);
      const res = await fetch(meta.url);
      if (!res.ok) {
        setErr('the file url did not open');
        return;
      }
      const raw = await res.text();
      if (raw.length > 1_500_000) {
        setText(raw.slice(0, 1_500_000));
        setErr('showing the first stretch. the rest is still on the file — the tab would lag if it painted all of it.');
      } else {
        setText(raw);
      }
    } catch {
      setErr('could not read that drop');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-5 pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="text-[12px] tracking-[0.18em] uppercase text-white/40">quire</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">read a public text drop</h1>
          <p className="mt-2 text-sm text-white/55">A reading room, not a drawer. Paste a share id and the page pulls the file already sitting in the database.</p>
          <div className="mt-6 flex gap-2">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="flex-1 rounded-full bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm outline-none" />
            <button onClick={open} className="px-4 py-2.5 rounded-full bg-white text-black text-sm font-medium">{busy ? '…' : 'open'}</button>
          </div>
          <label className="mt-4 flex items-center gap-3 text-xs text-white/45">
            type size
            <input type="range" min={14} max={28} value={size} onChange={(e) => setSize(Number(e.target.value))} />
          </label>
          {err && <p className="mt-3 text-xs text-amber-200/80">{err}</p>}
          {name && <p className="mt-6 text-xs text-white/40">{name}</p>}
          {text && (
            <article className="mt-2 whitespace-pre-wrap leading-relaxed text-white/85" style={{ fontSize: size }}>
              {text}
            </article>
          )}
        </motion.div>
      </main>
    </div>
  );
}
