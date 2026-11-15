import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useVault } from './VaultContext';

type Entry = {
  id: string;
  title: string;
  body: string;
  file?: File;
  preview?: string;
};

export default function QuietCodexPage() {
  const { addFiles } = useVault();
  const [entries, setEntries] = useState<Entry[]>([
    { id: '1', title: '', body: '' },
  ]);
  const [codexTitle, setCodexTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ title: string; embed: string; warn?: string | null }[]>([]);
  const [err, setErr] = useState('');
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const addEntry = () => {
    setEntries((prev) => [...prev, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title: '', body: '' }]);
  };

  const update = (id: string, patch: Partial<Entry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const remove = (id: string) => {
    setEntries((prev) => {
      const found = prev.find((e) => e.id === id);
      if (found?.preview) URL.revokeObjectURL(found.preview);
      return prev.filter((e) => e.id !== id);
    });
  };

  const attachFile = (id: string, file: File) => {
    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
    update(id, { file, preview });
  };

  const publish = async () => {
    const valid = entries.filter((e) => e.title.trim() || e.body.trim() || e.file);
    if (!valid.length) return;
    setBusy(true);
    setErr('');
    setResults([]);
    try {
      const files = valid.filter((e) => e.file).map((e) => e.file!);
      if (files.length) await addFiles(files, 'codex');
      const out: typeof results = [];
      for (const entry of valid) {
        let res;
        if (entry.file) {
          res = await publishLocalFile(entry.file, {
            caption: entry.body.trim() || undefined,
            cardTitle: entry.title.trim() || entry.file.name,
            author: 'rankvault',
            meta: { desk: 'quietcodex', codex: codexTitle.trim() || 'codex' },
          });
        } else {
          // text-only entry: publish as a small text file
          const blob = new Blob([entry.body || entry.title || 'note'], { type: 'text/plain' });
          const file = new File([blob], (entry.title.trim() || 'entry') + '.txt', { type: 'text/plain' });
          res = await publishLocalFile(file, {
            caption: entry.body.trim() || entry.title.trim(),
            cardTitle: entry.title.trim() || 'codex entry',
            author: 'rankvault',
            meta: { desk: 'quietcodex', codex: codexTitle.trim() || 'codex' },
          });
        }
        if (res.ok && res.id) {
          const urls = shareUrls(res.id);
          out.push({ title: entry.title.trim() || entry.file?.name || 'entry', embed: urls.embed, warn: res.warn || null });
        } else {
          out.push({ title: entry.title || 'entry', embed: '', warn: res.error || 'failed' });
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
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-3">quiet codex</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight mb-4">
            Gather notes.<br />Bind them softly.
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed max-w-lg mx-auto">
            A still codex for sequenced entries. Each may hold a title, body, and optional local file. Publish the whole set to the database; every link unfurls a polished Discord embed. Large files are only warned. All earlier desks remain fully intact.
          </p>
        </motion.div>

        <input
          value={codexTitle}
          onChange={(e) => setCodexTitle(e.target.value)}
          placeholder="optional codex title"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-6 outline-none"
        />

        <AnimatePresence>
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 140, damping: 20 }}
              className="glass rounded-[24px] p-5 mb-4"
            >
              <div className="flex justify-between items-start mb-3">
                <input
                  value={entry.title}
                  onChange={(e) => update(entry.id, { title: e.target.value })}
                  placeholder="entry title"
                  className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-neutral-500"
                />
                <button onClick={() => remove(entry.id)} className="text-neutral-500 hover:text-white text-xs ml-2">
                  remove
                </button>
              </div>
              <textarea
                value={entry.body}
                onChange={(e) => update(entry.id, { body: e.target.value })}
                placeholder="quiet note or body text…"
                rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-white/20 mb-3 resize-none"
              />
              {entry.file ? (
                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  {entry.preview && <img src={entry.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                  <span className="truncate flex-1">{entry.file.name}</span>
                  <button onClick={() => update(entry.id, { file: undefined, preview: undefined })} className="text-neutral-500">clear</button>
                </div>
              ) : (
                <button
                  onClick={() => fileRefs.current[entry.id]?.click()}
                  className="text-xs text-[#0A84FF]"
                >
                  attach local file (optional)
                </button>
              )}
              <input
                ref={(el) => { fileRefs.current[entry.id] = el; }}
                type="file"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && attachFile(entry.id, e.target.files[0])}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <button onClick={addEntry} className="w-full glass rounded-2xl py-3 text-sm text-neutral-300 mb-6 hover:bg-white/5 transition">
          add another entry
        </button>

        {large && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300/90 text-xs mb-4 text-center">
            large drop detected. the browser may feel slow while it encodes or uploads. no hard limit.
          </motion.p>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          onClick={publish}
          disabled={busy || !entries.some((e) => e.title.trim() || e.body.trim() || e.file)}
          className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white font-medium disabled:opacity-40 transition shadow-lg"
        >
          {busy ? 'binding into the database…' : 'publish codex'}
        </motion.button>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
              <p className="text-sm font-medium">bound</p>
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
                        className="text-xs text-[#0A84FF]"
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
