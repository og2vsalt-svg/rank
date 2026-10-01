import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function hex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}

function samplePalette(img: HTMLImageElement, count = 6) {
  const canvas = document.createElement('canvas');
  const w = 64;
  const h = Math.max(1, Math.round((img.height / img.width) * w));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return [] as string[];
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i] & 0xf0;
    const g = data[i + 1] & 0xf0;
    const b = data[i + 2] & 0xf0;
    const key = hex(r, g, b);
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([k]) => k);
}

export default function CopsePage() {
  const [colors, setColors] = useState<string[]>([]);
  const [name, setName] = useState('still');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = (file?: File) => {
    if (!file) return;
    setErr('');
    setLink('');
    setName(file.name.replace(/\.[^.]+$/, '') || 'still');
    if (file.size > 12 * 1024 * 1024) setWarn('large still. sampling stays in the tab, but the browser may yawn.');
    else setWarn('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        setColors(samplePalette(img));
      } catch (e: any) {
        setErr(e?.message || 'could not read the grove');
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setErr('that still would not open');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const publish = async () => {
    if (!colors.length) return;
    setBusy(true);
    setErr('');
    try {
      const body = JSON.stringify({ grove: name, swatches: colors }, null, 2);
      const blob = new Blob([body], { type: 'application/json' });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ''));
        r.onerror = () => reject(new Error('read failed'));
        r.readAsDataURL(blob);
      });
      const id = uid();
      const res = await publishShare({
        id,
        name: `${name || 'copse'}.json`,
        type: 'application/json',
        size: blob.size,
        dataUrl,
        author: 'copse',
      });
      if (!res.ok) throw new Error(res.error || 'the grove would not take');
      const urls = shareUrls(res.id || id);
      setLink(urls.embed);
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
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[28px] p-7">
          <p className="text-[#0a84ff] text-sm mb-2">copse</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pick a grove of colour.</h1>
          <p className="text-neutral-400 text-sm mb-6">drop a still. we sample a handful of swatches in the tab. publish only the palette json if you want a discord card. not the vault.</p>
          <label className="block mb-5">
            <span className="sr-only">choose a still</span>
            <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="block w-full text-sm text-neutral-400 file:mr-3 file:rounded-full file:border-0 file:bg-white file:text-black file:px-4 file:py-2 file:text-sm file:font-medium" />
          </label>
          {colors.length > 0 && (
            <div className="flex gap-2 mb-5 flex-wrap">
              {colors.map((c) => (
                <div key={c} className="flex-1 min-w-[72px]">
                  <div className="h-16 rounded-2xl border border-white/10" style={{ background: c }} />
                  <p className="text-[11px] text-neutral-500 mt-1.5 font-mono">{c}</p>
                </div>
              ))}
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <button onClick={publish} disabled={busy || !colors.length} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40 transition-transform active:scale-[0.98]">
            {busy ? 'planting…' : 'publish the palette'}
          </button>
          {link && <p className="text-xs text-neutral-500 mt-4 break-all">discord embed copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
