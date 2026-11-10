import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function formatSize(n: number) {
  if (!n) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

export default function SoftQuietEchoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [shares, setShares] = useState<{ id: string; name: string; size: number; url?: string }[]>([]);
  const [dropping, setDropping] = useState(false);

  const onFiles = useCallback(async (incoming: FileList | File[]) => {
    const arr = Array.from(incoming || []);
    if (!arr.length) return;
    setBusy(true);
    setWarn(null);
    let anyLarge = false;
    const newShares = [];
    for (const file of arr) {
      if (file.size > 40 * 1024 * 1024) anyLarge = true;
      const res = await publishLocalFile(file, { caption: caption.trim() || undefined, color: '#0A84FF' });
      if (!res.ok) {
        setWarn(res.error || 'could not share');
        break;
      }
      if (res.id) {
        newShares.push({ id: res.id, name: file.name, size: file.size, url: res.url });
      }
    }
    if (anyLarge) setWarn((w) => w || 'large drop. the browser may feel slow while it sends. no hard limit.');
    setShares((prev) => [...newShares, ...prev].slice(0, 12));
    setFiles([]);
    setBusy(false);
  }, [caption]);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropping(false);
    if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
  }

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-2">soft quiet echo</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white mb-3">let it echo softly</h1>
          <p className="text-neutral-400 text-lg max-w-lg mx-auto">
            Multi-file local upload where soft light echoes settle with spring motion on frosted glass. Shared caption. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.1 }}
          onDragOver={(e) => { e.preventDefault(); setDropping(true); }}
          onDragLeave={() => setDropping(false)}
          onDrop={onDrop}
          className={`glass rounded-[32px] p-8 border-2 border-dashed transition-all duration-300 ${
            dropping ? 'border-[#0A84FF]/70 bg-[#0A84FF]/8 scale-[1.01]' : 'border-white/15'
          }`}
        >
          <div className="flex flex-col items-center gap-5">
            <label className="w-full cursor-pointer">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && onFiles(e.target.files)}
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-center py-10 rounded-3xl bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                <div className="text-5xl mb-3 opacity-60">✦</div>
                <p className="text-white font-medium text-lg">drop files or click to echo</p>
                <p className="text-xs text-neutral-500 mt-2">multiple allowed · soft spring settle · Discord card ready</p>
              </motion.div>
            </label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional shared caption"
              className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-neutral-500 outline-none focus:border-[#0A84FF]/50 focus:bg-white/[0.07] transition"
            />
          </div>
          <AnimatePresence>
            {busy && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center text-sm text-[#0A84FF] mt-6">
                echoing…
              </motion.p>
            )}
            {warn && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-amber-300/90 mt-4">
                {warn}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {shares.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12">
            <h2 className="text-sm font-medium text-neutral-400 mb-4 tracking-wide">recent echoes</h2>
            <div className="grid gap-3">
              <AnimatePresence>
                {shares.map((s) => {
                  const urls = shareUrls(s.id);
                  return (
                    <motion.a
                      key={s.id}
                      href={urls.app}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      whileHover={{ x: 4 }}
                      className="glass rounded-2xl px-5 py-4 flex items-center justify-between group"
                    >
                      <div>
                        <p className="text-white text-sm font-medium truncate max-w-[220px]">{s.name}</p>
                        <p className="text-xs text-neutral-500">{formatSize(s.size)}</p>
                      </div>
                      <span className="text-xs text-[#0A84FF] opacity-0 group-hover:opacity-100 transition">open</span>
                    </motion.a>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
