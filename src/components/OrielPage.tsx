import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function OrielPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [link, setLink] = useState('');
  const [ready, setReady] = useState(false);

  const paint = (file: File | undefined) => {
    if (!file) return;
    setErr('');
    setLink('');
    setName(file.name);
    setWarn(file.size > 25 * 1024 * 1024 ? 'large still. decoding may feel sleepy. no hard cap.' : '');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = canvasRef.current;
      if (!c) return;
      const w = 1200;
      const h = 630;
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#050506';
      ctx.fillRect(0, 0, w, h);
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.fillStyle = 'rgba(5,5,6,0.35)';
      ctx.fillRect(0, h - 86, w, 86);
      ctx.fillStyle = '#f5f5f7';
      ctx.font = '600 28px Inter, system-ui, sans-serif';
      ctx.fillText(file.name.slice(0, 42), 40, h - 38);
      setReady(true);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setErr('could not open that still');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const hang = async () => {
    const c = canvasRef.current;
    if (!c || !ready) return;
    setBusy(true);
    setErr('');
    try {
      const dataUrl = c.toDataURL('image/jpeg', 0.88);
      const id = `oriel-${Date.now().toString(36)}`;
      const res = await publishShare({
        id,
        name: name ? `oriel · ${name}` : 'oriel card',
        type: 'image/jpeg',
        size: Math.floor((dataUrl.length * 3) / 4),
        dataUrl,
        author: 'oriel',
      });
      if (!res.ok) throw new Error(res.error || 'could not hang');
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(id);
      setLink(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="max-w-2xl mx-auto">
          <p className="text-[#0a84ff] text-sm mb-2">oriel</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">a window card from one still.</h1>
          <p className="text-neutral-400 text-sm mb-8">crops locally to 1200×630 so discord unfurls like a finished embed. only the card hits the share db.</p>
          <label className="block glass rounded-3xl p-8 text-center cursor-pointer mb-5 hover:bg-white/[0.04] transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => paint(e.target.files?.[0])} />
            <p className="text-white">{name || 'choose a still'}</p>
          </label>
          <div className="rounded-[28px] overflow-hidden border border-white/10 mb-5 bg-black">
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>
          <button onClick={hang} disabled={!ready || busy} className="w-full rounded-full bg-white text-black py-3 text-sm font-medium disabled:opacity-40 hover:bg-neutral-200 transition-colors">
            {busy ? 'hanging…' : 'hang the window and copy embed'}
          </button>
          {warn && <p className="text-amber-300/80 text-xs mt-4">{warn}</p>}
          {err && <p className="text-red-400 text-xs mt-4">{err}</p>}
          {link && <p className="text-[#0a84ff] text-xs mt-4 break-all">{link}</p>}
        </motion.div>
      </main>
    </div>
  );
}
