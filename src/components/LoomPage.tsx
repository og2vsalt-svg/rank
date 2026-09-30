import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function LoomPage() {
  const [thread, setThread] = useState('');
  const [warp, setWarp] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const add = () => {
    const t = thread.trim();
    if (!t) return;
    setWarp((w) => [...w, t]);
    setThread('');
  };

  const weave = async () => {
    if (!warp.length) {
      setErr('add at least one thread');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const body = warp.map((line, i) => `${i + 1}. ${line}`).join('\n');
      const file = new File([body], 'loom.txt', { type: 'text/plain' });
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const pub = await publishShare({
        id,
        name: `loom · ${warp.length} threads`,
        type: 'text/plain',
        size: file.size,
        dataUrl,
        author: 'loom',
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not weave');
        return;
      }
      const urls = shareUrls(id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'loom failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">loom</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">wind several lines into one drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. a small cloth of notes that publishes as one text file with a finished discord card.
          </p>
          <div className="flex gap-2 mb-4">
            <input
              value={thread}
              onChange={(e) => setThread(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="a thread"
              className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
            />
            <button onClick={add} className="px-4 py-2.5 rounded-full bg-white/8 border border-white/10 text-sm">
              add
            </button>
          </div>
          <ul className="space-y-1.5 mb-5">
            {warp.map((line, i) => (
              <li key={i} className="text-sm text-neutral-300 px-3 py-2 rounded-2xl bg-white/[0.03]">
                {line}
              </li>
            ))}
          </ul>
          <button onClick={weave} disabled={busy} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50">
            {busy ? 'weaving…' : 'publish the cloth'}
          </button>
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {link && (
            <div className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>app: {link}</p>
              <p>discord embed (copied): {embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
