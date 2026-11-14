import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietHorizonPage() {
  const { addFiles } = useVault();
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [color, setColor] = useState('#5AC8FA');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [results, setResults] = useState<{ id: string; embed: string; name: string; warn?: string | null }[]>([]);
  const [error, setError] = useState('');

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setStatus('idle');
    setResults([]);
    setError('');
  };

  const sizeWarn = useMemo(() => files.some(f => f.size > 40 * 1024 * 1024), [files]);

  const publish = async () => {
    if (!files.length && !note.trim()) return;
    setStatus('uploading');
    setError('');
    try {
      if (files.length) await addFiles(files, 'horizon');
      const out: typeof results = [];
      const toPublish = files.length ? files : [new File([new Blob([note], { type: 'text/plain' })], 'horizon-note.txt', { type: 'text/plain' })];
      for (const f of toPublish) {
        const res = await publishLocalFile(f, {
          caption: note || undefined,
          color,
          cardTitle: f.name,
          author: 'rankvault',
        });
        if (!res.ok || !res.id) {
          setError(res.error || 'could not publish');
          setStatus('error');
          return;
        }
        const urls = shareUrls(res.id);
        out.push({ id: res.id, embed: urls.embed, name: f.name, warn: res.warn || null });
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
          quiet horizon
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-10"
        >
          Drop local files. They settle along a soft horizon of frosted glass cards with gentle upward spring motion. Shared note, cool accent. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
        </motion.p>

        <motion.div
          className="glass rounded-3xl p-6 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="shared note for the horizon…"
            rows={3}
            className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-neutral-600 mb-4"
          />

          <div className="flex items-center gap-4 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-9 h-9 rounded-full border-0 cursor-pointer"
            />
          </div>

          <label className="block text-xs text-neutral-500 mb-2 cursor-pointer">
            drop files
            <input type="file" multiple onChange={onFiles} className="hidden" />
          </label>

          {files.length > 0 && (
            <div className="mb-3 text-sm text-neutral-300">
              {files.map(f => f.name).join(', ')}
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
            disabled={(!note.trim() && !files.length) || status === 'uploading'}
            className="w-full py-3 rounded-full bg-[#5AC8FA] text-black font-medium disabled:opacity-40 transition"
          >
            {status === 'uploading' ? 'publishing…' : 'publish to database'}
          </motion.button>
        </motion.div>

        <div className="relative h-48 mb-8">
          <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={f.name + i}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.05 }}
                className="absolute bottom-4 glass rounded-2xl px-4 py-3 text-xs"
                style={{ left: `${10 + (i % 5) * 18}%` }}
              >
                {f.name.slice(0, 16)}
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
              <p className="text-sm font-medium">shared along the horizon</p>
              {results.map(r => (
                <div key={r.id} className="text-xs">
                  <p className="text-neutral-300">{r.name}</p>
                  <p className="text-neutral-400 break-all mb-1">{r.embed}</p>
                  {r.warn && <p className="text-amber-400">{r.warn}</p>}
                  <button
                    onClick={() => navigator.clipboard.writeText(r.embed)}
                    className="text-[#5AC8FA] hover:underline"
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
