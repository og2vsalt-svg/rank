import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Result = { id: string; name: string; embed: string; warn?: string | null };

export default function QuietMeridianPage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState('');

  const onDrop = useCallback((list: FileList | File[]) => {
    setFiles(Array.from(list));
    setStatus('idle');
    setResults([]);
    setError('');
  }, []);

  const shareAll = async () => {
    if (!files.length) return;
    setStatus('uploading');
    setError('');
    setResults([]);
    try {
      await addFiles(files, 'meridian');
      const out: Result[] = [];
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption || undefined,
          color,
          cardTitle: file.name,
          author: 'rankvault',
        });
        if (res.ok && res.id) {
          const urls = shareUrls(res.id);
          out.push({ id: res.id, name: file.name, embed: urls.embed, warn: res.warn || null });
        } else {
          out.push({ id: '', name: file.name, embed: '', warn: res.error || 'failed' });
        }
      }
      setResults(out);
      setStatus('done');
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet meridian
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.07 }}
          className="text-neutral-400 mb-8 leading-relaxed"
        >
          Drop local files. They settle along a quiet meridian of balanced frosted glass cards with gentle spring motion. Shared caption, cool accent. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.
        </motion.p>

        <motion.div
          className="glass rounded-3xl p-10 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/20"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
          whileHover={{ scale: 1.004 }}
          whileTap={{ scale: 0.996 }}
        >
          <input type="file" onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="meridian-file" multiple />
          <label htmlFor="meridian-file" className="cursor-pointer block">
            <div className="text-neutral-500 text-sm mb-1">drag files onto the meridian or click</div>
            {files.length > 0 && (
              <div className="text-sm font-medium text-white/90">{files.length} file{files.length > 1 ? 's' : ''}</div>
            )}
          </label>
        </motion.div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 mb-6"
            >
              {files.map((f, i) => (
                <motion.div
                  key={f.name + i}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.045, type: 'spring', stiffness: 130, damping: 17 }}
                  className="glass rounded-2xl px-4 py-3 text-sm flex justify-between items-center"
                >
                  <span className="truncate">{f.name}</span>
                  <span className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {files.some(f => f.size > 40 * 1024 * 1024) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400 text-xs mb-4">
            large drop detected. the browser may feel slow while encoding or uploading. no hard limit.
          </motion.div>
        )}

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional shared caption for Discord cards"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
        />

        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs text-neutral-400">accent</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={shareAll}
          disabled={!files.length || status === 'uploading'}
          className="w-full py-3 rounded-full bg-[#5AC8FA] text-black font-medium disabled:opacity-50"
        >
          {status === 'uploading' ? 'settling…' : 'settle to database'}
        </motion.button>

        <AnimatePresence>
          {status === 'done' && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-3"
            >
              <p className="text-sm font-medium">shared along the meridian</p>
              {results.map((r, i) => (
                <motion.div
                  key={r.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4 text-sm"
                >
                  <p className="font-medium truncate">{r.name}</p>
                  {r.embed ? (
                    <>
                      <p className="text-xs text-neutral-400 break-all mt-1">{r.embed}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(r.embed)}
                        className="text-xs text-[#5AC8FA] mt-2"
                      >
                        copy embed
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-amber-400 mt-1">{r.warn}</p>
                  )}
                </motion.div>
              ))}
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
