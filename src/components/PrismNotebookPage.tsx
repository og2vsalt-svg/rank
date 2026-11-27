import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Entry = {
  id: string;
  text: string;
  file?: File;
  published?: { id: string; url: string; warn?: string };
};

export default function PrismNotebookPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('quiet notebook');
  const [accent, setAccent] = useState('#0A84FF');
  const [entries, setEntries] = useState<Entry[]>([{ id: '1', text: '' }]);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<{ url: string; warn?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const addEntry = () => setEntries(e => [...e, { id: Date.now().toString(36), text: '' }]);

  const updateEntry = (id: string, patch: Partial<Entry>) =>
    setEntries(e => e.map(x => x.id === id ? { ...x, ...patch } : x));

  const removeEntry = (id: string) => setEntries(e => e.filter(x => x.id !== id));

  const publishNotebook = useCallback(async () => {
    setPublishing(true);
    setError(null);
    setResult(null);
    try {
      const lines = [`# ${title}\n\n`, ...entries.map((e, i) => {
        let line = `## Entry ${i + 1}\n\n${e.text || '(empty)'}\n\n`;
        if (e.published) line += `Shared file: ${e.published.url}\n\n`;
        return line;
      })].join('');
      const blob = new Blob([lines], { type: 'text/markdown' });
      const file = new File([blob], `${title.replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'notebook'}.md`, { type: 'text/markdown' });
      const pub = await publishLocalFile(file, {
        caption: `Prism Notebook · ${entries.length} entries`,
        cardTitle: title,
        color: accent,
      });
      if (pub.ok && pub.id) {
        setResult({ url: shareUrls(pub.id).embed, warn: pub.warn || undefined });
      } else {
        setError(pub.error || 'could not publish notebook');
      }
    } catch (e: any) {
      setError(e?.message || 'publish failed');
    }
    setPublishing(false);
  }, [title, accent, entries]);

  const publishFileForEntry = async (entry: Entry) => {
    if (!entry.file) return;
    const pub = await publishLocalFile(entry.file, {
      caption: entry.text || 'from Prism Notebook',
      cardTitle: entry.file.name,
      color: accent,
    });
    if (pub.ok && pub.id) {
      updateEntry(entry.id, { published: { id: pub.id, url: shareUrls(pub.id).embed, warn: pub.warn || undefined } });
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 18 }} className="mb-10">
          <p className="text-[#0A84FF] text-sm tracking-wide mb-2">prism notebook</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3">a quiet sequence of thoughts.</h1>
          <p className="text-neutral-400 leading-relaxed">Add entries, optionally attach local files (they upload to the share database), then publish the whole notebook as one permanent Discord-ready markdown link. Soft size warnings only — no hard limits, no boosting. Apple-style springs on frosted glass. Prior desks remain untouched.</p>
        </motion.div>

        <div className="glass rounded-3xl p-6 mb-8 space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent text-2xl font-medium placeholder:text-neutral-600 focus:outline-none" placeholder="notebook title" />
          <div className="flex items-center gap-3">
            <label className="text-xs text-neutral-500">accent</label>
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-8 h-8 rounded-full border border-white/10 bg-transparent cursor-pointer" />
          </div>
        </div>

        <div className="space-y-5 mb-8">
          <AnimatePresence>
            {entries.map((entry, i) => (
              <motion.div key={entry.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 160, damping: 20 }} className="glass rounded-2xl p-5">
                <textarea value={entry.text} onChange={e => updateEntry(entry.id, { text: e.target.value })} placeholder={`entry ${i + 1}`} className="w-full bg-transparent text-sm leading-relaxed placeholder:text-neutral-600 focus:outline-none resize-none min-h-[80px]" />
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => fileRefs.current[i]?.click()} className="text-xs text-neutral-400 hover:text-white transition">attach file</button>
                    <input ref={el => fileRefs.current[i] = el} type="file" className="hidden" onChange={e => e.target.files?.[0] && updateEntry(entry.id, { file: e.target.files[0] })} />
                    {entry.file && <span className="text-xs text-neutral-500 truncate max-w-[140px]">{entry.file.name}</span>}
                    {entry.file && !entry.published && (
                      <button onClick={() => publishFileForEntry(entry)} className="text-xs text-[#0A84FF] hover:underline">publish file</button>
                    )}
                    {entry.published && <span className="text-xs text-emerald-400">shared</span>}
                  </div>
                  {entries.length > 1 && <button onClick={() => removeEntry(entry.id)} className="text-xs text-neutral-600 hover:text-red-400">remove</button>}
                </div>
                {entry.published?.warn && <p className="text-xs text-amber-400 mt-2">{entry.published.warn}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap gap-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={addEntry} className="px-5 py-2.5 rounded-full bg-white/10 text-sm font-medium hover:bg-white/15 transition">add entry</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={publishNotebook} disabled={publishing} className="px-6 py-2.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50">
            {publishing ? 'publishing…' : 'publish notebook'}
          </motion.button>
        </div>

        {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 mt-6">{error}</motion.p>}

        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 glass rounded-2xl p-5">
            <p className="text-sm mb-2">notebook published</p>
            {result.warn && <p className="text-xs text-amber-400 mb-2">{result.warn}</p>}
            <button onClick={() => navigator.clipboard.writeText(result.url)} className="text-xs px-4 py-2 rounded-full bg-[#0A84FF] text-white">copy Discord-ready link</button>
          </motion.div>
        )}

        <button onClick={() => navigate('home')} className="mt-10 text-sm text-neutral-500 hover:text-white transition">← back home</button>
      </div>
    </div>
  );
}
