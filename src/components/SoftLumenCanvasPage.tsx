import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftLumenCanvasPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [previews, setPreviews] = useState<{ url: string; name: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadRecent = async () => {
    const items = await listPublicShares(16);
    setRecent(items);
  };

  useEffect(() => {
    loadRecent();
  }, []);

  useEffect(() => {
    // Generate local previews for selected files
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(files.map((f, i) => ({ url: urls[i], name: f.name })));
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const addFiles = (list: File[]) => {
    if (!list.length) return;
    const next = [...files, ...list].slice(0, 32);
    setFiles(next);
    const large = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'Some files are large. The upload may feel slow. No hard limits — only a gentle note.' : null);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const shareCanvas = async () => {
    if (!files.length && !title.trim() && !caption.trim()) {
      setErr('add a title, caption, or drop files');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      const sharedTitle = title.trim() || 'soft lumen canvas';
      const sharedCaption = caption.trim() || 'from the soft lumen canvas';
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: sharedCaption,
          color: accent,
          cardTitle: `${sharedTitle} — ${file.name}`,
          meta: { desk: 'softlumencanvas', canvasTitle: sharedTitle },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr((prev) => prev || res.error || 'one file slowed');
      }
      if (!files.length && (title.trim() || caption.trim())) {
        const blob = new Blob([`${sharedTitle}\n\n${sharedCaption}`], { type: 'text/plain' });
        const fake = new File([blob], `${sharedTitle.replace(/\s+/g, '-')}.txt`, { type: 'text/plain' });
        const res = await publishLocalFile(fake, {
          caption: sharedCaption,
          color: accent,
          cardTitle: sharedTitle,
          meta: { desk: 'softlumencanvas', noteOnly: true },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
      }
      setLinks(newLinks);
      setFiles([]);
      setTitle('');
      setCaption('');
      await loadRecent();
    } catch (e: any) {
      setErr(e.message || 'something felt slow');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050506]" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <Navbar />
      <div className="pt-28 pb-20 px-5 sm:px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-7 sm:p-10 shadow-2xl mb-14"
        >
          <p className="text-[13px] font-medium tracking-[0.02em] mb-2" style={{ color: accent }}>
            Soft Lumen Canvas
          </p>
          <h1 className="text-[34px] sm:text-[42px] font-semibold tracking-tight leading-tight mb-4">
            A quiet canvas for what you carry.
          </h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 max-w-3xl">
            Drop one or many local files. Give the canvas a title and a soft caption. Live previews settle with spring motion on frosted glass. Files upload to storage and the public_shares table. Every share link unfurls with a polished Discord card. Large files receive only a gentle warning of slowness. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Canvas title"
              className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25 transition"
            />
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-11 h-11 rounded-full cursor-pointer border-0"
              />
              <span className="text-[13px] text-neutral-400">Accent light</span>
            </div>
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="A quiet caption for the canvas…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[20px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-6 resize-none focus:outline-none focus:border-white/25 transition"
          />

          <div
            className="border border-dashed border-white/15 rounded-[28px] p-10 text-center mb-6 hover:border-white/30 transition cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            <p className="text-neutral-200 text-[16px] font-medium">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} on the canvas` : 'Drop files or click to choose'}
            </p>
            <p className="text-neutral-500 text-[13px] mt-1.5">Multiple files welcome. Soft pacing only.</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(Array.from(e.target.files || []))}
            />
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {previews.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 18 }}
                  className="relative glass rounded-[18px] overflow-hidden aspect-square"
                >
                  {files[i]?.type.startsWith('image/') ? (
                    <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[11px] text-neutral-400 p-2 text-center">
                      {p.name.slice(0, 18)}
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs grid place-items-center hover:bg-black/80"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.965 }}
            whileHover={{ scale: 1.015 }}
            onClick={shareCanvas}
            disabled={busy || (!files.length && !title.trim() && !caption.trim())}
            className="w-full rounded-[22px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling the canvas…' : 'Share the canvas'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-7 space-y-2.5">
                {links.map((l) => (
                  <a key={l} href={l} className="block text-[13px] break-all hover:underline" style={{ color: accent }}>
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
          <h2 className="text-[22px] font-medium mb-7 text-neutral-100">Recent light on the canvas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recent.map((item, i) => (
              <motion.a
                key={item.id}
                href={`/s/${item.id}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4), type: 'spring', stiffness: 90, damping: 16 }}
                className="glass rounded-[22px] p-4 block hover:scale-[1.015] transition-transform"
              >
                <div className="aspect-square rounded-[16px] bg-black/30 mb-3 overflow-hidden flex items-center justify-center">
                  {item.type.startsWith('image/') ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-neutral-500 text-[11px] px-2 text-center">{item.name.slice(0, 22)}</span>
                  )}
                </div>
                <p className="text-[13.5px] text-neutral-100 truncate leading-snug">{item.caption || item.name}</p>
                <p className="text-[11px] text-neutral-500 mt-1">{(item.size / 1024).toFixed(0)} KB</p>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
