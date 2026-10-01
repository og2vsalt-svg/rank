import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

const swatches = ['#0A84FF', '#30D158', '#FF9F0A', '#FF375F', '#BF5AF2', '#F5F5F7'];

export default function LanyardPage() {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const save = async () => {
    const clean = id.trim().replace(/^.*\//, '');
    if (!clean) return;
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const res = await fetch('/api/share', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clean, caption, cardTitle: title, color }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || 'could not retouch that card');
        return;
      }
      setLink(shareUrls(clean).embed);
    } catch {
      setErr('network missed the share api');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="max-w-xl mx-auto px-5 pt-28 pb-24">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <p className="text-[12px] tracking-[0.18em] uppercase text-white/40">lanyard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">retouch a discord card</h1>
          <p className="mt-2 text-sm text-white/55 leading-relaxed">Does not re-upload the file. It writes a title, caption, and accent onto the existing share row so every /s link unfurls with that card.</p>
          <div className="mt-8 space-y-3">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="share id or paste a /s link" className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25" />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="card title (optional)" className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25" />
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="caption discord should show" rows={3} className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-white/25" />
            <div className="flex gap-2">
              {swatches.map((c) => (
                <button key={c} onClick={() => setColor(c)} aria-label={c} className="h-8 w-8 rounded-full border" style={{ background: c, borderColor: color === c ? '#fff' : 'transparent' }} />
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
            <p className="text-xs text-white/40">preview</p>
            <p className="mt-2 font-medium">{title || 'untitled drop'}</p>
            <p className="mt-1 text-sm text-white/55">{caption || 'caption lands under the file name on discord.'}</p>
          </div>
          {err && <p className="mt-3 text-xs text-red-300">{err}</p>}
          <button disabled={!id.trim() || busy} onClick={save} className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'saving…' : 'write card'}</button>
          {link && <a href={link} className="mt-4 block text-sm text-sky-300 break-all">{link}</a>}
        </motion.div>
      </main>
    </div>
  );
}
