import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function ClevisPage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');

  const pin = async () => {
    const left = a.trim();
    const right = b.trim();
    if (!left && !right) return;
    setBusy(true);
    setErr('');
    setLink('');
    const body = `— pin a —\n${left}\n\n— pin b —\n${right}\n`;
    const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
    setWarn(blob.size > 2 * 1024 * 1024 ? 'long pins. the write may feel slow. no cap.' : '');
    try {
      const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(body)}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: (title.trim() || 'clevis') + '.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'clevis',
      });
      if (!res.ok) throw new Error(res.error || 'the pin would not close');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      if (res.warn) setWarn(res.warn);
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
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-7"
        >
          <p className="text-[#0a84ff] text-sm mb-2">clevis</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pin two notes through one eye.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            two short texts become one public drop. no file vault — just a pin you can paste into discord.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="optional title"
            className="w-full mb-4 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 transition-colors"
          />
          <textarea
            value={a}
            onChange={(e) => setA(e.target.value)}
            rows={4}
            placeholder="first pin"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 transition-colors resize-none"
          />
          <textarea
            value={b}
            onChange={(e) => setB(e.target.value)}
            rows={4}
            placeholder="second pin"
            className="w-full mb-5 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40 transition-colors resize-none"
          />
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button
            onClick={pin}
            disabled={busy || (!a.trim() && !b.trim())}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]"
          >
            {busy ? 'closing…' : 'close the pin'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
