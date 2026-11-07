import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenSharePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ id: string; embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(12).then(setShares);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const share = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);
    const res = await publishLocalFile(file, {
      caption: caption.trim() || undefined,
      color: accent,
      cardTitle: caption.trim() || file.name,
    });
    setUploading(false);
    if (res.ok && res.id && res.embed) {
      setResult({ id: res.id, embed: res.embed, warn: res.warn });
      setFile(null);
      setCaption('');
      listPublicShares(12).then(setShares);
    } else {
      setError(res.error || 'could not share');
    }
  };

  const sizeMb = file ? (file.size / 1024 / 1024).toFixed(1) : '0';
  const isLarge = file && file.size > 25 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="glass rounded-[36px] p-8 sm:p-10"
        >
          <p className="text-sm text-[#0A84FF] mb-3 tracking-wide font-medium">soft lumen share</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-white">
            drop a file. leave a quiet note.
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-8">
            Upload a local file to the shared database. Add an optional caption. Every link unfurls a polished Discord embed. Large files are gently warned about possible slowness — never refused. All prior desks remain fully intact.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="border border-dashed border-white/15 rounded-3xl p-10 text-center cursor-pointer hover:border-white/30 hover:bg-white/[0.03] transition-all duration-500 mb-6"
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div>
                <p className="text-white font-medium truncate">{file.name}</p>
                <p className="text-neutral-500 text-sm mt-1">{sizeMb} MB</p>
              </div>
            ) : (
              <p className="text-neutral-400 text-sm">drop a file or click to choose</p>
            )}
          </div>

          {isLarge && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-amber-300/80 text-xs mb-4 text-center"
            >
              large drop — the browser may feel slow while it sends. no hard limit.
            </motion.p>
          )}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="quiet caption (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs text-neutral-500">accent</span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/20 cursor-pointer bg-transparent"
            />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={!file || uploading}
            onClick={share}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#3a9aff] transition"
          >
            {uploading ? 'sharing…' : 'share quietly'}
          </motion.button>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-sm mt-4 text-center"
              >
                {error}
              </motion.p>
            )}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 glass rounded-2xl p-5 text-center"
              >
                <p className="text-sm text-neutral-300 mb-2">shared</p>
                <a
                  href={result.embed}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0A84FF] text-sm break-all hover:underline"
                >
                  {result.embed}
                </a>
                {result.warn && <p className="text-xs text-amber-300/70 mt-2">{result.warn}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {shares.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="text-lg font-medium mb-4 text-neutral-300">recent quiet shares</h2>
            <div className="space-y-3">
              {shares.map((s) => (
                <a
                  key={s.id}
                  href={shareUrls(s.id).app}
                  className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition-all duration-500"
                >
                  <p className="text-sm text-white truncate">{s.name || 'untitled'}</p>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-1">{s.caption || 'shared quietly'}</p>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
