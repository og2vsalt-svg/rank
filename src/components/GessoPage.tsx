import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';
import { shareUrls } from '../lib/cloudShare';

export default function GessoPage() {
  const { addFiles, togglePublic } = useVault();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const [warn, setWarn] = useState('');
  const [hasImg, setHasImg] = useState(false);

  const load = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('needs a still'); return; }
    if (file.size > 40 * 1024 * 1024) setWarn('chunky still. decode may hitch. no hard cap.');
    else setWarn('');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current;
      if (!c) return;
      const max = 1200;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      setHasImg(true);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const paint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * c.width;
    const y = ((e.clientY - r.top) / r.height) * c.height;
    ctx.fillStyle = 'rgba(10,132,255,0.85)';
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  const publish = async () => {
    const c = canvasRef.current;
    if (!c || !hasImg) return;
    setBusy(true); setErr('');
    c.toBlob(async (blob) => {
      if (!blob) { setErr('could not flatten'); setBusy(false); return; }
      try {
        const file = new File([blob], 'gesso.png', { type: 'image/png' });
        const result = await addFiles([file], 'drops');
        if (!result.ok || !result.ids?.[0]) { setErr(result.error || 'save failed'); return; }
        const pub = await togglePublic(result.ids[0]);
        if (!pub.ok) { setErr(pub.error || 'saved locally, publish missed'); return; }
        const urls = shareUrls(result.ids[0]);
        setLink(urls.card);
        try { await navigator.clipboard.writeText(urls.card); } catch {}
      } catch (e: any) {
        setErr(e?.message || 'failed');
      } finally {
        setBusy(false);
      }
    }, 'image/png');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">gesso</p>
          <h1 className="text-3xl font-semibold mb-3">mark a still, then share it.</h1>
          <p className="text-neutral-400 text-sm mb-6">local canvas only until you publish. discord will pick up the image on the /s/ card.</p>
          <label className="inline-flex mb-4 px-4 py-2 rounded-full bg-white/8 text-sm cursor-pointer">
            pick a still
            <input type="file" accept="image/*" className="hidden" onChange={(e) => load(e.target.files?.[0])} />
          </label>
          <canvas ref={canvasRef} onPointerDown={paint} onPointerMove={paint} className="w-full rounded-2xl bg-black/40 touch-none cursor-crosshair max-h-[420px] object-contain" />
          <div className="mt-4">
            <button onClick={publish} disabled={busy || !hasImg} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'publishing…' : 'publish marked still'}</button>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-4">{err}</p>}
          {link && <p className="text-xs text-neutral-400 mt-4 break-all">card copied: {link}</p>}
        </motion.div>
      </div>
    </div>
  );
}
