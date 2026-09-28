import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('could not read file'));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('bad image'));
    img.src = src;
  });
}

export default function MosaicPage() {
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');
  const [warn, setWarn] = useState('');

  const build = async (list: FileList | null) => {
    const files = Array.from(list || []).filter((f) => f.type.startsWith('image/')).slice(0, 9);
    if (!files.length) {
      setErr('need at least one still');
      return;
    }
    setErr('');
    setEmbed('');
    setWarn(files.some((f) => f.size > 20 * 1024 * 1024) ? 'large stills. stitching may feel sleepy. no cap.' : '');
    setBusy(true);
    try {
      const urls = await Promise.all(files.map(readAsDataUrl));
      const imgs = await Promise.all(urls.map(loadImage));
      const cols = Math.min(3, imgs.length);
      const rows = Math.ceil(imgs.length / cols);
      const cell = 420;
      const canvas = document.createElement('canvas');
      canvas.width = cols * cell;
      canvas.height = rows * cell;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no canvas');
      ctx.fillStyle = '#0b0b0d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      imgs.forEach((img, i) => {
        const x = (i % cols) * cell;
        const y = Math.floor(i / cols) * cell;
        const scale = Math.max(cell / img.width, cell / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, x + (cell - w) / 2, y + (cell - h) / 2, w, h);
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setPreview(dataUrl);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
      const size = blob?.size || dataUrl.length;
      const res = await publishShare({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        name: 'mosaic.jpg',
        type: 'image/jpeg',
        size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'share failed');
      setEmbed(shareUrls(res.id || '').embed);
    } catch (e: any) {
      setErr(e?.message || 'mosaic failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">mosaic</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stills into one shareable card.</h1>
          <p className="text-neutral-400 text-sm mb-6">up to nine images, tiled, then shipped as a single jpeg drop. vault stays out of it.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => build(e.target.files)} />
            <p className="text-white font-medium">{busy ? 'laying tiles…' : 'pick stills'}</p>
          </label>
          {preview && <img src={preview} alt="" className="mt-6 w-full rounded-2xl" />}
          {warn && <p className="text-xs text-amber-300/80 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord: {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
