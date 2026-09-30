import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function WeftPage() {
  const [threads, setThreads] = useState<string[]>(['', '', '']);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');
  const [size, setSize] = useState(0);

  const weave = async () => {
    setErr('');
    const parts = threads.map((t) => t.trim()).filter(Boolean);
    if (!parts.length) {
      setErr('add at least one thread');
      return;
    }
    const text = parts.map((t, i) => `— thread ${i + 1} —\n${t}`).join('\n\n');
    const file = new File([text], 'weft.txt', { type: 'text/plain' });
    setSize(file.size);
    setWarn(file.size > 2 * 1024 * 1024 ? 'long weave. the tab may feel slow. no cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        author: 'weft',
      });
      if (!res.ok) throw new Error(res.error || 'weft failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'weft failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">weft</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">weave loose notes into one public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not a vault. three threads become a single .txt in the share db. discord unfurls /s.
          </p>
          <div className="space-y-3 mb-5">
            {threads.map((t, i) => (
              <textarea
                key={i}
                value={t}
                rows={3}
                placeholder={`thread ${i + 1}`}
                onChange={(e) => {
                  const next = [...threads];
                  next[i] = e.target.value;
                  setThreads(next);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-4 py-3 text-sm outline-none focus:border-[#0a84ff]/40 resize-none"
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setThreads((t) => [...t, ''])}
              className="px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm"
            >
              add thread
            </button>
            <button
              disabled={busy}
              onClick={weave}
              className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
            >
              {busy ? 'weaving…' : 'publish weave'}
            </button>
          </div>
          {size > 0 && <p className="text-xs text-neutral-500">{pretty(size)}</p>}
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>discord (copied): {embed}</p>
              <p>app: {app}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
