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

export default function IngressPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [picked, setPicked] = useState<File | null>(null);

  const go = async () => {
    if (!picked) return;
    setErr('');
    setEmbed('');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(picked);
      const r = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: picked.name,
          type: picked.type || 'application/octet-stream',
          size: picked.size,
          dataUrl,
        }),
      });
      const json = await r.json();
      if (!r.ok || !json?.ok) throw new Error(json?.error || 'share failed');
      const urls = shareUrls(json.id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (json.warn) setWarn(json.warn);
    } catch (e: any) {
      setErr(e?.message || 'ingress failed');
    } finally {
      setBusy(false);
    }
  };

  const pick = (file?: File) => {
    if (!file) return;
    setPicked(file);
    setEmbed('');
    setErr('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'we will still take it. expect a sleepy encode.' : file.size > 8 * 1024 * 1024 ? 'medium file. should be fine, might pause once.' : '');
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
          <p className="text-[#0a84ff] text-sm mb-2">ingress</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">warn first, then walk the file in.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            two-step so a huge local file does not surprise you. still no hard cap.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">{picked ? picked.name : 'choose a local file'}</p>
            {picked && <p className="text-xs text-neutral-500 mt-2">{pretty(picked.size)}</p>}
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          <button
            disabled={!picked || busy}
            onClick={go}
            className="mt-5 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
          >
            {busy ? 'walking in…' : 'send to share db'}
          </button>
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
