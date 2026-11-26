import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Item = {
  name: string;
  id?: string;
  url?: string;
  size: number;
  warn?: string | null;
};

export default function OrbitBundlePage() {
  const { navigate } = useRouter();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('Orbit Bundle');
  const [caption, setCaption] = useState('a quiet constellation of files');
  const [color, setColor] = useState('#64D2FF');
  const [items, setItems] = useState<Item[]>([]);
  const [catalogUrl, setCatalogUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setUploading(true);
      setError(null);
      setItems([]);
      setCatalogUrl(null);
      setProgress(0);

      const published: Item[] = [];
      const lines = [`# ${title}\n\n${caption}\n\n## files\n`];

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        setProgress(Math.round(((i + 0.25) / (list.length + 1)) * 100));
        try {
          const pub = await publishLocalFile(file, {
            caption,
            cardTitle: `${title} · ${file.name}`,
            color,
          });
          if (pub.ok && pub.id) {
            const url = shareUrls(pub.id).embed;
            published.push({
              name: file.name,
              id: pub.id,
              url,
              size: file.size,
              warn: pub.warn,
            });
            lines.push(`- [${file.name}](${url}) — ${prettySize(file.size)}`);
          } else {
            setError(pub.error || 'one file could not enter orbit');
          }
        } catch (e: any) {
          setError(e?.message || 'upload interrupted');
        }
        setProgress(Math.round(((i + 1) / (list.length + 1)) * 100));
      }

      setItems(published);

      if (published.length) {
        lines.push('\n---\nshared from rankvault · Discord-ready');
        const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
        const catalog = new File([blob], `${title.replace(/\s+/g, '-')}-catalog.md`, {
          type: 'text/markdown',
        });
        try {
          const pub = await publishLocalFile(catalog, {
            caption,
            cardTitle: title,
            color,
            meta: { kind: 'orbit-bundle', count: published.length },
          });
          if (pub.ok && pub.id) {
            const url = shareUrls(pub.id).embed;
            setCatalogUrl(url);
            navigator.clipboard.writeText(url).catch(() => {});
          }
        } catch {}
      }

      setProgress(100);
      setUploading(false);
    },
    [title, caption, color],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  function prettySize(n: number) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  }

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7]">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#64D2FF] text-sm tracking-wide mb-3">orbit bundle</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">
            many files,<br />one quiet catalog.
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
            Drop several local files. Each becomes its own Discord-ready share, and a single markdown catalog links them all. Soft size warnings only.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="glass rounded-3xl p-6 space-y-4">
            <label className="block text-xs text-neutral-500">bundle title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#64D2FF]/50"
            />
            <label className="block text-xs text-neutral-500">caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#64D2FF]/50 resize-none"
            />
            <label className="block text-xs text-neutral-500">accent</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-12 rounded-2xl cursor-pointer bg-transparent border border-white/10"
            />
          </div>
          <div className="glass rounded-3xl p-6">
            <p className="text-xs text-neutral-500 mb-3">catalog embed preview</p>
            <div className="border-l-4 rounded-2xl p-4 bg-black/40" style={{ borderColor: color }}>
              <p className="font-medium text-sm" style={{ color }}>
                {title || 'Orbit Bundle'}
              </p>
              <p className="text-neutral-400 text-xs mt-1 leading-relaxed">
                {caption || 'a quiet constellation of files'}
              </p>
              <p className="text-[10px] text-neutral-600 mt-3">rankvault · Discord-ready catalog</p>
            </div>
          </div>
        </div>

        <motion.div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          animate={{
            scale: dragging ? 1.012 : 1,
            borderColor: dragging ? color : 'rgba(255,255,255,0.08)',
          }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          className="relative border-2 border-dashed rounded-3xl p-16 text-center bg-white/[0.025] backdrop-blur-2xl cursor-pointer mb-10"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="space-y-5">
              <div
                className="w-16 h-16 mx-auto rounded-full border-2 border-white/20 animate-spin"
                style={{ borderTopColor: color }}
              />
              <p className="text-sm text-neutral-300">gathering orbit… {progress}%</p>
            </div>
          ) : (
            <>
              <p className="text-2xl font-medium mb-2">Drop files into orbit</p>
              <p className="text-sm text-neutral-500">
                or click to browse. Large files may feel slow — nothing is blocked.
              </p>
            </>
          )}
        </motion.div>

        {error && <p className="text-center text-sm text-red-400 mb-6">{error}</p>}

        {catalogUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
          >
            <div>
              <p className="text-sm font-medium">catalog share</p>
              <p className="text-xs text-neutral-500 break-all">{catalogUrl}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(catalogUrl)}
              className="self-start px-4 py-2 rounded-full text-xs font-medium text-black"
              style={{ background: color }}
            >
              copy catalog link
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid sm:grid-cols-2 gap-4"
            >
              {items.map((r, i) => (
                <motion.div
                  key={r.id || r.name + i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-2xl p-5 flex flex-col gap-3"
                >
                  <div>
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-neutral-500">{prettySize(r.size)}</p>
                    {r.warn && <p className="text-xs text-amber-400 mt-1">{r.warn}</p>}
                  </div>
                  {r.url && (
                    <button
                      onClick={() => navigator.clipboard.writeText(r.url!)}
                      className="self-start px-4 py-2 rounded-full text-xs font-medium text-black"
                      style={{ background: color }}
                    >
                      copy share link
                    </button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => navigate('home')}
          className="mt-12 text-sm text-neutral-500 hover:text-white transition"
        >
          ← back home
        </button>
      </div>
    </div>
  );
}
