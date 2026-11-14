import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietNadirPage() {
  const { addFiles } = useVault();
  const [sharedNote, setSharedNote] = useState('');
  const [files, setFiles] = useState<{ file: File; note: string; color: string }[]>([]);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<{ id: string; embed: string; name: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles(list.map((f, i) => ({
      file: f,
      note: '',
      color: ['#1C1C1E', '#2C2C2E', '#3A3A3C', '#48484A', '#636366'][i % 5],
    })));
    setStatus('idle');
    setResults([]);
    setError('');
  };

  const updateNote = (idx: number, note: string) => {
    setFiles(prev => prev.map((item, i) => i === idx ? { ...item, note } : item));
  };

  const sizeWarn = useMemo(() => files.some(f => f.file.size > 40 * 1024 * 1024), [files]);

  const publish = async () => {
    if (!files.length && !sharedNote.trim()) return;
    setStatus('uploading');
    setError('');
    try {
      if (files.length) await addFiles(files.map(f => f.file), 'nadir');
      const out: typeof results = [];
      const toPublish = files.length
        ? files
        : [{ file: new File([new Blob([sharedNote], { type: 'text/plain' })], 'nadir-note.txt', { type: 'text/plain' }), note: sharedNote, color: '#2C2C2E' }];
      for (const item of toPublish) {
        const caption = [sharedNote, item.note].filter(Boolean).join(' \u2014 ') || undefined;
        const res = await publishLocalFile(item.file, {
          caption,
          color: item.color,
          cardTitle: item.file.name,
          author: 'rankvault',
          meta: { desk: 'quietnadir' },
        });
        if (!res.ok || !res.id) {
          setError(res.error || 'could not publish');
          setStatus('error');
          return;
        }
        const urls = shareUrls(res.id);
        out.push({ id: res.id, embed: urls.embed, name: item.file.name, warn: res.warn || null });
      }
      setResults(out);
      setStatus('done');
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20 overflow-hidden">
      <div className="max-w-3xl mx-auto relative">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2"
        >
          quiet nadir
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-10"
        >
          Drop local files. They settle downward into the quiet depth as still frosted glass stones with gentle spring motion. Individual notes or a shared caption. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
        </motion.p>

        <motion.div
          className="glass rounded-3xl p-6 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <textarea
            value={sharedNote}
            onChange={(e) => setSharedNote(e.target.value)}
            placeholder="shared note for the nadir…"
            rows={2}
            className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-neutral-600 mb-4"
          />

          <label className="block text-xs text-neutral-500 mb-2 cursor-pointer">
            drop files
            <input type="file" multiple onChange={onFiles} className="hidden" />
          </label>

          {files.length > 0 && (
            <div className="space-y-3 mb-4">
              {files.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                  <span className="text-neutral-300 truncate flex-1">{item.file.name}</span>
                  <input
                    value={item.note}
                    onChange={(e) => updateNote(i, e.target.value)}
                    placeholder="quiet note…"
                    className="bg-transparent text-xs outline-none placeholder:text-neutral-600 flex-1"
                  />
                </div>
              ))}
            </div>
          )}

          {sizeWarn && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400 text-xs mb-3">
              large files. the browser may feel slow while uploading. no hard limit.
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={(!sharedNote.trim() && !files.length) || status === 'uploading'}
            className="w-full py-3 rounded-full bg-[#3A3A3C] text-white font-medium disabled:opacity-40 transition"
          >
            {status === 'uploading' ? 'settling…' : 'publish to database'}
          </motion.button>
        </motion.div>

        <div className="relative h-56 mb-8">
          <AnimatePresence>
            {files.map((item, i) => (
              <motion.div
                key={item.file.name + i}
                initial={{ opacity: 0, y: -40, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 90, damping: 18, delay: i * 0.07 }}
                className="absolute glass rounded-2xl px-4 py-3 text-xs"
                style={{
                  left: `${6 + (i % 5) * 18}%`,
                  bottom: `${8 + Math.floor(i / 5) * 28}%`,
                  background: `${item.color}33`,
                }}
              >
                {item.file.name.slice(0, 14)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {status === 'done' && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 space-y-3"
            >
              <p className="text-sm font-medium">settled in the nadir</p>
              {results.map(r => (
                <div key={r.id} className="text-xs">
                  <p className="text-neutral-300">{r.name}</p>
                  <p className="text-neutral-400 break-all mb-1">{r.embed}</p>
                  {r.warn && <p className="text-amber-400">{r.warn}</p>}
                  <button
                    onClick={() => navigator.clipboard.writeText(r.embed)}
                    className="text-[#8E8E93] hover:underline"
                  >
                    copy discord link
                  </button>
                </div>
              ))}
            </motion.div>
          )}
          {status === 'error' && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
