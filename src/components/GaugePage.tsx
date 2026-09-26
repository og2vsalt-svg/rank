import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function GaugePage() {
  const [info, setInfo] = useState<{ name: string; type: string; size: number; modified: string } | null>(null);
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const onFile = async (file?: File) => {
    if (!file) return;
    setErr('');
    setLink('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'gauge is heavy. publish may feel slow. no cap.' : '');
    setInfo({
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
      modified: file.lastModified ? new Date(file.lastModified).toLocaleString() : '—',
    });
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
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) {
        setErr(res.error || 'could not publish');
        return;
      }
      if (res.warn) setWarn(res.warn);
      setLink(shareUrls(id).embed);
      try { await navigator.clipboard.writeText(shareUrls(id).embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'gauge missed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">gauge</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read the weight, then ship it.</h1>
          <p className="text-neutral-400 text-sm mb-6">inspect name, type, size, and last-modified on device, then drop the same file into the share db. discord gets /s.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}>
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'weighing…' : 'drop a file on the gauge'}</p>
          </label>
          {info && (
            <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
                <p className="text-[11px] text-neutral-500 mb-1">name</p>
                <p className="text-white truncate">{info.name}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
                <p className="text-[11px] text-neutral-500 mb-1">type</p>
                <p className="text-white truncate">{info.type}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
                <p className="text-[11px] text-neutral-500 mb-1">size</p>
                <p className="text-white">{pretty(info.size)}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.04] border border-white/8 p-4">
                <p className="text-[11px] text-neutral-500 mb-1">modified</p>
                <p className="text-white text-xs">{info.modified}</p>
              </div>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
