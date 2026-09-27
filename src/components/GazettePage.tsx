import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

export default function GazettePage() {
  const [title, setTitle] = useState('untitled bulletin');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const publish = async () => {
    setErr('');
    setBusy(true);
    try {
      const text = `# ${title.trim() || 'bulletin'}\n\n${body}`;
      const blob = new Blob([text], { type: 'text/markdown' });
      const name = `${(title || 'bulletin').replace(/[^a-z0-9]+/gi, '-').slice(0, 48)}.md`;
      if (blob.size > 40 * 1024 * 1024) setWarn('huge note. encoding might feel slow. no cap tho.');
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not encode'));
        r.readAsDataURL(blob);
      });
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type: 'text/markdown', size: blob.size, dataUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'publish failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (json.warn) setWarn(json.warn);
    } catch (e: any) {
      setErr(e?.message || 'gazette failed');
    } finally {
      setBusy(false);
    }
  };

  const bytes = new TextEncoder().encode(`# ${title}\n\n${body}`).length;

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
          <p className="text-[#0a84ff] text-sm mb-2">gazette</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">write a bulletin, ship it as a file.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. this is a one-shot markdown drop with a discord card.</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50"
            placeholder="headline"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="w-full mb-4 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/50 resize-y min-h-[12rem]"
            placeholder="what happened"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-500">{pretty(bytes)}</p>
            <button
              onClick={publish}
              disabled={busy || !body.trim()}
              className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
            >
              {busy ? 'sending…' : 'publish bulletin'}
            </button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
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
