import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function sha256(text: string) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function EchoPage() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('echo.txt');
  const [digest, setDigest] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const bytes = useMemo(() => new TextEncoder().encode(text).length, [text]);
  const warn = bytes > 40 * 1024 * 1024 ? 'no cap. a note this long can make the tab feel sleepy.' : '';

  const fingerprint = async () => {
    setErr('');
    try {
      setDigest(await sha256(text));
    } catch (e: any) {
      setErr(e?.message || 'could not hash');
    }
  };

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setErr('');
    try {
      const blob = new Blob([text], { type: 'text/plain' });
      const dataUrl = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(text)))}`;
      const id = uid();
      const res = await publishShare({
        id,
        name: title.trim() || 'echo.txt',
        type: 'text/plain',
        size: blob.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'echo failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'echo failed');
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
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">echo</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write a note, hear the hash, send it out.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. a text desk that fingerprints locally, then can publish to the public share table.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none focus:border-[#0a84ff]/40"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="say something quiet"
            className="w-full bg-white/5 border border-white/10 rounded-3xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40 resize-y"
          />
          <p className="text-xs text-neutral-500 mt-3">{bytes} bytes</p>
          {warn && <p className="text-xs text-amber-300/80 mt-2">{warn}</p>}
          <div className="flex flex-wrap gap-2 mt-4">
            <button onClick={fingerprint} className="px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm hover:bg-white/12 transition-colors">
              fingerprint
            </button>
            <button
              disabled={!text.trim() || busy}
              onClick={send}
              className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition-colors"
            >
              {busy ? 'sending…' : 'publish echo'}
            </button>
          </div>
          {digest && <p className="text-[11px] text-neutral-400 mt-4 break-all font-mono">{digest}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-300 mt-4 break-all">discord (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
