import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

type Tile = {
  id: string;
  note: string;
  file?: File;
  preview?: string;
  status: 'idle' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function MosaicPage() {
  const { navigate } = useRouter();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [title, setTitle] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listPublicShares(6);
      if (!cancelled) {
        setRecent(list);
        setLoadingRecent(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const totalSize = tiles.reduce((s, t) => s + (t.file?.size || 0), 0) + arr.reduce((s, f) => s + f.size, 0);
    setWarn(totalSize > 50_000_000 ? 'Large mosaic — may feel slower while sending. No hard limits.' : null);
    const newTiles: Tile[] = arr.map((file) => ({
      id: Math.random().toString(36).slice(2, 10),
      note: '',
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'idle' as const,
    }));
    setTiles((p) => [...p, ...newTiles]);
  }, [tiles]);

  const updateTile = (id: string, patch: Partial<Tile>) => {
    setTiles((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const removeTile = (id: string) => {
    setTiles((p) => p.filter((t) => t.id !== id));
  };

  const publish = async () => {
    if (busy || !tiles.length) return;
    setBusy(true);
    for (const tile of tiles) {
      if (tile.status === 'done' || !tile.file) continue;
      updateTile(tile.id, { status: 'uploading' });
      try {
        const res = await publishLocalFile(tile.file, {
          caption: tile.note.trim() || title.trim() || tile.file.name,
          color: accent,
          cardTitle: title.trim() || 'mosaic tile',
          meta: { desk: 'mosaic', sharedTitle: title },
        });
        updateTile(tile.id, {
          status: res.ok ? 'done' : 'error',
          link: res.embed,
          error: res.error,
        });
      } catch (e: any) {
        updateTile(tile.id, { status: 'error', error: e.message });
      }
    }
    setBusy(false);
    const list = await listPublicShares(6);
    setRecent(list);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2 text-[#0A84FF]">Mosaic</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Compose the grid.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several files. They arrange into a living mosaic. Shared title, per-tile notes, one accent color. Everything publishes with polished Discord embeds. Soft size warnings only. Spring animations on frosted glass.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Shared mosaic title"
              className="flex-1 bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">accent</span>
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-10 h-10 rounded-full cursor-pointer border-0"
              />
            </div>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-6 cursor-pointer hover:border-white/25 transition bg-black/10"
          >
            <p className="text-neutral-400 text-sm">drop files here or click to add</p>
            <p className="text-neutral-600 text-xs mt-1">images look best in the mosaic</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}

          {tiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <AnimatePresence>
                {tiles.map((tile) => (
                  <motion.div
                    key={tile.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="glass rounded-2xl p-3 relative"
                  >
                    {tile.preview ? (
                      <img src={tile.preview} alt="" className="w-full h-32 object-cover rounded-xl mb-2" />
                    ) : (
                      <div className="w-full h-32 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500 mb-2">
                        {tile.file?.name || 'file'}
                      </div>
                    )}
                    <input
                      value={tile.note}
                      onChange={(e) => updateTile(tile.id, { note: e.target.value })}
                      placeholder="tile note"
                      className="w-full bg-black/20 border border-white/8 rounded-lg px-2 py-1.5 text-xs text-white placeholder:text-neutral-500 mb-1 focus:outline-none"
                    />
                    {tile.status === 'uploading' && <p className="text-[10px] text-neutral-500">sending…</p>}
                    {tile.link && (
                      <a href={tile.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 truncate block">
                        link
                      </a>
                    )}
                    {tile.error && <p className="text-[10px] text-red-400">{tile.error}</p>}
                    <button
                      onClick={() => removeTile(tile.id)}
                      className="absolute top-2 right-2 text-[10px] text-neutral-500 hover:text-white"
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy || !tiles.length}
            className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Composing…' : 'Publish mosaic'}
          </motion.button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h2 className="text-2xl font-semibold tracking-tight mb-5">Recent</h2>
          {loadingRecent ? (
            <p className="text-neutral-500 text-sm">loading…</p>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              {recent.map((share, i) => (
                <motion.button
                  key={share.id}
                  onClick={() => navigate('share', share.id)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -3 }}
                  className="glass rounded-2xl p-4 text-left"
                >
                  <p className="text-sm font-medium truncate">{share.name}</p>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">{share.caption || 'shared'}</p>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
