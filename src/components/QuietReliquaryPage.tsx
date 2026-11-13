import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietReliquaryPage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF9F0A');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<{ id: string; embed: string; name: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles(prev => [...prev, ...arr]);
    setStatus('idle');
    setError('');
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onDrop(e.target.files);
  };

  const sealAll = async () => {
    if (!files.length) return;
    setStatus('uploading');
    setError('');
    setResults([]);
    try {
      await addFiles(files, 'reliquary');
      const outs: typeof results = [];
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption || 'sealed in the reliquary',
          color,
          cardTitle: file.name,
          author: 'rankvault',
          meta: { desk: 'quietreliquary' },
        });
        if (res.ok && res.id) {
          const urls = shareUrls(res.id);
          outs.push({ id: res.id, embed: urls.embed, name: file.name, warn: res.warn || null });
        } else {
          outs.push({ id: '', embed: '', name: file.name, warn: res.error || 'failed' });
        }
      }
      setResults(outs);
      setStatus('done');
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  const clear = () => {
    setFiles([]);
    setResults([]);
    setStatus('idle');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {files.map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full glass"
            style={{
              width: 60 + (i % 3) * 20,
              height: 60 + (i % 3) * 20,
              left: `${10 + (i * 17) % 80}%`,
              bottom: `${20 + (i * 13) % 40}%`,
              background: color + '22',
            }}
            animate={{ y: [0, -12, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 5 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <div className="relative max-w-2xl mx-auto z-10">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet reliquary
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-8"
        >
          Seal local files into soft floating glass orbs. Shared caption. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple-style spring motion. All prior desks remain fully intact.
        </motion.p>

        <div
          className="glass rounded-3xl p-8 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/20 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" onChange={onFile} className="hidden" id="reliquary-file" multiple />
          <label htmlFor="reliquary-file" className="cursor-pointer">
            <div className="text-neutral-500 text-sm mb-2">drop files to seal in the reliquary</div>
            {files.length > 0 && (
              <div className="text-sm font-medium">{files.length} file{files.length > 1 ? 's' : ''} ready to seal</div>
            )}
          </label>
        </div>

        {files.some(f => f.size > 40 * 1024 * 1024) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400 text-xs mb-4">
            large drops detected. the browser may feel slow while sealing or uploading. no hard limit.
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
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0" />
        </div>

        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={sealAll}
            disabled={!files.length || status === 'uploading'}
            className="flex-1 py-3 rounded-full bg-[#FF9F0A] text-black font-medium disabled:opacity-50"
          >
            {status === 'uploading' ? 'sealing…' : 'seal & publish'}
          </motion.button>
          {files.length > 0 && (
            <button onClick={clear} className="px-5 py-3 rounded-full bg-white/10 text-sm">clear</button>
          )}
        </div>

        <AnimatePresence>
          {status === 'done' && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-3"
            >
              {results.map((r, i) => (
                <div key={i} className="glass rounded-2xl p-4">
                  <p className="text-sm font-medium mb-1">{r.name}</p>
                  {r.embed ? (
                    <>
                      <p className="text-xs text-neutral-400 break-all mb-2">{r.embed}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(r.embed)}
                        className="text-xs text-[#FF9F0A]"
                      >
                        copy link
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
