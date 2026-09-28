import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  return (n / (1024 * 1024)).toFixed(1) + ' mb';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

type Sight = { w: number; h: number; avg: string };

function sightImage(dataUrl: string): Promise<Sight | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        const w = Math.min(img.naturalWidth, 64);
        const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        if (!ctx) return resolve({ w: img.naturalWidth, h: img.naturalHeight, avg: '#888888' });
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
        }
        const hex = (x: number) => Math.round(x / n).toString(16).padStart(2, '0');
        resolve({ w: img.naturalWidth, h: img.naturalHeight, avg: `#${hex(r)}${hex(g)}${hex(b)}` });
      } catch {
        resolve({ w: img.naturalWidth, h: img.naturalHeight, avg: '#888888' });
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export default function SextantPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [sight, setSight] = useState<Sight | null>(null);
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);
  const [embed, setEmbed] = useState('');
  const [link, setLink] = useState('');

  const send = async (file?: File) => {
    if (!file) return;
    setErr('');
    setEmbed('');
    setLink('');
    setSight(null);
    setMeta({ name: file.name, size: file.size });
    setWarn(file.size > 32 * 1024 * 1024 ? 'no cap. this size can make the tab feel slow while it encodes.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      if (file.type.startsWith('image/')) setSight(await sightImage(dataUrl));
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      const urls = shareUrls(res.id || id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
      if (res.warn) setWarn(res.warn);
    } catch (e: any) {
      setErr(e?.message || 'sextant failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">sextant</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">take a bearing, then launch the file.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            images get width, height, and an average color. everything else still ships to the share db with a discord card.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); send(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" className="hidden" onChange={(e) => send(e.target.files?.[0])} />
            <p className="text-white font-medium">{busy ? 'sighting…' : 'drop a file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. only a slowness note.</p>
          </label>
          {meta && <p className="text-xs text-neutral-500 mt-4">{meta.name} · {pretty(meta.size)}</p>}
          {sight && (
            <div className="mt-4 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full border border-white/10" style={{ background: sight.avg }} />
              <p className="text-sm text-neutral-300">{sight.w} × {sight.h} · {sight.avg}</p>
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
