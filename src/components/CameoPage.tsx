import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function CameoPage() {
  const [src, setSrc] = useState('');
  const [name, setName] = useState('cameo.png');
  const [out, setOut] = useState('');
  const [link, setLink] = useState('');
  const [warn, setWarn] = useState('');
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onFile = (file?: File) => {
    if (!file) return;
    setName(file.name.replace(/\.[^.]+$/, '') + '-cameo.png');
    if (file.size > 12 * 1024 * 1024) setWarn('large still. the crop may feel slow. no hard cap.');
    else setWarn('');
    const url = URL.createObjectURL(file);
    setSrc(url);
    const img = new Image();
    img.onload = () => {
      const size = 720;
      const c = canvasRef.current;
      if (!c) return;
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
      ctx.clip();
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      ctx.restore();
      setOut(c.toDataURL('image/png'));
    };
    img.src = url;
  };

  const publish = async () => {
    if (!out) return;
    setBusy(true);
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const res = await publishShare({ id, name, type: 'image/png', size: Math.floor((out.length * 3) / 4), dataUrl: out });
    setBusy(false);
    if (res.ok && res.id) {
      setLink(shareUrls(res.id).embed);
      if (res.warn) setWarn(res.warn);
    } else setWarn(res.error || 'could not publish');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-3xl p-8">
          <p className="text-[#0a84ff] text-sm mb-2">cameo</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">cut a circle, keep the rest</h1>
          <p className="text-sm text-neutral-500 mb-6">a portrait press. crop locally. publish only if you want a discord card.</p>
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="text-sm text-neutral-400" />
          <canvas ref={canvasRef} className="hidden" />
          {out && <img src={out} alt="" className="w-56 h-56 rounded-full mx-auto my-8 shadow-[0_20px_50px_rgba(0,0,0,.45)]" />}
          {warn && <p className="text-xs text-amber-200/80 mb-3">{warn}</p>}
          <div className="flex flex-wrap gap-2">
            {out && (
              <a href={out} download={name} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium">save png</a>
            )}
            {out && (
              <button disabled={busy} onClick={publish} className="px-5 py-2.5 rounded-full bg-white/10 text-sm">{busy ? 'publishing…' : 'publish cameo'}</button>
            )}
          </div>
          {link && <p className="text-xs text-neutral-500 mt-4">discord link: {link}</p>}
          {src && <p className="sr-only">{src}</p>}
        </motion.div>
      </div>
    </div>
  );
}
