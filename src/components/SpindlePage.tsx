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

export default function SpindlePage() {
  const [file, setFile] = useState<File | null>(null);
  const [alias, setAlias] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const pick = (f?: File) => {
    if (!f) return;
    setFile(f);
    setAlias(f.name);
    setErr('');
    setEmbed('');
    setWarn(f.size > 40 * 1024 * 1024 ? 'no hard limit. this size can make the tab feel slow while it winds.' : '');
  };

  const wind = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const name = alias.trim() || file.name;
      const res = await publishShare({
        id,
        name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'spindle failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      if (res.warn) setWarn(res.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'spindle failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">spindle</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">rename a local file, then wind it out.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            inspect name and size here. upload goes to the share db with a /s discord card.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => pick(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">{file ? file.name : 'drop a file onto the spindle'}</p>
            {file && <p className="text-xs text-neutral-500 mt-2">{pretty(file.size)} · {file.type || 'unknown'}</p>}
          </label>
          {file && (
            <div className="mt-5 space-y-3">
              <input
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm outline-none"
              />
              <button
                onClick={wind}
                disabled={busy}
                className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-50"
              >
                {busy ? 'winding…' : 'wind into share db'}
              </button>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
