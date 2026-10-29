import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftLumenVistaPage() {
  const [note, setNote] = useState('');
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onDrop = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((prev) => [...prev, ...next].slice(0, 16));
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. the upload may feel slow. no hard limit is enforced.' : '');
  };

  const publish = async () => {
    if (files.length === 0 && !note.trim()) {
      setErr('drop a local file or write a note for the vista');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const results: string[] = [];
      const toPublish = files.length > 0 ? files : [new File([note.trim()], (title.trim() || 'vista-note') + '.txt', { type: 'text/plain' })];
      for (const file of toPublish) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || title.trim() || 'soft lumen vista',
          cardTitle: title.trim() || file.name,
          color: accent,
          meta: { desk: 'softlumenvista', note: note.trim(), accent },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || 'could not publish one of the files');
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
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[36px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>softlumenvista</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a quiet vista of shared light</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop local files or write a note. Each becomes its own share under a soft vista, tinted with your chosen accent. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>
          <div className="flex gap-3 mb-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="optional vista title"
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition"
            />
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-12 h-12 rounded-2xl bg-transparent border border-white/10 cursor-pointer"
              title="accent color"
            />
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional shared note..."
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
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready for the vista` : 'drop or click for local files (multiple ok)'}
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
            whileTap={{ scale: 0.96 }}
            onClick={publish}
            disabled={busy}
            className="w-full py-3 rounded-full text-white text-sm font-medium transition disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {busy ? 'settling into the vista…' : 'publish vista'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>share links (first copied to clipboard):</p>
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
