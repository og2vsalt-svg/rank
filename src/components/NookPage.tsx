import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function NookPage() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const publish = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setErr('');
    setWarn(body.length > 400_000 ? 'long note. clients may feel slow opening it.' : '');
    const blob = new Blob([body], { type: 'text/plain' });
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
    const id = uid();
    const res = await publishShare({
      id,
      name: 'nook-note.txt',
      type: 'text/plain',
      size: blob.size,
      dataUrl,
    });
    setBusy(false);
    if (!res.ok) {
      setErr(res.error || 'publish failed');
      return;
    }
    if (res.warn) setWarn(res.warn);
    const urls = shareUrls(id);
    setLink(urls.embed);
    try { await navigator.clipboard.writeText(urls.embed); } catch {}
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">nook</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet note that becomes a file.</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault view. just type, publish to the share db, copy a discord-ready link.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="leave something in the nook…"
            className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50 transition"
          />
          <button
            onClick={publish}
            disabled={busy || !text.trim()}
            className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'publishing…' : 'publish note'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-3 break-all">copied embed: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
