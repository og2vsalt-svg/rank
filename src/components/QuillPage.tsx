import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuillPage() {
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const onDrop = (list: FileList | null) => {
    const f = list?.[0] || null;
    setFile(f);
    if (f && f.size > 40 * 1024 * 1024) {
      setWarn('chunky attachment. encoding may feel slow. no hard limit.');
    } else {
      setWarn('');
    }
  };

  const publish = async () => {
    if (!note.trim() && !file) {
      setErr('write a note or attach a file');
      return;
    }
    setBusy(true);
    setErr('');
    setLink('');
    try {
      let id: string | undefined;
      if (file) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'quill note',
          cardTitle: title.trim() || file.name,
          meta: { desk: 'quill', note: note.trim() },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'could not publish');
          return;
        }
        if (res.warn) setWarn(res.warn);
        id = res.id;
      } else {
        // text-only: create a tiny text file
        const blob = new File([note.trim()], (title.trim() || 'note') + '.txt', { type: 'text/plain' });
        const res = await publishLocalFile(blob, {
          caption: note.trim(),
          cardTitle: title.trim() || 'quill',
          meta: { desk: 'quill' },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'could not publish note');
          return;
        }
        id = res.id;
      }
      if (id) {
        const urls = shareUrls(id);
        setLink(urls.app);
        try { await navigator.clipboard.writeText(urls.app); } catch {}
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0A84FF] text-sm mb-2 tracking-wide">quill</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">ink a note. optional file.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Write a short line or attach a local file. Bytes land in storage and the share table. Discord unfurls the link with a clean card. Large files get a slowness warning, never refused. Human-crafted Apple-smooth motion.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="optional title"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="the note..."
            rows={4}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-6 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">{file ? file.name : 'optional local file (click or drop)'}</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy}
            className="w-full py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] disabled:opacity-50 transition"
          >
            {busy ? 'inking…' : 'publish quill'}
          </motion.button>
          {link && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 break-all">
              share link (copied): {link}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
