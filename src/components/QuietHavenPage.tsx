import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietHavenPage() {
  const { addFiles } = useVault();
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [color, setColor] = useState('#5AC8FA');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ id: string; embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ''));
    setStatus('idle');
    setResult(null);
    setError('');
  };

  const sizeWarn = useMemo(() => file && file.size > 40 * 1024 * 1024, [file]);

  const publish = async () => {
    if (!note.trim() && !file) return;
    setStatus('uploading');
    setError('');
    try {
      if (file) await addFiles([file], 'haven');
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption: note || undefined,
          color,
          cardTitle: title.trim() || file.name,
          author: 'rankvault',
        });
      } else {
        // pure note: create a small text file
        const blob = new Blob([note], { type: 'text/plain' });
        const textFile = new File([blob], `${title.trim() || 'note'}.txt`, { type: 'text/plain' });
        res = await publishLocalFile(textFile, {
          caption: note,
          color,
          cardTitle: title.trim() || 'quiet haven',
          author: 'rankvault',
        });
      }
      if (!res.ok || !res.id) {
        setError(res.error || 'could not publish');
        setStatus('error');
        return;
      }
      const urls = shareUrls(res.id);
      setResult({ id: res.id, embed: urls.embed, warn: res.warn || null });
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
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2"
        >
          quiet haven
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-10"
        >
          A still place for a short note or a single local file. Soft glass, spring motion, polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.
        </motion.p>

        <motion.div
          layout
          className="glass rounded-3xl p-6 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="title (optional)"
            className="w-full bg-transparent text-lg font-medium outline-none mb-3 placeholder:text-neutral-600"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="write a quiet note…"
            rows={5}
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
            optional file
            <input type="file" onChange={onFile} className="hidden" />
          </label>
          {file && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-neutral-300 mb-3">
              {file.name}
            </motion.div>
          )}

          {sizeWarn && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400 text-xs mb-3">
              large file. the browser may feel slow while uploading. no hard limit.
            </motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={(!note.trim() && !file) || status === 'uploading'}
            className="w-full py-3 rounded-full bg-[#5AC8FA] text-black font-medium disabled:opacity-40 transition"
          >
            {status === 'uploading' ? 'publishing…' : 'publish to database'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {status === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5"
            >
              <p className="text-sm font-medium mb-2">shared from the haven</p>
              <p className="text-xs text-neutral-400 break-all mb-3">{result.embed}</p>
              {result.warn && <p className="text-amber-400 text-xs mb-2">{result.warn}</p>}
              <button
                onClick={() => navigator.clipboard.writeText(result.embed)}
                className="text-xs text-[#5AC8FA] hover:underline"
              >
                copy discord link
              </button>
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
