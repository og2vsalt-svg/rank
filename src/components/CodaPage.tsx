import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function CodaPage() {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('coda.txt');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [link, setLink] = useState('');

  const send = async () => {
    const body = text.trim();
    if (!body) {
      setErr('write something first');
      return;
    }
    setErr('');
    setEmbed('');
    setLink('');
    const bytes = new TextEncoder().encode(body);
    setWarn(bytes.length > 2 * 1024 * 1024 ? 'long coda. the tab may feel slow encoding it.' : '');
    setBusy(true);
    try {
      const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('encode failed'));
        r.readAsDataURL(blob);
      });
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const name = (title.trim() || 'coda.txt').replace(/[^\w.\- ]+/g, '') || 'coda.txt';
      const res = await publishShare({
        id,
        name,
        type: 'text/plain',
        size: blob.size,
        dataUrl,
        author: 'coda',
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      const urls = shareUrls(res.id || id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'coda failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">coda</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write an ending, publish it as a file.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault. a plain-text drop with a discord unfurl. no character cap, only a slowness note if it gets huge.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="the last paragraph"
            className="w-full min-h-[160px] rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-[#0a84ff]/50"
          />
          <p className="text-xs text-neutral-500 mt-2">{pretty(new TextEncoder().encode(text).length)}</p>
          <button
            onClick={send}
            disabled={busy}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'publishing…' : 'publish coda'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
