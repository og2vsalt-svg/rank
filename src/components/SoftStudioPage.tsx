import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Drop = {
  id: string;
  file: File;
  preview?: string;
  caption: string;
};

export default function SoftStudioPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ embed?: string; warn?: string | null; name: string }[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const next: Drop[] = [];
    Array.from(list).forEach((file) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const drop: Drop = { id, file, caption: '' };
      if (file.type.startsWith('image/')) {
        drop.preview = URL.createObjectURL(file);
      }
      next.push(drop);
    });
    setDrops((prev) => [...prev, ...next]);
  }, []);

  const remove = (id: string) => setDrops((d) => d.filter((x) => x.id !== id));

  const updateCaption = (id: string, caption: string) =>
    setDrops((d) => d.map((x) => (x.id === id ? { ...x, caption } : x)));

  const shareAll = async () => {
    if (!drops.length) return;
    setBusy(true);
    setResults([]);
    const out: typeof results = [];
    for (const d of drops) {
      const res = await publishLocalFile(d.file, {
        author,
        caption: d.caption || d.file.name,
        color: accent,
        cardTitle: d.caption || d.file.name,
        meta: { accent, source: 'softstudio', kind: d.file.type.split('/')[0] || 'file' },
      });
      if (res.ok && res.id) {
        out.push({
          embed: shareUrls(res.id).embed,
          warn: res.warn,
          name: d.file.name,
        });
      }
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
      <main className="mx-auto max-w-3xl px-5 pb-28 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <p className="text-[12px] uppercase tracking-[0.2em] text-white/40">soft studio</p>
          <h1 className="mt-2 text-[36px] font-semibold tracking-[-0.045em] leading-tight">
            compose what you carry.<br />share the studio.
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/65 max-w-xl">
            Drop one or many local files. Give each a quiet caption. They land in storage and the public_shares table.
            Every link unfurls a polished Discord card. Soft warning only if a drop may feel slow. No hard limits.
            Prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <div
          className="mt-10 glass rounded-[32px] p-8 text-center border border-white/10"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFiles(e.dataTransfer.files);
          }}
        >
          <input
            type="file"
            multiple
            className="hidden"
            id="studio-files"
            onChange={(e) => onFiles(e.target.files)}
          />
          <label htmlFor="studio-files" className="cursor-pointer block">
            <div className="text-[15px] text-white/70">drop files here or tap to choose</div>
            <div className="mt-2 text-[13px] text-white/40">images, audio, documents — anything</div>
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-11 w-16 rounded-xl border border-white/10 bg-transparent cursor-pointer"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="your name, optional"
            className="glass flex-1 min-w-[200px] rounded-2xl px-4 py-3 text-[14px] outline-none"
          />
        </div>

        <AnimatePresence>
          {drops.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.03 }}
              className="mt-5 glass rounded-[28px] p-5 flex gap-4 items-start"
            >
              {d.preview ? (
                <img src={d.preview} alt="" className="w-24 h-24 object-cover rounded-2xl shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white/5 grid place-items-center text-[12px] text-white/40 shrink-0">
                  {d.file.type.split('/')[0] || 'file'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white/50 truncate">{d.file.name}</p>
                <input
                  value={d.caption}
                  onChange={(e) => updateCaption(d.id, e.target.value)}
                  placeholder="caption for this drop"
                  className="mt-2 w-full bg-transparent text-[14.5px] outline-none placeholder:text-white/30"
                />
                <p className="mt-1 text-[12px] text-white/35">
                  {(d.file.size / 1024 / 1024).toFixed(1)} MB
                  {d.file.size > 40 * 1024 * 1024 ? ' · may feel slow' : ''}
                </p>
              </div>
              <button
                onClick={() => remove(d.id)}
                className="text-white/30 hover:text-white/70 text-[18px] leading-none"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {drops.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={shareAll}
            disabled={busy}
            className="mt-8 w-full rounded-full py-3.5 text-[15px] font-medium text-black disabled:opacity-50"
            style={{ background: accent }}
          >
            {busy ? 'filing the studio…' : `share ${drops.length} drop${drops.length > 1 ? 's' : ''}`}
          </motion.button>
        )}

        {results.length > 0 && (
          <div className="mt-8 space-y-3">
            {results.map((r) => (
              <motion.div
                key={r.embed}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[14px] truncate">{r.name}</p>
                  <p className="text-[12px] text-white/40 break-all mt-0.5">{r.embed}</p>
                  {r.warn && <p className="text-[11px] text-amber-200/70 mt-1">{r.warn}</p>}
                </div>
                <button
                  onClick={() => r.embed && copy(r.embed)}
                  className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[12px]"
                >
                  {copied === r.embed ? 'copied' : 'copy'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
