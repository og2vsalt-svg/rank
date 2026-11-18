import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

function pretty(n: number) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return Math.max(1, Math.round(n / 1024)) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

export default function QuietEchoesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; note: string }[]>([]);
  const [err, setErr] = useState('');

  const onDrop = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    if (arr.some((f) => f.size > 40 * 1024 * 1024)) {
      setWarn('large echoes — the browser may feel slow while it encodes and sends. no hard limit.');
    } else {
      setWarn('');
    }
    setFiles((prev) => [...prev, ...arr]);
    setErr('');
  }, []);

  const updateNote = (idx: number, note: string) => {
    setNotes((prev) => ({ ...prev, [idx]: note }));
  };

  const remove = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setNotes((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const publishEchoes = async () => {
    if (!files.length) return;
    setBusy(true);
    setErr('');
    const out: typeof results = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const note = notes[i] || '';
        const res = await publishLocalFile(file, {
          caption: note || undefined,
          cardTitle: file.name,
          meta: { desk: 'quietechoes', echoNote: note },
        });
        if (res.ok && res.id) {
          out.push({
            id: res.id,
            name: file.name,
            embed: shareUrls(res.id).embed,
            note,
          });
        } else {
          setErr(res.error || `failed on ${file.name}`);
        }
      }
      setResults(out);
      setFiles([]);
      setNotes({});
    } catch (e: any) {
      setErr(e?.message || 'echo failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        >
          <p className="text-[#64D2FF] text-sm font-medium mb-2 tracking-wide">quiet echoes</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-3">send a quiet echo.</h1>
          <p className="text-neutral-400 text-base mb-8 max-w-xl leading-relaxed">
            Drop local files. Add a personal note to each. They publish independently to the database with polished Discord embeds on every link. Soft size warnings only. No hard limits. Sleek spring motion on frosted glass.
          </p>

          <motion.label
            whileHover={{ y: -2 }}
            className="block cursor-pointer rounded-[28px] glass p-10 mb-6 border border-dashed border-white/15 hover:border-[#64D2FF]/40 transition"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => e.target.files && onDrop(e.target.files)} disabled={busy} />
            <p className="text-white font-medium text-lg">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop files here'}</p>
            <p className="text-sm text-neutral-500 mt-2">each becomes its own echo with a note</p>
          </motion.label>

          {warn && <p className="text-sm text-amber-300/90 mb-4">{warn}</p>}
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}

          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={f.name + f.size + i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="glass rounded-2xl p-4 mb-3"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-[11px] text-neutral-500">{pretty(f.size)}</p>
                  </div>
                  <button onClick={() => remove(i)} className="text-xs text-neutral-500 hover:text-white">remove</button>
                </div>
                <textarea
                  value={notes[i] || ''}
                  onChange={(e) => updateNote(i, e.target.value)}
                  placeholder="quiet note for this echo…"
                  rows={2}
                  className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm outline-none border border-white/5 resize-none"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {files.length > 0 && (
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={publishEchoes}
              disabled={busy}
              className="w-full py-3.5 rounded-full bg-white text-black font-medium text-sm mt-4 disabled:opacity-50"
            >
              {busy ? 'sending echoes…' : `publish ${files.length} echo${files.length > 1 ? 'es' : ''}`}
            </motion.button>
          )}

          {results.length > 0 && (
            <div className="mt-10 space-y-4">
              <h2 className="text-lg font-medium">your echoes</h2>
              {results.map((r) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass rounded-2xl p-5"
                >
                  <p className="text-sm font-medium">{r.name}</p>
                  {r.note && <p className="text-xs text-neutral-400 mt-1">{r.note}</p>}
                  <p className="text-xs text-[#64D2FF] mt-3 break-all">{r.embed}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.embed)}
                    className="mt-2 text-xs text-neutral-400 hover:text-white"
                  >
                    copy discord link
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          <p className="mt-16 text-center text-xs text-neutral-600">all prior features preserved. this is simply another surface for noted shares.</p>
        </motion.div>
      </div>
    </div>
  );
}
