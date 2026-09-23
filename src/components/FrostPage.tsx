import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function FrostPage() {
  const [src, setSrc] = useState('');
  const [blur, setBlur] = useState(12);
  const [warn, setWarn] = useState('');

  const onFile = (file?: File) => {
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) setWarn('big still. the tab might feel sleepy. no cap, just a heads up.');
    else setWarn('');
    const url = URL.createObjectURL(file);
    setSrc(url);
  };

  const save = () => {
    const img = document.querySelector('#frost-img') as HTMLImageElement | null;
    if (!img) return;
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || 800;
    c.height = img.naturalHeight || 600;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    c.toBlob((b) => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = 'frost.png';
      a.click();
    }, 'image/png');
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">frost</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">blur a still on this device.</h1>
          <p className="text-neutral-400 text-sm mb-6">not the vault. local preview, download a frosted png. no hard size cap.</p>
          <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} className="block w-full text-sm text-neutral-400 mb-4" />
          <label className="text-xs text-neutral-500 block mb-4">
            frost {blur}px
            <input type="range" min={0} max={40} value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-full mt-2" />
          </label>
          {warn && <p className="text-amber-300/90 text-xs mb-3">{warn}</p>}
          {src && (
            <img id="frost-img" src={src} alt="" className="w-full rounded-2xl mb-4" style={{ filter: `blur(${blur}px)` }} />
          )}
          <button disabled={!src} onClick={save} className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40">
            download frost
          </button>
        </motion.div>
      </div>
    </div>
  );
}
