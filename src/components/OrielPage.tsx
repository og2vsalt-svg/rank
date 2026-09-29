import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function pretty(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return Math.round(n / 1024) + ' kb';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' mb';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' gb';
}

export default function OrielPage() {
  const [info, setInfo] = useState<{ name: string; type: string; size: number; modified: string } | null>(null);
  const [preview, setPreview] = useState('');
  const [warn, setWarn] = useState('');

  const onFile = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    setWarn(f.size > 20 * 1024 * 1024 ? 'large window. preview may feel slow. no hard cap.' : '');
    setInfo({
      name: f.name,
      type: f.type || 'unknown',
      size: f.size,
      modified: new Date(f.lastModified).toISOString(),
    });
    setPreview('');
    if (f.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = () => setPreview(String(r.result || ''));
      r.readAsDataURL(f);
    }
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
          <p className="text-[#0a84ff] text-sm mb-2">oriel</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">look at a file without sending it anywhere.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            a bay window for name, type, and size. nothing uploads from this desk.
          </p>
          <label className="block cursor-pointer rounded-[24px] border border-dashed border-white/15 hover:border-[#0a84ff]/50 p-10 text-center transition">
            <input type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
            <p className="text-white font-medium">peek at a local file</p>
          </label>
          {warn && <p className="text-amber-300/90 text-xs mt-3">{warn}</p>}
          {info && (
            <div className="mt-6 space-y-1 text-sm text-neutral-300">
              <p className="text-white font-medium break-all">{info.name}</p>
              <p>{info.type}</p>
              <p>{pretty(info.size)}</p>
              <p className="text-neutral-500 text-xs">{info.modified}</p>
            </div>
          )}
          {preview && (
            <img src={preview} alt="" className="mt-5 rounded-2xl max-h-72 object-contain w-full" />
          )}
        </motion.div>
      </div>
    </div>
  );
}
