import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietGalleryPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#0A84FF');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [gallery, setGallery] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(36).then(setGallery).catch(() => setGallery([]));
  }, []);

  const onDrop = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((prev) => [...prev, ...next].slice(0, 12));
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. the upload may feel slow. no hard limit.' : '');
  };

  const remove = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const publish = async () => {
    if (files.length === 0) {
      setErr('drop at least one local file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const made: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'quiet gallery',
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'quietgallery', note: note.trim() },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || `failed on ${file.name}`);
          break;
        }
        if (res.warn) setWarn(res.warn);
        made.push(shareUrls(res.id).app);
      }
      setLinks(made);
      if (made[0]) {
        try { await navigator.clipboard.writeText(made.join('\n')); } catch {}
      }
      // refresh gallery
      listPublicShares(36).then(setGallery).catch(() => {});
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 16 }}
          className="glass rounded-[32px] p-8 mb-10"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>quiet gallery</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a living gallery of shared light.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop local files with a shared note and accent. They land in storage and the public_shares table. Recent public drops surface here as quiet glass cards that settle with spring motion. Every share link unfurls a polished Discord card. Large drops receive only a gentle warning of possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional note for the gallery…"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">drop or click for local files</p>
          </label>
          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div
                key={f.name + i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between text-xs text-neutral-400 mb-1 px-1"
              >
                <span className="truncate max-w-[70%]">{f.name}</span>
                <button type="button" onClick={() => remove(i)} className="text-neutral-500 hover:text-white">remove</button>
              </motion.div>
            ))}
          </AnimatePresence>
          {warn && <p className="text-xs text-amber-300/80 mb-3 mt-2">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy || files.length === 0}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition mt-2"
            style={{ background: accent }}
          >
            {busy ? 'settling…' : 'add to gallery'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>share links (copied):</p>
              {links.map((l) => (
                <div key={l} className="break-all">{l}</div>
              ))}
            </motion.div>
          )}
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item, i) => (
            <motion.a
              key={item.id}
              href={shareUrls(item.id).app}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 18 }}
              className="glass rounded-2xl p-4 block hover:bg-white/[0.07] transition overflow-hidden"
            >
              <div className="h-32 rounded-xl mb-3 flex items-center justify-center" style={{ background: item.color || '#0A84FF20' }}>
                <span className="text-xs text-neutral-300 truncate px-2">{item.name}</span>
              </div>
              <p className="text-sm font-medium truncate">{item.cardTitle || item.name}</p>
              {item.caption && <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{item.caption}</p>}
              <p className="text-[10px] text-neutral-500 mt-2">{item.size ? `${(item.size / 1024 / 1024).toFixed(1)} MB` : ''}</p>
            </motion.a>
          ))}
        </div>
        {gallery.length === 0 && (
          <p className="text-center text-neutral-500 text-sm mt-8">the gallery is quiet for now. drop something above.</p>
        )}
      </div>
    </div>
  );
}
