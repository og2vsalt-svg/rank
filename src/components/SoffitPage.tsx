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

async function peekImage(file: File) {
  if (!file.type.startsWith('image/')) return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('image'));
      el.src = url;
    });
    return { w: img.naturalWidth, h: img.naturalHeight, preview: url };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

export default function SoffitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dims, setDims] = useState<{ w: number; h: number; preview: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [link, setLink] = useState('');

  const inspect = async (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    setEmbed('');
    setLink('');
    setErr('');
    setWarn(f.size > 40 * 1024 * 1024 ? 'no cap, but this size can make the tab feel sleepy while it encodes.' : '');
    if (dims?.preview) URL.revokeObjectURL(dims.preview);
    setDims(await peekImage(f));
  };

  const ship = async () => {
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = await readAsDataUrl(file);
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
        author: 'soffit',
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'soffit failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">soffit</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">look under the edge of a file, then share it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            inspect name, size, type, and still dimensions. only ship if you want a public drop.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              inspect(e.dataTransfer.files?.[0]);
            }}
          >
            <input type="file" className="hidden" onChange={(e) => inspect(e.target.files?.[0])} />
            <p className="text-white font-medium">set a file on the ledge</p>
            <p className="text-xs text-neutral-500 mt-2">nothing leaves until you ship.</p>
          </label>
          {file && (
            <div className="mt-6 space-y-2 text-sm text-neutral-300">
              <p className="text-white">{file.name}</p>
              <p>{pretty(file.size)} · {file.type || 'unknown'}</p>
              <p className="text-neutral-500 text-xs">modified {new Date(file.lastModified).toLocaleString()}</p>
              {dims && <p>{dims.w} × {dims.h}</p>}
              {dims?.preview && <img src={dims.preview} alt="" className="mt-3 rounded-2xl w-full max-h-72 object-contain bg-black/20" />}
              <button
                disabled={busy}
                onClick={ship}
                className="mt-3 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
              >
                {busy ? 'shipping…' : 'ship public drop'}
              </button>
            </div>
          )}
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
