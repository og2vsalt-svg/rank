import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function IrisPage() {
  const [src, setSrc] = useState('');
  const [info, setInfo] = useState<{ w: number; h: number; name: string; size: number; type: string } | null>(null);
  const [warn, setWarn] = useState('');

  const onFile = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setWarn('iris only looks at images. drop a still.');
      return;
    }
    setWarn(f.size > 40 * 1024 * 1024 ? 'huge still. decode might feel slow. no cap tho.' : '');
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setInfo({ w: img.naturalWidth, h: img.naturalHeight, name: f.name, size: f.size, type: f.type });
      setSrc(url);
    };
    img.src = url;
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">iris</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">peek an image locally.</h1>
          <p className="text-neutral-400 text-sm mb-6">no upload. just dimensions, type, and a quiet preview in the tab.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-8 text-center transition" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files); }}>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">drop a still</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {src && info && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <img src={src} alt="" className="w-full rounded-2xl mb-4" />
              <p className="text-sm text-neutral-300">{info.name}</p>
              <p className="text-xs text-neutral-500">{info.w}×{info.h} · {info.type} · {(info.size / 1024).toFixed(1)} kb</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
