import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

type Info = { name: string; size: string; type: string; w?: number; h?: number; preview?: string };

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

export default function LumenPage() {
  const [info, setInfo] = useState<Info | null>(null);
  const [warn, setWarn] = useState('');

  function take(file: File | undefined) {
    if (!file) return;
    setWarn(file.size > 25 * 1024 * 1024 ? 'large still. the tab may feel sleepy while it decodes.' : '');
    const rec: Info = { name: file.name, size: pretty(file.size), type: file.type || 'unknown' };
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        rec.w = img.naturalWidth;
        rec.h = img.naturalHeight;
        rec.preview = url;
        setInfo({ ...rec });
      };
      img.src = url;
    } else {
      rec.preview = undefined;
      setInfo(rec);
    }
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="glass rounded-[32px] p-8">
          <p className="text-[#0a84ff] text-sm mb-2">lumen</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">read a still, keep it here</h1>
          <p className="text-neutral-400 text-sm mb-6">not a vault. dimensions and type stay in the tab. nothing is sent unless you leave for drop.</p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center">
            <input type="file" accept="image/*,video/*,audio/*" className="hidden" onChange={(e) => take(e.target.files?.[0])} />
            <p className="font-medium">drop a still or clip</p>
            <p className="text-xs text-neutral-500 mt-2">no hard size cap. only a slowness note.</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mt-4">{warn}</p>}
          {info && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
              {info.preview && <img src={info.preview} alt="" className="w-full max-h-72 object-contain rounded-2xl bg-black/30" />}
              <p className="text-sm text-neutral-200 truncate">{info.name}</p>
              <p className="text-xs text-neutral-500">{info.type} · {info.size}{info.w ? ` · ${info.w}×${info.h}` : ''}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
