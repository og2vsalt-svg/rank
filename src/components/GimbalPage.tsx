import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishShare, shareUrls } from '../lib/cloudShare';

export default function GimbalPage() {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [src, setSrc] = useState('');
  const [rot, setRot] = useState(0);
  const [flip, setFlip] = useState(false);
  const [name, setName] = useState('still.png');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [err, setErr] = useState('');
  const [embed, setEmbed] = useState('');

  const load = (file: File) => {
    if (!file.type.startsWith('image/')) { setErr('drop a still'); return; }
    setErr('');
    setName(file.name.replace(/\.[^.]+$/, '') + '.gimbal.png');
    setWarn(file.size > 20 * 1024 * 1024 ? 'large still. rotate stays local but export may feel slow.' : '');
    setSrc(URL.createObjectURL(file));
    setRot(0);
    setFlip(false);
    setEmbed('');
  };

  const exportShare = async () => {
    const img = imgRef.current;
    if (!img || !src) return;
    setBusy(true);
    setErr('');
    try {
      const canvas = document.createElement('canvas');
      const rad = ((rot % 360) * Math.PI) / 180;
      const swap = Math.abs(rot % 180) === 90;
      canvas.width = swap ? img.naturalHeight : img.naturalWidth;
      canvas.height = swap ? img.naturalWidth : img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no canvas');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.scale(flip ? -1 : 1, 1);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      const dataUrl = canvas.toDataURL('image/png');
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const res = await publishShare({ id, name, type: 'image/png', size: Math.floor((dataUrl.length * 3) / 4), dataUrl, author: 'gimbal' });
      if (!res.ok) throw new Error(res.error || 'gimbal failed');
      const urls = shareUrls(res.id || id);
      setEmbed(urls.embed);
      try { await navigator.clipboard.writeText(urls.embed); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'export failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">gimbal</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">level a still, then hang it on the public board.</h1>
          <p className="text-neutral-400 text-sm mb-6">rotate and flip stay in the tab. only the leveled png goes to the share db.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center mb-5" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) load(f); }}>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
            <p className="text-white font-medium">drop a still</p>
          </label>
          {src && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl bg-black/40 flex items-center justify-center min-h-40">
                <img ref={imgRef} src={src} alt="" className="max-h-72 max-w-full" style={{ transform: `rotate(${rot}deg) scaleX(${flip ? -1 : 1})`, transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)' }} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setRot((r) => r - 90)} className="px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm">left</button>
                <button onClick={() => setRot((r) => r + 90)} className="px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm">right</button>
                <button onClick={() => setFlip((f) => !f)} className="px-4 py-2 rounded-full bg-white/8 border border-white/10 text-sm">flip</button>
                <button disabled={busy} onClick={exportShare} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">{busy ? 'hanging…' : 'publish leveled still'}</button>
              </div>
            </div>
          )}
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mt-3">{err}</p>}
          {embed && <p className="text-xs text-neutral-400 mt-4 break-all">discord (copied): {embed}</p>}
        </motion.div>
      </div>
    </div>
  );
}
