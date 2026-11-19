import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type BundleItem = {
  file: File;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  shareId?: string;
  error?: string;
};

export default function BundlePage() {
  const [items, setItems] = useState<BundleItem[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [bundleLink, setBundleLink] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 45_000_000 ? 'Large bundle — uploads may feel slower. No hard limits.' : null);
    const next: BundleItem[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
    }));
    setItems((p) => [...p, ...next]);
  }, []);

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    setBundleLink(null);
    const publishedIds: string[] = [];

    for (const item of items) {
      if (item.status === 'done' && item.shareId) {
        publishedIds.push(item.shareId);
        continue;
      }
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const res = await publishLocalFile(item.file, {
          caption: caption.trim() || item.file.name,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'bundle', role: 'member' },
        });
        if (res.ok && res.id) {
          publishedIds.push(res.id);
          setItems((p) => p.map((i) =>
            i.id === item.id ? { ...i, status: 'done', shareId: res.id } : i
          ));
        } else {
          setItems((p) => p.map((i) =>
            i.id === item.id ? { ...i, status: 'error', error: res.error || 'failed' } : i
          ));
        }
      } catch (e: any) {
        setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'error', error: e.message } : i));
      }
    }

    if (publishedIds.length) {
      // Create a special bundle share that references the members
      const bundleId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const bundleRowMeta = {
        desk: 'bundle',
        role: 'index',
        members: publishedIds,
        title: title.trim() || 'Untitled bundle',
        color: accent,
      };
      try {
        // Use a lightweight text file as the bundle index so it has a proper share row
        const indexBlob = new Blob(
          [JSON.stringify({ title: bundleRowMeta.title, members: publishedIds, caption }, null, 2)],
          { type: 'application/json' }
        );
        const indexFile = new File([indexBlob], `${bundleRowMeta.title.replace(/[^a-z0-9]+/gi, '_') || 'bundle'}.json`, { type: 'application/json' });
        const bundleRes = await publishLocalFile(indexFile, {
          caption: caption.trim() || bundleRowMeta.title,
          color: accent,
          cardTitle: bundleRowMeta.title,
          meta: bundleRowMeta,
        });
        if (bundleRes.ok && bundleRes.embed) {
          setBundleLink(bundleRes.embed);
        }
      } catch {
        // bundle index failed; individual shares still exist
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Bundle</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Group files.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several local files. They become individual shares, then a single collection link that carries a polished Discord embed. Soft size warnings only. Apple-style spring motion on frosted glass.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bundle title"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-white/30 transition"
          />

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-white/20'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-white/20')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-white/20');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-12 text-center mb-6 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files for the bundle</p>
            <p className="text-neutral-500 text-sm mt-1">or click to choose</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Optional caption for the collection"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for embeds</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="glass rounded-2xl p-4 flex items-center gap-4 mb-3"
              >
                <div className="w-12 h-12 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500">file</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <p className="text-xs text-neutral-500">{(item.file.size / 1024 / 1024).toFixed(1)} MB · {item.status}</p>
                  {item.shareId && (
                    <a href={shareUrls(item.shareId).embed} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate block mt-0.5">{shareUrls(item.shareId).embed}</a>
                  )}
                  {item.error && <p className="text-xs text-red-400 mt-0.5">{item.error}</p>}
                </div>
                <button
                  onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))}
                  className="text-xs text-neutral-500 hover:text-white px-2"
                >
                  remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl mt-2"
            style={{ background: accent }}
          >
            {busy ? 'Bundling…' : items.length ? `Create bundle of ${items.length}` : 'Add files first'}
          </motion.button>

          {bundleLink && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 glass rounded-2xl p-4"
            >
              <p className="text-sm text-neutral-300 mb-2">Bundle ready</p>
              <a href={bundleLink} target="_blank" rel="noreferrer" className="text-sm text-blue-400 break-all">{bundleLink}</a>
              <p className="text-xs text-neutral-500 mt-2">Share this link. It carries a polished Discord embed and points to the collection index.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
