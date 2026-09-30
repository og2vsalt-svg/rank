import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function ThresholdPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const send = async () => {
    const text = [title.trim(), body.trim()].filter(Boolean).join('\n\n');
    if (!text) return;
    setBusy(true);
    setErr('');
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
      const id = uid();
      const pub = await publishShare({
        id,
        name: (title.trim() || 'threshold') + '.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'threshold',
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not write the note');
        return;
      }
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'threshold failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">threshold</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">leave a note on the lintel.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. a short text drop written into the public share table, with a discord card on the other side.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 mb-3"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="what should sit on the door"
            rows={7}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 resize-none"
          />
          <button
            onClick={send}
            disabled={busy || (!title.trim() && !body.trim())}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'writing…' : 'publish note'}
          </button>
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord card copied: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
