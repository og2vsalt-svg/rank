import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { shareUrls } from '../lib/cloudShare';

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

export default function HourglassPage() {
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [until, setUntil] = useState('');

  const send = async (file: File | undefined) => {
    if (!file) return;
    setErr('');
    setLink('');
    setEmbed('');
    setMeta({ name: file.name, size: file.size });
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap, but this size can make the tab feel sleepy while it encodes.' : '');
    const expiresAt = new Date(Date.now() + Math.max(1, hours) * 3600 * 1000).toISOString();
    setUntil(expiresAt);
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          expiresAt,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setLink(urls.app);
      setEmbed(urls.embed || `${window.location.origin}/s/${json.id}`);
      if (json.warn) setWarn(json.warn);
      try { await navigator.clipboard.writeText(urls.embed || urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'hourglass failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">hourglass</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">a timed public drop.</h1>
          <p className="text-neutral-400 text-sm mb-6">pick how long the file stays live, then ship it to the share db. discord still gets a /s card.</p>
          <label className="block text-xs text-neutral-500 mb-1">hours until it fades</label>
          <input type="number" min={1} value={hours} onChange={(e) => setHours(Number(e.target.value) || 1)} className="w-full mb-6 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none focus:border-[#0a84ff]/50" />
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'turning the glass…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when it might feel slow.</p>
          </label>
          {meta && <p className="text-xs text-neutral-500 mt-4">{meta.name} · {pretty(meta.size)}</p>}
          {until && <p className="text-xs text-neutral-500 mt-2">expires {new Date(until).toLocaleString()}</p>}
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
