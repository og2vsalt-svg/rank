import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function QuietHarborPage() {
  const { navigate } = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ link?: string; error?: string } | null>(null);
  const [sizeNote, setSizeNote] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback((f: File) => {
    setFile(f);
    setTitle(f.name.replace(/\.[^.]+$/, ''));
    setSizeNote(f.size > 80_000_000 ? 'Quite large — the browser might pause while sending. Nothing is blocked.' : null);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
    setResult(null);
  }, []);

  const share = async () => {
    if (!file || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await publishLocalFile(file, {
        caption: note.trim() || undefined,
        color: accent,
        cardTitle: title.trim() || file.name,
        meta: { desk: 'quietharbor' },
      });
      if (res.ok && res.id) {
        setResult({ link: shareUrls(res.id).app });
      } else {
        setResult({ error: res.error || 'Could not place the share.' });
      }
    } catch (e: any) {
      setResult({ error: e.message });
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-32 pb-28 px-5 max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 24 }}
          className="glass rounded-[40px] p-8 md:p-11 border border-white/[0.06]"
        >
          <p className="text-[12.5px] font-medium tracking-[0.08em] uppercase text-[#5AC8FA]/80 mb-3">Quiet Harbor</p>
          <h1 className="text-[2.35rem] font-semibold tracking-tight leading-tight mb-3 text-white">A calm place to leave files.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-9">
            Drop something local. Add a short note if you like. Soft warning on very large files — the rest is up to the browser. Every link carries a clean Discord embed.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#5AC8FA]/30'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#5AC8FA]/30')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#5AC8FA]/30');
              if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-[28px] p-14 text-center mb-8 cursor-pointer hover:border-white/25 transition-colors bg-black/15"
          >
            {preview ? (
              <img src={preview} alt="" className="max-h-36 mx-auto rounded-2xl object-contain" />
            ) : file ? (
              <p className="text-neutral-300 text-[15px]">{file.name}</p>
            ) : (
              <>
                <p className="text-neutral-300 text-[15px]">Drop a file</p>
                <p className="text-neutral-500 text-sm mt-1.5">or click to choose</p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </div>

          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 mb-7 overflow-hidden"
              >
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full bg-black/25 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25 transition"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note"
                  rows={3}
                  className="w-full bg-black/25 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25 transition resize-none"
                />
                <div className="flex items-center gap-3 pt-1">
                  <label className="text-sm text-neutral-400">Accent</label>
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => setAccent(e.target.value)}
                    className="w-9 h-9 rounded-full border border-white/10 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs text-neutral-500 font-mono">{accent}</span>
                </div>
                {sizeNote && <p className="text-[13px] text-amber-300/70">{sizeNote}</p>}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            onClick={share}
            disabled={busy || !file}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Placing…' : file ? 'Leave in harbor' : 'Choose a file first'}
          </motion.button>

          <AnimatePresence>
            {result?.link && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 glass rounded-2xl p-4"
              >
                <p className="text-sm text-neutral-400 mb-1">Ready</p>
                <button
                  onClick={() => navigate('share', result.link!.split('/').pop() || '')}
                  className="text-sm break-all text-left"
                  style={{ color: accent }}
                >
                  {result.link}
                </button>
              </motion.div>
            )}
            {result?.error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400/90 mt-4">
                {result.error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
