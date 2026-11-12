import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietVesperPage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#FF9500');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(6).then(setRecent).catch(() => {});
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
      await addFiles(files, 'vesper');
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
      listPublicShares(6).then(setRecent).catch(() => {});
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  const large = files.some((f) => f.size > 40 * 1024 * 1024);

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3"
        >
          quiet vesper
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-10 leading-relaxed"
        >
          Drop local files into the soft dusk of vesper. They rise as gentle floating lanterns of frosted glass with spring motion. Share one caption and warm accent, then publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits.
        </motion.p>

        <div
          className="glass rounded-3xl p-10 mb-6 text-center cursor-pointer border border-white/10 hover:border-[#FF9500]/40 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" onChange={onFile} className="hidden" id="vesper-file" multiple />
          <label htmlFor="vesper-file" className="cursor-pointer block">
            <div className="text-neutral-500 text-sm mb-1">drag files into the dusk or click</div>
            <div className="text-xs text-neutral-600">multi-file · floating lanterns · discord embeds</div>
          </label>
        </div>

        {large && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-amber-400 text-xs mb-5">
            large drops in the vesper. the browser may feel slow while encoding or uploading. no hard limit.
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.04 }}
                  className="glass rounded-2xl px-4 py-3 flex items-center justify-between text-sm"
                  style={{ boxShadow: `0 0 20px ${color}22` }}
                >
                  <span className="truncate pr-4">{f.name}</span>
                  <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white text-xs">remove</button>
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
          <label className="text-xs text-neutral-400">dusk accent</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={shareAll}
          disabled={!files.length || status === 'uploading'}
          className="w-full py-3.5 rounded-full bg-[#FF9500] text-black font-medium disabled:opacity-50"
        >
          {status === 'uploading' ? 'rising…' : `publish ${files.length || ''} to vesper`}
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
                        className="text-xs text-[#FF9500]"
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

        {recent.length > 0 && (
          <div className="mt-16">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-4">recent shares in the dusk</p>
            <div className="grid gap-3">
              {recent.map((s) => (
                <a
                  key={s.id}
                  href={`/s/${s.id}`}
                  className="glass rounded-2xl p-4 text-sm hover:bg-white/5 transition block"
                >
                  <span className="truncate block">{s.name || s.caption || 'shared file'}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
