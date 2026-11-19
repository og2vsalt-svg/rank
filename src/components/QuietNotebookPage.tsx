import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Attachment = { file: File; id: string; preview?: string };

export default function QuietNotebookPage() {
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [accent, setAccent] = useState('#5E5CE6');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ link: string; name: string }[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0) + attachments.reduce((s, a) => s + a.file.size, 0);
    setWarn(total > 45_000_000 ? 'Large collection — uploads may feel slower. No hard limits.' : null);
    const next: Attachment[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setAttachments((p) => [...p, ...next]);
  }, [attachments]);

  const publish = async () => {
    if (busy) return;
    setBusy(true);
    setResults([]);
    const published: { link: string; name: string }[] = [];

    // Publish the note as a text file if present
    if (note.trim()) {
      const noteFile = new File([note.trim()], 'notebook-note.txt', { type: 'text/plain' });
      try {
        const res = await publishLocalFile(noteFile, {
          caption: note.trim().slice(0, 120),
          color: accent,
          cardTitle: 'Quiet notebook entry',
          meta: { desk: 'notebook', kind: 'note' },
        });
        if (res.ok && res.embed) published.push({ link: res.embed, name: 'note' });
      } catch {}
    }

    // Publish each attachment
    for (const att of attachments) {
      try {
        const res = await publishLocalFile(att.file, {
          caption: note.trim().slice(0, 80) || att.file.name,
          color: accent,
          cardTitle: att.file.name,
          meta: { desk: 'notebook', kind: 'attachment' },
        });
        if (res.ok && res.embed) published.push({ link: res.embed, name: att.file.name });
      } catch {}
    }

    setResults(published);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Notebook</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Write, then share.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            A still surface for longer notes. Attach local files if the words need company. The note and each file settle independently into the database with polished Discord embeds on every link. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your quiet note…"
            rows={8}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-4 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition resize-none leading-relaxed"
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-8 text-center mb-6 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Attach files (optional)</p>
            <p className="text-neutral-500 text-sm mt-1">drop or click</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          <AnimatePresence>
            {attachments.map((att) => (
              <motion.div
                key={att.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass rounded-2xl p-3 flex items-center gap-3 mb-2"
              >
                {att.preview ? (
                  <img src={att.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-white/5 grid place-items-center text-[10px] text-neutral-500">file</div>
                )}
                <p className="text-sm truncate flex-1">{att.file.name}</p>
                <button onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))} className="text-xs text-neutral-500 hover:text-white">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex items-center gap-3 my-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy || (!note.trim() && !attachments.length)}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : 'Share notebook'}
          </motion.button>

          {results.length > 0 && (
            <div className="mt-6 space-y-2">
              {results.map((r, i) => (
                <div key={i} className="glass rounded-xl p-3">
                  <p className="text-xs text-neutral-500">{r.name}</p>
                  <a href={r.link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{r.link}</a>
                </div>
              ))}
              <p className="text-xs text-neutral-500">Each link carries a polished Discord embed.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
