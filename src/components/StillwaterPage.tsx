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

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function StillwaterPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [items, setItems] = useState<{ file: File; done?: string; embed?: string }[]>([]);

  const add = (list: FileList | File[] | undefined) => {
    if (!list || !list.length) return;
    const next = Array.from(list).map((file) => ({ file }));
    setItems((prev) => [...prev, ...next]);
    const heavy = next.some((n) => n.file.size > 40 * 1024 * 1024);
    setWarn(heavy ? 'no cap. a few large files can make this tab feel still for a minute.' : '');
  };

  const sendOne = async (idx: number) => {
    const row = items[idx];
    if (!row) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(row.file);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({
        id,
        name: row.file.name,
        type: row.file.type || 'application/octet-stream',
        size: row.file.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      const urls = shareUrls(res.id || id);
      setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, done: urls.app, embed: urls.embed } : p)));
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'stillwater failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">stillwater</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a quiet pile, one drop at a time.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            line up local files, then publish each into the share db. every /s link gets a discord embed.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => add(e.target.files || undefined)} />
            <p className="text-white font-medium">set files on the water</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          <div className="mt-6 space-y-3">
            {items.map((row, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.04] border border-white/8 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{row.file.name}</p>
                    <p className="text-[11px] text-neutral-500">{pretty(row.file.size)}</p>
                  </div>
                  <button
                    onClick={() => sendOne(i)}
                    disabled={busy || !!row.embed}
                    className="shrink-0 rounded-full bg-white text-black px-3.5 py-1.5 text-xs font-medium disabled:opacity-40"
                  >
                    {row.embed ? 'live' : busy ? '…' : 'send'}
                  </button>
                </div>
                {row.embed && <p className="text-[11px] text-neutral-400 mt-2 break-all">{row.embed}</p>}
              </div>
            ))}
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
        </motion.div>
      </div>
    </div>
  );
}
