import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function VelvetLedgerPage() {
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('Velvet Ledger');
  const [caption, setCaption] = useState('filed under lock and quiet time');
  const [color, setColor] = useState('#BF5AF2');
  const [lockPass, setLockPass] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setUploading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    const newResults: any[] = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setProgress(Math.round(((i + 0.3) / list.length) * 100));
      try {
        const pub = await publishLocalFile(file, {
          caption,
          cardTitle: title || file.name,
          color,
          lockPass: lockPass.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          newResults.push({
            name: file.name,
            id: pub.id,
            url: urls.embed,
            size: file.size,
            warn: pub.warn,
            locked: !!lockPass.trim(),
            expires: expiresAt || null,
          });
        } else {
          setError(pub.error || 'one entry could not be filed');
        }
      } catch (e: any) {
        setError(e?.message || 'upload interrupted');
      }
      setProgress(Math.round(((i + 1) / list.length) * 100));
    }
    setResults(newResults);
    setUploading(false);
  }, [title, caption, color, lockPass, expiresAt]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const prettySize = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#BF5AF2] text-sm tracking-wide mb-3">velvet ledger</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">
            file under lock,<br />or let it fade.
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Optional password and expiry on every share. Local files upload to the share database with polished Discord embeds. Soft size warnings only — nothing is refused.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="glass rounded-3xl p-6 space-y-4">
            <label className="block text-xs text-neutral-500">embed title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#BF5AF2]/50"
            />
            <label className="block text-xs text-neutral-500">caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#BF5AF2]/50 resize-none"
            />
            <label className="block text-xs text-neutral-500">password lock (optional)</label>
            <input
              type="password"
              value={lockPass}
              onChange={(e) => setLockPass(e.target.value)}
              placeholder="leave empty for open access"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#BF5AF2]/50"
            />
            <label className="block text-xs text-neutral-500">expires at (optional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#BF5AF2]/50"
            />
            <label className="block text-xs text-neutral-500">accent</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-12 rounded-2xl cursor-pointer bg-transparent border border-white/10"
            />
          </div>
          <div className="glass rounded-3xl p-6">
            <p className="text-xs text-neutral-500 mb-3">live embed preview</p>
            <div className="border-l-4 rounded-2xl p-4 bg-black/40" style={{ borderColor: color }}>
              <p className="font-medium text-sm" style={{ color }}>
                {title || 'Velvet Ledger'}
              </p>
              <p className="text-neutral-400 text-xs mt-1 leading-relaxed">
                {caption || 'filed under lock and quiet time'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {lockPass.trim() && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-400">locked</span>
                )}
                {expiresAt && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-neutral-400">expires</span>
                )}
              </div>
              <p className="text-[10px] text-neutral-600 mt-3">rankvault · Discord-ready</p>
            </div>
          </div>
        </div>

        <motion.div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          animate={{
            scale: dragging ? 1.012 : 1,
            borderColor: dragging ? color : 'rgba(255,255,255,0.08)',
          }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          className="relative border-2 border-dashed rounded-3xl p-16 text-center bg-white/[0.025] backdrop-blur-2xl cursor-pointer mb-10"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="space-y-5">
              <div
                className="w-16 h-16 mx-auto rounded-full border-2 border-white/20 animate-spin"
                style={{ borderTopColor: color }}
              />
              <p className="text-sm text-neutral-300">filing… {progress}%</p>
            </div>
          ) : (
            <>
              <p className="text-2xl font-medium mb-2">Drop files into the ledger</p>
              <p className="text-sm text-neutral-500">
                or click to browse. Large files may feel slow in the browser — nothing is blocked.
              </p>
            </>
          )}
        </motion.div>

        {error && <p className="text-center text-sm text-red-400 mb-6">{error}</p>}

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid sm:grid-cols-2 gap-4"
            >
              {results.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-2xl p-5 flex flex-col gap-3"
                >
                  <div>
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-neutral-500">{prettySize(r.size)}</p>
                    {r.locked && <p className="text-xs text-[#BF5AF2] mt-1">password locked</p>}
                    {r.expires && <p className="text-xs text-neutral-500 mt-0.5">expires {r.expires}</p>}
                    {r.warn && <p className="text-xs text-amber-400 mt-1">{r.warn}</p>}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.url)}
                    className="self-start px-4 py-2 rounded-full text-xs font-medium text-white"
                    style={{ background: color }}
                  >
                    copy share link
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => navigate('home')}
          className="mt-12 text-sm text-neutral-500 hover:text-white transition"
        >
          ← back home
        </button>
      </div>
    </div>
  );
}
