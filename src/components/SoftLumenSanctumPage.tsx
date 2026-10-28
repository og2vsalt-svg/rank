import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftLumenSanctumPage() {
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
    setWarn(big ? 'some files are chunky. encoding may feel slow. no hard limit.' : '');
  };

  const publish = async () => {
    if (files.length === 0 && !note.trim()) {
      setErr('drop a file or write a note for the sanctum');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const results: string[] = [];
      const toPublish = files.length > 0 ? files : [new File([note.trim()], (title.trim() || 'sanctum') + '.txt', { type: 'text/plain' })];
      for (const file of toPublish) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || title.trim() || 'soft lumen sanctum',
          cardTitle: title.trim() || file.name,
          color: '#AF52DE',
          meta: { desk: 'softlumensanctum', note: note.trim() },
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
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-10"
        >
          <p className="text-[#AF52DE] text-sm mb-2 tracking-wide font-medium">softlumensanctum</p>
          <h1 className="text-3xl md:text-4xl font-semibold mb-3 tracking-tight">a quiet sanctum of shared light</h1>
          <p className="text-neutral-400 text-sm mb-7 leading-relaxed">
            Soft light gathers in a still sanctum around multi-file drops or a quiet note. Each file settles into storage and the public_shares table. Share links unfurl with polished Discord cards. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="optional sanctum title"
            className="w-full mb-3 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#AF52DE]/40 transition"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional quiet note for the sanctum..."
            rows={4}
            className="w-full mb-5 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#AF52DE]/40 transition resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#AF52DE]/40 p-7 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready to settle` : 'drop or click for local files (multiple ok)'}
            </p>
          </label>
          {files.length > 0 && (
            <ul className="text-xs text-neutral-500 mb-4 space-y-1 max-h-32 overflow-auto">
              {files.map((f, i) => (
                <li key={i} className="truncate">{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</li>
              ))}
            </ul>
          )}
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={publish}
            disabled={busy}
            className="w-full py-3.5 rounded-full bg-[#AF52DE] text-white text-sm font-medium hover:bg-[#c06ae8] disabled:opacity-50 transition"
          >
            {busy ? 'settling into the sanctum…' : 'publish sanctum'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-xs text-neutral-400 space-y-1.5">
              <p className="text-neutral-300">share links (first copied to clipboard):</p>
              {links.map((l, i) => (
                <p key={i} className="break-all font-mono text-[11px]">{l}</p>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
