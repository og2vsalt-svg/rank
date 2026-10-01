import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { sbRest } from '../lib/supabase';

export default function BinnaclePage() {
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    const clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
      setStatus('needs a full http link');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      const res = await sbRest('links', {
        method: 'POST',
        body: JSON.stringify({ url: clean, note: note.slice(0, 280) || null, author: author.slice(0, 40) || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      const row = await res.json();
      const id = Array.isArray(row) ? row[0]?.id : row?.id;
      setStatus(id ? `seated. link id ${id}` : 'seated on the shelf');
      setUrl('');
      setNote('');
    } catch (e: any) {
      setStatus(e.message || 'could not seat the link');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5 max-w-xl mx-auto">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-[#0a84ff] text-sm font-medium mb-3">binnacle</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-semibold tracking-tight text-white mb-3">a compass for links.</motion.h1>
        <p className="text-neutral-400 mb-6 leading-relaxed">no file involved. an address and a short note land in the links table so they stay off this device.</p>
        <div className="glass rounded-3xl p-5 space-y-3">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="why this one" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="name, optional" className="w-full rounded-2xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white outline-none" />
          <button onClick={save} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'seating…' : 'seat the link'}</button>
          {status && <p className="text-sm text-neutral-400">{status}</p>}
        </div>
      </main>
    </div>
  );
}
