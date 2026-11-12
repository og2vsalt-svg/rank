import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietRelayPage() {
  const { addFiles } = useVault();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'relaying' | 'done' | 'error'>('idle');
  const [current, setCurrent] = useState(0);
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

  const relayAll = async () => {
    if (!files.length) return;
    setStatus('relaying');
    setError('');
    setResults([]);
    setCurrent(0);
    try {
      await addFiles(files, 'relay');
      const out: typeof results = [];
      for (let i = 0; i < files.length; i++) {
        setCurrent(i);
        const file = files[i];
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
        setResults([...out]);
        await new Promise((r) => setTimeout(r, 400)); // gentle pause for animation
      }
      setStatus('done');
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  const large = files.some((f) => f.size > 40 * 1024 * 1024);
  const progress = files.length ? (current + (status === 'done' ? 1 : 0)) / files.length : 0;

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          quiet relay
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-8"
        >
          Sequential multi-file relay. Each file is shared one by one with a living progress pulse. Lands in the database with polished Discord embeds. Soft size warnings only. No hard limits.
        </motion.p>

        <motion.div
          className="glass rounded-3xl p-10 mb-6 text-center cursor-pointer border border-white/10 hover:border-white/25 transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
          whileHover={{ scale: 1.005 }}
          whileTap={{ scale: 0.995 }}
        >
          <input ref={inputRef} type="file" onChange={onFile} className="hidden" id="relay-file" multiple />
          <label htmlFor="relay-file" className="cursor-pointer block">
            <div className="text-neutral-400 text-sm mb-1">drop files here to relay</div>
            <div className="text-xs text-neutral-500">or click to browse · sequential share</div>
          </label>
        </motion.div>

        {large && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-amber-400 text-xs mb-4 px-1">
            large files detected. the relay may feel slow. no hard limit enforced.
          </motion.div>
        )}

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 space-y-2"
            >
              {files.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`glass rounded-2xl px-4 py-3 flex items-center justify-between text-sm ${status === 'relaying' && i === current ? 'ring-1 ring-[#0A84FF]' : ''}`}
                >
                  <span className="truncate max-w-[70%]">{f.name}</span>
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    <span>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    {status === 'idle' && <button onClick={() => remove(i)} className="text-neutral-500 hover:text-white">remove</button>}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {status === 'relaying' && (
          <motion.div className="mb-6">
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#0A84FF]"
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
              />
            </div>
            <p className="text-xs text-neutral-400 mt-2 text-center">relaying {current + 1} of {files.length}</p>
          </motion.div>
        )}

        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="optional caption for Discord cards"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none focus:border-white/30"
          disabled={status === 'relaying'}
        />

        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs text-neutral-400">accent color</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" disabled={status === 'relaying'} />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={relayAll}
          disabled={!files.length || status === 'relaying'}
          className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-50 transition"
        >
          {status === 'relaying' ? 'relaying to database…' : `relay ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
        </motion.button>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-3"
            >
              {results.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-4">
                  <p className="text-sm font-medium mb-1 truncate">{r.name}</p>
                  {r.embed ? (
                    <>
                      <p className="text-xs text-neutral-400 break-all mb-2">{r.embed}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(r.embed)}
                        className="text-xs text-[#0A84FF]"
                      >
                        copy embed link
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-red-400">{r.warn}</p>
                  )}
                  {r.warn && r.embed && <p className="text-amber-400 text-xs mt-1">{r.warn}</p>}
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
