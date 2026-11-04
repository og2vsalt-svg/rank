import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftGlintPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ embed?: string; error?: string; warn?: string | null; name: string }[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const onDrop = useCallback((list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
  }, []);

  const shareAll = async () => {
    if (!files.length) return;
    setBusy(true);
    setResults([]);
    const outs: typeof results = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note || file.name,
        color: accent,
        cardTitle: file.name,
        meta: { accent, source: 'softglint', kind: 'glint' },
      });
      outs.push({
        name: file.name,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
      });
    }
    setResults(outs);
    setBusy(false);
    setFiles([]);
  };

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1400);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/40">softglint</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">catch a glint. share the light.</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            Drop one or many local files. They land in storage and public_shares with a soft shimmering accent. Every share link unfurls a polished Discord card. Large drops receive only a gentle warning of possible slowness — never refused. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          className="mt-8 glass rounded-[28px] p-6 relative overflow-hidden"
          whileHover={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${accent}33, transparent 50%), radial-gradient(circle at 70% 80%, ${accent}22, transparent 40%)`,
            }}
          />
          <div className="relative">
            <label className="block text-center cursor-pointer">
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onDrop(e.target.files)}
              />
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="mx-auto w-16 h-16 rounded-full grid place-items-center mb-3"
                style={{ background: `${accent}22`, border: `1px solid ${accent}44` }}
              >
                <span className="text-2xl">✦</span>
              </motion.div>
              <p className="text-[15px] font-medium">drop files or click to choose</p>
              <p className="text-[13px] text-white/45 mt-1">no hard limits · soft warning only</p>
            </label>

            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-1.5"
                >
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between text-[13px] text-white/70">
                      <span className="truncate">{f.name}</span>
                      <span className="text-white/40 shrink-0 ml-2">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="mt-4 space-y-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="quiet note for the cards (optional)"
            className="glass w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none"
          />
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent"
            />
            <span className="text-[13px] text-white/50">glint accent</span>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.015 }}
          onClick={shareAll}
          disabled={!files.length || busy}
          className="mt-6 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
          style={{ background: accent }}
        >
          {busy ? 'catching the glint…' : files.length ? `share ${files.length} file${files.length > 1 ? 's' : ''}` : 'add files first'}
        </motion.button>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-3"
            >
              {results.map((r, i) => (
                <div key={i} className="glass rounded-2xl px-4 py-3.5">
                  {r.embed ? (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[14px] truncate">{r.name} filed</p>
                        <button
                          onClick={() => copy(r.embed!)}
                          className="rounded-full bg-white/10 px-3 py-1 text-[12px] shrink-0"
                        >
                          {copied === r.embed ? 'copied' : 'copy link'}
                        </button>
                      </div>
                      <p className="mt-1.5 break-all text-[12px] text-white/45">{r.embed}</p>
                    </>
                  ) : (
                    <p className="text-[13px] text-red-300">{r.error || 'could not file'}</p>
                  )}
                  {r.warn && <p className="mt-1.5 text-[12px] text-amber-200/80">{r.warn}</p>}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
