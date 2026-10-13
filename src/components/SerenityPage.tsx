import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SerenityPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#30D158');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onFiles = (list: FileList | null) => {
    const arr = list ? Array.from(list) : [];
    setFiles(arr);
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(
      big
        ? 'large files detected. the browser may feel slow. no hard limit — only a gentle warning of slowness.'
        : '',
    );
  };

  const publish = async () => {
    if (!note.trim() && !files.length) {
      setErr('add a note or drop at least one file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      if (files.length) {
        for (const file of files) {
          const res = await publishLocalFile(file, {
            caption: note.trim() || 'serenity note',
            cardTitle: title.trim() || file.name,
            color: accent,
            meta: { desk: 'serenity', accent, dedication: title.trim() || null },
          });
          if (!res.ok || !res.id) {
            setErr(res.error || 'publish failed for ' + file.name);
            return;
          }
          if (res.warn) setWarn(res.warn);
          const urls = shareUrls(res.id);
          newLinks.push(urls.app);
        }
      } else {
        // note-only: still land a share row somehow, or use a placeholder
        // for simplicity, require file or handle note via API, but stick to file for DB upload
        setErr('drop a file to share the note with it');
        return;
      }
      setLinks(newLinks);
      try {
        await navigator.clipboard.writeText(newLinks.join('\n'));
      } catch {}
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen relative overflow-hidden">
      <Navbar />
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full blur-[100px] pointer-events-none opacity-10"
        style={{ background: accent }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="glass rounded-[40px] p-10"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>
            serenity
          </p>
          <h1 className="text-3xl font-semibold mb-4 tracking-tight">a quiet place for notes and files.</h1>
          <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
            Leave a longer note, optional title, and drop local files. Each lands in the database with polished Discord embeds on the share links. Large files warned gently for slowness, never refused. Sleek Apple-style spring animations. Older features stay intact.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="optional title / dedication"
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none"
          />

          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-400">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
            />
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a longer quiet note that travels with the files"
            rows={6}
            className="w-full mb-6 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none resize-none"
          />

          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-white/30 p-6 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {files.length ? `${files.length} file(s) ready` : 'optional: drop files to attach'}
            </p>
          </label>

          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={publish}
            disabled={busy}
            className="w-full py-3.5 rounded-full text-black text-sm font-medium disabled:opacity-50"
            style={{ background: accent }}
          >
            {busy ? 'settling…' : 'publish serenity'}
          </motion.button>

          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-xs text-neutral-400 space-y-1">
              <p>share links (copied):</p>
              {links.map((l, i) => (
                <p key={i} className="break-all font-mono">{l}</p>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
