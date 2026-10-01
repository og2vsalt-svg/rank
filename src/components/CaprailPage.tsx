import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function CaprailPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');

  const pick = async (f: File | null) => {
    setFile(f);
    setErr('');
    setLink('');
    setPreview('');
    if (!f) return;
    setWarn(f.size > 12 * 1024 * 1024 ? 'heavy rail. preview may lag. no hard cap.' : '');
    if (f.type.startsWith('image/')) {
      try { setPreview(await readAsDataUrl(f)); } catch {}
    }
  };

  const paste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'));
        if (!type) continue;
        const blob = await item.getType(type);
        const fileFromClip = new File([blob], `clipboard.${type.split('/')[1] || 'png'}`, { type });
        await pick(fileFromClip);
        return;
      }
      setErr('no image on the clipboard');
    } catch {
      setErr('clipboard blocked — drop a file instead');
    }
  };

  const send = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = preview && file.type.startsWith('image/') ? preview : await readAsDataUrl(file);
      const id = uid();
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'caprail',
      });
      if (!res.ok) throw new Error(res.error || 'rail missed');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
      if (res.warn) setWarn(res.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[28px] p-7"
        >
          <p className="text-[#0a84ff] text-sm mb-2">caprail</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">rest a still on the rail, then share it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            paste a clipboard image or drop a local file. it goes into the public share db. discord cards on /s.
          </p>
          {preview && (
            <img src={preview} alt="" className="w-full max-h-56 object-contain rounded-2xl mb-5 bg-black/30" />
          )}
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-4 transition-colors duration-300">
            <input type="file" accept="image/*,*/*" className="hidden" onChange={(e) => pick(e.target.files?.[0] || null)} />
            <span className="text-sm text-neutral-300">{file ? `${file.name} · ${pretty(file.size)}` : 'drop a still or any file'}</span>
          </label>
          <div className="flex gap-2 mb-5">
            <button onClick={paste} className="px-4 py-2 rounded-full glass text-sm text-neutral-200">paste clipboard</button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={send} disabled={busy || !file} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            {busy ? 'setting the rail…' : 'publish drop'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
