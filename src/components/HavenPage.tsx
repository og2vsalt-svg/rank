import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function HavenPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onFiles = (list: FileList | null) => {
    const arr = list ? Array.from(list) : [];
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'one or more large files. browser may slow while sending. no hard limit — just a gentle warning.' : '');
  };

  const publish = async () => {
    if (!files.length) {
      setErr('drop at least one file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'haven collection',
          cardTitle: file.name,
          meta: { desk: 'haven', collectionNote: note.trim() || null },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'publish failed for ' + file.name);
          return;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id);
        newLinks.push(urls.app);
      }
      setLinks(newLinks);
      try { await navigator.clipboard.writeText(newLinks.join('\n')); } catch {}
    } catch (e: any) {
      setErr(e?.message || 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
          className="glass rounded-[32px] p-8 relative overflow-hidden"
        >
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#0A84FF]/12 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#AF52DE]/10 rounded-full blur-3xl pointer-events-none" />
          <p className="text-[#0A84FF] text-sm mb-2 tracking-wide">haven</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet harbor for several files.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop one or more local files. Each lands in storage and the share table with a shared note. Links carry polished Discord embeds. Soft warning for large files only. All prior desks and features remain intact.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional shared note for the collection"
            rows={3}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/40 transition resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            <p className="text-sm text-neutral-300">{files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop or click for one or more files'}</p>
          </label>
          <AnimatePresence>
            {files.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 space-y-1 text-xs text-neutral-400"
              >
                {files.map((f, i) => (
                  <li key={i} className="truncate">{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] disabled:opacity-50 transition"
          >
            {busy ? 'mooring…' : 'publish haven'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>copied share links:</p>
              {links.map((l, i) => <p key={i} className="break-all">{l}</p>)}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
