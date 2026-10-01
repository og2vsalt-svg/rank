import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function HoltPage() {
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const speak = words / 150;
    const read = words / 220;
    return {
      words,
      chars,
      speak: speak < 1 ? Math.round(speak * 60) + 's spoken' : speak.toFixed(1) + ' min spoken',
      read: read < 1 ? Math.round(read * 60) + 's read' : read.toFixed(1) + ' min read',
    };
  }, [text]);

  const publish = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const blob = new Blob([text], { type: 'text/plain' });
    const dataUrl = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(blob);
    });
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const res = await publishShare({
      id,
      name: 'holt.txt',
      type: 'text/plain',
      size: blob.size,
      dataUrl,
    });
    setBusy(false);
    if (res.ok && res.id) {
      setLink(shareUrls(res.id).embed);
      if (res.warn) setWarn(res.warn);
    } else setWarn(res.error || 'could not publish');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">holt</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">time a passage</h1>
          <p className="text-sm text-neutral-500 mb-6">how long to read or say it. optional public .txt if you want a discord card.</p>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="paste a speech, a letter, a note…" className="w-full min-h-44 rounded-2xl bg-black/30 border border-white/10 p-4 text-sm outline-none" />
          <div className="flex flex-wrap gap-3 mt-5 text-sm text-neutral-400">
            <span>{stats.words} words</span>
            <span>{stats.chars} chars</span>
            <span>{stats.read}</span>
            <span>{stats.speak}</span>
          </div>
          {warn && <p className="text-xs text-amber-200/80 mt-3">{warn}</p>}
          <button disabled={busy || !text.trim()} onClick={publish} className="mt-6 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'sending…' : 'publish as .txt'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4">discord link: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
