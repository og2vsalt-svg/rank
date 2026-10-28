import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftLumenValePage() {
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onDrop = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((prev) => [...prev, ...next].slice(0, 16));
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. the vale may settle slowly. no hard limit.' : '');
  };

  const publish = async () => {
    if (files.length === 0 && !note.trim()) {
      setErr('drop a file or leave a quiet note');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const results: string[] = [];
      const toPublish = files.length > 0 ? files : [new File([note.trim()], (title.trim() || 'vale') + '.txt', { type: 'text/plain' })];
      for (const file of toPublish) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || title.trim() || 'soft lumen vale',
          cardTitle: title.trim() || file.name,
          meta: { desk: 'softlumenvale', note: note.trim() },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'could not settle one of the files');
          setBusy(false);
          return;
        }
        if (res.warn) setWarn(res.warn);
        const urls = shareUrls(res.id);
        results.push(urls.app);
      }
      setLinks(results);
      if (results[0]) {
        try { await navigator.clipboard.writeText(results[0]); } catch {}
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
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 95, damping: 24 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-[#0A84FF] text-sm mb-2 tracking-wide">soft lumen vale</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet vale of shared light</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Soft light gathers in a still vale around multi-file drops or a quiet note. Files land in storage and the share table. Share links unfurl with polished Discord cards. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="optional vale title"
            className="w-full mb-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional quiet note..."
            rows={3}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-6 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'drop or click for local files (multiple ok)'}
            </p>
          </label>
          {files.length > 0 && (
            <ul className="text-xs text-neutral-500 mb-4 space-y-1">
              {files.map((f, i) => (
                <li key={i}>{f.name}</li>
              ))}
            </ul>
          )}
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy}
            className="w-full py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#409CFF] disabled:opacity-50 transition"
          >
            {busy ? 'settling in the vale…' : 'publish vale'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>share links (first copied):</p>
              {links.map((l, i) => (
                <p key={i} className="break-all">{l}</p>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
