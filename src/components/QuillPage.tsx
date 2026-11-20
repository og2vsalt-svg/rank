import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuillPage() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback((list: FileList | File[] | null) => {
    const f = list ? Array.from(list)[0] : null;
    setFile(f);
    if (f && f.size > 40 * 1024 * 1024) {
      setWarn('Large attachment — may feel slow while uploading. No hard limits.');
    } else {
      setWarn('');
    }
  }, []);

  const publish = useCallback(async () => {
    if (busy || (!note.trim() && !file)) {
      setErr('Write a note or attach a file');
      return;
    }
    setBusy(true);
    setErr('');
    setLink('');
    try {
      const caption = note.trim() || 'A quiet note from Quill';
      const cardTitle = title.trim() || (file ? file.name : 'quill note');
      let res;
      if (file) {
        res = await publishLocalFile(file, {
          caption,
          color: accent,
          cardTitle,
          meta: { desk: 'quill', note: note.trim() },
        });
      } else {
        const textFile = new File([note.trim()], (title.trim() || 'note') + '.txt', { type: 'text/plain' });
        res = await publishLocalFile(textFile, {
          caption,
          color: accent,
          cardTitle,
          meta: { desk: 'quill', wordCount: note.trim().split(/\s+/).filter(Boolean).length },
        });
      }
      if (!res.ok || !res.id) {
        setErr(res.error || 'Could not publish');
        return;
      }
      if (res.warn) setWarn(res.warn);
      const urls = shareUrls(res.id);
      setLink(urls.app);
      try { await navigator.clipboard.writeText(urls.app); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'Publish failed');
    } finally {
      setBusy(false);
    }
  }, [note, title, file, accent, busy]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quill</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Write quietly.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            A different desk. Compose a note, optionally attach a local file. It lands in the database with a polished Discord embed on the share link. Soft size warnings only — never hard limits. Apple-style springs on frosted glass.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional title"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30 transition"
          />

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your note…"
            rows={8}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none leading-relaxed"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              onFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-8 text-center mb-5 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">{file ? file.name : 'Optional local file'}</p>
            <p className="text-neutral-500 text-sm mt-1">Drop or click to attach</p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for the embed</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}
          {err && <p className="text-sm text-red-400 mb-4">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || (!note.trim() && !file)}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Publishing…' : 'Publish'}
          </motion.button>

          <AnimatePresence>
            {link && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 glass rounded-2xl p-4"
              >
                <p className="text-sm text-neutral-300 mb-1">Shared (copied)</p>
                <a href={link} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{link}</a>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
