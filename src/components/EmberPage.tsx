import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function EmberPage() {
  const [title, setTitle] = useState('ember');
  const [hex, setHex] = useState('#0A84FF');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const burn = async () => {
    setErr('');
    setEmbed('');
    setApp('');
    setBusy(true);
    try {
      const body = [
        title.trim() || 'ember',
        hex.trim() || '#0A84FF',
        note.trim() || 'a quiet color card',
        new Date().toISOString(),
      ].join('\n');
      const blob = new Blob([body], { type: 'text/plain' });
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(body)))}`;
      const id = uid();
      const name = `${(title.trim() || 'ember').slice(0, 40)}.txt`;
      const res = await publishShare({
        id,
        name,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: note.trim() || undefined,
      });
      if (!res.ok) throw new Error(res.error || 'ember failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'ember failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">ember</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write a color card, then let it travel.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. a tiny text drop with a title, a hex, and a line. discord unfurls /s.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="h-11 w-14 rounded-xl bg-transparent border border-white/10 cursor-pointer"
            />
            <input
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            />
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="one line"
            className="w-full mb-5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
          />
          <button
            onClick={burn}
            disabled={busy}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50"
          >
            {busy ? 'warming…' : 'send the card'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-300 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
