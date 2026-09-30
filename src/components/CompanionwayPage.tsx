import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function CompanionwayPage() {
  const [text, setText] = useState('');
  const [name, setName] = useState('note.txt');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setErr('');
    setEmbed('');
    try {
      const blob = new Blob([body], { type: 'text/plain' });
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const fileName = name.trim() || 'note.txt';
      const res = await publishShare({
        id,
        name: fileName,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish note');
        return;
      }
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">companionway</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write downstairs, share upstairs.</h1>
          <p className="text-neutral-400 text-sm mb-6">plain text becomes a public drop. discord unfurls the filename and size like any other file.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mb-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none" placeholder="filename" />
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="type something worth sending" className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none resize-y" />
          <button onClick={publish} disabled={busy || !text.trim()} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'publishing…' : 'publish note'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 break-all mt-4">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
