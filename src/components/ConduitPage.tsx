import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from './Router';
import { publishLocalFile } from '../lib/cloudShare';

export default function ConduitPage() {
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ id: string; url: string; embed: string; warn?: string | null; name: string } | null>(null);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [error, setError] = useState('');

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;
    setError('');
    setUploading(true);
    setResult(null);
    try {
      const res = await publishLocalFile(file, { caption, color, cardTitle: file.name });
      if (!res.ok) {
        setError(res.error || 'upload failed');
        return;
      }
      setResult({
        id: res.id!,
        url: res.url!,
        embed: res.embed!,
        warn: res.warn,
        name: file.name,
      });
    } catch (e: any) {
      setError(e?.message || 'failed');
    } finally {
      setUploading(false);
    }
  }, [caption, color]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="min-h-screen mesh pt-24 pb-16 px-5">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <p className="text-[#0a84ff] text-sm font-medium tracking-wide mb-2">conduit</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">drop & share</h1>
          <p className="text-neutral-400">Local file to cloud. Discord embeds on every link. Large files get a gentle warning.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative rounded-3xl glass p-8 text-center transition-all duration-500 ${dragging ? 'border-[#0a84ff]/40 bg-white/5' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={uploading}
          />
          <div className="pointer-events-none">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 grid place-items-center">
              <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-white font-medium mb-1">{uploading ? 'sending…' : 'drop a file or click'}</p>
            <p className="text-neutral-500 text-sm">any size · no hard limits</p>
          </div>
        </motion.div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-neutral-500 uppercase tracking-wider">caption</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional note"
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#0a84ff]/50"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 uppercase tracking-wider">accent</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="mt-1 w-full h-10 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
            />
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 text-red-400 text-sm text-center">{error}</motion.p>
          )}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-2xl glass p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                <p className="text-white font-medium truncate">{result.name}</p>
              </div>
              {result.warn && <p className="text-amber-400/80 text-xs mb-3">{result.warn}</p>}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between bg-black/30 rounded-xl px-3 py-2">
                  <span className="text-neutral-400 truncate mr-2">{result.embed}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(result.embed)}
                    className="text-[#0a84ff] text-xs font-medium shrink-0"
                  >copy</button>
                </div>
                <p className="text-neutral-500 text-xs">paste into Discord for a pro embed card</p>
              </div>
              <div className="mt-4 flex gap-2">
                <a href={result.embed} target="_blank" rel="noreferrer" className="flex-1 text-center py-2 rounded-full bg-white text-black text-sm font-medium">open</a>
                <button onClick={() => navigate('gallery')} className="flex-1 py-2 rounded-full glass text-sm">gallery</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
