import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useVault } from './VaultContext';

export default function JuniperPage() {
  const { addFiles } = useVault();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState('');
  const [warn, setWarn] = useState('');
  const [msg, setMsg] = useState('');

  const stamp = (file: File) => {
    if (file.size > 25 * 1024 * 1024) setWarn('huge still. stamp still runs, decode might lag. no cap.');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = canvasRef.current;
      if (!c) return;
      const max = 1600;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, c.width, c.height);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(16, c.height - 54, Math.min(c.width - 32, 360), 38);
      ctx.fillStyle = '#f5f5f7';
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText(new Date().toLocaleString(), 28, c.height - 28);
      setPreview(c.toDataURL('image/jpeg', 0.86));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const save = async () => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `juniper-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const res = await addFiles([file], 'inbox');
      setMsg(res.ok ? 'stamped still parked in vault' : res.error || 'save failed');
    }, 'image/jpeg', 0.86);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">juniper</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">stamp a time on a still.</h1>
          <p className="text-neutral-400 text-sm mb-6">local canvas watermark. stays on this machine unless you save it into the vault.</p>
          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 p-10 text-center mb-4 hover:border-[#0a84ff]/40 transition">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && stamp(e.target.files[0])} />
            drop an image
          </label>
          <canvas ref={canvasRef} className="hidden" />
          {preview && <img src={preview} alt="stamped" className="rounded-2xl mb-4 w-full" />}
          {preview && <button onClick={save} className="px-4 py-2 rounded-full bg-[#0a84ff] text-white text-sm">save stamped still</button>}
          {msg && <p className="text-xs text-neutral-400 mt-3">{msg}</p>}
        </motion.div>
      </div>
    </div>
  );
}
