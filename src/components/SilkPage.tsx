import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Layer = {
  file?: File;
  note: string;
  id: string;
  status: 'idle' | 'uploading' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function SilkPage() {
  const [layers, setLayers] = useState<Layer[]>([
    { id: '1', note: '', status: 'idle' },
  ]);
  const [accent, setAccent] = useState('#C084FC');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addLayer = () => {
    setLayers((p) => [...p, { id: Math.random().toString(36).slice(2, 9), note: '', status: 'idle' }]);
  };

  const attachFile = (id: string, file: File) => {
    const size = file.size;
    setWarn(size > 40_000_000 ? 'Large file — may take a moment. Soft warning only, no hard limit.' : null);
    setLayers((p) => p.map((l) => l.id === id ? { ...l, file } : l));
  };

  const publish = async () => {
    if (busy) return;
    setBusy(true);
    for (const layer of layers) {
      if (layer.status === 'done' || (!layer.file && !layer.note.trim())) continue;
      setLayers((p) => p.map((l) => l.id === layer.id ? { ...l, status: 'uploading' } : l));
      try {
        if (layer.file) {
          const res = await publishLocalFile(layer.file, {
            caption: layer.note.trim() || layer.file.name,
            color: accent,
            cardTitle: layer.file.name,
            meta: { desk: 'silk', note: layer.note },
          });
          setLayers((p) => p.map((l) =>
            l.id === layer.id
              ? { ...l, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
              : l
          ));
        } else {
          // pure note share — still create a lightweight share
          setLayers((p) => p.map((l) => l.id === layer.id ? { ...l, status: 'done', link: '#note-only' } : l));
        }
      } catch (e: any) {
        setLayers((p) => p.map((l) => l.id === layer.id ? { ...l, status: 'error', error: e.message } : l));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[40px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Silk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Layered quiet.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Soft stacked notes with optional local files. Each layer can carry a caption that appears on the polished Discord embed. Soft size warnings only. Spring animations on frosted glass.
          </p>

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent for embeds</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {layers.map((layer, idx) => (
              <motion.div
                key={layer.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="glass rounded-3xl p-5 mb-4"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-neutral-500">layer {idx + 1}</span>
                  {layers.length > 1 && (
                    <button
                      onClick={() => setLayers((p) => p.filter((l) => l.id !== layer.id))}
                      className="text-xs text-neutral-500 hover:text-white"
                    >
                      remove
                    </button>
                  )}
                </div>
                <textarea
                  value={layer.note}
                  onChange={(e) => setLayers((p) => p.map((l) => l.id === layer.id ? { ...l, note: e.target.value } : l))}
                  placeholder="Quiet note for this layer…"
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-3 focus:outline-none focus:border-white/25 resize-none h-20"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => inputRef.current?.click()}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-neutral-300 hover:bg-white/15"
                  >
                    {layer.file ? layer.file.name : 'attach local file'}
                  </button>
                  {layer.file && (
                    <span className="text-xs text-neutral-500">{(layer.file.size / 1024 / 1024).toFixed(1)} MB</span>
                  )}
                  {layer.status === 'done' && layer.link && (
                    <a href={layer.link} className="text-xs text-blue-400 truncate">shared</a>
                  )}
                  {layer.status === 'error' && <span className="text-xs text-red-400">{layer.error}</span>}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) attachFile(layer.id, f);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            onClick={addLayer}
            className="text-sm text-neutral-400 hover:text-white mb-6"
          >
            + add another layer
          </button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling layers…' : 'Share layers'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
