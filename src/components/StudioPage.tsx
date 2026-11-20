import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';
import { useRouter } from './Router';

type Layer = {
  id: string;
  note: string;
  file?: File;
  preview?: string;
  accent: string;
  status: 'idle' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function StudioPage() {
  const { navigate } = useRouter();
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'l1', note: '', accent: '#0A84FF', status: 'idle' },
  ]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [recent, setRecent] = useState<CloudMeta[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listPublicShares(8);
      if (!cancelled) {
        setRecent(list);
        setLoadingRecent(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addLayer = () => {
    setLayers((p) => [
      ...p,
      { id: Math.random().toString(36).slice(2, 9), note: '', accent: '#0A84FF', status: 'idle' },
    ]);
  };

  const updateLayer = (id: string, patch: Partial<Layer>) => {
    setLayers((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const onFile = (id: string, file: File) => {
    const total = layers.reduce((s, l) => s + (l.file?.size || 0), 0) + file.size;
    setWarn(total > 45_000_000 ? 'Large studio drop — may feel slower. No hard limits.' : null);
    updateLayer(id, {
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'idle',
    });
  };

  const publish = async () => {
    if (busy) return;
    const toPublish = layers.filter((l) => l.file || l.note.trim());
    if (!toPublish.length) return;
    setBusy(true);
    for (const layer of toPublish) {
      if (layer.status === 'done') continue;
      updateLayer(layer.id, { status: 'uploading' });
      try {
        if (layer.file) {
          const res = await publishLocalFile(layer.file, {
            caption: layer.note.trim() || title.trim() || layer.file.name,
            color: layer.accent,
            cardTitle: title.trim() || layer.file.name,
            meta: { desk: 'studio', layerNote: layer.note },
          });
          updateLayer(layer.id, {
            status: res.ok ? 'done' : 'error',
            link: res.embed,
            error: res.error,
          });
        } else if (layer.note.trim()) {
          // pure note as text file
          const blob = new Blob([layer.note], { type: 'text/plain' });
          const file = new File([blob], `${title || 'note'}.txt`, { type: 'text/plain' });
          const res = await publishLocalFile(file, {
            caption: layer.note.slice(0, 180),
            color: layer.accent,
            cardTitle: title || 'studio note',
            meta: { desk: 'studio' },
          });
          updateLayer(layer.id, {
            status: res.ok ? 'done' : 'error',
            link: res.embed,
            error: res.error,
          });
        }
      } catch (e: any) {
        updateLayer(layer.id, { status: 'error', error: e.message });
      }
    }
    setBusy(false);
    const list = await listPublicShares(8);
    setRecent(list);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[36px] p-8 md:p-12 mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2 text-[#0A84FF]">Studio</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Layer the work.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            A quiet multi-layer desk. Primary title, per-layer notes, optional files. Everything lands in the database with polished Discord embeds. Soft size warnings only. Spring animations on frosted glass.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional studio title"
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-6 focus:outline-none focus:border-white/30 transition"
          />

          <AnimatePresence>
            {layers.map((layer, idx) => (
              <motion.div
                key={layer.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="glass rounded-2xl p-5 mb-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] text-neutral-500">layer {idx + 1}</span>
                  <input
                    type="color"
                    value={layer.accent}
                    onChange={(e) => updateLayer(layer.id, { accent: e.target.value })}
                    className="w-7 h-7 rounded-full cursor-pointer border-0"
                  />
                </div>
                <textarea
                  value={layer.note}
                  onChange={(e) => updateLayer(layer.id, { note: e.target.value })}
                  placeholder="Note for this layer…"
                  rows={2}
                  className="w-full bg-black/20 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 mb-3 focus:outline-none focus:border-white/20 resize-none"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileRefs.current[layer.id]?.click()}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/8 text-neutral-300 hover:bg-white/12"
                  >
                    {layer.file ? layer.file.name : 'add file'}
                  </button>
                  <input
                    ref={(el) => { fileRefs.current[layer.id] = el; }}
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && onFile(layer.id, e.target.files[0])}
                  />
                  {layer.preview && (
                    <img src={layer.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  {layer.link && (
                    <a href={layer.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 truncate">
                      {layer.link}
                    </a>
                  )}
                  {layer.status === 'uploading' && <span className="text-xs text-neutral-500">sending…</span>}
                  {layer.error && <span className="text-xs text-red-400">{layer.error}</span>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {warn && <p className="text-[13px] text-amber-300/80 mb-4">{warn}</p>}

          <div className="flex gap-3">
            <button
              onClick={addLayer}
              className="text-sm px-4 py-2.5 rounded-2xl bg-white/6 text-neutral-300 hover:bg-white/10"
            >
              + layer
            </button>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={publish}
              disabled={busy}
              className="flex-1 rounded-2xl py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
              style={{ background: '#0A84FF' }}
            >
              {busy ? 'Publishing…' : 'Publish studio'}
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <h2 className="text-2xl font-semibold tracking-tight mb-5">Recent</h2>
          {loadingRecent ? (
            <p className="text-neutral-500 text-sm">loading…</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
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
