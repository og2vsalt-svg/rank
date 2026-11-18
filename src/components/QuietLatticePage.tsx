import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Item = { file: File; id: string; caption: string; status: string; link?: string; error?: string; preview?: string };

export default function QuietLatticePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const next: Item[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      caption: '',
      status: 'queued',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems((p) => [...p, ...next]);
  }, []);

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading' } : i));
      try {
        const res = await publishLocalFile(item.file, {
          caption: item.caption.trim() || item.file.name,
          cardTitle: item.file.name,
          meta: { desk: 'quietlattice' },
        });
        setItems((p) => p.map((i) =>
          i.id === item.id
            ? { ...i, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
            : i
        ));
      } catch (e: any) {
        setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'error', error: e.message } : i));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2 text-[#FF9F0A]">Quiet Lattice</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Arrange the weave.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several files. Give each its own quiet caption. They publish independently to the database with polished Discord embeds. Soft size warnings only. No hard limits. Apple-style springs on frosted glass.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/12 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files for the lattice</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-3">
                  {item.preview && <img src={item.preview} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />}
                  <p className="text-xs truncate mb-1">{item.file.name}</p>
                  <input
                    value={item.caption}
                    onChange={(e) => setItems((p) => p.map((i) => i.id === item.id ? { ...i, caption: e.target.value } : i))}
                    placeholder="caption"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-2 py-1 text-xs mb-1"
                  />
                  <p className="text-[10px] text-neutral-500">{item.status}</p>
                  {item.link && <a href={item.link} className="text-[10px] text-blue-400 truncate block">{item.link}</a>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#FF9F0A]"
          >
            {busy ? 'Weaving…' : items.length ? `Publish lattice (${items.length})` : 'Drop files first'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
