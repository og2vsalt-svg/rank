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

async function sha256(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function FeldsparPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [info, setInfo] = useState<{ name: string; size: number; type: string; hash: string } | null>(null);
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const run = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setEmbed('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap, but hashing + encoding a file this size can make the tab sleepy.' : '');
    try {
      const hash = await sha256(file);
      setInfo({ name: file.name, size: file.size, type: file.type || 'application/octet-stream', hash });
      const dataUrl = await readAsDataUrl(file);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          author: hash.slice(0, 12),
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'publish failed');
      const urls = shareUrls(json.id);
      setEmbed(urls.embed);
      setApp(urls.app);
      if (json.warn) setWarn(json.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'feldspar failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">feldspar</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">hash, then ship.</h1>
          <p className="text-neutral-400 text-sm mb-6">sha-256 stays in the tab first. then the file goes to the share db with a discord /s card.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); run(e.dataTransfer.files?.[0]); }}>
            <input type="file" className="hidden" onChange={(e) => run(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'cutting…' : 'drop one file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. only a slowness warning.</p>
          </label>
          {info && (
            <div className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>{info.name} · {pretty(info.size)} · {info.type}</p>
              <p className="break-all font-mono text-neutral-500">{info.hash}</p>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-5 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord: {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
