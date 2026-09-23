import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

type Shot = { name: string; size: number; url: string; warn?: string };

export default function PetalPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shots, setShots] = useState<Shot[]>([]);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const next: Shot[] = [];
    Array.from(list).forEach((file) => {
      const warn = file.size > 40 * 1024 * 1024 ? 'heavy still. preview may lag. no hard cap.' : undefined;
      next.push({ name: file.name, size: file.size, url: URL.createObjectURL(file), warn });
    });
    setShots((prev) => [...prev, ...next]);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">petal</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">lay stills in a quiet strip.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            local contact sheet. not a vault. nothing leaves this tab unless you share it later.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-14 text-center hover:bg-white/[0.05] transition-colors"
          >
            <p className="text-white text-sm font-medium">add local stills</p>
            <p className="text-xs text-neutral-500 mt-2">multi select is fine</p>
          </motion.button>
          {shots.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {shots.map((s, i) => (
                  <div key={s.url + i} className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.03]">
                    <img src={s.url} alt="" className="w-full h-32 object-cover" />
                    <div className="p-3 text-xs text-neutral-400">
                      <p className="text-white truncate">{s.name}</p>
                      <p>{formatBytes(s.size)}</p>
                      {s.warn && <p className="text-amber-300/80 mt-1">{s.warn}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShots([])}
                className="mt-4 text-xs text-neutral-500 hover:text-white transition-colors"
              >
                clear strip
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
