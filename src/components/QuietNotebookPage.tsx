import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Entry = { id: string; note: string; file: File | null; title: string };

export default function QuietNotebookPage() {
  const [entries, setEntries] = useState<Entry[]>([{ id: '1', note: '', file: null, title: '' }]);
  const [color, setColor] = useState('#0A84FF');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; embed: string; title: string; warn?: string | null }[]>([]);

  const addEntry = () => setEntries((p) => [...p, { id: Date.now().toString(), note: '', file: null, title: '' }]);

  const update = (id: string, patch: Partial<Entry>) =>
    setEntries((p) => p.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const publishAll = async () => {
    const valid = entries.filter((e) => e.note.trim() || e.file);
    if (!valid.length || status === 'uploading') return;
    setStatus('uploading');
    const next: typeof results = [];
    for (const e of valid) {
      let res;
      if (e.file) {
        res = await publishLocalFile(e.file, {
          caption: e.note || undefined,
          color,
          cardTitle: e.title.trim() || e.file.name,
          author: 'rankvault',
        });
      } else {
        const blob = new Blob([e.note], { type: 'text/plain' });
        const textFile = new File([blob], `${e.title.trim() || 'note'}.txt`, { type: 'text/plain' });
        res = await publishLocalFile(textFile, {
          caption: e.note,
          color,
          cardTitle: e.title.trim() || 'notebook entry',
          author: 'rankvault',
        });
      }
      if (res.ok && res.id) {
        next.push({
          id: res.id,
          embed: shareUrls(res.id).embed,
          title: e.title || e.file?.name || 'note',
          warn: res.warn || (e.file && e.file.size > 40 * 1024 * 1024 ? 'large file — may feel slow' : null),
        });
      }
    }
    setResults(next);
    setEntries([{ id: Date.now().toString(), note: '', file: null, title: '' }]);
    setStatus('done');
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
          quiet notebook
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-10"
        >
          Keep multiple quiet entries. Compose notes or drop local files. They settle as soft pages on frosted glass with spring motion. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.
        </motion.p>

        <AnimatePresence>
          {entries.map((entry, idx) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 110, damping: 18 }}
              className="glass rounded-3xl p-5 mb-4"
            >
              <input
                value={entry.title}
                onChange={(e) => update(entry.id, { title: e.target.value })}
                placeholder={`entry ${idx + 1} title`}
                className="w-full bg-transparent text-base font-medium outline-none mb-2 placeholder:text-neutral-600"
              />
              <textarea
                value={entry.note}
                onChange={(e) => update(entry.id, { note: e.target.value })}
                placeholder="write a quiet note…"
                rows={4}
                className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-neutral-600 mb-3"
              />
              <label className="block text-xs text-neutral-500 mb-1 cursor-pointer">
                optional file
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => update(entry.id, { file: e.target.files?.[0] || null })}
                />
              </label>
              {entry.file && <p className="text-xs text-neutral-300 mb-2">{entry.file.name}</p>}
              {entry.file && entry.file.size > 40 * 1024 * 1024 && (
                <p className="text-amber-400 text-xs">large file. may feel slow. no hard limit.</p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="flex items-center gap-4 mb-6">
          <button onClick={addEntry} className="text-sm text-[#0A84FF] hover:underline">+ add entry</button>
          <label className="text-xs text-neutral-500 flex items-center gap-2">
            accent
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 rounded-full border-0 cursor-pointer" />
          </label>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={publishAll}
          disabled={status === 'uploading' || !entries.some((e) => e.note.trim() || e.file)}
          className="w-full py-3 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-40 transition"
        >
          {status === 'uploading' ? 'publishing…' : 'publish notebook to database'}
        </motion.button>

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 mt-6">
            <p className="text-sm font-medium mb-3">notebook shares</p>
            {results.map((r) => (
              <div key={r.id} className="mb-3 last:mb-0">
                <p className="text-sm">{r.title}</p>
                <button onClick={() => navigator.clipboard.writeText(r.embed)} className="text-xs text-[#0A84FF] hover:underline">copy discord link</button>
                {r.warn && <p className="text-amber-400 text-xs mt-1">{r.warn}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
