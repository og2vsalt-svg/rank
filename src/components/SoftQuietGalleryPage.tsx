import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietGalleryPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#30D158');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [gallery, setGallery] = useState<CloudMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadGallery = async () => {
    const items = await listPublicShares(12);
    setGallery(items);
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  };

  const addFiles = (list: File[]) => {
    if (!list.length) return;
    setFiles((prev) => [...prev, ...list].slice(0, 24));
    const large = list.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'Some files are large. Uploads may feel slow. No hard limits — only gentle pacing.' : null);
  };

  const shareAll = async () => {
    if (!files.length && !note.trim()) {
      setErr('add files or a quiet note');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || `from soft quiet gallery`,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softquietgallery', sharedNote: note.trim() },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one upload slowed');
      }
      if (!files.length && note.trim()) {
        const blob = new Blob([note.trim()], { type: 'text/plain' });
        const fake = new File([blob], 'quiet-note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(fake, {
          caption: note.trim(),
          color: accent,
          cardTitle: 'quiet note',
          meta: { desk: 'softquietgallery', noteOnly: true },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
      await loadGallery();
    } catch (e: any) {
      setErr(e.message || 'something felt slow');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl mb-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>
            Soft Quiet Gallery
          </p>
          <h1 className="text-[32px] md:text-[36px] font-semibold tracking-tight mb-3">
            A still gallery of shared light.
          </h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8 max-w-2xl">
            Drop multiple local files or leave a quiet note. Soft mosaic cards settle in your accent color, like light finding place in still glass. Each upload lands in storage and public_shares. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <div
            className="border border-dashed border-white/15 rounded-[24px] p-8 text-center mb-6 hover:border-white/25 transition cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-neutral-300 text-[15px]">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop files here or click to choose'}
            </p>
            <p className="text-neutral-500 text-[12px] mt-1">Multiple files welcome. Soft warning only for large drops.</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(Array.from(e.target.files || []))}
            />
          </div>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {files.map((f, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-[12px] px-3 py-1 rounded-full bg-white/10 text-neutral-200"
                >
                  {f.name}
                </motion.span>
              ))}
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="A quiet note for the gallery…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full cursor-pointer border-0"
            />
            <span className="text-[13px] text-neutral-400">Accent for the gallery cards</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={shareAll}
            disabled={busy || (!files.length && !note.trim())}
            className="w-full rounded-[20px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling the gallery…' : 'Share into the quiet gallery'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                {links.map((l) => (
                  <a key={l} href={l} className="block text-[13px] break-all" style={{ color: accent }}>
                    {l}
                  </a>
                ))}
              </motion.div>
            )}
            {err && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <div>
          <h2 className="text-[20px] font-medium mb-6 text-neutral-200">Recent light in the gallery</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {gallery.map((item, i) => (
              <motion.a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 100, damping: 16 }}
                className="glass rounded-[24px] p-5 block hover:scale-[1.02] transition-transform"
              >
                <div className="aspect-video rounded-2xl bg-black/30 mb-3 flex items-center justify-center overflow-hidden">
                  {item.type.startsWith('image/') ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-neutral-500 text-[12px]">{item.name.slice(0, 24)}</span>
                  )}
                </div>
                <p className="text-[14px] text-neutral-100 truncate">{item.caption || item.name}</p>
                <p className="text-[11px] text-neutral-500 mt-1">{(item.size / 1024).toFixed(0)} KB</p>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
