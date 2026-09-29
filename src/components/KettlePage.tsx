import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export default function KettlePage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const brew = async () => {
    const name = (title.trim() || 'kettle-note') + '.txt';
    const text = [title.trim() && `# ${title.trim()}`, body.trim()].filter(Boolean).join('\n\n');
    if (!text) {
      setErr('write something first.');
      return;
    }
    setErr('');
    setBusy(true);
    setWarn(text.length > 400_000 ? 'long note. encoding may feel slow. no cap.' : '');
    try {
      const dataUrl = `data:text/plain;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(text)))}`;
      const id = uid();
      const res = await publishShare({
        id,
        name,
        type: 'text/plain',
        size: new Blob([text]).size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'could not pour');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      if (res.warn) setWarn(res.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'kettle failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">kettle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">brew a note, then pour it public.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. a quiet kettle for text that becomes a discord-ready drop.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50 transition"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="what you want to send"
            rows={8}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/50 transition resize-none"
          />
          <button
            onClick={brew}
            disabled={busy}
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'pouring…' : 'pour to share db'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
              <p className="text-[11px] text-neutral-600">{pretty(new Blob([body]).size)} note</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
