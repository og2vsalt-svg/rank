import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Result = { id: string; name: string; embed: string; warn?: string | null; progress?: string };

export default function QuietVeilPage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
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
    setResults(files.map(f => ({ id: '', name: f.name, embed: '', progress: 'settling…' })));
    try {
      await addFiles(files, 'veil');
      const out: Result[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, progress: 'publishing…' } : r));
        const res = await publishLocalFile(file, {
          caption: caption || undefined,
          cardTitle: file.name,
          author: 'rankvault',
          color: '#A8C0FF',
        });
        const item: Result = res.ok && res.id
          ? { id: res.id, name: file.name, embed: shareUrls(res.id).embed, warn: res.warn || null, progress: 'shared' }
          : { id: '', name: file.name, embed: '', warn: res.error || 'failed', progress: 'issue' };
        out.push(item);
        setResults(prev => {
          const next = [...prev];
          next[i] = item;
          return next;
        });
      }
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
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet veil
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-8 leading-relaxed"
        >
          Drop local files. They settle under a soft layered veil of frosted glass with staggered spring reveals, then publish progressively to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. All prior desks remain fully intact.
        </motion.p>

        <motion.div
          className="glass rounded-3xl p-12 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/25 transition-all relative overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
          whileHover={{ scale: 1.004 }}
          whileTap={{ scale: 0.996 }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <input type="file" onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="veil-file" multiple />
          <label htmlFor="veil-file" className="cursor-pointer block relative z-10">
            <div className="text-neutral-500 text-sm mb-1">drop files under the veil</div>
            {files.length > 0 && (
              <div className="text-sm font-medium text-white/90">{files.length} file{files.length > 1 ? 's' : ''}</div>
            )}
          </label>
        </motion.div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2 mb-6"
            >
              {files.map((f, i) => (
                <motion.div
                  key={f.name + i}
                  initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ delay: i * 0.06, type: 'spring', stiffness: 120, damping: 16 }}
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
            large drop. the browser may feel slow while it settles and publishes. never refused.
          </motion.div>
        )}

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional shared caption for Discord cards"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
        />

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={shareAll}
          disabled={!files.length || status === 'uploading'}
          className="w-full py-3 rounded-full bg-[#A8C0FF] text-black font-medium disabled:opacity-50"
        >
          {status === 'uploading' ? 'lifting the veil…' : 'publish under the veil'}
        </motion.button>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-3"
            >
              <p className="text-sm font-medium">under the veil</p>
              {results.map((r, i) => (
                <motion.div
                  key={r.name + i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-2xl p-4 text-sm"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-medium truncate">{r.name}</p>
                    <span className="text-xs text-neutral-400">{r.progress}</span>
                  </div>
                  {r.embed ? (
                    <>
                      <p className="text-xs text-neutral-400 break-all mt-1">{r.embed}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(r.embed)}
                        className="text-xs text-[#A8C0FF] mt-2"
                      >
                        copy embed
                      </button>
                    </>
                  ) : r.warn ? (
                    <p className="text-xs text-amber-400 mt-1">{r.warn}</p>
                  ) : null}
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
