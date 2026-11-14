import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useVault } from './VaultContext';

type Entry = {
  id: string;
  text: string;
  file: File | null;
  preview?: string;
};

export default function QuietCovePage() {
  const { addFiles } = useVault();
  const [entries, setEntries] = useState<Entry[]>([{ id: '1', text: '', file: null }]);
  const [sharedAccent, setSharedAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ title: string; embed: string; warn?: string | null }[]>([]);
  const [err, setErr] = useState('');

  const addEntry = () => {
    setEntries((prev) => [...prev, { id: Date.now().toString(36), text: '', file: null }]);
  };

  const updateEntry = (id: string, patch: Partial<Entry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => {
      const found = prev.find((e) => e.id === id);
      if (found?.preview) URL.revokeObjectURL(found.preview);
      return prev.filter((e) => e.id !== id);
    });
  };

  const onFile = (id: string, f: File | null) => {
    const entry = entries.find((e) => e.id === id);
    if (entry?.preview) URL.revokeObjectURL(entry.preview);
    const preview = f && f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined;
    updateEntry(id, { file: f, preview });
  };

  const publish = async () => {
    const valid = entries.filter((e) => e.text.trim() || e.file);
    if (!valid.length) return;
    setBusy(true);
    setErr('');
    setResults([]);
    try {
      const files = valid.map((e) => e.file).filter(Boolean) as File[];
      if (files.length) await addFiles(files, 'cove');
      const out: typeof results = [];
      for (const entry of valid) {
        let res;
        if (entry.file) {
          res = await publishLocalFile(entry.file, {
            caption: entry.text.trim() || undefined,
            color: sharedAccent,
            cardTitle: entry.file.name,
            author: 'rankvault',
            meta: { desk: 'quietcove' },
          });
        } else {
          const blob = new Blob([entry.text], { type: 'text/plain' });
          const textFile = new File([blob], 'cove-note.txt', { type: 'text/plain' });
          res = await publishLocalFile(textFile, {
            caption: entry.text.slice(0, 280),
            color: sharedAccent,
            cardTitle: 'Quiet Cove Note',
            author: 'rankvault',
            meta: { desk: 'quietcove' },
          });
        }
        if (res.ok && res.id) {
          const urls = shareUrls(res.id);
          out.push({ title: entry.file?.name || 'note', embed: urls.embed, warn: res.warn || null });
        } else {
          out.push({ title: entry.file?.name || 'note', embed: '', warn: res.error || 'failed' });
        }
      }
      setResults(out);
    } catch (e: any) {
      setErr(e?.message || 'something slowed');
    }
    setBusy(false);
  };

  const large = entries.some((e) => e.file && e.file.size > 40 * 1024 * 1024);

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-10"
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-3">quiet cove</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight mb-4">
            Gather notes<br />in a calm cove.
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed max-w-lg mx-auto">
            Collect several quiet notes, each with an optional local file and live preview. Batch-publish to the database. Every link carries a polished Discord embed. Soft size warnings only. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <AnimatePresence>
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 140, damping: 20 }}
              className="glass rounded-2xl p-5 mb-4"
            >
              <textarea
                value={entry.text}
                onChange={(e) => updateEntry(entry.id, { text: e.target.value })}
                placeholder="quiet note for this entry"
                rows={3}
                className="w-full bg-transparent outline-none resize-none text-sm mb-3 placeholder:text-neutral-600"
              />
              <div className="flex items-center gap-3">
                {entry.preview && <img src={entry.preview} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <label className="text-xs text-neutral-500 cursor-pointer">
                  {entry.file ? entry.file.name : 'optional file'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => onFile(entry.id, e.target.files?.[0] || null)}
                  />
                </label>
                {entries.length > 1 && (
                  <button onClick={() => removeEntry(entry.id)} className="ml-auto text-xs text-neutral-500 hover:text-white">
                    remove
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button onClick={addEntry} className="text-sm text-[#0A84FF] mb-6 hover:underline">
          + add another entry
        </button>

        {large && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300/90 text-xs mb-4 text-center">
            large file detected. the browser may feel slow. no hard limit.
          </motion.p>
        )}

        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs text-neutral-400">accent</label>
          <input
            type="color"
            value={sharedAccent}
            onChange={(e) => setSharedAccent(e.target.value)}
            className="w-9 h-9 rounded-full border-0 cursor-pointer"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={publish}
          disabled={busy || !entries.some((e) => e.text.trim() || e.file)}
          className="w-full py-3.5 rounded-full text-white font-medium disabled:opacity-40 transition shadow-lg"
          style={{ background: sharedAccent }}
        >
          {busy ? 'settling into the cove…' : 'publish collection'}
        </motion.button>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
              <p className="text-sm font-medium">shared from the cove</p>
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-2xl p-4"
                >
                  <p className="text-sm font-medium mb-1 truncate">{r.title}</p>
                  {r.embed ? (
                    <>
                      <p className="text-xs text-neutral-400 break-all mb-2">{r.embed}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(r.embed)}
                        className="text-xs"
                        style={{ color: sharedAccent }}
                      >
                        copy discord link
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-red-400">{r.warn}</p>
                  )}
                  {r.warn && r.embed && <p className="text-amber-300/80 text-xs mt-1">{r.warn}</p>}
                </motion.div>
              ))}
            </motion.div>
          )}
          {err && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-red-400">
              {err}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
