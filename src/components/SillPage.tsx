import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' KB';
  return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function SillPage() {
  const [preview, setPreview] = useState('');
  const [info, setInfo] = useState('');
  const [warn, setWarn] = useState('');

  const look = (file: File) => {
    setWarn(file.size > 40 * 1024 * 1024 ? 'no cap. a still this heavy can make the tab feel slow.' : '');
    if (!file.type.startsWith('image/')) {
      setPreview('');
      setInfo(`${file.name} · ${pretty(file.size)} · not a still — nothing left this device.`);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setInfo(`${file.name} · ${img.naturalWidth}×${img.naturalHeight} · ${pretty(file.size)} · stays on the sill`);
    };
    img.src = url;
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
          <p className="text-[#0a84ff] text-sm mb-2">sill</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">set a still on the window ledge. nothing uploads.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            not the vault and not the share db. just a quiet look at a local image — frame size, weight, and a preview.
          </p>
          <label
            className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition-all duration-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) look(f);
            }}
          >
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && look(e.target.files[0])} />
            <p className="text-white font-medium">drop a still onto the sill</p>
            <p className="text-xs text-neutral-500 mt-2">stays in this tab.</p>
          </label>
          {preview && (
            <motion.img
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              src={preview}
              alt=""
              className="mt-6 w-full rounded-[24px] object-cover max-h-[420px]"
            />
          )}
          {info && <p className="text-xs text-neutral-500 mt-4">{info}</p>}
          {warn && <p className="text-xs text-amber-300/90 mt-3">{warn}</p>}
        </motion.div>
      </div>
    </div>
  );
}
