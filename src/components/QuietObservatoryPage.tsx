import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietObservatoryPage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#AF52DE');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(12).then(setRecent).catch(() => setRecent([]));
  }, []);

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
      await addFiles(files, 'observatory');
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
      listPublicShares(12).then(setRecent).catch(() => {});
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  const large = files.some((f) => f.size > 40 * 1024 * 1024);

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20 overflow-hidden">
      <div className="max-w-3xl mx-auto relative">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3 text-center"
        >
          quiet observatory
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-10 leading-relaxed text-center max-w-xl mx-auto"
        >
          Drop local files into a soft observatory. They settle as orbiting spring-animated frosted glass cards around a quiet center, then publish to the database with polished Discord embeds. Soft size warnings only. No hard limits.
        </motion.p>

        <div
          className="glass rounded-3xl p-12 mb-8 text-center cursor-pointer border border-white/10 hover:border-[#AF52DE]/40 transition relative z-10"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" onChange={onFile} className="hidden" id="obs-file" multiple />
          <label htmlFor="obs-file" className="cursor-pointer block">
            <div className="text-neutral-500 text-sm mb-1">drag files into the observatory or click</div>
            <div className="text-xs text-neutral-600">multi-file · orbiting cards · discord embeds</div>
          </label>
        </div>

        {large && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-amber-400 text-xs mb-5 text-center">
            large drops in the observatory. the browser may feel slow while encoding or uploading. no hard limit.
          </motion.div>
        )}

        <div className="relative h-64 mb-10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#AF52DE]/20 blur-xl" />
          </div>
          <AnimatePresence>
            {files.map((f, i) => {
              const angle = (i / Math.max(files.length, 1)) * Math.PI * 2;
              const radius = 110;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <motion.div
                  key={f.name + i + f.size}
                  initial={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x, y }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ type: 'spring', stiffness: 90, damping: 16, delay: i * 0.04 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass rounded-2xl px-3 py-2 text-xs max-w-[140px] truncate shadow-lg"
                  style={{ originX: 0.5, originY: 0.5 }}
                >
                  {f.name}
                  <button onClick={() => remove(i)} className="ml-1 text-neutral-500 hover:text-white">×</button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional shared caption for Discord cards"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
        />

        <div className="flex items-center gap-3 mb-8 justify-center">
          <label className="text-xs text-neutral-400">accent</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={shareAll}
          disabled={!files.length || status === 'uploading'}
          className="w-full py-3.5 rounded-full bg-[#AF52DE] text-white font-medium disabled:opacity-50"
        >
          {status === 'uploading' ? 'orbiting…' : `publish ${files.length || ''} to observatory`}
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
                        className="text-xs text-[#AF52DE]"
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-400 text-sm text-center">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {recent.length > 0 && (
          <div className="mt-16">
            <h2 className="text-sm text-neutral-500 mb-4 text-center">recent public shares in orbit</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recent.slice(0, 9).map((r) => (
                <motion.a
                  key={r.id}
                  href={`/s/${r.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -2 }}
                  className="glass rounded-2xl p-3 text-xs block"
                >
                  <p className="truncate font-medium">{r.name || r.cardTitle || 'share'}</p>
                  <p className="text-neutral-500 mt-1 truncate">{r.caption || r.type}</p>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
