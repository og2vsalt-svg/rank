import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

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

function samplePalette(dataUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const w = 48;
      const h = Math.max(1, Math.round((img.height / img.width) * w));
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return resolve([]);
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const buckets = new Map<string, number>();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 40) continue;
        const r = data[i] >> 4;
        const g = data[i + 1] >> 4;
        const b = data[i + 2] >> 4;
        const key = `${r}-${g}-${b}`;
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
      const top = [...buckets.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([k]) => {
          const [r, g, b] = k.split('-').map((n) => parseInt(n, 10) * 17);
          return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
        });
      resolve(top);
    };
    img.onerror = () => resolve([]);
    img.src = dataUrl;
  });
}

export default function FlumePage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [embed, setEmbed] = useState('');

  const onFile = async (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setErr('');
    setLink('');
    setEmbed('');
    setColors([]);
    setWarn(f.size > 12 * 1024 * 1024 ? 'large still. sampling may feel slow. no hard cap.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(f);
      if (f.type.startsWith('image/')) setColors(await samplePalette(dataUrl));
      const id = uid();
      const pub = await publishShare({
        id,
        name: f.name,
        type: f.type || 'application/octet-stream',
        size: f.size,
        dataUrl,
      });
      if (!pub.ok) {
        setErr(pub.error || 'could not publish');
        return;
      }
      if (pub.warn) setWarn(pub.warn);
      const urls = shareUrls(id);
      setLink(urls.app);
      setEmbed(urls.embed);
      try {
        await navigator.clipboard.writeText(urls.embed);
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'flume failed');
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
          <p className="text-[#0a84ff] text-sm mb-2">flume</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">run a still through the colour channel.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            samples a palette in the tab, then docks the original into the share db. discord unfurls the embed path.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'sampling…' : 'drop a still'}</p>
            <p className="text-xs text-neutral-500 mt-2">no file limit. just a slowness ping if it is huge.</p>
          </label>
          {colors.length > 0 && (
            <div className="flex gap-2 mt-5">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => navigator.clipboard.writeText(c)}
                  className="flex-1 h-12 rounded-2xl border border-white/10"
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
          )}
          {colors.length > 0 && (
            <p className="text-[11px] text-neutral-500 mt-2 font-mono">{colors.join('  ')}</p>
          )}
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          {link && (
            <div className="mt-6 space-y-2 text-xs text-neutral-400 break-all">
              <p>app: {link}</p>
              <p>discord embed (copied): {embed}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
