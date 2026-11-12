import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietFolioPage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles((prev) => {
      const next = [...prev, ...arr];
      arr.forEach((file, idx) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            setPreviews((p) => ({ ...p, [prev.length + idx]: reader.result as string }));
          };
          reader.readAsDataURL(file);
        }
      });
      return next;
    });
    setStatus('idle');
    setError('');
  }, []);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onDrop(e.target.files);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((p) => {
      const next = { ...p };
      delete next[idx];
      return next;
    });
  };

  const shareAll = async () => {
    if (!files.length) return;
    setStatus('uploading');
    setError('');
    setResults([]);
    try {
      await addFiles(files, 'folio');
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
    <div className="mesh min-h-screen pt-24 pb-16 px-5">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="text-center mb-10"
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-3">quiet folio</p>
          <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight mb-4">gather & share</h1>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Drop local files into a soft folio. Previews for images, spring-animated cards, batch publish to the database with polished Discord embeds. Soft size warnings only. No hard limits.
          </p>
        </motion.div>

        <motion.div
          className="glass apple-card rounded-3xl p-12 mb-8 text-center cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.995 }}
        >
          <input ref={inputRef} type="file" onChange={onFile} className="hidden" id="folio-file" multiple />
          <label htmlFor="folio-file" className="cursor-pointer block">
            <div className="text-neutral-300 text-base mb-2">drop files or click to browse</div>
            <div className="text-xs text-neutral-500">multiple files welcome · images show previews</div>
          </label>
        </motion.div>

        {large && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-amber-400 text-xs mb-6 text-center">
            large files detected. upload may feel slower. no hard limit enforced.
          </motion.div>
        )}

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 space-y-3"
            >
              {files.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  className="glass rounded-2xl p-4 flex items-center gap-4"
                >
                  {previews[i] ? (
                    <img src={previews[i]} alt="" className="w-12 h-12 object-cover rounded-xl" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xs text-neutral-400">file</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{f.name}</p>
                    <p className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button onClick={() => remove(i)} className="text-xs text-neutral-500 hover:text-white transition">remove</button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass rounded-3xl p-6 mb-8 space-y-4">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional shared caption for Discord cards"
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500"
          />
          <div className="flex items-center gap-4">
            <label className="text-xs text-neutral-400">accent</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={shareAll}
          disabled={!files.length || status === 'uploading'}
          className="w-full py-4 rounded-full bg-white text-black font-medium disabled:opacity-50 transition hover:bg-neutral-100"
        >
          {status === 'uploading' ? 'publishing to database…' : `publish ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
        </motion.button>

        <AnimatePresence>
          {status === 'done' && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 space-y-4"
            >
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass apple-card rounded-2xl p-5"
                >
                  <p className="text-sm font-medium text-white mb-2 truncate">{r.name}</p>
                  {r.embed ? (
                    <>
                      <p className="text-xs text-neutral-400 break-all mb-3">{r.embed}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(r.embed)}
                        className="text-xs text-[#0A84FF] hover:underline"
                      >
                        copy Discord embed link
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-red-400">{r.warn}</p>
                  )}
                  {r.warn && r.embed && <p className="text-amber-400 text-xs mt-2">{r.warn}</p>}
                </motion.div>
              ))}
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-red-400 text-sm text-center">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 text-center">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => window.history.back()}
            className="text-sm text-neutral-500 hover:text-white transition"
          >
            back
          </motion.button>
        </div>
      </div>
    </div>
  );
}
