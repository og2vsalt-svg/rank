import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { sbRest } from '../lib/supabase';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function PalimpsestPage() {
  const [title, setTitle] = useState('');
  const [layers, setLayers] = useState(['', '']);
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function publish() {
    const body = layers.map((l) => l.trim()).filter(Boolean).join('\n\n—\n\n');
    if (!title.trim() || !body) {
      setStatus('needs a title and at least one layer');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const id = uid();
      const res = await sbRest('desks', {
        method: 'POST',
        body: JSON.stringify({
          id,
          title: title.trim().slice(0, 140),
          body: body.slice(0, 12000),
          author: author.slice(0, 40) || null,
          kind: 'note',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus(`filed as a desk note. id ${id}. discord card: /p/palimpsest`);
    } catch (e: any) {
      setStatus(e.message || 'could not file the layers');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">palimpsest</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-semibold tracking-tight text-white mb-3">write over the last line.</motion.h1>
        <p className="text-neutral-400 mb-6 leading-relaxed">two or three layers of a note, kept in the desks table. not a file drawer.</p>
        <div className="space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
          {layers.map((layer, i) => (
            <textarea key={i} value={layer} onChange={(e) => setLayers(layers.map((l, j) => (j === i ? e.target.value : l)))} placeholder={`layer ${i + 1}`} rows={4} className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
          ))}
          <div className="flex gap-2">
            <button onClick={() => setLayers([...layers, ''])} className="text-sm text-neutral-300 px-3 py-2 rounded-full glass">add a layer</button>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name" className="flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm text-white outline-none" />
          </div>
          <button onClick={publish} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'filing…' : 'file the layers'}</button>
          {status && <p className="text-sm text-neutral-400">{status}</p>}
        </div>
      </main>
    </div>
  );
}
