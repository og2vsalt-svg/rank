import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return `${n} b`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} kb`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} mb`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} gb`;
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(r.error || new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function GnomonPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [app, setApp] = useState('');

  const onPick = (f: File | null) => {
    setFile(f);
    setEmbed('');
    setApp('');
    setErr('');
    setWarn(f && f.size > 40 * 1024 * 1024 ? 'chunky file. publishing might feel sleepy. still no cap.' : '');
  };

  const go = async () => {
    if (!file) {
      setErr('drop a local file first');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'gnomon',
      });
      if (!res.ok) {
        setErr(res.error || 'gnomon miss');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setEmbed(urls.embed);
      setApp(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'gnomon miss');
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
          <p className="text-[#0a84ff] text-sm mb-2">gnomon</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read the shadow of a local file.</h1>
          <p className="text-neutral-400 text-sm mb-7">
            not a vault grid. we only look at last-modified, type, and size, then you can publish if you want a discord /s card.
          </p>

          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onPick(e.dataTransfer.files?.[0] || null);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => onPick(e.target.files?.[0] || null)} />
            <p className="text-white font-medium">{file ? file.name : 'drop a file to read its clock'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. we only warn when the tab might stall.</p>
          </label>

          {file && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-[11px] text-neutral-500">size</p>
                <p className="text-sm text-white">{pretty(file.size)}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3">
                <p className="text-[11px] text-neutral-500">type</p>
                <p className="text-sm text-white truncate">{file.type || 'unknown'}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 col-span-2">
                <p className="text-[11px] text-neutral-500">last modified</p>
                <p className="text-sm text-white">{file.lastModified ? new Date(file.lastModified).toLocaleString() : 'unknown'}</p>
              </div>
            </motion.div>
          )}

          <button
            onClick={go}
            disabled={busy || !file}
            className="mt-6 w-full rounded-full bg-white text-black py-2.5 text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 transition-colors"
          >
            {busy ? 'publishing…' : 'publish + copy discord card'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-1">
              <p className="text-xs text-neutral-400 break-all">discord embed (copied): {embed}</p>
              <p className="text-xs text-neutral-500 break-all">app: {app}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
