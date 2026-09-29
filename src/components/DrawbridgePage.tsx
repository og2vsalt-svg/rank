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

const WINDOWS = [
  { label: 'an hour', ms: 60 * 60 * 1000 },
  { label: 'a day', ms: 24 * 60 * 60 * 1000 },
  { label: 'a week', ms: 7 * 24 * 60 * 60 * 1000 },
  { label: 'a month', ms: 30 * 24 * 60 * 60 * 1000 },
];

export default function DrawbridgePage() {
  const [hours, setHours] = useState(WINDOWS[1].ms);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [meta, setMeta] = useState<{ name: string; size: number; type: string } | null>(null);
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [until, setUntil] = useState('');

  const send = async (file: File | undefined) => {
    if (!file) return;
    setErr('');
    setLink('');
    setEmbed('');
    setMeta({ name: file.name, size: file.size, type: file.type || 'application/octet-stream' });
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap, but this size can make the tab feel sleepy while it encodes.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const expiresAt = new Date(Date.now() + hours).toISOString();
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        expiresAt,
        author: 'drawbridge',
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      const urls = shareUrls(res.id || id);
      setLink(urls.app);
      setEmbed(urls.embed);
      setUntil(expiresAt);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'drawbridge failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">drawbridge</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">raise a timed crossing, then lower it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            one local file becomes a public drop that fades when the window ends. discord still gets a clean /s card.
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {WINDOWS.map((w) => (
              <button
                key={w.label}
                onClick={() => setHours(w.ms)}
                className={`px-3.5 py-1.5 rounded-full text-sm transition ${
                  hours === w.ms ? 'bg-white text-black' : 'bg-white/8 text-neutral-300'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              send(e.dataTransfer.files?.[0]);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'lowering…' : 'drop one file across'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          {meta && (
            <p className="text-xs text-neutral-500 mt-4">
              {meta.name} · {pretty(meta.size)} · {meta.type || 'unknown'}
            </p>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-neutral-400">open until {new Date(until).toLocaleString()}</p>
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {link}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
