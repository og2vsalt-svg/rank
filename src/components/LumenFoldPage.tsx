import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function LumenFoldPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');

  const onDrop = useCallback((list: FileList | File[]) => {
    setFiles(Array.from(list));
    setStatus('idle');
    setResult(null);
    setError('');
  }, []);

  const share = async () => {
    if (!files.length) return;
    setStatus('uploading');
    setError('');
    try {
      const primary = files[0];
      const names = files.map(f => f.name).join(', ');
      const fullCaption = [title && `Fold: ${title}`, caption, names && `Files: ${names}`].filter(Boolean).join('\n');
      const res = await publishLocalFile(primary, {
        caption: fullCaption || undefined,
        color,
        cardTitle: title || primary.name,
        author: 'rankvault',
        meta: { fold: files.map(f => ({ name: f.name, size: f.size, type: f.type })) },
      });
      if (!res.ok || !res.id) {
        setError(res.error || 'upload failed');
        setStatus('error');
        return;
      }
      const urls = shareUrls(res.id);
      setResult({ embed: urls.embed, warn: res.warn || null });
      setStatus('done');
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  const totalSize = files.reduce((a, f) => a + f.size, 0);
  const slow = totalSize > 50 * 1024 * 1024;

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          lumen fold
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-8"
        >
          Fold several local files into one quiet share. The primary file uploads to the database with a polished Discord embed that lists the companions. Soft warnings only.
        </motion.p>

        <motion.div
          className="glass rounded-3xl p-8 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/20 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
          whileHover={{ scale: 1.005 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <input type="file" onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="fold-files" multiple />
          <label htmlFor="fold-files" className="cursor-pointer block">
            <div className="text-neutral-500 text-sm mb-3">drop files to fold · or click</div>
            {files.length === 0 && <div className="text-xs text-neutral-600">no hard limits · large drops may feel slow</div>}
          </label>
        </motion.div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
            >
              {files.map((f, i) => (
                <motion.div
                  key={f.name + i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 22, delay: i * 0.03 }}
                  className="glass rounded-2xl p-3 text-xs"
                >
                  <div className="font-medium truncate">{f.name}</div>
                  <div className="text-neutral-500 mt-1">{(f.size / 1024 / 1024).toFixed(1)} mb</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {slow && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400 text-xs mb-4">
            large fold. the browser may feel slow while uploading. no hard limit.
          </motion.div>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="optional fold title"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-3 outline-none"
        />
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional caption for the Discord card"
          rows={3}
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none resize-none"
        />

        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs text-neutral-400">accent</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={share}
          disabled={!files.length || status === 'uploading'}
          className="w-full py-3 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-50"
        >
          {status === 'uploading' ? 'folding…' : 'fold and share'}
        </motion.button>

        <AnimatePresence>
          {status === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl p-5"
            >
              <p className="text-sm font-medium mb-2">folded</p>
              <p className="text-xs text-neutral-400 break-all mb-3">{result.embed}</p>
              {result.warn && <p className="text-amber-400 text-xs mb-2">{result.warn}</p>}
              <button onClick={() => navigator.clipboard.writeText(result.embed)} className="text-xs text-[#0A84FF]">
                copy Discord link
              </button>
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-400 text-sm">
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
