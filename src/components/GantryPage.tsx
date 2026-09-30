import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

export default function GantryPage() {
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [meta, setMeta] = useState<{ name: string; size: number; type: string } | null>(null);

  const inspect = async (file: File) => {
    setErr('');
    setEmbed('');
    setMeta({ name: file.name, size: file.size, type: file.type || 'unknown' });
    setWarn(file.size > 32 * 1024 * 1024 ? 'no cap. hoisting a file this heavy can feel slow.' : '');
    if (file.type.startsWith('image/')) setPreview(URL.createObjectURL(file));
    else setPreview('');
    (window as any).__gantryFile = file;
  };

  const hoist = async () => {
    const file: File | undefined = (window as any).__gantryFile;
    if (!file) { setErr('load a still first'); return; }
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
        author: 'gantry',
      });
      if (!res.ok) throw new Error(res.error || 'gantry failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      if (res.warn) setWarn(res.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'gantry failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">gantry</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">hoist a still. publish when ready.</h1>
          <p className="text-neutral-400 text-sm mb-6">preview stays in the tab. only the publish step writes the original into the share db.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition">
            <input type="file" accept="image/*,*/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void inspect(f); }} />
            <p className="text-white font-medium">load a file onto the crane</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. just a slowness warning if it is huge.</p>
          </label>
          {preview && (
            <img src={preview} alt="" className="mt-5 w-full max-h-72 object-contain rounded-2xl bg-black/30" />
          )}
          {meta && <p className="text-xs text-neutral-400 mt-4">{meta.name} · {meta.type} · {pretty(meta.size)}</p>}
          <button
            onClick={() => void hoist()}
            disabled={busy || !meta}
            className="mt-4 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 disabled:opacity-50 transition"
          >
            {busy ? 'hoisting…' : 'publish original'}
          </button>
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord card copied · {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
