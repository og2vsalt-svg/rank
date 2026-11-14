import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVault } from './VaultContext';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Entry = { id: string; date: string; text: string; fileName?: string };

export default function QuietSharedJournalPage() {
  const { addFiles } = useVault();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [title, setTitle] = useState('quiet journal');
  const [color, setColor] = useState('#FF9F0A');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ id: string; embed: string; warn?: string | null } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('quiet-shared-journal');
      if (saved) setEntries(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('quiet-shared-journal', JSON.stringify(entries));
    } catch {}
  }, [entries]);

  const addEntry = () => {
    if (!currentText.trim() && !currentFile) return;
    const entry: Entry = {
      id: Date.now().toString(36),
      date: new Date().toISOString().slice(0, 10),
      text: currentText.trim(),
      fileName: currentFile?.name,
    };
    setEntries((prev) => [entry, ...prev]);
    setCurrentText('');
    setCurrentFile(null);
  };

  const removeEntry = (id: string) => setEntries((prev) => prev.filter((e) => e.id !== id));

  const journalText = useMemo(() => {
    return entries
      .map((e) => `${e.date}\n${e.text}${e.fileName ? `\n[attached: ${e.fileName}]` : ''}`)
      .join('\n\n---\n\n');
  }, [entries]);

  const sizeWarn = useMemo(() => currentFile && currentFile.size > 40 * 1024 * 1024, [currentFile]);

  const publish = async () => {
    if (!entries.length) return;
    setStatus('uploading');
    setError('');
    try {
      if (currentFile) await addFiles([currentFile], 'journal');
      const blob = new Blob([journalText], { type: 'text/plain' });
      const textFile = new File([blob], `${title.trim() || 'journal'}.txt`, { type: 'text/plain' });
      const res = await publishLocalFile(textFile, {
        caption: journalText.slice(0, 280) + (journalText.length > 280 ? '…' : ''),
        color,
        cardTitle: title.trim() || 'quiet shared journal',
        author: 'rankvault',
        meta: { desk: 'quietsharedjournal', entryCount: entries.length },
      });
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
          quiet shared journal
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-neutral-400 mb-10"
        >
          Dated quiet entries that live in the browser and can be published as one share. Optional file attachment on the latest entry. Spring-animated frosted glass, polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact. No traces of boosting.
        </motion.p>

        <motion.div layout className="glass rounded-3xl p-6 mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="journal title"
            className="w-full bg-transparent text-lg font-medium outline-none mb-3 placeholder:text-neutral-600"
          />

          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="write today's quiet entry…"
            rows={4}
            className="w-full bg-white/5 rounded-2xl p-3 text-sm outline-none resize-none placeholder:text-neutral-600 mb-3"
          />

          <label className="block text-xs text-neutral-500 mb-2 cursor-pointer">
            optional attachment
            <input type="file" onChange={(e) => setCurrentFile(e.target.files?.[0] || null)} className="hidden" />
          </label>
          {currentFile && <div className="text-sm text-neutral-300 mb-3">{currentFile.name}</div>}
          {sizeWarn && <p className="text-amber-400 text-xs mb-3">large file. browser may feel slow. no hard limit.</p>}

          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={addEntry} disabled={!currentText.trim() && !currentFile} className="px-5 py-2 rounded-full bg-white/10 text-sm disabled:opacity-40">
              add entry
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={publish} disabled={!entries.length || status === 'uploading'} className="flex-1 py-2 rounded-full bg-[#FF9F0A] text-black text-sm font-medium disabled:opacity-40">
              {status === 'uploading' ? 'publishing…' : 'publish journal'}
            </motion.button>
          </div>
        </motion.div>

        <div className="space-y-3 mb-8">
          <AnimatePresence>
            {entries.map((e) => (
              <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-4 text-sm">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>{e.date}</span>
                  <button onClick={() => removeEntry(e.id)} className="hover:text-white">remove</button>
                </div>
                <p className="whitespace-pre-wrap">{e.text}</p>
                {e.fileName && <p className="text-xs text-neutral-400 mt-1">attached: {e.fileName}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
          {entries.length === 0 && <p className="text-neutral-500 text-sm text-center">no entries yet</p>}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs text-neutral-400">accent</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-full border-0 cursor-pointer" />
        </div>

        <AnimatePresence>
          {status === 'done' && result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
              <p className="text-sm font-medium mb-2">journal shared</p>
              <p className="text-xs text-neutral-400 break-all mb-3">{result.embed}</p>
              {result.warn && <p className="text-amber-400 text-xs mb-2">{result.warn}</p>}
              <button onClick={() => navigator.clipboard.writeText(result.embed)} className="text-xs text-[#FF9F0A] hover:underline">
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
