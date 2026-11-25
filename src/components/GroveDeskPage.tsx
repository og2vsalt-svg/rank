import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function GroveDeskPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#34C759');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const big = files.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. Upload may feel slow. No hard limit.' : null);
  }, [files]);

  const share = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const results = await Promise.all(
        files.map((file, i) =>
          publishLocalFile(file, {
            caption: caption.trim() || 'from the grove',
            color: accent,
            cardTitle: title.trim() || file.name,
            meta: { desk: 'grovedesk', index: i },
          })
        )
      );
      const ok = results.filter((r) => r.ok && r.embed).map((r) => r.embed!);
      if (ok.length) setLinks(ok);
      else setErr('nothing settled');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Grove Desk</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Files settle like leaves.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Drop several local files. They rise and settle with staggered organic springs under one quiet title and caption. Each becomes its own permanent Discord-ready link. Soft size warnings only.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Shared title"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-3 focus:outline-none focus:border-white/20"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Quiet caption…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <label className="text-[13px] text-neutral-300 cursor-pointer hover:text-white transition">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Choose local files'}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
            </label>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <div className="flex flex-wrap gap-2 mb-5 min-h-[40px]">
            <AnimatePresence>
              {files.map((f, i) => (
                <motion.div
                  key={f.name + i}
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 16, delay: i * 0.06 }}
                  className="px-3 py-1.5 rounded-full bg-white/10 text-[12px] text-neutral-200"
                >
                  {f.name}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : 'Share the grove'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 space-y-2">
                {links.map((l) => (
                  <motion.a
                    key={l}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    href={l}
                    className="block text-[13px] break-all"
                    style={{ color: accent }}
                  >
                    {l}
                  </motion.a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
