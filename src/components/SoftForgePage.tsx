import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Dropped = {
  file: File;
  note: string;
  preview?: string;
};

export default function SoftForgePage() {
  const [drops, setDrops] = useState<Dropped[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id?: string; embed?: string; error?: string; warn?: string | null; name: string }[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const onFiles = useCallback((list: FileList | File[]) => {
    const next: Dropped[] = Array.from(list).map((file) => {
      const item: Dropped = { file, note: '' };
      if (file.type.startsWith('image/')) {
        item.preview = URL.createObjectURL(file);
      }
      return item;
    });
    setDrops((prev) => [...prev, ...next]);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  };

  const updateNote = (i: number, note: string) => {
    setDrops((prev) => prev.map((d, idx) => (idx === i ? { ...d, note } : d)));
  };

  const remove = (i: number) => {
    setDrops((prev) => {
      const item = prev[i];
      if (item.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const forge = async () => {
    if (!drops.length) return;
    setBusy(true);
    setResults([]);
    const out: typeof results = [];
    for (const d of drops) {
      const caption = d.note.trim() || sharedNote.trim() || undefined;
      const res = await publishLocalFile(d.file, {
        author,
        caption,
        color,
        cardTitle: d.file.name,
        meta: { accent: color, source: 'softforge', kind: 'forge', note: d.note },
      });
      out.push({
        name: d.file.name,
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
      });
    }
    setResults(out);
    setBusy(false);
  };

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1400);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pb-28 pt-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/35">softforge</p>
          <h1 className="mt-2 text-[40px] font-semibold tracking-[-0.045em] leading-none">forge what you carry.</h1>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/60">
            Drop one or many local files. Add a quiet note to each, or a shared one. They land in storage and the public_shares table. Every link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="mt-10 glass rounded-[32px] p-8 text-center transition"
        >
          <p className="text-[15px] text-white/70">drop files here, or</p>
          <label className="mt-4 inline-block cursor-pointer rounded-full bg-white/10 px-5 py-2.5 text-[14px] font-medium hover:bg-white/15">
            choose from your machine
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && onFiles(e.target.files)}
            />
          </label>
          <p className="mt-3 text-[12px] text-white/35">images show a soft preview. everything else just waits.</p>
        </div>

        <AnimatePresence>
          {drops.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-3"
            >
              {drops.map((d, i) => (
                <motion.div
                  key={i}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass flex items-start gap-4 rounded-2xl p-4"
                >
                  {d.preview ? (
                    <img src={d.preview} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-xl bg-white/5 text-[11px] text-white/40">
                      {d.file.type.split('/')[0] || 'file'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{d.file.name}</p>
                    <p className="text-[12px] text-white/40">{(d.file.size / 1024 / 1024).toFixed(1)} MB</p>
                    <input
                      value={d.note}
                      onChange={(e) => updateNote(i, e.target.value)}
                      placeholder="quiet note for this file (optional)"
                      className="mt-2 w-full bg-transparent text-[13px] outline-none placeholder:text-white/30"
                    />
                  </div>
                  <button onClick={() => remove(i)} className="text-[12px] text-white/40 hover:text-white">
                    remove
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {drops.length > 0 && (
          <div className="mt-8 space-y-3">
            <input
              value={sharedNote}
              onChange={(e) => setSharedNote(e.target.value)}
              placeholder="shared note for the whole drop (optional)"
              className="glass w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none"
            />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="your name, optional"
              className="glass w-full rounded-2xl px-4 py-3.5 text-[14px] outline-none"
            />
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent"
              />
              <span className="text-[13px] text-white/50">accent that colors every card</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.965 }}
              whileHover={{ scale: 1.012 }}
              onClick={forge}
              disabled={busy}
              className="mt-4 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
              style={{ background: color }}
            >
              {busy ? 'forging…' : `forge ${drops.length} file${drops.length === 1 ? '' : 's'}`}
            </motion.button>
          </div>
        )}

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
            {results.map((r, i) => (
              <div key={i} className="glass rounded-2xl px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[14px]">{r.name}</p>
                  {r.embed && (
                    <button onClick={() => copy(r.embed!)} className="rounded-full bg-white/10 px-3 py-1 text-[12px]">
                      {copied === r.embed ? 'copied' : 'copy link'}
                    </button>
                  )}
                </div>
                {r.embed ? (
                  <p className="mt-2 break-all text-[12px] text-white/45">{r.embed}</p>
                ) : (
                  <p className="mt-2 text-[13px] text-red-300">{r.error || 'could not forge'}</p>
                )}
                {r.warn && <p className="mt-2 text-[12px] text-amber-200/80">{r.warn}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
