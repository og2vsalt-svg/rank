import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function SamphirePage() {
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    if (!title.trim() && !body.trim()) { setErr('write something first'); return; }
    setBusy(true); setErr('');
    try {
      const md = `# ${title.trim() || 'field note'}\n\nplace: ${place.trim() || 'unmarked'}\nwhen: ${new Date().toISOString()}\n\n${body.trim()}\n`;
      const file = new File([md], 'samphire.md', { type: 'text/markdown' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({ id, name: file.name, type: file.type, size: file.size, dataUrl, author: 'samphire' });
      if (!res.ok) throw new Error(res.error || 'failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">samphire</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a field note that walks out as markdown.</h1>
          <p className="text-neutral-400 text-sm mb-6">title, place, body. published to the share db, not the vault.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="title" className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40" />
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="place" className="w-full mb-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} placeholder="what you noticed" className="w-full mb-4 bg-white/5 border border-white/10 rounded-3xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40 resize-none" />
          <button disabled={busy} onClick={publish} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'picking…' : 'publish field note'}</button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
