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

function sampleColor(dataUrl: string) {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 8;
      c.height = 8;
      const ctx = c.getContext('2d');
      if (!ctx) {
        resolve('#0a84ff');
        return;
      }
      ctx.drawImage(img, 0, 0, 8, 8);
      const d = ctx.getImageData(3, 3, 1, 1).data;
      const hex = '#' + [d[0], d[1], d[2]].map((x) => x.toString(16).padStart(2, '0')).join('');
      resolve(hex);
    };
    img.onerror = () => resolve('#0a84ff');
    img.src = dataUrl;
  });
}

export default function AuroraPage() {
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [tint, setTint] = useState('#0a84ff');
  const [preview, setPreview] = useState('');
  const [embed, setEmbed] = useState('');

  const run = async (file?: File) => {
    if (!file) return;
    setErr('');
    setEmbed('');
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap, but this size can make the tab feel sleepy while it encodes.' : '');
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(file.type.startsWith('image/') ? dataUrl : '');
      if (file.type.startsWith('image/')) setTint(await sampleColor(dataUrl));
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl,
      });
      if (!res.ok) throw new Error(res.error || 'publish failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      if (res.warn) setWarn(res.warn);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'aurora failed');
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
          style={{ boxShadow: `0 0 80px ${tint}22` }}
        >
          <p className="text-sm mb-2" style={{ color: tint }}>aurora</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">pull a tint, then publish.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            images get a sample color for the room. then the file goes to the share db. discord still uses /s.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-white/30 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => run(e.target.files?.[0] || undefined)} />
            <p className="text-white font-medium">{busy ? 'lifting…' : 'drop an image or any file'}</p>
            <p className="text-xs text-neutral-500 mt-2">no hard limit. warn only if it might feel slow.</p>
          </label>
          {preview && (
            <img src={preview} alt="" className="mt-6 w-full max-h-56 object-cover rounded-2xl" />
          )}
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord: {embed}</p>}
          {preview && <p className="text-xs text-neutral-500 mt-2">tint {tint}</p>}
        </motion.div>
      </div>
    </div>
  );
}
