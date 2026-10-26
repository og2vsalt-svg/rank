import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, shareUrls, type CloudMeta } from '../lib/cloudShare';

export default function SoftNoteDeskPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#A78BFA');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id: string; embed: string; name: string; warn?: string | null; caption?: string }[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    listPublicShares(16).then(setRecent).catch(() => {});
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files);
    if (list.length) setFiles((p) => [...list, ...p].slice(0, 8));
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (list.length) setFiles((p) => [...list, ...p].slice(0, 8));
  };

  const share = async () => {
    if (!files.length && !note.trim()) return;
    setBusy(true);
    setMsg('');
    const next: typeof results = [];
    const filesToShare = files.length ? files : [new File([note || 'quiet note'], 'note.txt', { type: 'text/plain' })];
    for (const file of filesToShare) {
      const warn = file.size > 40 * 1024 * 1024 ? 'large file — may feel slow while uploading. no hard limit.' : null;
      const res = await publishLocalFile(file, { caption: note || undefined, color: accent, author: 'rankvault' });
      if (res.ok && res.id && res.embed) {
        next.push({ id: res.id, embed: res.embed, name: file.name, warn: res.warn || warn, caption: note });
      } else {
        setMsg(res.error || 'upload failed');
      }
    }
    setResults((p) => [...next, ...p]);
    setFiles([]);
    setNote('');
    setBusy(false);
    if (next.length) listPublicShares(16).then(setRecent).catch(() => {});
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[32px] p-8 mb-8"
        >
          <p className="text-[#a78bfa] text-sm tracking-wide mb-1">softnotedesk</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">a quiet desk for notes and light.</h1>
          <p className="text-neutral-400 text-sm mb-6">leave a note, attach local files if you wish. they settle into the public record with polished Discord embeds. soft spring motion. large files receive only a gentle warning. no hard limits.</p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a quiet note..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-white/20 mb-4 min-h-[80px] resize-none"
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center mb-6 cursor-pointer hover:bg-white/[0.04] transition"
            onClick={() => document.getElementById('note-pick')?.click()}
          >
            <input id="note-pick" type="file" multiple className="hidden" onChange={onPick} />
            <p className="text-neutral-300 text-sm">drop files here or click (optional)</p>
            <p className="text-xs text-neutral-500 mt-1">any size · up to eight</p>
          </div>

          {files.length > 0 && (
            <ul className="space-y-2 mb-6">
              {files.map((f, i) => (
                <li key={i} className="flex items-center justify-between text-sm bg-white/[0.03] rounded-2xl px-4 py-2">
                  <span className="truncate">{f.name}</span>
                  <span className="text-neutral-500 text-xs">{(f.size / 1024 / 1024).toFixed(1)} mb</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-3 mb-6 items-center">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-12 h-10 rounded-2xl bg-transparent border border-white/10 cursor-pointer"
            />
            <span className="text-xs text-neutral-500">accent</span>
          </div>

          <button
            onClick={share}
            disabled={busy || (!files.length && !note.trim())}
            className="w-full rounded-2xl bg-white text-black font-medium py-3 text-sm disabled:opacity-40 transition active:scale-[0.98]"
          >
            {busy ? 'settling…' : 'leave on the desk'}
          </button>
          {msg && <p className="text-amber-300/80 text-xs mt-3">{msg}</p>}
        </motion.div>

        <AnimatePresence>
          {results.map((r) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="glass rounded-3xl p-5 mb-3"
              style={{ borderColor: accent + '33' }}
            >
              <p className="text-sm font-medium truncate">{r.name}</p>
              {r.caption && <p className="text-xs text-neutral-400 mt-1">{r.caption}</p>}
              <a href={r.embed} className="text-[#a78bfa] text-xs break-all hover:underline">{r.embed}</a>
              {r.warn && <p className="text-xs text-amber-300/70 mt-1">{r.warn}</p>}
            </motion.div>
          ))}
        </AnimatePresence>

        {recent.length > 0 && (
          <div className="mt-10">
            <p className="text-neutral-500 text-xs mb-3 uppercase tracking-wider">recent notes</p>
            <div className="space-y-3">
              {recent.map((s) => (
                <motion.a
                  key={s.id}
                  href={shareUrls(s.id).embed}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass rounded-2xl p-4 block hover:bg-white/[0.06] transition"
                >
                  <p className="text-sm truncate">{s.name || 'untitled'}</p>
                  <p className="text-xs text-neutral-500 mt-1">{s.caption || 'quiet note'}</p>
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
