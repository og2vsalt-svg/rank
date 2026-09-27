import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function VellumPage() {
  const [title, setTitle] = useState('note.txt');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const send = async () => {
    const text = body.trim();
    if (!text) {
      setErr('write something first');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const file = new File([text], title || 'note.txt', { type: 'text/plain' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('encode failed'));
        r.readAsDataURL(file);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const pub = await publishShare({ id, name: file.name, type: file.type, size: file.size, dataUrl });
      if (!pub.ok) throw new Error(pub.error || 'publish failed');
      const urls = shareUrls(pub.id || id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'vellum failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">vellum</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write a note, ship it as a public file.</h1>
          <p className="text-neutral-400 text-sm mb-6">no vault grid. text becomes a .txt on the share db with a discord /s card.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm mb-3 outline-none focus:border-[#0a84ff]/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 resize-y" placeholder="type here" />
          <button onClick={send} disabled={busy} className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">{busy ? 'shipping…' : 'publish note'}</button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && (
            <div className="mt-5 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
