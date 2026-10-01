import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function OgeePage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const curve = async () => {
    const text = [`# ogee`, '', '## rise', a, '', '## fall', b].join('\n');
    setBusy(true);
    setErr('');
    try {
      const dataUrl = `data:text/markdown;base64,${btoa(unescape(encodeURIComponent(text)))}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: 'ogee.md',
        type: 'text/markdown',
        size: text.length,
        dataUrl,
        author: 'ogee',
      });
      if (!res.ok) throw new Error(res.error || 'could not curve the note');
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
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm font-medium mb-2 tracking-wide">ogee</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">a double curve of notes</h1>
          <p className="text-neutral-400 text-sm mb-6">two passages become one markdown drop. discord unfurls /s. not the vault grid.</p>
          <textarea value={a} onChange={(e) => setA(e.target.value)} rows={5} placeholder="the rise" className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none resize-y" />
          <textarea value={b} onChange={(e) => setB(e.target.value)} rows={5} placeholder="the fall" className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm outline-none resize-y" />
          <button disabled={busy || (!a.trim() && !b.trim())} onClick={curve} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'curving…' : 'publish the curve'}
          </button>
          {err && <p className="text-red-400 text-sm mt-4">{err}</p>}
          {embed && <p className="text-sm text-[#0a84ff] mt-4 break-all">{embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
