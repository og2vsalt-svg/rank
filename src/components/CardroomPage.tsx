import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { fetchShare } from '../lib/cloudShare';

export default function CardroomPage() {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const load = async () => {
    setErr('');
    setOk('');
    const meta = await fetchShare(id.trim());
    if (!meta) {
      setErr('no public share with that id');
      return;
    }
    setName(meta.name);
    setTitle(meta.cardTitle || meta.name);
    setCaption(meta.caption || '');
    setColor(meta.color || '#0A84FF');
  };

  const save = async () => {
    setErr('');
    setOk('');
    const res = await fetch('/api/share', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id.trim(), cardTitle: title, caption, color }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || 'could not rewrite the card');
      return;
    }
    setOk(`${location.origin}/s/${id.trim()}`);
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] tracking-[0.16em] uppercase text-white/40">unfurl desk</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-4xl font-semibold tracking-tight">Card room</motion.h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">Rewrite the Discord card on a file that is already filed. Title, caption, and accent land on the same share row. Paste /s/id, /keepsake/id, or /cardroom after saving.</p>
        <div className="mt-8 flex gap-2">
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id" className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]" />
          <button onClick={load} className="rounded-full bg-white/10 px-4 text-sm">load</button>
        </div>
        <div className="mt-4 grid gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="card title" className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]" />
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption Discord will show" className="min-h-24 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]" />
          <label className="flex items-center gap-3 text-sm text-white/60">accent <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 bg-transparent" /></label>
        </div>
        <motion.div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-[#111113]" animate={{ borderColor: color }}>
          <div className="h-1.5" style={{ background: color }} />
          <div className="p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-white/35">rankvault</p>
            <p className="mt-2 text-xl font-semibold tracking-tight">{title || name || 'card title'}</p>
            <p className="mt-1 text-sm text-white/55">{caption || 'caption shows here'}</p>
          </div>
        </motion.div>
        <button onClick={save} className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition duration-200 hover:scale-[1.02]">save card</button>
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        {ok && <p className="mt-3 text-sm text-[#7ab6ff]">{ok}</p>}
      </main>
    </div>
  );
}
