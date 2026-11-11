import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietEmbersPage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF6B35');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
    setStatus('idle');
    setError('');
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onDrop(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const shareAll = async () => {
    if (!files.length) return;
    setStatus('uploading');
    setError('');
    setResults([]);
    try {
      await addFiles(files, 'embers');
      const out: typeof results = [];
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

  const large = files.some((f) => f.size > 40 * 1024 * 1024);

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet embers
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-8"
        >
          Multi-file drop that settles as soft glowing embers. Gentle floating pulse, spring motion, frosted glass. Each publishes to the database with a polished Discord embed. Soft slow warnings only. No hard limits.
        </motion.p>

        <motion.div
          className="glass rounded-3xl p-10 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/25 transition-all relative overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-orange-400 blur-sm"
                style={{ left: `${15 + i * 14}%`, top: `${30 + (i % 3) * 20}%` }}
                animate={{ y: [0, -8, 0], opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </div>
          <input ref={inputRef} type="file" onChange={onFile} className="hidden" id="embers-file" multiple />
          <label htmlFor="embers-file" className="cursor-pointer block relative z-10">
            <div className="text-neutral-400 text-sm mb-1">drop files here</div>
            <div className="text-xs text-neutral-500">or click to browse · multiple ok</div>
          </label>
        </motion.div>

        {large && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-amber-400 text-xs mb-4 px-1">
            large files detected. encoding and upload may feel slow. no hard limit enforced.
          </motion.div>
        )}

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 space-y-3"
            >
              {files.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                  className="glass rounded-2xl px-4 py-3 flex items-center justify-between text-sm relative overflow-hidden"
                >
                  <motion.div
                    className="absolute left-3 w-1.5 h-1.5 rounded-full bg-orange-400 blur-[1px]"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span className="truncate max-w-[70%] pl-5">{f.name}</span>
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white">remove</button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional caption for Discord cards"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30"
        />

        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs text-neutral-400">ember accent</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={shareAll}
          disabled={!files.length || status === 'uploading'}
          className="w-full py-3.5 rounded-full bg-[#FF6B35] text-white font-medium disabled:opacity-50 transition"
        >
          {status === 'uploading' ? 'kindling in the database…' : `share ${files.length || ''} ember${files.length === 1 ? '' : 's'}`}
        </motion.button>

        <AnimatePresence>
          {status === 'done' && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-3"
            >
              {results.map((r, i) => (
                <div key={i} className="glass rounded-2xl p-4">
                  <p className="text-sm font-medium mb-1 truncate">{r.name}</p>
                  {r.embed ? (
                    <>
                      <p className="text-xs text-neutral-400 break-all mb-2">{r.embed}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(r.embed)}
                        className="text-xs text-[#FF6B35]"
                      >
                        copy embed link
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-red-400">{r.warn}</p>
                  )}
                  {r.warn && r.embed && <p className="text-amber-400 text-xs mt-1">{r.warn}</p>}
                </div>
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
