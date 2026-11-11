import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Entry = {
  id: string;
  title: string;
  note: string;
  fileName?: string;
  embed?: string;
  warn?: string | null;
  created: number;
};

export default function SoftQuietChroniclePage() {
  const { addFiles } = useVault();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((list: FileList | File[]) => {
    setFiles(Array.from(list));
    setStatus('idle');
    setError('');
  }, []);

  const publish = async () => {
    if (!title.trim() && !note.trim() && !files.length) return;
    setStatus('uploading');
    setError('');
    try {
      const file = files[0];
      let resultId = '';
      let embed = '';
      let warn: string | null = null;
      if (file) {
        await addFiles([file], 'chronicle');
        const res = await publishLocalFile(file, {
          caption: [title, note].filter(Boolean).join(' — ') || undefined,
          color,
          cardTitle: title || file.name,
          author: 'rankvault chronicle',
        });
        if (!res.ok || !res.id) {
          setError(res.error || 'upload failed');
          setStatus('error');
          return;
        }
        resultId = res.id;
        embed = shareUrls(res.id).embed;
        warn = res.warn || null;
      } else {
        // note-only as text file
        const blob = new Blob([`${title}\n\n${note}`], { type: 'text/plain' });
        const textFile = new File([blob], `${title || 'chronicle'}.txt`, { type: 'text/plain' });
        const res = await publishLocalFile(textFile, {
          caption: note || title,
          color,
          cardTitle: title || 'chronicle note',
          author: 'rankvault chronicle',
        });
        if (!res.ok || !res.id) {
          setError(res.error || 'upload failed');
          setStatus('error');
          return;
        }
        resultId = res.id;
        embed = shareUrls(res.id).embed;
        warn = res.warn || null;
      }
      setEntries((prev) => [
        {
          id: resultId,
          title: title || 'untitled',
          note,
          fileName: file?.name,
          embed,
          warn,
          created: Date.now(),
        },
        ...prev,
      ]);
      setTitle('');
      setNote('');
      setFiles([]);
      setStatus('done');
    } catch (e: any) {
      setError(e?.message || 'something went wrong');
      setStatus('error');
    }
  };

  const large = files.some((f) => f.size > 40 * 1024 * 1024);

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-16">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl font-semibold tracking-tight mb-2"
        >
          soft quiet chronicle
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-8"
        >
          Keep a quiet dated stream of notes and files. Each entry lands in the database with a polished Discord embed. Soft slow warnings only. No hard limits. All prior desks remain fully intact.
        </motion.p>

        <motion.div
          className="glass rounded-3xl p-6 mb-8"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="quiet title"
            className="w-full bg-transparent text-lg font-medium placeholder:text-neutral-500 outline-none mb-3"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a short note that travels with the share…"
            rows={3}
            className="w-full bg-transparent text-sm text-neutral-300 placeholder:text-neutral-600 outline-none resize-none mb-4"
          />
          <div
            className="border border-dashed border-white/10 rounded-2xl p-6 text-center text-sm text-neutral-400 mb-4 cursor-pointer hover:border-white/20 transition"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
            }}
          >
            {files.length ? files.map((f) => f.name).join(', ') : 'drop a file (optional) or click'}
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files && onDrop(e.target.files)} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-full border-0 bg-transparent" />
          </div>
          {large && (
            <p className="text-xs text-amber-400/80 mb-3">large drop. the browser may feel slow while it sends. no hard limit.</p>
          )}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={status === 'uploading'}
            className="w-full py-3 rounded-2xl bg-white text-black font-medium text-sm disabled:opacity-50"
          >
            {status === 'uploading' ? 'settling…' : 'publish to chronicle'}
          </motion.button>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </motion.div>

        <div className="space-y-3">
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass rounded-2xl p-4"
              >
                <p className="font-medium text-sm mb-1">{entry.title}</p>
                {entry.note && <p className="text-xs text-neutral-400 mb-2">{entry.note}</p>}
                {entry.fileName && <p className="text-xs text-neutral-500 mb-2">{entry.fileName}</p>}
                {entry.embed && (
                  <a href={entry.embed} className="text-xs text-[#0A84FF] break-all" target="_blank" rel="noreferrer">
                    {entry.embed}
                  </a>
                )}
                {entry.warn && <p className="text-[11px] text-amber-400/70 mt-1">{entry.warn}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
