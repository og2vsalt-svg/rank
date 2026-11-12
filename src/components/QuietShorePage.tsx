import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import Navbar from './Navbar';

export default function QuietShorePage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');
  const [publicShares, setPublicShares] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listPublicShares(36).then(setPublicShares).catch(() => {});
  }, []);

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
      await addFiles(files, 'drops');
      const out: typeof results = [];
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption || undefined,
          color,
          cardTitle: file.name,
          author: 'rankvault',
          meta: { source: 'quietshore' },
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
      listPublicShares(36).then(setPublicShares).catch(() => {});
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  const large = files.some((f) => f.size > 40 * 1024 * 1024);

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-8 px-5 pb-16 relative overflow-hidden">
      <Navbar />
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]">
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#5AC8FA]/20 to-transparent" />
        <div className="absolute bottom-20 left-1/4 w-96 h-32 bg-[#5AC8FA]/10 blur-3xl rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative pt-20">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet shore
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-8 max-w-2xl"
        >
          Multi-file drop that washes files onto a soft shore of spring-animated frosted glass cards. Live public shares gather like gentle waves beside your drops. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits.
        </motion.p>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          <div>
            {publicShares.length > 0 && (
              <div className="mb-10">
                <h2 className="text-sm font-medium text-white/60 mb-4">shore waves</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {publicShares.slice(0, 12).map((s, i) => (
                    <motion.a
                      key={s.id}
                      href={shareUrls(s.id).embed}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 18 }}
                      className="glass rounded-2xl p-3 block hover:bg-white/[0.06] transition"
                    >
                      <div className="text-xs font-medium truncate">{s.name || s.id.slice(0, 8)}</div>
                      <div className="text-[10px] text-neutral-500 mt-1">{s.caption ? s.caption.slice(0, 40) : 'washed ashore'}</div>
                    </motion.a>
                  ))}
                </div>
              </div>
            )}

            <motion.div
              className="glass rounded-3xl p-10 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/25"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
              }}
              whileHover={{ scale: 1.004, y: -2 }}
              whileTap={{ scale: 0.996 }}
            >
              <input ref={inputRef} type="file" onChange={onFile} className="hidden" id="shore-file" multiple />
              <label htmlFor="shore-file" className="cursor-pointer block">
                <div className="text-neutral-400 text-sm mb-1">drop files onto the shore</div>
                <div className="text-xs text-neutral-500">or click · multiple welcome</div>
              </label>
            </motion.div>

            {large && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-amber-400 text-xs mb-4 px-1">
                large files detected. the browser may feel slow while encoding or uploading. no hard limit.
              </motion.div>
            )}

            {files.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {files.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 130, damping: 16, delay: i * 0.06 }}
                    className="glass rounded-2xl p-4 relative group"
                    style={{ borderColor: color + '50' }}
                  >
                    <div className="text-sm font-medium truncate mb-1">{f.name}</div>
                    <div className="text-[10px] text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</div>
                    <button
                      onClick={() => remove(i)}
                      className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/10 text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-3xl p-5 h-fit">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="optional caption for Discord cards"
              className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30 bg-white/5"
            />

            <div className="flex items-center gap-3 mb-6">
              <label className="text-xs text-neutral-400">accent</label>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={shareAll}
              disabled={!files.length || status === 'uploading'}
              className="w-full py-3.5 rounded-full bg-[#5AC8FA] text-black font-medium disabled:opacity-50"
            >
              {status === 'uploading' ? 'washing onto shore…' : `wash ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
            </motion.button>

            <AnimatePresence>
              {status === 'done' && results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 space-y-3"
                >
                  {results.map((r, i) => (
                    <div key={i} className="glass rounded-2xl p-3 text-xs">
                      <p className="font-medium mb-1 truncate">{r.name}</p>
                      {r.embed ? (
                        <>
                          <p className="text-neutral-400 break-all mb-1 text-[10px]">{r.embed}</p>
                          <button
                            onClick={() => navigator.clipboard.writeText(r.embed)}
                            className="text-[#5AC8FA]"
                          >
                            copy embed
                          </button>
                        </>
                      ) : (
                        <p className="text-red-400">{r.warn}</p>
                      )}
                      {r.warn && r.embed && <p className="text-amber-400 text-[10px] mt-1">{r.warn}</p>}
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
      </div>
    </div>
  );
}
