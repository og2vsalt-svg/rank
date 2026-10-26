import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Entry = {
  id: string;
  date: string;
  note: string;
  fileName?: string;
  embed?: string;
  color: string;
};

export default function SoftLumenJournalPage() {
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const raw = localStorage.getItem('softlumenjournal');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [accent, setAccent] = useState('#A78BFA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    localStorage.setItem('softlumenjournal', JSON.stringify(entries));
  }, [entries]);

  const onFile = (list: FileList | null) => {
    if (!list || !list[0]) return;
    const f = list[0];
    setFile(f);
    setWarn(f.size > 40 * 1024 * 1024 ? 'This file is large. The upload may feel slow. No hard limit — only a gentle warning.' : null);
  };

  const addEntry = async () => {
    if (!note.trim() && !file) return setErr('add a note or drop a file');
    setBusy(true);
    setErr('');
    let embed: string | undefined;
    let fileName: string | undefined;
    if (file) {
      const res = await publishLocalFile(file, {
        caption: note.trim() || 'from the softlumenjournal',
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'softlumenjournal', entry: true },
      });
      if (res.ok && res.embed) {
        embed = res.embed;
        fileName = file.name;
      } else {
        setErr(res.error || 'upload slowed');
        setBusy(false);
        return;
      }
    } else if (note.trim()) {
      const textFile = new File([note.trim()], `journal-${Date.now()}.txt`, { type: 'text/plain' });
      const res = await publishLocalFile(textFile, {
        caption: note.trim(),
        color: accent,
        cardTitle: 'journal entry',
        meta: { desk: 'softlumenjournal', noteOnly: true },
      });
      if (res.ok && res.embed) embed = res.embed;
    }
    const entry: Entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: new Date().toLocaleString(),
      note: note.trim(),
      fileName,
      embed,
      color: accent,
    };
    setEntries((prev) => [entry, ...prev]);
    setNote('');
    setFile(null);
    setWarn(null);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 sm:p-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>softlumenjournal</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">A quiet journal of shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Leave dated entries with notes and optional local files. Each settles into the journal in your accent color, like quiet pages finding their place. Files (or note-only entries) upload to storage and public_shares. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Journal note…"
            rows={4}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files); }}
            className="border-2 border-dashed border-white/15 rounded-[20px] p-6 text-center mb-4 hover:border-white/25 transition cursor-pointer"
            onClick={() => document.getElementById('journal-input')?.click()}
          >
            <p className="text-neutral-300 text-[14px]">{file ? file.name : 'Optional file (drag or click)'}</p>
            <input id="journal-input" type="file" className="hidden" onChange={(e) => onFile(e.target.files)} />
          </div>

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">accent color</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={addEntry}
            disabled={busy || (!note.trim() && !file)}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the journal…' : 'Add to journal'}
          </motion.button>

          {err && <p className="mt-4 text-[12px] text-red-400">{err}</p>}
        </motion.div>

        <div className="mt-10 space-y-4">
          <AnimatePresence>
            {entries.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 110, damping: 18, delay: i * 0.03 }}
                className="glass rounded-[22px] p-5 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: e.color }} />
                <p className="text-[12px] text-neutral-500 mb-1">{e.date}</p>
                {e.note && <p className="text-[15px] text-neutral-200 mb-2 whitespace-pre-wrap">{e.note}</p>}
                {e.fileName && <p className="text-[13px] text-neutral-400">file: {e.fileName}</p>}
                {e.embed && (
                  <a href={e.embed} className="block mt-2 text-[12px] break-all" style={{ color: e.color }}>{e.embed}</a>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
