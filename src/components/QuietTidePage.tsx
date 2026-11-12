import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietTidePage() {
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
      await addFiles(files, 'tide');
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
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#64D2FF]/20 to-transparent"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="max-w-2xl mx-auto relative">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3"
        >
          quiet tide
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-10 leading-relaxed"
        >
          Drop local files onto a soft rising tide. They wash in as spring-animated frosted glass cards that gently float with the water, then publish to the database with polished Discord embeds. Soft size warnings only. No hard limits.
        </motion.p>

        <div
          className="glass rounded-3xl p-10 mb-6 text-center cursor-pointer border border-white/10 hover:border-[#64D2FF]/40 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" onChange={onFile} className="hidden" id="tide-file" multiple />
          <label htmlFor="tide-file" className="cursor-pointer block">
            <div className="text-neutral-500 text-sm mb-1">let files wash in with the tide or click</div>
            <div className="text-xs text-neutral-600">multi-file · tidal spring cards · discord embeds</div>
          </label>
        </div>

        {large && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-amber-400 text-xs mb-5">
            a deep tide. the browser may feel slow while encoding or uploading. no hard limit.
          </motion.div>
        )}

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
                  key={f.name + i + f.size}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.03 }}
                  className="glass rounded-2xl px-4 py-3 flex items-center justify-between text-sm"
                  style={{ animation: 'subtle-float 6s ease-in-out infinite' }}
                >
                  <span className="truncate pr-4">{f.name}</span>
                  <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white text-xs">ebb</button>
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
          {status === 'uploading' ? 'rising…' : `publish ${files.length || ''} with the tide`}
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
