import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function ThimblePage() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const go = async () => {
    const body = text.trim();
    if (!body) {
      setErr('write something first');
      return;
    }
    setErr('');
    setWarn(body.length > 200_000 ? 'long note. encoding might feel sleepy. no hard cap.' : '');
    setBusy(true);
    try {
      const blob = new Blob([body], { type: 'text/plain' });
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const id = uid();
      const name = (title.trim() || 'thimble.txt').replace(/\.txt$/i, '') + '.txt';
      const res = await publishShare({
        id,
        name,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'thimble',
      });
      if (!res.ok) {
        setErr(res.error || 'thimble miss');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'thimble miss');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">thimble</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a tiny note that becomes a public file.</h1>
          <p className="text-neutral-400 text-sm mb-7">
            not another vault. type here, we drop a .txt into the share db, and discord gets a clean /s card.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="optional title"
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/40 mb-3"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="write a small thing"
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-[#0a84ff]/40"
          />
          <button
            onClick={go}
            disabled={busy}
            className="mt-4 w-full rounded-full bg-white text-black py-2.5 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 transition-colors"
          >
            {busy ? 'sewing…' : 'publish note'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
