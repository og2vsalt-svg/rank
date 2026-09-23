import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

function formatBytes(n: number) {
  if (n < 1024) return n + ' b';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' kb';
  return (n / (1024 * 1024)).toFixed(2) + ' mb';
}

type Meta = {
  name: string;
  type: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  warn?: string;
};

export default function WrenPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [preview, setPreview] = useState('');

  const onFile = async (file: File) => {
    const size = file.size || 0;
    const warn = size > 40 * 1024 * 1024 ? 'big clip. preview might feel syrupy. no hard cap.' : '';
    const url = URL.createObjectURL(file);
    setPreview(url);
    const base: Meta = { name: file.name, type: file.type || 'unknown', size, warn };

    if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
      await new Promise<void>((resolve) => {
        const el = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
        el.preload = 'metadata';
        el.onloadedmetadata = () => {
          base.duration = el.duration;
          if (el instanceof HTMLVideoElement) {
            base.width = el.videoWidth;
            base.height = el.videoHeight;
          }
          resolve();
        };
        el.onerror = () => resolve();
        el.src = url;
      });
    } else if (file.type.startsWith('image/')) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          base.width = img.naturalWidth;
          base.height = img.naturalHeight;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });
    }
    setMeta(base);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0a84ff] text-sm mb-2">wren</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">listen to a file before you ship it.</h1>
          <p className="text-neutral-400 text-sm mb-6">
            local only. duration, pixels, weight. not a vault, just a quiet inspect before a drop.
          </p>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-16 text-center hover:bg-white/[0.05] transition-colors"
          >
            <p className="text-white text-sm font-medium">drop a local file</p>
            <p className="text-xs text-neutral-500 mt-2">stays on this machine</p>
          </motion.button>
          {meta && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
              {preview && meta.type.startsWith('image/') && (
                <img src={preview} alt="" className="w-full rounded-2xl" />
              )}
              {preview && meta.type.startsWith('video/') && (
                <video src={preview} controls className="w-full rounded-2xl" />
              )}
              {preview && meta.type.startsWith('audio/') && (
                <audio src={preview} controls className="w-full" />
              )}
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 text-sm text-neutral-300 space-y-1.5">
                <p className="text-white truncate">{meta.name}</p>
                <p>{formatBytes(meta.size)} · {meta.type}</p>
                {meta.duration != null && Number.isFinite(meta.duration) && (
                  <p>{meta.duration.toFixed(2)}s</p>
                )}
                {meta.width && meta.height && (
                  <p>{meta.width} × {meta.height}</p>
                )}
                {meta.warn && <p className="text-amber-300/80 text-xs pt-2">{meta.warn}</p>}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
