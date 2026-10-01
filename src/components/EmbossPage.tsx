import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function EmbossPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [stamp, setStamp] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const press = async () => {
    if (!title.trim() && !body.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const payload = [
        title.trim() || 'untitled plate',
        stamp.trim() ? `stamp: ${stamp.trim()}` : '',
        '',
        body,
      ].filter(Boolean).join('\n');
      const blob = new Blob([payload], { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: `${(title.trim() || 'plate').slice(0, 40)}.txt`,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: stamp.trim() || 'emboss',
      });
      if (!res.ok) throw new Error(res.error || 'the plate cracked');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">emboss</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">raise a title on a note.</h1>
          <p className="text-neutral-400 text-sm mb-6">compose a headed letter, stamp an author, and press it into the share database. discord will show the filename as the card title. this is stationery, not a vault drawer.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="raised title" className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40" />
          <input value={stamp} onChange={(e) => setStamp(e.target.value)} placeholder="optional stamp / author" className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="the letter itself…" className="w-full mb-5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 resize-y" />
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={press} disabled={busy || (!title.trim() && !body.trim())} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]">
            {busy ? 'pressing…' : 'emboss and share'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
