import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function WispPage() {
  const [text, setText] = useState('');
  const [hours, setHours] = useState(24);
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const publish = async () => {
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setErr('');
    try {
      const id = uid();
      const blob = new Blob([body], { type: 'text/plain' });
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      const res = await publishShare({
        id,
        name: 'wisp.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        expiresAt,
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish');
        return;
      }
      setLink(shareUrls(id).embed);
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
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">wisp</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a note that fades on its own.</h1>
          <p className="text-neutral-400 text-sm mb-6">write something, pick a lifetime, get a discord-ready link. no vault tray.</p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="say it once"
            className="w-full rounded-2xl bg-white/[0.04] border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 mb-4 resize-none"
          />
          <div className="flex items-center gap-3 mb-5">
            <label className="text-xs text-neutral-500">lives for</label>
            <input
              type="range"
              min={1}
              max={168}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs text-neutral-300 w-16 text-right">{hours}h</span>
          </div>
          <button
            onClick={publish}
            disabled={busy || !text.trim()}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'sending…' : 'publish wisp'}
          </button>
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">{link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
