import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function NotesVaultPage() {
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [links, setLinks] = useState<{name: string; link: string}[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0) + (note.length * 2);
    setWarn(total > 40_000_000 ? 'Large note or files — may take a moment. No hard limits.' : null);
    setFiles(arr);
  }, [note]);

  const publish = async () => {
    if ((!note.trim() && !files.length) || busy) return;
    setBusy(true);
    setLinks([]);
    const created: {name: string; link: string}[] = [];

    // pure note as text file if no files
    if (note.trim() && !files.length) {
      const blob = new Blob([note], { type: 'text/plain' });
      const file = new File([blob], 'note.txt', { type: 'text/plain' });
      const res = await publishLocalFile(file, {
        caption: note.slice(0, 120),
        color: accent,
        cardTitle: 'Quiet Note',
        meta: { desk: 'notesvault' },
      });
      if (res.ok && res.embed) created.push({ name: 'note.txt', link: res.embed });
    } else {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || file.name,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'notesvault', note: note.slice(0, 200) },
        });
        if (res.ok && res.embed) created.push({ name: file.name, link: res.embed });
      }
    }

    setLinks(created);
    setBusy(false);
    const list = await listPublicShares(8);
    setRecent(list);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
          className="glass rounded-[32px] p-8 md:p-10 mb-8"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Notes Vault</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">Write. Attach. Share.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            A quiet desk for notes and optional files. Pure text becomes a shareable file. Everything lands in the database with polished Discord embeds. Soft warnings only.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet note…"
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[15px] text-white placeholder:text-neutral-500 resize-none h-32 mb-4 focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex flex-wrap gap-3 items-center mb-4">
            <label className="flex items-center gap-2 text-sm text-neutral-300 cursor-pointer">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-8 h-8 rounded-full border-0 cursor-pointer"
              />
              accent
            </label>
            <button
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-sm transition"
            >
              attach files
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => e.target.files && onFiles(e.target.files)}
            />
            {files.length > 0 && (
              <span className="text-xs text-neutral-500">{files.length} file{files.length > 1 ? 's' : ''}</span>
            )}
          </div>

          {warn && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-amber-400/80 mb-4">
              {warn}
            </motion.p>
          )}

          <button
            onClick={publish}
            disabled={busy || (!note.trim() && !files.length)}
            className="px-6 py-3 rounded-full bg-[#0A84FF] hover:bg-[#0A84FF]/90 disabled:opacity-40 text-white text-sm font-medium transition shadow-lg shadow-blue-500/20"
          >
            {busy ? 'sharing…' : 'share quietly'}
          </button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 space-y-2"
              >
                {links.map((l) => (
                  <div key={l.link} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2 text-sm">
                    <span className="truncate text-neutral-300">{l.name}</span>
                    <a href={l.link} target="_blank" rel="noreferrer" className="text-[#0A84FF] hover:underline">open</a>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {recent.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">recent</p>
            {recent.map((r) => (
              <div key={r.id} className="glass rounded-2xl px-4 py-3 text-sm flex justify-between">
                <span className="truncate">{r.caption || r.name}</span>
                <span className="text-neutral-500 text-xs">{new Date(r.createdAt || '').toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
