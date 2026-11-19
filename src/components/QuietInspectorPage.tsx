import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Inspected = {
  file: File;
  id: string;
  preview?: string;
  hash?: string;
  status: 'ready' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietInspectorPage() {
  const [item, setItem] = useState<Inspected | null>(null);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const inspect = useCallback(async (file: File) => {
    setWarn(file.size > 40 * 1024 * 1024 ? 'Large file — may feel slow while hashing or sending. No hard limits.' : null);
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    let hash: string | undefined;
    try {
      const buf = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buf);
      hash = Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 16);
    } catch {
      // hashing optional
    }
    setItem({
      file,
      id: Math.random().toString(36).slice(2, 10),
      preview,
      hash,
      status: 'ready',
    });
    setCaption(file.name);
  }, []);

  const publish = async () => {
    if (!item || busy) return;
    setBusy(true);
    setItem((p) => p ? { ...p, status: 'uploading' } : p);
    try {
      const res = await publishLocalFile(item.file, {
        caption: caption.trim() || item.file.name,
        color: accent,
        cardTitle: item.file.name,
        meta: { desk: 'quietinspector', hash: item.hash },
      });
      setItem((p) =>
        p
          ? {
              ...p,
              status: res.ok ? 'done' : 'error',
              link: res.embed,
              error: res.error,
            }
          : p
      );
    } catch (e: any) {
      setItem((p) => p ? { ...p, status: 'error', error: e.message } : p);
    }
    setBusy(false);
  };

  useEffect(() => {
    return () => {
      if (item?.preview) URL.revokeObjectURL(item.preview);
    };
  }, [item?.preview]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>
            Quiet Inspector
          </p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Look first. Then share.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop one local file. Soft details appear before it settles into the database. Every share link carries a polished Discord embed. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          {!item && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('ring-2', 'ring-white/20');
              }}
              onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-white/20');
                const f = e.dataTransfer.files[0];
                if (f) inspect(f);
              }}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-white/12 rounded-3xl p-16 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
            >
              <p className="text-neutral-300 text-[15px]">Drop one file</p>
              <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && inspect(e.target.files[0])}
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            {item && (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                className="glass rounded-3xl p-6 mb-6"
              >
                {item.preview && (
                  <img src={item.preview} alt="" className="w-full max-h-64 object-contain rounded-2xl mb-5 bg-black/30" />
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Name</span>
                    <span className="truncate max-w-[60%] text-right">{item.file.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Type</span>
                    <span>{item.file.type || 'unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Size</span>
                    <span>{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  {item.hash && (
                    <div className="flex justify-between">
                      <span className="text-neutral-500">SHA-256 (prefix)</span>
                      <span className="font-mono text-xs">{item.hash}…</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Status</span>
                    <span>{item.status}</span>
                  </div>
                </div>
                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block text-sm text-blue-400 truncate"
                  >
                    {item.link}
                  </a>
                )}
                {item.error && <p className="mt-3 text-sm text-red-400">{item.error}</p>}
                <button
                  onClick={() => setItem(null)}
                  className="mt-5 text-xs text-neutral-500 hover:text-white"
                >
                  clear and drop another
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-9 h-9 rounded-full cursor-pointer border-0"
            />
            <span className="text-[13px] text-neutral-500">Accent for the embed</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !item || item.status === 'done'}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : item?.status === 'done' ? 'Published' : 'Publish to database'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
