import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

export default function LoomPage() {
  const [name, setName] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [warn, setWarn] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function onFile(f: File | undefined) {
    if (!f) return;
    if (src) URL.revokeObjectURL(src);
    setName(f.name);
    setSrc(URL.createObjectURL(f));
    setWarn(f.size > 80 * 1024 * 1024 ? 'big clip — playback might hitch in this tab. no hard cap though.' : '');
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20 px-5">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">loom</p>
          <h1 className="text-3xl font-semibold text-white tracking-tight">listen desk</h1>
          <p className="text-sm text-neutral-500 mt-2 mb-8">drop an audio file and play it here. not a vault clone, just a quiet player.</p>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => inputRef.current?.click()}
            className="w-full glass rounded-3xl py-16 text-center hover:bg-white/[0.04] transition-colors"
          >
            <p className="text-white text-sm">{name || 'drop audio'}</p>
            <p className="text-xs text-neutral-500 mt-2">mp3, wav, m4a, whatever the tab can decode</p>
          </motion.button>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />

          {warn && <p className="text-xs text-amber-400/80 mt-3">{warn}</p>}

          {src && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-3xl p-5">
              <audio src={src} controls className="w-full" />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
