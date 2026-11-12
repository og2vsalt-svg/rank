import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietHorizonPage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#64D2FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
    setStatus('idle');
    setError('');
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onDrop(e.target.files);
  };

  const remove = (idx: number) => setFiles((f) => f.filter((_, i) => i !== idx));

  const shareAll = async () => {
    if (!files.length) return;
    setStatus('uploading');
    setError('');
    setResults([]);
    try {
      await addFiles(files, 'horizon');
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
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20">
      <div className="max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3"
        >
          quiet horizon
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-10 leading-relaxed max-w-xl"
        >
          Drop local files onto a quiet horizon. They rise as soft frosted glass cards that gently float and settle with spring motion, then publish to the database with polished Discord embeds. Soft size warnings only. No hard limits.
        </motion.p>

        <div
          className="glass rounded-3xl p-12 mb-8 text-center cursor-pointer border border-white/10 hover:border-[#64D2FF]/40 transition-all duration-300"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" onChange={onFile} className="hidden" id="horizon-file" multiple />
          <label htmlFor="horizon-file" className="cursor-pointer block">
            <div className="text-neutral-500 text-sm mb-1">drag files onto the horizon or click</div>
            <div className="text-xs text-neutral-600">multi-file · spring cards · discord embeds</div>
          </label>
        </div>

        {large && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-amber-400 text-xs mb-5">
            large drops on the horizon. the browser may feel slow while encoding or uploading. no hard limit.
          </motion.div>
        )}

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8"
            >
              {files.map((f, i) => (
                <motion.div
                  key={f.name + i + f.size}
                  initial={{ opacity: 0, y: 24, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 110, damping: 16, delay: i * 0.04 }}
                  className="glass rounded-2xl p-4 flex flex-col items-center text-center relative"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 mb-3 flex items-center justify-center text-xs text-neutral-400">
                    {f.type.startsWith('image') ? '■' : f.type.startsWith('video') ? '▶' : '●'}
                  </div>
                  <span className="text-xs truncate w-full mb-2">{f.name}</span>
                  <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white text-[10px] absolute top-2 right-2">×</button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional shared caption for Discord cards"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
        />

        <div className="flex items-center gap-3 mb-8">
          <label className="text-xs text-neutral-400">accent</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={shareAll}
          disabled={!files.length || status === 'uploading'}
          className="w-full py-3.5 rounded-full bg-[#64D2FF] text-black font-medium disabled:opacity-50"
        >
          {status === 'uploading' ? 'rising…' : `publish ${files.length || ''} to horizon`}
        </motion.button>

        <AnimatePresence>
          {status === 'done' && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-3"
            >
              {results.map((r, i) => (
                <motion.div
                  key={r.id || i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4"
                >
                  <p className="text-sm font-medium mb-1 truncate">{r.name}</p>
                  {r.embed ? (
                    <>
                      <p className="text-xs text-neutral-400 break-all mb-2">{r.embed}</p>
                      {r.warn && <p className="text-amber-400 text-xs mb-1">{r.warn}</p>}
                      <button
                        onClick={() => navigator.clipboard.writeText(r.embed)}
                        className="text-xs text-[#64D2FF]"
                      >
                        copy embed link
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-red-400">{r.warn}</p>
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
