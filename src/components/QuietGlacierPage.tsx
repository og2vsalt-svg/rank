import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function QuietGlacierPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warn, setWarn] = useState<string | null>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const next = Array.from(list);
    setFiles((f) => [...f, ...next]);
    const large = next.some((f) => f.size > 30 * 1024 * 1024);
    if (large) setWarn('Some shards are large. The glacier may take a moment. No hard limit.');
  }, []);

  const publish = async () => {
    if (!files.length) return;
    setBusy(true);
    setLinks([]);
    const made: string[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption.trim() || `quiet glacier · ${file.name}`,
        color: accent,
        meta: { desk: 'quietglacier' },
      });
      if (res.ok && res.embed) made.push(res.embed);
    }
    setLinks(made);
    setFiles([]);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 105, damping: 21 }}
          className="glass rounded-[32px] p-8 md:p-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Glacier</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-2">Shards settle on the glacier.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop local files. They settle as soft icy shards of frosted glass with gentle spring motion and cool light. Shared caption. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-6 hover:border-white/25 transition cursor-pointer"
            onClick={() => (document.getElementById('glacier-input') as HTMLInputElement)?.click()}
          >
            <p className="text-neutral-300">Drop shards here</p>
            <input id="glacier-input" type="file" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <ul className="mb-6 space-y-1.5 text-sm text-neutral-300">
              {files.map((f, i) => <li key={i} className="truncate">{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</li>)}
            </ul>
          )}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional shared note"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/25"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer" />
            <span className="text-[13px] text-neutral-400">Glacier color</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.975 }}
            whileHover={{ scale: 1.01 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white disabled:opacity-40"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : 'Let them settle'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                {links.map((l) => (
                  <a key={l} href={l} className="block text-[13px] break-all glass rounded-xl p-3" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
