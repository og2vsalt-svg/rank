import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function prettySize(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function MerlonPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<{ app: string; embed: string; id: string } | null>(null);

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    setWarn(file.size > 8 * 1024 * 1024 ? 'chunky file. host or tab might lag. still sending — no hard cap.' : '');
    setLinks(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('could not read file'));
        r.readAsDataURL(file);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'merlon would not hold');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id || id);
      setLinks({ ...urls, id: res.id || id });
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'battlement slipped');
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
          <p className="text-[#0a84ff] text-sm mb-2">merlon</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stand one file on the wall and share it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            local file goes straight to the share db. copies the discord embed. different from the vault grid — one drop, one card.
          </p>
          <label className="block rounded-[24px] border border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center cursor-pointer hover:border-[#0a84ff]/40 transition mb-4">
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${prettySize(file.size)}` : 'pick a local file'}</span>
          </label>
          <button type="button" onClick={send} disabled={busy || !file} className="px-5 py-2.5 rounded-2xl bg-white text-black text-sm font-medium hover:bg-neutral-200 transition disabled:opacity-50">
            {busy ? 'raising…' : 'share file'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {links && (
            <div className="mt-6 rounded-[24px] border border-white/8 bg-white/[0.03] p-5 space-y-2">
              <p className="text-xs text-neutral-500">id {links.id}</p>
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {links.embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {links.app}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
