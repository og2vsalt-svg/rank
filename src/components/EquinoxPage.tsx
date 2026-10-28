import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function EquinoxPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [theme, setTheme] = useState<'day' | 'night'>('day');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const accent = theme === 'day' ? '#FFD60A' : '#0A84FF';

  const onDrop = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((prev) => [...prev, ...next].slice(0, 16));
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are chunky. encoding may feel slow. no hard limit.' : '');
  };

  const remove = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const publish = async () => {
    if (files.length === 0) {
      setErr('drop at least one local file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const made: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || `${theme} equinox`,
          cardTitle: title.trim() || file.name,
          color: accent,
          meta: { desk: 'equinox', theme, note: note.trim(), title: title.trim() },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || `failed on ${file.name}`);
          break;
        }
        if (res.warn) setWarn(res.warn);
        made.push(shareUrls(res.id).app);
      }
      setLinks(made);
      if (made[0]) {
        try { await navigator.clipboard.writeText(made.join('\n')); } catch {}
      }
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 16 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>equinox</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">balance of light. many files.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Choose day or night balance. Drop several local files. Each becomes its own share in storage and the public table, lit with your chosen accent and optional title. Share links unfurl with polished Discord cards. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact.
          </p>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setTheme('day')}
              className={`px-4 py-2 rounded-full text-sm transition ${
                theme === 'day' ? 'bg-yellow-400 text-black' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              day
            </button>
            <button
              type="button"
              onClick={() => setTheme('night')}
              className={`px-4 py-2 rounded-full text-sm transition ${
                theme === 'night' ? 'bg-blue-500 text-white' : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
            >
              night
            </button>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="optional shared title…"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional note for every equinox…"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/40 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">drop or click for local files (up to sixteen)</p>
          </label>
          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={f.name + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between text-xs text-neutral-400 mb-1 px-1"
              >
                <span className="truncate max-w-[70%]">{f.name}</span>
                <button type="button" onClick={() => remove(i)} className="text-neutral-500 hover:text-white">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>
          {warn && <p className="text-xs text-amber-300/80 mb-3 mt-2">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy || files.length === 0}
            className="w-full py-3 rounded-full text-black text-sm font-medium disabled:opacity-50 transition mt-2"
            style={{ background: accent }}
          >
            {busy ? 'balancing…' : 'publish equinox'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>share links (copied):</p>
              {links.map((l) => (
                <div key={l} className="break-all">{l}</div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
