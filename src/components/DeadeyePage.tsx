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

export default function DeadeyePage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [label, setLabel] = useState('');
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);

  const send = async (file?: File) => {
    if (!file) return;
    setErr('');
    setLink('');
    setEmbed('');
    setMeta({ name: file.name, size: file.size });
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap, but this size can make the tab feel sleepy while it encodes.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const name = label.trim() ? `${label.trim()} — ${file.name}` : file.name;
      const res = await publishShare({ id, name, type: file.type || 'application/octet-stream', size: file.size, dataUrl });
      if (!res.ok) {
        setErr(res.error || 'could not publish');
        return;
      }
      const urls = shareUrls(res.id || id);
      setLink(urls.page);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">deadeye</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">name a drop, then let it fly.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a local file goes into the share table. optional label sits in front of the filename so discord cards look finished.
          </p>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="optional card title"
            className="w-full mb-4 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none"
          />
          <label className="block">
            <input type="file" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
            <span className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium cursor-pointer">
              {busy ? 'sending…' : 'choose a file'}
            </span>
          </label>
          <p className="text-xs text-neutral-500 mt-3">no hard limit. we only warn when it might feel slow.</p>
          {meta && <p className="text-xs text-neutral-400 mt-3">{meta.name} · {pretty(meta.size)}</p>}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <div className="mt-6 text-sm">
              <p className="text-neutral-300 break-all">page: {link}</p>
              <p className="text-xs text-neutral-400 break-all mt-1">discord: {embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
